import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SensorDef {
  id: string;
  name: string;
  scope: string;
  unit: string;
  price: number;
}

const SENSORS: Record<string, SensorDef> = {
  'BLK-S-CO2': { id: 'BLK-S-CO2', name: 'NDIR CO2 Process Sensor', scope: 'scope1', unit: 'ppm', price: 1850 },
  'BLK-S-FLOW': { id: 'BLK-S-FLOW', name: 'Thermal Mass Flow Meter', scope: 'scope1', unit: 'Nm³/h', price: 2400 },
  'BLK-S-FLUOR': { id: 'BLK-S-FLUOR', name: 'Fluorocarbon Emissions Monitor (CF4/C2F6)', scope: 'scope1', unit: 'ppm', price: 4200 },
  'BLK-S-CH4P': { id: 'BLK-S-CH4P', name: 'Methane Process Sensor', scope: 'scope1', unit: 'ppm', price: 2100 },
  'BLK-M-KWH': { id: 'BLK-M-KWH', name: 'Grid Electricity Meter (LT)', scope: 'scope2', unit: 'kWh', price: 320 },
  'BLK-M-KWH-HV': { id: 'BLK-M-KWH-HV', name: 'Grid Electricity Meter (HV)', scope: 'scope2', unit: 'kWh', price: 780 },
  'BLK-M-THRML': { id: 'BLK-M-THRML', name: 'Thermal Energy Meter (Steam/Hot Water)', scope: 'scope2', unit: 'GJ', price: 1450 },
  'BLK-S-WTE': { id: 'BLK-S-WTE', name: 'Waste-to-Energy Weighbridge + Calorimeter', scope: 'scope3', unit: 't', price: 3600 },
  'BLK-GW-H4': { id: 'BLK-GW-H4', name: 'ERTH Gateway H4 (4-channel IoT Aggregator)', scope: 'gateway', unit: 'unit', price: 950 },
  'BLK-S-AQI': { id: 'BLK-S-AQI', name: 'Ambient Air Quality Sensor (PM/NOx/SOx)', scope: 'ambient', unit: 'AQI', price: 540 },
};

const INDUSTRIES: Record<string, { scope1_sensors: string[]; scope2_sensors: string[]; scope3_sensors: string[] }> = {
  cement: { scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW'], scope2_sensors: ['BLK-M-KWH', 'BLK-M-THRML'], scope3_sensors: ['BLK-S-WTE'] },
  aluminium: { scope1_sensors: ['BLK-S-FLUOR', 'BLK-S-FLOW'], scope2_sensors: ['BLK-M-KWH-HV'], scope3_sensors: ['BLK-S-WTE'] },
  steel: { scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW', 'BLK-S-CH4P'], scope2_sensors: ['BLK-M-KWH', 'BLK-M-THRML'], scope3_sensors: ['BLK-S-WTE'] },
  power: { scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW'], scope2_sensors: ['BLK-M-KWH'], scope3_sensors: ['BLK-S-WTE'] },
  'chlor-alkali': { scope1_sensors: ['BLK-S-FLUOR', 'BLK-S-CO2'], scope2_sensors: ['BLK-M-KWH'], scope3_sensors: ['BLK-S-WTE'] },
  'pulp-paper': { scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW'], scope2_sensors: ['BLK-M-KWH'], scope3_sensors: ['BLK-S-WTE'] },
};

const GREEN_CLUB_SENSORS: Record<string, string[]> = {
  re_bess: ['BLK-M-KWH', 'BLK-GW-H4'],
  nbs: ['BLK-S-CO2', 'BLK-GW-H4'],
  biochar: ['BLK-S-CO2', 'BLK-S-FLOW', 'BLK-GW-H4'],
  community: ['BLK-M-KWH', 'BLK-GW-H4'],
};

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { industry, club, methodology, scopeLevel, phase } = await req.json();

    let sensorList: string[] = [];
    if (club && GREEN_CLUB_SENSORS[club]) {
      sensorList = [...GREEN_CLUB_SENSORS[club]];
    } else if (industry && INDUSTRIES[industry]) {
      const ind = INDUSTRIES[industry];
      if (scopeLevel === 'scope1') sensorList = [...ind.scope1_sensors];
      else if (scopeLevel === 'scope2') sensorList = [...ind.scope2_sensors];
      else sensorList = [...ind.scope3_sensors];
    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown industry or club' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (phase === 'monitoring') {
      if (!sensorList.includes('BLK-GW-H4')) sensorList.push('BLK-GW-H4');
      if (!sensorList.includes('BLK-S-AQI')) sensorList.push('BLK-S-AQI');
    }

    const boqItems = sensorList
      .map((sid) => SENSORS[sid])
      .filter(Boolean)
      .map((s) => ({ id: s.id, name: s.name, unit: s.unit, unitPrice: s.price, scope: s.scope }));

    const total = boqItems.reduce((sum, item) => sum + item.unitPrice, 0);

    const samplePayload = {
      gateway_id: 'GW-TEST-001',
      timestamp: new Date().toISOString(),
      methodology,
      phase,
      sensors: boqItems.map((item) => ({
        id: item.id,
        value: +(Math.random() * 100).toFixed(4),
        unit: item.unit,
      })),
      merkle_root: randomHex(64),
      hsm_signature: randomHex(128),
    };

    return new Response(
      JSON.stringify({ boq: { items: boqItems, total, phase }, samplePayload }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
