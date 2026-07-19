import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const SETTLEMENT_PRICE_PER_CREDIT = 2100;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, seller, buyer, quantity, registry, creditUnit } = await req.json();

    if (action === 'mint') {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', seller)
        .maybeSingle();

      if (error) throw error;
      if (!wallet) {
        return new Response(
          JSON.stringify({ error: 'Seller wallet not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newAvailable = Number(wallet.available_credits) + Number(quantity);
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ available_credits: newAvailable, updated_at: new Date().toISOString() })
        .eq('user_id', seller);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          status: 'minted',
          credit_unit: creditUnit,
          quantity,
          registry,
          wallet: { ...wallet, available_credits: newAvailable },
          tx_hash: '0x' + Math.random().toString(16).slice(2, 66),
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'sell') {
      const { data: sellerWallet, error: sellerError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', seller)
        .maybeSingle();
      if (sellerError) throw sellerError;
      if (!sellerWallet || Number(sellerWallet.available_credits) < Number(quantity)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credit balance' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: buyerWallet, error: buyerError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', buyer)
        .maybeSingle();
      if (buyerError) throw buyerError;
      if (!buyerWallet) {
        return new Response(
          JSON.stringify({ error: 'Buyer wallet not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const settlementTotal = Number(quantity) * SETTLEMENT_PRICE_PER_CREDIT;

      const { error: sellerUpdateError } = await supabase
        .from('wallets')
        .update({
          available_credits: Number(sellerWallet.available_credits) - Number(quantity),
          total_value: Number(sellerWallet.total_value) + settlementTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', seller);
      if (sellerUpdateError) throw sellerUpdateError;

      const { error: buyerUpdateError } = await supabase
        .from('wallets')
        .update({
          available_credits: Number(buyerWallet.available_credits) + Number(quantity),
          total_value: Number(buyerWallet.total_value) - settlementTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', buyer);
      if (buyerUpdateError) throw buyerUpdateError;

      const tradeRef = 'IEX-ORD-' + Date.now();
      const exchangeResponse = {
        exchange: 'IEX',
        trade_ref: tradeRef,
        status: 'settled',
        credit_unit: creditUnit,
        ccc_transferred: quantity,
        settlement_price_per_credit: SETTLEMENT_PRICE_PER_CREDIT,
        settlement_total: settlementTotal,
        seller_wallet_id: seller,
        buyer_wallet_id: buyer,
        registry,
        tx_hash: '0x' + Math.random().toString(16).slice(2, 66),
        timestamp: new Date().toISOString(),
      };

      return new Response(
        JSON.stringify(exchangeResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'balance') {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', seller)
        .maybeSingle();
      if (error) throw error;

      return new Response(
        JSON.stringify({ wallet: wallet || null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
