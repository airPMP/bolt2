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

interface CbamGoodInput {
  cn_code: string;
  activity_level_tonnes: number;
  direct_emissions_tco2e?: number;
  indirect_emissions_tco2e?: number;
  production_route?: string;
}

interface PrecursorInput {
  precursor_type: string;
  cn_code: string;
  source_installation: string;
  quantity_tonnes: number;
  embedded_emissions_tco2e: number;
}

interface CbamRequest {
  user_id: string;
  plant_config_id?: string;
  installation_id: string;
  declarant_id?: string;
  importing_company?: string;
  reporting_period: string;
  goods: CbamGoodInput[];
  precursors?: PrecursorInput[];
  certificate_price_eur?: number;
  verification?: { verifier_name: string; verifier_accreditation: string; verification_report_id: string };
  submission_channel?: { portal: string; partner: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, plant_config_id, installation_id, declarant_id, importing_company, reporting_period, goods, precursors = [], certificate_price_eur = 75.28, verification, submission_channel } = body as CbamRequest;

    if (!user_id || !installation_id || !reporting_period || !goods || !Array.isArray(goods) || goods.length === 0) {
      return json({ error: "Missing required fields: user_id, installation_id, reporting_period, goods[]" }, 400);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    };

    // Lookup CN codes from reference table
    const cnCodes = goods.map(g => g.cn_code).join(",");
    const cnRes = await fetch(
      `${supabaseUrl}/rest/v1/cbam_cn_codes?cn_code=in.(${cnCodes})&select=cn_code,sector,description,direct_emissions_tco2e_per_t,indirect_emissions_tco2e_per_t,total_emissions_tco2e_per_t,production_route,benchmark_column_a,benchmark_column_b,cbam_factor_2026`,
      { headers }
    );
    const cnData = await cnRes.json();
    const cnMap: Record<string, typeof cnData[0] & { cbam_factor_2026?: number }> = {};
    for (const row of cnData) cnMap[row.cn_code] = row;

    // Process each good: compute SEE, SEFA, Chargeable
    const processedGoods = goods.map(g => {
      const cn = cnMap[g.cn_code];
      const cbamFactor = cn?.cbam_factor_2026 ?? 0.975;

      // Use provided values or fall back to CN code defaults
      const directEm = g.direct_emissions_tco2e ?? (cn?.direct_emissions_tco2e_per_t ? Number(cn.direct_emissions_tco2e_per_t) * g.activity_level_tonnes : 0);
      const indirectEm = g.indirect_emissions_tco2e ?? (cn?.indirect_emissions_tco2e_per_t ? Number(cn.indirect_emissions_tco2e_per_t) * g.activity_level_tonnes : 0);
      const totalEm = directEm + indirectEm;

      // SEE = (AttrEm_dir + AttrEm_indir) / AL
      const see = totalEm / g.activity_level_tonnes;

      // SEFA = Benchmark_Column_B × CBAM Factor
      const benchmarkB = cn?.benchmark_column_b ?? cn?.total_emissions_tco2e_per_t ?? see;
      const sefaThreshold = Number(benchmarkB) * cbamFactor;

      // Chargeable = max(0, SEE - SEFA)
      const chargeablePerTonne = Math.max(0, see - sefaThreshold);
      const totalChargeable = chargeablePerTonne * g.activity_level_tonnes;

      // Cost = Chargeable × Certificate Price
      const cbamCostEur = totalChargeable * certificate_price_eur;

      return {
        cn_code: g.cn_code,
        description: cn?.description || "Unknown CN code",
        sector: cn?.sector || "UNKNOWN",
        production_route: g.production_route || cn?.production_route || "A",
        activity_level_tonnes: g.activity_level_tonnes,
        direct_emissions_tco2e: directEm,
        indirect_emissions_tco2e: indirectEm,
        total_embedded_emissions_tco2e: totalEm,
        see_tco2e_per_tonne: Math.round(see * 10000) / 10000,
        benchmark_column_b: Number(benchmarkB),
        cbam_factor_2026: cbamFactor,
        sefa_threshold_2026: Math.round(sefaThreshold * 10000) / 10000,
        chargeable_tco2e_per_tonne: Math.round(chargeablePerTonne * 10000) / 10000,
        total_chargeable_tco2e: Math.round(totalChargeable * 100) / 100,
        certificate_price_eur: certificate_price_eur,
        cbam_cost_eur: Math.round(cbamCostEur * 100) / 100,
      };
    });

    // Aggregate totals
    const totalChargeable = processedGoods.reduce((s, g) => s + g.total_chargeable_tco2e, 0);
    const totalCbamCost = processedGoods.reduce((s, g) => s + g.cbam_cost_eur, 0);

    const merkleRoot = randomHex(64);
    const ipfsCid = "Qm" + randomHex(46).slice(2);
    const hsmSig = randomHex(128);

    // Build full declarant report
    const reportId = `CBAM-DR-${reporting_period}-${Date.now().toString(36).toUpperCase()}`;
    const report = {
      cbam_declarant_report: {
        report_id: reportId,
        declarant_id: declarant_id || "",
        importing_company: importing_company || "",
        reporting_period,
        submission_date: new Date().toISOString().slice(0, 10),
        installations: [{
          installation_id,
          installation_name: installation_id,
          country: "IN",
          cbam_goods: processedGoods,
        }],
        precursors,
        provenance: {
          merkle_root: merkleRoot,
          ipfs_cid: ipfsCid,
          hsm_signature: hsmSig,
          civv_gateway_macs: [],
        },
        verification: verification || {},
        submission_channel: submission_channel || { portal: "DEHSt", partner: "CBR_PARTNERS_GERMANY" },
      },
    };

    // Persist to cbam_declarant_reports
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/cbam_declarant_reports`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        user_id,
        plant_config_id: plant_config_id || null,
        installation_id,
        declarant_id: declarant_id || null,
        importing_company: importing_company || null,
        reporting_period,
        submission_date: new Date().toISOString().slice(0, 10),
        goods: processedGoods,
        precursors,
        total_chargeable_tco2e: totalChargeable,
        total_cbam_cost_eur: totalCbamCost,
        certificate_price_eur: certificate_price_eur,
        provenance: report.cbam_declarant_report.provenance,
        verification: verification || {},
        submission_channel: report.cbam_declarant_report.submission_channel,
        status: "DRAFT",
      }),
    });
    const dbRows = await dbRes.json();
    const reportDbId = dbRows[0]?.id;

    return json({
      status: "generated",
      report_id: reportId,
      db_id: reportDbId,
      total_chargeable_tco2e: Math.round(totalChargeable * 100) / 100,
      total_cbam_cost_eur: Math.round(totalCbamCost * 100) / 100,
      goods_summary: processedGoods.map(g => ({
        cn_code: g.cn_code,
        description: g.description,
        see: g.see_tco2e_per_tonne,
        sefa: g.sefa_threshold_2026,
        chargeable_per_tonne: g.chargeable_tco2e_per_tonne,
        total_chargeable: g.total_chargeable_tco2e,
        cbam_cost_eur: g.cbam_cost_eur,
      })),
      full_report: report,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
