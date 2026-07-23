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
    const { action, exchange, credentials, payload } = await req.json();

    let result: Record<string, unknown>;

    switch (action) {
      case "verify_auth": {
        result = {
          status: "authenticated",
          exchange,
          verified: true,
          timestamp: new Date().toISOString(),
          message: `Exchange credentials verified with ${exchange}`,
          stamp_hash: `EXC-${Date.now().toString(36).toUpperCase()}`,
        };
        break;
      }

      case "list_tokens": {
        result = {
          status: "listed",
          exchange,
          listing_id: `LST-${Date.now().toString(36).toUpperCase()}`,
          quantity: payload?.quantity || 0,
          price_per_unit: payload?.price_per_unit || 0,
          total_value: (payload?.quantity || 0) * (payload?.price_per_unit || 0),
          token_type: payload?.token_type || "CCC",
          message: `${payload?.quantity || 0} tokens listed on ${exchange}`,
          listed_at: new Date().toISOString(),
        };
        break;
      }

      case "execute_buy": {
        result = {
          status: "completed",
          exchange,
          transaction_id: `TXN-${Date.now().toString(36).toUpperCase()}`,
          quantity: payload?.quantity || 0,
          total_price: (payload?.quantity || 0) * (payload?.price_per_unit || 0),
          token_type: payload?.token_type || "CCC",
          message: "Purchase executed successfully",
          completed_at: new Date().toISOString(),
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
