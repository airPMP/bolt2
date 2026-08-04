import { useState, useEffect, useCallback } from 'react';
import { Building2, Send, Coins, TrendingUp, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, FingerprintPattern as Fingerprint, Zap, Clock, Database, Wifi, FileText } from 'lucide-react';
import ESGDashboard from '../Shared/ESGDashboard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { REGISTRIES } from '../../data/registries';
import { EXCHANGES } from '../../data/exchanges';
import CredentialTester from '../Shared/CredentialTester';
import AuthBadge from '../Shared/AuthBadge';
import AuthStampPanel from '../Shared/AuthStampPanel';
import type { AuthStamp, PlantConfig, PersonaCredential, DataSubmission, TokenMint, ExchangeListing, Wallet, ProjectStatus } from '../../types';

type DevTab = 'overview' | 'credentials' | 'submit' | 'mint' | 'exchange' | 'wallet' | 'esg';

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<DevTab>('overview');
  const [plantConfigs, setPlantConfigs] = useState<PlantConfig[]>([]);
  const [credentials, setCredentials] = useState<PersonaCredential[]>([]);
  const [stamps, setStamps] = useState<AuthStamp[]>([]);
  const [submissions, setSubmissions] = useState<DataSubmission[]>([]);
  const [tokenMints, setTokenMints] = useState<TokenMint[]>([]);
  const [exchangeListings, setExchangeListings] = useState<ExchangeListing[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [mintQuantity, setMintQuantity] = useState(0);
  const [mintTokenType, setMintTokenType] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('');
  const [listQuantity, setListQuantity] = useState(0);
  const [listPrice, setListPrice] = useState(0);
  const [selectedRegistry, setSelectedRegistry] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    const [plants, creds, stampsRes, subs, mints, listings, wal] = await Promise.all([
      supabase.from('plant_configs').select('*').order('created_at', { ascending: false }),
      supabase.from('persona_credentials').select('*').eq('user_id', user.id),
      supabase.from('auth_stamps').select('*').eq('user_id', user.id).order('stamped_at', { ascending: false }),
      supabase.from('data_submissions').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false }),
      supabase.from('token_mints').select('*').eq('user_id', user.id).order('minted_at', { ascending: false }),
      supabase.from('exchange_listings').select('*').eq('user_id', user.id).order('listed_at', { ascending: false }),
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    if (plants.data) setPlantConfigs(plants.data);
    if (creds.data) setCredentials(creds.data);
    if (stampsRes.data) setStamps(stampsRes.data);
    if (subs.data) setSubmissions(subs.data);
    if (mints.data) setTokenMints(mints.data);
    if (listings.data) setExchangeListings(listings.data);
    if (wal.data) setWallet(wal.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const registryCred = credentials.find(c => c.credential_type === 'registry' && c.auth_status === 'authenticated');
  const exchangeCreds = credentials.filter(c => c.credential_type === 'exchange' && c.auth_status === 'authenticated');
  const validatedPlants = plantConfigs.filter(p => p.status === 'REGISTRY_VALIDATED' || p.status === 'DATA_STREAMING' || p.status === 'CREDITS_ISSUED');

  async function handlePushData() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.id === selectedPlantId);
      if (!plant) throw new Error('Select a plant');
      if (!plant.mac_address) throw new Error('No MAC locked');
      if (!registryCred) throw new Error('Registry not authenticated');
      const payload = { plant_code: plant.plant_code, mac_address: plant.mac_address, timestamp: new Date().toISOString(), interval: '15min', sensor_data: { power_consumption_kwh: (Math.random() * 5000 + 2000).toFixed(2), flow_rate_m3h: (Math.random() * 100 + 50).toFixed(2), temperature_c: (Math.random() * 50 + 20).toFixed(1), gas_concentration_ppm: (Math.random() * 100 + 10).toFixed(1), humidity_pct: (Math.random() * 30 + 40).toFixed(1), irradiance_wm2: (Math.random() * 800 + 100).toFixed(0) }, ghg_calculator_type: plant.ghg_calculator_type, methodology: plant.methodology, registry: plant.registry };
      await new Promise(r => setTimeout(r, 1500));
      const registryResponse = { status: 'accepted', submission_id: `SUB-${Date.now().toString(36).toUpperCase()}`, data_points: 6, verified: true };
      await supabase.from('data_submissions').insert({ user_id: user.id, plant_config_id: plant.id, mac_address: plant.mac_address, registry: plant.registry, payload, interval_minutes: 15, submission_status: 'submitted', registry_response: registryResponse });
      await supabase.from('plant_configs').update({ status: 'DATA_STREAMING' as ProjectStatus }).eq('id', plant.id);
      setSuccess(`15-min data pushed to ${plant.registry}.`); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleMintTokens() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.id === selectedPlantId);
      if (!plant) throw new Error('Select a plant');
      if (!registryCred) throw new Error('Registry not authenticated');
      const reg = REGISTRIES.find(r => r.id === plant.registry);
      const tokenType = mintTokenType || (plant.token_type === 'black' ? 'CCC' : 'I-REC');
      await new Promise(r => setTimeout(r, 1500));
      const serialNumber = `${reg?.credit_unit}-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from('token_mints').insert({ user_id: user.id, plant_config_id: plant.id, registry: plant.registry, token_type: tokenType, quantity: mintQuantity, serial_number: serialNumber, mint_status: 'minted', wallet_address: reg?.wallet, registry_response: { status: 'minted', serial_number: serialNumber, quantity: mintQuantity } });
      if (wallet) await supabase.from('wallets').update({ available_credits: wallet.available_credits + mintQuantity, total_value: wallet.total_value + mintQuantity * 2100 }).eq('id', wallet.id);
      await supabase.from('plant_configs').update({ status: 'CREDITS_ISSUED' as ProjectStatus }).eq('id', plant.id);
      await supabase.from('auth_stamps').insert({ user_id: user.id, persona: 'developer', provider: plant.registry, provider_type: 'token_mint', status: 'authenticated', stamp_hash: `MINT-${Date.now().toString(36).toUpperCase()}`, stamped_at: new Date().toISOString(), metadata: { quantity: mintQuantity, token_type: tokenType } });
      setSuccess(`${mintQuantity} ${tokenType} minted.`); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handlePushToExchange() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const lastMint = tokenMints[tokenMints.length - 1];
      if (!lastMint) throw new Error('No tokens minted');
      const exchange = EXCHANGES.find(e => e.id === selectedExchange);
      if (!exchange) throw new Error('Select exchange');
      const exCred = exchangeCreds.find(c => c.provider === selectedExchange);
      if (!exCred) throw new Error('Exchange not authenticated');
      await new Promise(r => setTimeout(r, 1500));
      await supabase.from('exchange_listings').insert({ user_id: user.id, token_mint_id: lastMint.id, exchange: selectedExchange, token_type: lastMint.token_type, quantity: listQuantity, price_per_unit: listPrice, listing_status: 'listed', exchange_response: { status: 'listed', listing_id: `LST-${Date.now().toString(36).toUpperCase()}` } });
      await supabase.from('auth_stamps').insert({ user_id: user.id, persona: 'developer', provider: selectedExchange, provider_type: 'exchange_listing', status: 'authenticated', stamp_hash: `LST-${Date.now().toString(36).toUpperCase()}`, stamped_at: new Date().toISOString(), metadata: { quantity: listQuantity } });
      setSuccess(`${listQuantity} ${lastMint.token_type} listed on ${exchange.name}.`); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  const tabs: { id: DevTab; label: string; icon: typeof Building2 }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 }, { id: 'credentials', label: 'Registry Auth', icon: Fingerprint },
    { id: 'submit', label: 'Push 15-min Data', icon: Send }, { id: 'mint', label: 'Mint Tokens', icon: Coins },
    { id: 'exchange', label: 'Exchange Auth & List', icon: TrendingUp }, { id: 'wallet', label: 'My Wallet', icon: Database },
    { id: 'esg', label: 'ESG Reporting', icon: FileText },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900 mb-1">Project Developer Dashboard</h1><p className="text-gray-600">Authenticate with registry, push 15-min plant data, mint tokens, and list on exchanges</p></div>
      <div className="mb-6"><AuthStampPanel stamps={stamps} loading={false} /></div>
      {error && <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span className="text-sm">{error}</span></div>}
      {success && <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /><span className="text-sm">{success}</span></div>}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{tabs.map(t => { const Icon = t.icon; return <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${tab === t.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Icon className="w-4 h-4" />{t.label}</button>; })}</div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-4">
          {[{ icon: Building2, label: 'Validated Plants', value: validatedPlants.length, color: 'bg-blue-500' }, { icon: Send, label: 'Data Submissions', value: submissions.length, color: 'bg-green-500' }, { icon: Coins, label: 'Tokens Minted', value: tokenMints.reduce((s, m) => s + Number(m.quantity), 0), color: 'bg-amber-500' }, { icon: TrendingUp, label: 'Exchange Listings', value: exchangeListings.length, color: 'bg-purple-500' }, { icon: Database, label: 'Wallet Credits', value: wallet?.available_credits || 0, color: 'bg-teal-500' }, { icon: Fingerprint, label: 'Auth Stamps', value: stamps.length, color: 'bg-slate-700' }].map(s => { const Icon = s.icon; return <div key={s.label} className="bg-white rounded-xl shadow p-5"><div className={`${s.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}><Icon className="w-5 h-5 text-white" /></div><div className="text-2xl font-bold text-gray-900">{s.value}</div><div className="text-sm text-gray-500">{s.label}</div></div>; })}
        </div>
      )}

      {tab === 'credentials' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registry Authentication</h2>
          <p className="text-gray-600 mb-4 text-sm">Enter your plant credentials (NOT VVB credentials) to authenticate.</p>
          {registryCred && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="text-sm font-medium text-emerald-700">Authenticated with {REGISTRIES.find(r => r.id === registryCred.provider)?.name}</span><AuthBadge status="authenticated" label="Green Tick" size="sm" /></div>}
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Select Registry</label><select value={selectedRegistry} onChange={e => setSelectedRegistry(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{REGISTRIES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          {selectedRegistry && !registryCred && user && <CredentialTester credType="registry" providerId={selectedRegistry} userId={user.id} persona="developer" onAuthenticated={() => { setSelectedRegistry(''); loadData(); }} />}
        </div>
      )}

      {tab === 'submit' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Push 15-Minute Sensor Data</h2>
          {!registryCred && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">Registry not authenticated. Get green tick first.</div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Select Plant</label><select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name} — MAC: {p.mac_address}</option>)}</select></div>
            {selectedPlantId && <div className="flex items-center gap-3"><Wifi className="w-5 h-5 text-gray-400" /><AuthBadge status={registryCred ? 'authenticated' : 'pending'} label={registryCred ? 'Connected' : 'Not Connected'} /></div>}
            <button onClick={handlePushData} disabled={loading || !selectedPlantId || !registryCred} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Push Data</button>
          </div>
          {submissions.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Submissions</h3><div className="space-y-2 max-h-64 overflow-y-auto">{submissions.slice(0, 10).map(s => <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-600">{new Date(s.submitted_at).toLocaleString('en-IN')}</span></div><AuthBadge status={s.submission_status === 'submitted' ? 'authenticated' : 'failed'} label={s.submission_status} size="sm" /></div>)}</div></div>}
        </div>
      )}

      {tab === 'mint' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mint Carbon Tokens</h2>
          {!registryCred && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">Registry not authenticated.</div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Select Plant</label><select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Token Type</label><input value={mintTokenType} onChange={e => setMintTokenType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="CCC, I-REC, VCU" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label><input type="number" value={mintQuantity} onChange={e => setMintQuantity(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            </div>
            <button onClick={handleMintTokens} disabled={loading || !selectedPlantId || !mintQuantity || !registryCred} className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}Mint</button>
          </div>
          {tokenMints.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-gray-700 mb-2">Minted Tokens</h3><div className="space-y-2">{tokenMints.map(m => <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><Coins className="w-4 h-4 text-amber-500" /><div><span className="font-medium text-sm">{m.quantity} {m.token_type}</span><span className="text-xs text-gray-500 ml-2">{m.serial_number}</span></div></div><AuthBadge status={m.mint_status === 'minted' ? 'authenticated' : 'failed'} label={m.mint_status} size="sm" /></div>)}</div></div>}
        </div>
      )}

      {tab === 'exchange' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Exchange Authentication</h2>
            <p className="text-gray-600 mb-4 text-sm">Use exchange credentials (NOT registry credentials).</p>
            {exchangeCreds.length > 0 && <div className="mb-4 flex flex-wrap gap-2">{exchangeCreds.map(c => <div key={c.id} className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-sm text-emerald-700">{EXCHANGES.find(e => e.id === c.provider)?.name}</span><AuthBadge status="authenticated" label="Green Tick" size="sm" /></div>)}</div>}
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Select Exchange</label><select value={selectedExchange} onChange={e => setSelectedExchange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{EXCHANGES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
            {selectedExchange && !exchangeCreds.find(c => c.provider === selectedExchange) && user && <CredentialTester credType="exchange" providerId={selectedExchange} userId={user.id} persona="developer" onAuthenticated={() => { setSelectedExchange(''); loadData(); }} />}
          </div>
          {tokenMints.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Push Tokens to Exchange</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Exchange</label><select value={selectedExchange} onChange={e => setSelectedExchange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{EXCHANGES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label><input type="number" value={listQuantity} onChange={e => setListQuantity(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Price/Unit (₹)</label><input type="number" value={listPrice} onChange={e => setListPrice(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
                </div>
                <button onClick={handlePushToExchange} disabled={loading || !selectedExchange || !listQuantity || !exchangeCreds.find(c => c.provider === selectedExchange)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}List</button>
              </div>
              {exchangeListings.length > 0 && <div className="mt-6 space-y-2"><h3 className="text-sm font-semibold text-gray-700 mb-2">Listings</h3>{exchangeListings.map(l => <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><TrendingUp className="w-4 h-4 text-indigo-500" /><span className="text-sm font-medium">{l.quantity} {l.token_type} on {EXCHANGES.find(e => e.id === l.exchange)?.name}</span></div><AuthBadge status={l.listing_status === 'listed' ? 'authenticated' : 'failed'} label={l.listing_status} size="sm" /></div>)}</div>}
            </div>
          )}
        </div>
      )}

      {tab === 'wallet' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Wallet</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-teal-50 rounded-lg"><div className="text-xs text-teal-600 mb-1">Available</div><div className="text-2xl font-bold text-teal-700">{wallet?.available_credits || 0}</div></div>
            <div className="p-4 bg-amber-50 rounded-lg"><div className="text-xs text-amber-600 mb-1">Pending</div><div className="text-2xl font-bold text-amber-700">{wallet?.pending_credits || 0}</div></div>
            <div className="p-4 bg-purple-50 rounded-lg"><div className="text-xs text-purple-600 mb-1">Value (₹)</div><div className="text-2xl font-bold text-purple-700">{wallet?.total_value?.toLocaleString('en-IN') || 0}</div></div>
          </div>
          <div><h3 className="text-sm font-semibold text-gray-700 mb-2">Token History</h3><div className="space-y-2">{tokenMints.map(m => <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /><span className="text-sm">{m.quantity} {m.token_type}</span><span className="text-xs text-gray-500">{new Date(m.minted_at).toLocaleString('en-IN')}</span></div><AuthBadge status={m.mint_status === 'minted' ? 'authenticated' : 'failed'} label={m.mint_status} size="sm" /></div>)}{tokenMints.length === 0 && <p className="text-sm text-gray-400">No tokens yet</p>}</div></div>
        </div>
      )}

      {tab === 'esg' && <ESGDashboard />}
    </div>
  );
}
