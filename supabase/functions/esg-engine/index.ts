import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EMISSION_FACTORS: Record<string, { factor: number; unit: string }> = {
  stationary_combustion_diesel: { factor: 0.2621, unit: "L" },
  stationary_combustion_natural_gas: { factor: 0.00184, unit: "m3" },
  stationary_combustion_coal: { factor: 2.419, unit: "kg" },
  purchased_electricity_grid: { factor: 0.000702, unit: "kWh" },
  purchased_heat: { factor: 0.00025, unit: "kWh" },
  transport_diesel_vehicle: { factor: 0.2621, unit: "L" },
  transport_petrol_vehicle: { factor: 0.2307, unit: "L" },
  refrigerant_r410a: { factor: 2088.0, unit: "kg" },
  refrigerant_r404a: { factor: 3922.0, unit: "kg" },
  waste_landfill_mixed: { factor: 0.58, unit: "kg" },
  water_supply_treatment: { factor: 0.000149, unit: "L" },
  business_travel_air_short: { factor: 0.255, unit: "km" },
  business_travel_air_long: { factor: 0.195, unit: "km" },
  purchased_goods_steel: { factor: 1.91, unit: "kg" },
  purchased_goods_cement: { factor: 0.73, unit: "kg" },
  purchased_goods_aluminium: { factor: 8.1, unit: "kg" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const { action, activityType, rawQuantity, scopeCategory } = await req.json();
    let result: Record<string, unknown>;

    switch (action) {
      case "compute": {
        const ef = EMISSION_FACTORS[activityType];
        if (!ef) { result = { error: "No emission factor found for: " + activityType }; break; }
        const totalKg = rawQuantity * ef.factor;
        const totalT = totalKg / 1000;
        const scope = scopeCategory;
        let gri = "GRI 305-3", sbti = "Value Chain Engagement";
        if (scope === "scope1") { gri = "GRI 305-1"; sbti = "Absolute Base Reduction"; }
        else if (scope === "scope2") { gri = "GRI 305-2"; sbti = "Market/Location Based Target"; }
        result = {
          calculated_tco2e: Number(totalT.toFixed(6)),
          gri_indicator: gri,
          sbti_classification: sbti,
          factor_used: ef.factor,
          factor_unit: ef.unit,
        };
        break;
      }
      default:
        result = { error: "Unknown action: " + action };
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
