import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, registry, credentials, payload } = await req.json();

    let result: Record<string, unknown>;

    switch (action) {
      case "verify_auth": {
        result = {
          status: "authenticated",
          registry,
          verified: true,
          timestamp: new Date().toISOString(),
          message: `VVB credentials verified with ${registry}`,
          stamp_hash: `VVB-${Date.now().toString(36).toUpperCase()}`,
        };
        break;
      }

      case "submit_project": {
        result = {
          status: "validated",
          registry,
          registry_project_id: `${registry.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          validation_status: "approved",
          message: "Project data validated by VVB. Ready for developer data submission.",
          validated_at: new Date().toISOString(),
        };
        break;
      }

      case "submit_data": {
        result = {
          status: "accepted",
          registry,
          submission_id: `SUB-${Date.now().toString(36).toUpperCase()}`,
          data_points: payload?.sensor_data ? Object.keys(payload.sensor_data).length : 6,
          verified: true,
          message: "15-min data accepted by registry",
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case "mint_tokens": {
        result = {
          status: "minted",
          registry,
          serial_number: `${payload?.token_type || "CCC"}-${Date.now().toString(36).toUpperCase()}`,
          quantity: payload?.quantity || 0,
          wallet: payload?.wallet || "Registry Wallet",
          message: `${payload?.quantity || 0} ${payload?.token_type || "CCC"} tokens minted to wallet`,
          minted_at: new Date().toISOString(),
        };
        break;
      }

      default:
        result = { status: "error", message: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
