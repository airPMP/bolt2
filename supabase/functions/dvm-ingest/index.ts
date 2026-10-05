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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      plant_config_id,
      user_id,
      gateway_mac,
      interval_minutes = 15,
      event_type_slug = "sensor-interval",
      event_type_name = "Sensor Interval",
      timestamp,
      sensor_data,
      hsm_signature,
      merkle_proof,
    } = body;

    if (!plant_config_id || !user_id || !gateway_mac || !sensor_data) {
      return json({ error: "Missing required fields: plant_config_id, user_id, gateway_mac, sensor_data" }, 400);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    };

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
    const eventRes = await fetch(`${supabaseUrl}/rest/v1/dvm_events`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        event_type_id: eventTypeId,
        plant_config_id,
        user_id,
        timestamp: timestamp || new Date().toISOString(),
        metadata: { interval_minutes, gateway_mac },
      }),
    });
    const eventRows = await eventRes.json();
    const eventId = eventRows[0].id;

    // 3. Create datapoints for each sensor reading
    const datapointIds: string[] = [];
    const alerts: string[] = [];

    for (const [key, value] of Object.entries(sensor_data)) {
      // Find or create datapoint type
      let dpTypeRes = await fetch(
        `${supabaseUrl}/rest/v1/dvm_datapoint_types?event_type_id=eq.${eventTypeId}&slug=eq.${key}&select=id&limit=1`,
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
            name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            slug: key,
            unit: "",
            data_type: "NUMERIC",
          }),
        });
        const dptRows = await createDPT.json();
        dpTypeId = dptRows[0].id;
      }

      const numericVal = typeof value === "number" ? value : parseFloat(String(value));
      const dpRes = await fetch(`${supabaseUrl}/rest/v1/dvm_datapoints`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          event_id: eventId,
          datapoint_type_id: dpTypeId,
          numeric_value: isNaN(numericVal) ? null : numericVal,
          text_value: isNaN(numericVal) ? String(value) : null,
          unit: "",
          hsm_signature: hsm_signature || null,
          gateway_mac,
          merkle_proof: merkle_proof || null,
          captured_at: timestamp || new Date().toISOString(),
        }),
      });
      const dpRows = await dpRes.json();
      if (dpRows[0]?.id) datapointIds.push(dpRows[0].id);

      // 4. Evaluate data rules for this value
      const rulesRes = await fetch(
        `${supabaseUrl}/rest/v1/dvm_data_rules?plant_config_id=eq.${plant_config_id}&is_active=eq.true&select=id,expression,alert_message,action,user_id`,
        { headers }
      );
      const rules = await rulesRes.json();

      for (const rule of rules) {
        try {
          const expr = rule.expression
            .replace(/VALUE/g, String(numericVal))
            .replace(/PREVIOUS_VALUE/g, "0")
            .replace(/AND/g, "&&")
            .replace(/OR/g, "||");
          // eslint-disable-next-line no-new-func
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
                message: rule.alert_message || `Rule "${rule.name}" triggered for ${key}=${numericVal}`,
              }),
            });
            alerts.push(`${key}=${numericVal} triggered rule: ${rule.name}`);
          }
        } catch {
          // skip rule eval errors
        }
      }
    }

    return json({
      status: "ingested",
      event_id: eventId,
      datapoints_created: datapointIds.length,
      datapoint_ids: datapointIds,
      alerts,
      timestamp: timestamp || new Date().toISOString(),
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
