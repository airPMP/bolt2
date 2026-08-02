import { useState } from 'react';
import { Loader as Loader2, CircleCheck as CheckCircle, Circle as XCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { validateRegistryCredential, validateExchangeCredential, validateWalletCredential, saveCredentialAndStamp, type ValidationResult } from '../../lib/credentialValidation';
import { REGISTRIES } from '../../data/registries';
import { EXCHANGES } from '../../data/exchanges';

interface CredentialTesterProps {
  credType: 'registry' | 'exchange' | 'wallet';
  providerId: string;
  userId: string;
  persona: string;
  onAuthenticated: () => void;
  label?: string;
}

export default function CredentialTester({ credType, providerId, userId, persona, onAuthenticated, label }: CredentialTesterProps) {
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');

  const providerName = credType === 'registry' ? REGISTRIES.find(r => r.id === providerId)?.name ?? providerId
    : credType === 'exchange' ? EXCHANGES.find(e => e.id === providerId)?.name ?? providerId : 'Blockvolt Wallet';

  async function handleTest() {
    setTesting(true); setError(''); setResult(null);
    try {
      let validation: ValidationResult;
      let apiEndpoint: string | null = null;
      if (credType === 'registry') { const reg = REGISTRIES.find(r => r.id === providerId); apiEndpoint = reg?.api_endpoint ?? null; validation = await validateRegistryCredential(providerId, apiKey); }
      else if (credType === 'exchange') { const exc = EXCHANGES.find(e => e.id === providerId); apiEndpoint = exc?.api_endpoint ?? null; validation = await validateExchangeCredential(providerId, apiKey); }
      else { validation = await validateWalletCredential(walletAddress, apiKey); }
      if (!validation.valid) { setResult(validation); return; }
      const { error: saveErr } = await saveCredentialAndStamp(userId, credType, providerId, apiKey, username || null, password || null, apiEndpoint, persona, credType, validation.stampHash!, { provider_name: providerName, username, wallet_address: walletAddress });
      if (saveErr) { setError(saveErr); return; }
      setResult(validation); onAuthenticated();
    } catch (err) { setError(err instanceof Error ? err.message : 'Test failed'); }
    finally { setTesting(false); }
  }

  const isValid = result?.valid === true;
  return (
    <div className={`rounded-lg border-2 p-4 transition-colors ${isValid ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <KeyRound className="w-5 h-5 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-900">{label ?? `${providerName} Credentials`}</h4>
        {isValid && <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Green Tick</span>}
      </div>
      {credType === 'wallet' && <div className="mb-3"><label className="block text-xs font-medium text-gray-600 mb-1">Wallet Address</label><input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} disabled={isValid} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono disabled:bg-gray-100" placeholder="0x..." /></div>}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {credType !== 'wallet' && <div><label className="block text-xs font-medium text-gray-600 mb-1">Username</label><input value={username} onChange={e => setUsername(e.target.value)} disabled={isValid} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100" placeholder="Username" /></div>}
        {credType !== 'wallet' && <div><label className="block text-xs font-medium text-gray-600 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isValid} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100" placeholder="Password" /></div>}
      </div>
      <div className="mb-3"><label className="block text-xs font-medium text-gray-600 mb-1">API Key</label><input value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={isValid} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono disabled:bg-gray-100" placeholder="API key" /></div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {result && !result.valid && <div className="flex items-center gap-1.5 text-xs text-red-600 mb-2"><XCircle className="w-4 h-4" /> {result.message}</div>}
      {result && result.valid && <div className="flex items-center gap-1.5 text-xs text-emerald-700 mb-2"><CheckCircle className="w-4 h-4" /> {result.message}{result.stampHash && <span className="font-mono text-emerald-500 ml-1">#{result.stampHash.slice(0, 12)}</span>}</div>}
      {!isValid && <button onClick={handleTest} disabled={testing || !apiKey} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Test Connection</button>}
    </div>
  );
}
