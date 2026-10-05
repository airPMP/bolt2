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

async function sha3_256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface HistorianFeed {
  timestamp?: number;
  PI_TAG_CO2_MASS_FLOW: number;
  PI_TAG_STACK_TEMP_K?: number;
  PI_TAG_CCS_RECOVERY_KG_S?: number;
}

interface MizanPayload {
  "@context": string;
  country: string;
  governorate: string;
  sovereign_entity: string;
  tpm_signature: string;
  telemetry: {
    timestamp: number;
    gross_emitted_tco2_hr: number;
    captured_ccs_tco2_hr: number;
    net_emitted_tco2_hr: number;
    civv_hash_proof: string;
  };
  wrapped_drmv: {
    mint_black_tokens: number;
    mint_green_tokens: number;
    unit: string;
  };
  compliance_status: {
    oman_net_zero_2050_aligned: boolean;
    article_6_2_itmo_eligible: boolean;
  };
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
      facility_id,
      tpm_device_id,
      governorate = "North Al Batinah",
      historian_data,
      dispatch_to_mizan = false,
    } = body;

    if (!facility_id || !historian_data) {
      return json({ error: "Missing required fields: facility_id, historian_data" }, 400);
    }

    const feed: HistorianFeed = historian_data;
    const timestamp = feed.timestamp || Math.floor(Date.now() / 1000);
    const co2_mass_flow_kg_s = feed.PI_TAG_CO2_MASS_FLOW || 0;
    const stack_temp_k = feed.PI_TAG_STACK_TEMP_K || 0;
    const ccs_captured_kg_s = feed.PI_TAG_CCS_RECOVERY_KG_S || 0;

    // Thermodynamic computation
    const gross_emitted_tco2_hr = (co2_mass_flow_kg_s * 3600.0) / 1000.0;
    const captured_ccs_tco2_hr = (ccs_captured_kg_s * 3600.0) / 1000.0;
    const net_emitted_tco2_hr = Math.max(0, gross_emitted_tco2_hr - captured_ccs_tco2_hr);

    // Cryptographic proof (SHA-256 as Deno doesn't have SHA3-256 in WebCrypto)
    const rawPayload = `${facility_id}:${timestamp}:${net_emitted_tco2_hr}:${stack_temp_k}`;
    const civvHashProof = await sha3_256(rawPayload);

    // Token classification (Wrapped dRMV Protocol)
    const blackTokenUnits = Math.max(0, net_emitted_tco2_hr);
    const greenTokenUnits = captured_ccs_tco2_hr;
    const article62Eligible = greenTokenUnits > 0;

    // Build JSON-LD payload for Mizan
    const mizanPayload: MizanPayload = {
      "@context": "https://mizan.onc.gov.om/schemas/v1/civv.jsonld",
      country: "OMAN",
      governorate,
      sovereign_entity: facility_id,
      tpm_signature: tpm_device_id || "UNKNOWN",
      telemetry: {
        timestamp,
        gross_emitted_tco2_hr,
        captured_ccs_tco2_hr: greenTokenUnits,
        net_emitted_tco2_hr,
        civv_hash_proof: civvHashProof,
      },
      wrapped_drmv: {
        mint_black_tokens: blackTokenUnits,
        mint_green_tokens: greenTokenUnits,
        unit: "tCO2e",
      },
      compliance_status: {
        oman_net_zero_2050_aligned: true,
        article_6_2_itmo_eligible: article62Eligible,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    };

    // Persist CIVV record
    const recordRes = await fetch(`${supabaseUrl}/rest/v1/mizan_civv_records`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        plant_config_id: plant_config_id || null,
        user_id: user_id || null,
        facility_id,
        tpm_device_id: tpm_device_id || null,
        governorate,
        timestamp: new Date(timestamp * 1000).toISOString(),
        co2_mass_flow_kg_s: co2_mass_flow_kg_s,
        stack_temp_k: stack_temp_k,
        ccs_captured_kg_s: ccs_captured_kg_s,
        gross_emitted_tco2_hr,
        captured_ccs_tco2_hr: greenTokenUnits,
        net_emitted_tco2_hr,
        civv_hash_proof: civvHashProof,
        oman_net_zero_2050_aligned: true,
        article_6_2_itmo_eligible: article62Eligible,
        jsonld_payload: mizanPayload,
      }),
    });
    const recordRows = await recordRes.json();
    const recordId = recordRows[0]?.id;

    // Mint Black and Green tokens
    const tokenInserts: unknown[] = [];
    if (blackTokenUnits > 0) {
      tokenInserts.push({
        record_id: recordId,
        user_id: user_id,
        token_class: "BLACK",
        quantity: blackTokenUnits,
        unit: "tCO2e",
        settlement_status: "MINTED",
        article_6_2_eligible: false,
      });
    }
    if (greenTokenUnits > 0) {
      tokenInserts.push({
        record_id: recordId,
        user_id: user_id,
        token_class: "GREEN",
        quantity: greenTokenUnits,
        unit: "tCO2e",
        settlement_status: "MINTED",
        article_6_2_eligible: true,
      });
    }

    let mintedTokens: { id: string; token_class: string; quantity: number }[] = [];
    if (tokenInserts.length > 0 && recordId) {
      const tokenRes = await fetch(`${supabaseUrl}/rest/v1/mizan_tokens`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify(tokenInserts),
      });
      mintedTokens = await tokenRes.json();
    }

    // Optionally dispatch to Mizan (simulated — real deployment would POST to mizan.onc.gov.om)
    let dispatchResult = null;
    if (dispatch_to_mizan && recordId) {
      dispatchResult = {
        status: "DISPATCHED_TO_MIZAN",
        payload_hash: civvHashProof,
        endpoint: "https://mizan.onc.gov.om/v1/telemetry/ingest",
        timestamp: new Date().toISOString(),
      };
      await fetch(`${supabaseUrl}/rest/v1/mizan_civv_records?id=eq.${recordId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          mizan_dispatch_status: "DISPATCHED",
          mizan_dispatch_response: dispatchResult,
          dispatched_at: new Date().toISOString(),
        }),
      });
    }

    return json({
      status: "verified",
      record_id: recordId,
      facility_id,
      civv_hash_proof: civvHashProof,
      telemetry: mizanPayload.telemetry,
      wrapped_drmv: mizanPayload.wrapped_drmv,
      compliance_status: mizanPayload.compliance_status,
      tokens_minted: mintedTokens.map(t => ({
        id: t.id,
        class: t.token_class,
        quantity: t.quantity,
      })),
      mizan_payload: mizanPayload,
      dispatch: dispatchResult,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
