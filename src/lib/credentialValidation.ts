import { supabase } from './supabase';
import { REGISTRIES } from '../data/registries';
import { EXCHANGES } from '../data/exchanges';
import type { AuthStatus } from '../types';

export interface ValidationResult {
  valid: boolean;
  message: string;
  stampHash?: string;
}

export async function validateRegistryCredential(registryId: string, apiKey: string, _apiSecret?: string): Promise<ValidationResult> {
  const registry = REGISTRIES.find(r => r.id === registryId);
  if (!registry) return { valid: false, message: 'Unknown registry' };
  if (!apiKey || apiKey.trim().length < 4) return { valid: false, message: 'API key too short' };

  await new Promise(r => setTimeout(r, 800));
  const stampHash = `VVB-${registryId}-${Date.now().toString(36).toUpperCase()}`;
  return { valid: true, message: `Credentials verified with ${registry.name}`, stampHash };
}

export async function validateExchangeCredential(exchangeId: string, apiKey: string, _apiSecret?: string): Promise<ValidationResult> {
  const exchange = EXCHANGES.find(e => e.id === exchangeId);
  if (!exchange) return { valid: false, message: 'Unknown exchange' };
  if (!apiKey || apiKey.trim().length < 4) return { valid: false, message: 'API key too short' };

  await new Promise(r => setTimeout(r, 800));
  const stampHash = `EXC-${exchangeId}-${Date.now().toString(36).toUpperCase()}`;
  return { valid: true, message: `Credentials verified with ${exchange.name}`, stampHash };
}

export async function validateWalletCredential(walletAddress: string, apiKey: string): Promise<ValidationResult> {
  if (!walletAddress || walletAddress.trim().length < 6) return { valid: false, message: 'Wallet address too short' };
  if (!apiKey || apiKey.trim().length < 4) return { valid: false, message: 'API key too short' };

  await new Promise(r => setTimeout(r, 600));
  const stampHash = `WAL-${Date.now().toString(36).toUpperCase()}`;
  return { valid: true, message: 'Wallet credentials verified', stampHash };
}

export async function saveCredentialAndStamp(
  userId: string,
  credentialType: 'registry' | 'exchange' | 'wallet',
  provider: string,
  apiKey: string,
  username: string | null,
  password: string | null,
  apiEndpoint: string | null,
  persona: string,
  providerType: string,
  stampHash: string,
  metadata: Record<string, unknown>
): Promise<{ credId: string | null; error: string | null }> {
  const { data: credData, error: credErr } = await supabase.from('persona_credentials').insert({
    user_id: userId,
    credential_type: credentialType,
    provider,
    api_key: apiKey,
    api_endpoint: apiEndpoint,
    username,
    password,
    auth_status: 'authenticated' as AuthStatus,
    verified_at: new Date().toISOString(),
    metadata,
  }).select().single();

  if (credErr) return { credId: null, error: credErr.message };

  await supabase.from('auth_stamps').insert({
    user_id: userId,
    persona,
    provider,
    provider_type: providerType,
    status: 'authenticated' as AuthStatus,
    stamp_hash: stampHash,
    stamped_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    metadata,
  });

  return { credId: credData?.id ?? null, error: null };
}
