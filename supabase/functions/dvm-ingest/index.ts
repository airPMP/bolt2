import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface CIVVSensor {
  sensor_id: string;
  part_number?: string;
  measurement: string;
  value: number | string;
  unit: string;
  status?: string;
  depth_cm?: number;
}

interface EpochPayload {
  gateway_id?: string;
  gateway_mac: string;
  project_id?: string;
  epoch_start?: string;
  epoch_end?: string;
  sensors?: CIVVSensor[];
  hsm_signature?: string;
  gateway_public_key_id?: string;
}

interface LegacyPayload {
  plant_config_id: string;
  user_id: string;
  gateway_mac: string;
  interval_minutes?: number;
  sensor_data: Record<string, number | string>;
  timestamp?: string;
  hsm_signature?: string;
  merkle_proof?: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Detect format: CIVV epoch (sensors array) vs legacy (sensor_data flat object)
    const isEpoch = Array.isArray(body.sensors);
    let plant_config_id: string;
    let user_id: string;
    let gateway_mac: string;
    let timestamp: string;
    let interval_minutes: number;
    let hsm_signature: string | undefined;
    let measurements: { slug: string; value: number | string; unit: string; part_number?: string; sensor_id?: string }[];

    if (isEpoch) {
      const epoch = body as EpochPayload;
      plant_config_id = body.plant_config_id || body.project_id || "";
      user_id = body.user_id || "";
      gateway_mac = epoch.gateway_mac;
      timestamp = epoch.epoch_start || new Date().toISOString();
      interval_minutes = body.interval_minutes || 15;
      hsm_signature = epoch.hsm_signature;
      measurements = epoch.sensors!.map(s => ({
        slug: s.measurement,
        value: s.value,
        unit: s.unit,
        part_number: s.part_number,
        sensor_id: s.sensor_id,
      }));
    } else {
      const legacy = body as LegacyPayload;
      plant_config_id = legacy.plant_config_id;
      user_id = legacy.user_id;
      gateway_mac = legacy.gateway_mac;
      timestamp = legacy.timestamp || new Date().toISOString();
      interval_minutes = legacy.interval_minutes || 15;
      hsm_signature = legacy.hsm_signature;
      measurements = Object.entries(legacy.sensor_data).map(([slug, value]) => ({
        slug,
        value,
        unit: "",
      }));
    }

    if (!plant_config_id || !gateway_mac || measurements.length === 0) {
      return json({ error: "Missing required fields. Need plant_config_id/project_id, gateway_mac, and sensors[] or sensor_data" }, 400);
    }

    // If user_id not provided, try to get it from the plant config
    if (!user_id) {
      const pcRes = await fetch(
        `${supabaseUrl}/rest/v1/plant_configs?id=eq.${plant_config_id}&select=developer_id,auditor_id&limit=1`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } }
      );
      const pcJson = await pcRes.json();
      user_id = pcJson[0]?.developer_id || pcJson[0]?.auditor_id || "";
      if (!user_id) return json({ error: "Could not determine user_id from plant_config" }, 400);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    };

    const event_type_slug = isEpoch ? "civv-epoch" : "sensor-interval";
    const event_type_name = isEpoch ? "CIVV Sensor Epoch" : "Sensor Interval";

    // 1. Find or create event type
    let eventTypeRes = await fetch(
      `${supabaseUrl}/rest/v1/dvm_event_types?plant_config_id=eq.${plant_config_id}&slug=eq.${event_type_slug}&select=id&limit=1`,
      { headers }
    );
    let eventTypeJson = await eventTypeRes.json();
    let eventTypeId = eventTypeJson[0]?.id;

    if (!eventTypeId) {
      const createET = await fetch(`${supabaseUrl}/rest/v1/dvm_event_types`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          plant_config_id,
          user_id,
          name: event_type_name,
          slug: event_type_slug,
          cadence: `${interval_minutes}min`,
        }),
      });
      const etRows = await createET.json();
      eventTypeId = etRows[0].id;
    }

    // 2. Create event
    const eventTs = isEpoch ? (body as EpochPayload).epoch_start || timestamp : timestamp;
    const eventRes = await fetch(`${supabaseUrl}/rest/v1/dvm_events`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        event_type_id: eventTypeId,
        plant_config_id,
        user_id,
        timestamp: eventTs,
        metadata: {
          interval_minutes,
          gateway_mac,
          epoch_end: isEpoch ? (body as EpochPayload).epoch_end : undefined,
          gateway_id: isEpoch ? (body as EpochPayload).gateway_id : undefined,
          gateway_public_key_id: isEpoch ? (body as EpochPayload).gateway_public_key_id : undefined,
        },
      }),
    });
    const eventRows = await eventRes.json();
    const eventId = eventRows[0].id;

    // 3. Fetch data rules ONCE (not per sensor)
    const rulesRes = await fetch(
      `${supabaseUrl}/rest/v1/dvm_data_rules?plant_config_id=eq.${plant_config_id}&is_active=eq.true&select=id,name,expression,alert_message,action,user_id`,
      { headers }
    );
    const rules = await rulesRes.json();

    // 4. Create datapoints for each sensor measurement
    const datapointIds: string[] = [];
    const alerts: string[] = [];

    for (const m of measurements) {
      // Find or create datapoint type
      let dpTypeRes = await fetch(
        `${supabaseUrl}/rest/v1/dvm_datapoint_types?event_type_id=eq.${eventTypeId}&slug=eq.${m.slug}&select=id&limit=1`,
        { headers }
      );
      let dpTypeJson = await dpTypeRes.json();
      let dpTypeId = dpTypeJson[0]?.id;

      if (!dpTypeId) {
        const createDPT = await fetch(`${supabaseUrl}/rest/v1/dvm_datapoint_types`, {
          method: "POST",
          headers: { ...headers, "Prefer": "return=representation" },
          body: JSON.stringify({
            event_type_id: eventTypeId,
            name: m.slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            slug: m.slug,
            unit: m.unit || "",
            data_type: "NUMERIC",
          }),
        });
        const dptRows = await createDPT.json();
        dpTypeId = dptRows[0].id;
      }

      const numericVal = typeof m.value === "number" ? m.value : parseFloat(String(m.value));
      const dpRes = await fetch(`${supabaseUrl}/rest/v1/dvm_datapoints`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          event_id: eventId,
          datapoint_type_id: dpTypeId,
          numeric_value: isNaN(numericVal) ? null : numericVal,
          text_value: isNaN(numericVal) ? String(m.value) : null,
          unit: m.unit || "",
          hsm_signature: hsm_signature || null,
          gateway_mac,
          captured_at: eventTs,
        }),
      });
      const dpRows = await dpRes.json();
      if (dpRows[0]?.id) datapointIds.push(dpRows[0].id);

      // 5. Evaluate data rules for this value
      for (const rule of rules) {
        try {
          const expr = rule.expression
            .replace(/VALUE/g, String(numericVal))
            .replace(/PREVIOUS_VALUE/g, "0")
            .replace(/\bAND\b/g, "&&")
            .replace(/\bOR\b/g, "||");
          const triggered = Function(`"use strict"; return (${expr});`)();
          if (triggered) {
            await fetch(`${supabaseUrl}/rest/v1/dvm_rule_results`, {
              method: "POST",
              headers: { ...headers, "Prefer": "return=representation" },
              body: JSON.stringify({
                rule_id: rule.id,
                user_id: rule.user_id,
                target_type: "DATAPOINT",
                target_id: dpRows[0]?.id || null,
                message: rule.alert_message || `Rule "${rule.name}" triggered for ${m.slug}=${numericVal}`,
              }),
            });
            alerts.push(`${m.slug}=${numericVal} triggered: ${rule.name}`);
          }
        } catch {
          // skip rule eval errors
        }
      }
    }

    return json({
      status: "ingested",
      format: isEpoch ? "civv-epoch" : "legacy",
      event_id: eventId,
      datapoints_created: datapointIds.length,
      datapoint_ids: datapointIds,
      alerts,
      epoch_start: eventTs,
      gateway_mac,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
