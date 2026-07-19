import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REGISTRIES: Record<string, { name: string; type: string; api_endpoint: string; credit_unit: string; wallet: string }> = {
  ccts: { name: 'India CCTS (NSDL)', type: 'compliance', api_endpoint: 'https://icm.beeindia.gov.in/api/v1/form-a', credit_unit: 'CCC', wallet: 'NSDL' },
  verra: { name: 'Verra VCS', type: 'voluntary', api_endpoint: 'https://registry.verra.org/api/v1/issuance', credit_unit: 'VCU', wallet: 'Verra Custody' },
  gold_standard: { name: 'Gold Standard', type: 'voluntary', api_endpoint: 'https://registry.goldstandard.org/api/v1/issuance', credit_unit: 'GS-VER', wallet: 'GS Custody' },
  irec: { name: 'I-TRACK (I-REC)', type: 'compliance', api_endpoint: 'https://api.evident.app/v1/irec/issuance', credit_unit: 'I-REC', wallet: 'I-REC Custody' },
  gcc: { name: 'Global Carbon Council', type: 'voluntary', api_endpoint: 'https://registry.gcc.org/api/v1/issuance', credit_unit: 'ACC', wallet: 'GCC Custody' },
  isometric: { name: 'Isometric', type: 'voluntary', api_endpoint: 'https://registry.isometric.com/api/v1/cdr', credit_unit: 'CDR Unit', wallet: 'Isometric Custody' },
  puro: { name: 'Puro.earth', type: 'voluntary', api_endpoint: 'https://registry.puro.earth/api/v1/corc', credit_unit: 'CORC', wallet: 'Puro Custody' },
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
    const { registry, projectId, methodology, phase, tokenType, merkleRoot, hsmSignature } = await req.json();
    const reg = REGISTRIES[registry];
    if (!reg) {
      return new Response(
        JSON.stringify({ error: 'Registry not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = {
      registry: reg.name,
      registry_type: reg.type,
      status: phase === 'monitoring' ? 'issued' : 'submitted',
      project_id: projectId,
      methodology,
      phase,
      token_type: tokenType,
      credit_unit: reg.credit_unit,
      api_endpoint: reg.api_endpoint,
      wallet_provider: reg.wallet,
      tx_hash: randomHex(64),
      ipfs_cid: 'Qm' + randomHex(46).slice(2),
      merkle_root: merkleRoot || randomHex(64),
      hsm_signature: hsmSignature || randomHex(128),
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
