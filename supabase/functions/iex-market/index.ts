import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Dummy IEX REC market data — simulates Indian Energy Exchange REC session prices
const BASE_REC_PRICE = 1200; // INR per REC
const BASE_CCC_PRICE = 2100; // INR per CCC (carbon credit)

function jitter(base: number, pct: number): number {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.max(0, +(base + delta).toFixed(2));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const instrument = url.searchParams.get('instrument') || 'rec';

    const now = new Date();
    const session24 = Array.from({ length: 24 }, (_, h) => {
      const hour = new Date(now.getTime() - (23 - h) * 3600 * 1000);
      const base = instrument === 'ccc' ? BASE_CCC_PRICE : BASE_REC_PRICE;
      const intraday = jitter(base, 0.08);
      const volume = Math.floor(800 + Math.random() * 2400);
      return {
        hour: hour.toISOString().slice(0, 13) + ':00',
        price: intraday,
        volume,
      };
    });

    const last = session24[session24.length - 1];
    const prev = session24[session24.length - 2];
    const change = +(last.price - prev.price).toFixed(2);
    const changePct = +((change / prev.price) * 100).toFixed(2);

    const orderBook = {
      bids: [
        { price: +(last.price - 1.5).toFixed(2), qty: Math.floor(200 + Math.random() * 800) },
        { price: +(last.price - 3).toFixed(2), qty: Math.floor(300 + Math.random() * 600) },
        { price: +(last.price - 5).toFixed(2), qty: Math.floor(500 + Math.random() * 500) },
      ],
      asks: [
        { price: +(last.price + 1.5).toFixed(2), qty: Math.floor(200 + Math.random() * 800) },
        { price: +(last.price + 3).toFixed(2), qty: Math.floor(300 + Math.random() * 600) },
        { price: +(last.price + 5).toFixed(2), qty: Math.floor(500 + Math.random() * 500) },
      ],
    };

    const response = {
      instrument: instrument.toUpperCase(),
      exchange: 'IEX',
      currency: 'INR',
      last_price: last.price,
      change,
      change_pct: changePct,
      session_high: Math.max(...session24.map((s) => s.price)),
      session_low: Math.min(...session24.map((s) => s.price)),
      session_volume: session24.reduce((sum, s) => sum + s.volume, 0),
      last_updated: now.toISOString(),
      intraday: session24,
      order_book: orderBook,
      unit: instrument === 'ccc' ? 'CCC (tCO2e)' : 'REC (1 MWh)',
      note: 'Dummy market data for testing — not a live IEX feed',
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
