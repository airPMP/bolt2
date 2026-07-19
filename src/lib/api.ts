import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'X-Client-Info': 'blockvolt-erth/1.0',
};

export interface BoQResponse {
  boq: {
    items: Array<{ id: string; name: string; unit: string; unitPrice: number; scope: string }>;
    total: number;
    phase: string;
  };
  samplePayload: {
    gateway_id: string;
    timestamp: string;
    methodology: string;
    phase: string;
    sensors: Array<{ id: string; value: number; unit: string }>;
    merkle_root: string;
    hsm_signature: string;
  };
}

export async function fetchBoQ(params: {
  industry?: string;
  club?: string;
  methodology: string;
  scopeLevel?: string;
  phase: 'pdd' | 'monitoring';
}): Promise<BoQResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/boq`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `BoQ request failed (${res.status})`);
  }
  return res.json();
}

export interface RegistrySubmitResponse {
  registry: string;
  registry_type: string;
  status: string;
  project_id: string;
  methodology: string;
  phase: string;
  token_type: string;
  credit_unit: string;
  api_endpoint: string;
  wallet_provider: string;
  tx_hash: string;
  ipfs_cid: string;
  merkle_root: string;
  hsm_signature: string;
  timestamp: string;
}

export async function submitToRegistry(params: {
  registry: string;
  projectId: string;
  methodology: string;
  phase: 'pdd' | 'monitoring';
  tokenType: 'black' | 'green';
  merkleRoot?: string;
  hsmSignature?: string;
}): Promise<RegistrySubmitResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/registry-submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Registry submit failed (${res.status})`);
  }
  return res.json();
}

export interface WalletMintResponse {
  status: string;
  credit_unit: string;
  quantity: number;
  registry: string;
  wallet: unknown;
  tx_hash: string;
  timestamp: string;
}

export interface WalletSellResponse {
  exchange: string;
  trade_ref: string;
  status: string;
  credit_unit: string;
  ccc_transferred: number;
  settlement_price_per_credit: number;
  settlement_total: number;
  seller_wallet_id: string;
  buyer_wallet_id: string;
  registry: string;
  tx_hash: string;
  timestamp: string;
}

export async function walletMint(params: {
  seller: string;
  quantity: number;
  registry: string;
  creditUnit: string;
}): Promise<WalletMintResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/wallet`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'mint', ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Wallet mint failed (${res.status})`);
  }
  return res.json();
}

export async function walletSell(params: {
  seller: string;
  buyer: string;
  quantity: number;
  registry: string;
  creditUnit: string;
}): Promise<WalletSellResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/wallet`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'sell', ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Wallet sell failed (${res.status})`);
  }
  return res.json();
}

export async function walletBalance(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/wallet`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'balance', seller: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Wallet balance failed (${res.status})`);
  }
  return res.json();
}

export interface IEXMarketData {
  instrument: string;
  exchange: string;
  currency: string;
  last_price: number;
  change: number;
  change_pct: number;
  session_high: number;
  session_low: number;
  session_volume: number;
  last_updated: string;
  intraday: Array<{ hour: string; price: number; volume: number }>;
  order_book: { bids: Array<{ price: number; qty: number }>; asks: Array<{ price: number; qty: number }> };
  unit: string;
  note: string;
}

export async function fetchIEXMarket(instrument: 'rec' | 'ccc' = 'rec'): Promise<IEXMarketData> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/iex-market?instrument=${instrument}`, {
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `IEX market request failed (${res.status})`);
  }
  return res.json();
}

export { supabase };
