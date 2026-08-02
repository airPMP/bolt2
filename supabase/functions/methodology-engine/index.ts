import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const { action, methodology, days, intervalMinutes } = await req.json();
    let result: Record<string, unknown>;
    switch (action) {
      case "simulate": {
        const d = days || 10;
        const interval = intervalMinutes || 15;
        const blocksPerDay = (24 * 60) / interval;
        const totalBlocks = d * blocksPerDay;
        const sensorTypes = methodology?.required_sensor_types || [];
        const data = [];
        for (let i = 0; i < totalBlocks; i++) {
          const block: Record<string, unknown> = { timestamp: new Date(Date.now() + i * interval * 60000).toISOString() };
          for (const type of sensorTypes) {
            const ranges: Record<string, [number, number]> = {
              CO2: [400, 500], CH4: [1.5, 3], N2O: [0.3, 0.5], FLOW: [100, 150],
              ENERGY: [500, 600], TEMP: [20, 50], HUMIDITY: [40, 70], SOIL_C: [2, 5],
            };
            const range = ranges[type] || [0, 1];
            block[type] = range[0] + Math.random() * (range[1] - range[0]);
          }
          data.push(block);
        }
        result = { status: "simulated", totalBlocks, data: data.slice(0, 10), message: `Generated ${totalBlocks} blocks over ${d} days` };
        break;
      }
      default: result = { status: "error", message: `Unknown action: ${action}` };
    }
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
