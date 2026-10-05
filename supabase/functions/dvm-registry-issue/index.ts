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

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "0x";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

interface RegistryRequest {
  registry: string;
  methodology: string;
  project_id: string;
  plant_config_id: string;
  user_id: string;
  vintage: string;
  calculation_details: Record<string, number | string>;
  serial_prefix?: string;
  monitoring_period?: { start: string; end: string };
  verification?: { vvb: string; report_id: string };
  sdg_impacts?: Record<string, string>;
  batch_data?: Record<string, number | string>;
  nsdl_depository?: { bo_id: string; isin: string };
  cbam_benchmark?: Record<string, number>;
  cbam_product?: string;
  cn_code?: string;
  importing_company?: string;
  entity_registration_id?: string;
  reporting_period?: string;
  activities?: unknown[];
  emission_sources?: unknown[];
  source_streams?: unknown[];
  permanence_tier?: string;
  registry_link?: Record<string, string>;
  gei_calculation?: Record<string, number>;
  production_data?: Record<string, number>;
}

function buildIssuance(req: RegistryRequest) {
  const merkleRoot = randomHex(64);
  const ipfsCid = "Qm" + randomHex(46).slice(2);
  const hsmSig = req.calculation_details?.hsm_signature || randomHex(128);

  const base = {
    provenance: { merkle_root: merkleRoot, ipfs_cid: ipfsCid, hsm_signature: hsmSig },
  };

  switch (req.registry) {
    case "VERRA_VCS":
      return {
        registry: "VERRA_VCS",
        methodology: req.methodology,
        project_id: `VCS-2026-${req.project_id}`,
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity_tco2e: req.calculation_details.net_credits_tco2e || req.calculation_details.net_credits || 0,
          serial_prefix: req.serial_prefix || `VCU-2026-${req.project_id}`,
          unit: "tCO2e",
        },
        calculation_details: req.calculation_details,
        monitoring_period: req.monitoring_period || {},
        ...base,
        verification: req.verification || {},
      };

    case "GOLD_STANDARD":
      return {
        registry: "GOLD_STANDARD",
        methodology: req.methodology,
        project_id: `GS-2026-${req.project_id}`,
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity_tco2e: req.calculation_details.net_credits_tco2e || 0,
          serial_prefix: req.serial_prefix || `GS-VER-2026-${req.project_id}`,
          unit: "tCO2e",
        },
        calculation_details: req.calculation_details,
        sdg_impacts: req.sdg_impacts || {},
        ...base,
        verification: req.verification || {},
      };

    case "I_TRACK":
      return {
        registry: "I_TRACK",
        methodology: req.methodology,
        project_id: `I-REC-2026-${req.project_id}`,
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity_mwh: req.calculation_details.recs_issued || req.calculation_details.net_generation_kwh / 1000 || 0,
          serial_prefix: req.serial_prefix || `I-REC-2026-${req.project_id}`,
          unit: "MWh",
        },
        calculation_details: req.calculation_details,
        ...base,
        registry_link: req.registry_link || { country: "IN", energy_source: "BIOMASS" },
      };

    case "CCTS_ICM":
      return {
        registry: "CCTS_ICM",
        methodology: req.methodology,
        entity_registration_id: req.entity_registration_id || "",
        report_type: req.reporting_period ? "FORM_A" : "ISSUANCE",
        reporting_period: req.reporting_period || "",
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity_cccs: req.gei_calculation?.surplus_deficit_tco2e || req.calculation_details.net_credits_tco2e || req.calculation_details.emission_reductions_tco2e || 0,
          serial_prefix: req.serial_prefix || `CCC-2026-${req.project_id}`,
          unit: "tCO2e",
        },
        calculation_details: req.calculation_details,
        activities: req.activities || [],
        emission_sources: req.emission_sources || [],
        source_streams: req.source_streams || [],
        gei_calculation: req.gei_calculation || {},
        nsdl_depository: req.nsdl_depository || {},
        ...base,
        submission_metadata: {
          submitted_via: "MCP_AGENT",
          submission_timestamp: new Date().toISOString(),
        },
      };

    case "EU_CBAM":
      return {
        registry: "EU_CBAM",
        report_type: "DECLARANT_REPORT",
        declarant_id: req.entity_registration_id || "",
        importing_company: req.importing_company || "",
        goods_category: "IRON_AND_STEEL_PRODUCTS",
        cn_code: req.cn_code || "",
        product: req.cbam_product || "",
        production_period: req.reporting_period || "",
        production_data: req.production_data || req.calculation_details,
        cbam_benchmark: req.cbam_benchmark || {},
        ...base,
        verification: req.verification || {},
      };

    case "PURO_EARTH":
      return {
        registry: "PURO_EARTH",
        methodology: req.methodology,
        project_id: `PURO-${req.project_id}`,
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity_corcs: req.calculation_details.net_credits_tco2e || 0,
          serial_prefix: req.serial_prefix || `CORC-2026-${req.project_id}`,
          unit: "tCO2e",
        },
        batch_data: req.batch_data || {},
        calculation_details: req.calculation_details,
        permanence_tier: req.permanence_tier || "1000_YEAR",
        ...base,
        verification: req.verification || {},
      };

    case "ISOMETRIC":
      return {
        registry: "ISOMETRIC",
        methodology: req.methodology,
        project_id: `ISO-${req.project_id}`,
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity_cdr_units: req.calculation_details.net_credits_tco2e || 0,
          serial_prefix: req.serial_prefix || `ISO-CDR-2026-${req.project_id}`,
          unit: "tCO2e",
        },
        calculation_details: req.calculation_details,
        ...base,
        verification: {
          ...req.verification,
          certification_standard: "ISO_14064_2",
        },
      };

    default:
      return {
        registry: req.registry,
        methodology: req.methodology,
        project_id: req.project_id,
        issuance_request: {
          issuance_date: new Date().toISOString().slice(0, 10),
          vintage: req.vintage,
          quantity: req.calculation_details.net_credits_tco2e || 0,
          unit: "tCO2e",
        },
        calculation_details: req.calculation_details,
        ...base,
      };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { registry, methodology, project_id, plant_config_id, user_id, vintage, ...rest } = body;

    if (!registry || !methodology || !project_id) {
      return json({ error: "Missing required fields: registry, methodology, project_id" }, 400);
    }

    const issuanceJson = buildIssuance({ registry, methodology, project_id, plant_config_id, user_id, vintage, ...rest } as RegistryRequest);

    // Persist to dvm_credit_inventory
    if (plant_config_id && user_id) {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      };
      const creditType = registry === "I_TRACK" ? "I-REC" :
        registry === "VERRA_VCS" ? "VCU" :
        registry === "GOLD_STANDARD" ? "GS-VER" :
        registry === "PURO_EARTH" ? "CORC" :
        registry === "ISOMETRIC" ? "CDR" :
        registry === "CCTS_ICM" ? "CCC" :
        registry === "EU_CBAM" ? "CBAM" : "GENERIC";

      const quantity = issuanceJson.issuance_request?.quantity_tco2e ||
        issuanceJson.issuance_request?.quantity_corcs ||
        issuanceJson.issuance_request?.quantity_cdr_units ||
        issuanceJson.issuance_request?.quantity_cccs ||
        issuanceJson.issuance_request?.quantity_mwh || 0;

      await fetch(`${supabaseUrl}/rest/v1/dvm_credit_inventory`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          plant_config_id,
          user_id,
          issuance_ref: `${registry}-${Date.now().toString(36).toUpperCase()}`,
          credit_type: creditType,
          quantity: Number(quantity),
          vintage: vintage || "",
          registry_ref: registry,
          serial_numbers: [issuanceJson.issuance_request?.serial_prefix || ""],
          status: "ACTIVE",
        }),
      });
    }

    return json({
      status: "issued",
      registry,
      issuance: issuanceJson,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
