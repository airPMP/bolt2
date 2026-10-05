import { useState, useEffect, useCallback } from 'react';
import { Building2, Send, Coins, TrendingUp, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, FingerprintPattern as Fingerprint, Zap, Clock, Database, Wifi, FileText, Activity, Layers, FlaskConical, Bell, Globe, Flame, Leaf, ShieldCheck } from 'lucide-react';
import ESGDashboard from '../Shared/ESGDashboard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { REGISTRIES } from '../../data/registries';
import { EXCHANGES } from '../../data/exchanges';
import CredentialTester from '../Shared/CredentialTester';
import AuthBadge from '../Shared/AuthBadge';
import AuthStampPanel from '../Shared/AuthStampPanel';
import type { AuthStamp, PlantConfig, PersonaCredential, DataSubmission, TokenMint, ExchangeListing, Wallet, ProjectStatus, DvmModel, DvmModelRun, DvmEvent, DvmRuleResult, DvmLedger, MizanCivvRecord, MizanToken } from '../../types';

type DevTab = 'overview' | 'credentials' | 'submit' | 'mint' | 'exchange' | 'wallet' | 'esg' | 'dvm' | 'mizan';

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
  const [dvmModels, setDvmModels] = useState<DvmModel[]>([]);
  const [dvmModelRuns, setDvmModelRuns] = useState<DvmModelRun[]>([]);
  const [dvmEvents, setDvmEvents] = useState<DvmEvent[]>([]);
  const [dvmAlerts, setDvmAlerts] = useState<DvmRuleResult[]>([]);
  const [dvmLedgers, setDvmLedgers] = useState<DvmLedger[]>([]);
  const [dvmIngestMac, setDvmIngestMac] = useState('');
  const [dvmIngesting, setDvmIngesting] = useState(false);
  const [dvmJsonInput, setDvmJsonInput] = useState('');
  const [dvmModelYaml, setDvmModelYaml] = useState('');
  const [dvmModelName, setDvmModelName] = useState('');
  const [dvmRunModelId, setDvmRunModelId] = useState('');
  const [dvmRuleName, setDvmRuleName] = useState('');
  const [dvmRuleExpr, setDvmRuleExpr] = useState('');
  const [dvmRuleMsg, setDvmRuleMsg] = useState('');
  const [mizanRecords, setMizanRecords] = useState<MizanCivvRecord[]>([]);
  const [mizanTokens, setMizanTokens] = useState<MizanToken[]>([]);
  const [mizanFacilityId, setMizanFacilityId] = useState('OM-SOHAR-PETROCHEM-04');
  const [mizanTpmId, setMizanTpmId] = useState('ATECC608B-OMAN-8891');
  const [mizanGovernorate, setMizanGovernorate] = useState('North Al Batinah');
  const [mizanCo2Flow, setMizanCo2Flow] = useState(12.5);
  const [mizanStackTemp, setMizanStackTemp] = useState(420.15);
  const [mizanCcsRecovery, setMizanCcsRecovery] = useState(4.0);
  const [mizanProcessing, setMizanProcessing] = useState(false);

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
    if (user) {
      const [models, runs, events, alerts, ledgers] = await Promise.all([
        supabase.from('dvm_models').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('dvm_model_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('dvm_events').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(20),
        supabase.from('dvm_rule_results').select('*').eq('user_id', user.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('dvm_ledgers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (models.data) setDvmModels(models.data);
      if (runs.data) setDvmModelRuns(runs.data);
      if (events.data) setDvmEvents(events.data);
      if (alerts.data) setDvmAlerts(alerts.data);
      if (ledgers.data) setDvmLedgers(ledgers.data);
      const [mizanRecs, mizanToks] = await Promise.all([
        supabase.from('mizan_civv_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('mizan_tokens').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);
      if (mizanRecs.data) setMizanRecords(mizanRecs.data);
      if (mizanToks.data) setMizanTokens(mizanToks.data);
    }
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
    { id: 'dvm', label: 'dMRV Data Model', icon: Activity },
    { id: 'mizan', label: 'Mizan CIVV', icon: Globe },
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

      {tab === 'dvm' && (
        <div className='space-y-6'>
          {/* Ingest sensor data via gateway */}
          <div className='bg-white rounded-xl shadow p-6 max-w-4xl'>
            <h2 className='text-xl font-bold text-gray-900 mb-2 flex items-center gap-2'><Wifi className='w-5 h-5 text-blue-600' /> Gateway Data Ingestion</h2>
            <p className='text-gray-600 mb-4 text-sm'>Send 15-min interval JSON from CIVV gateway. Data is parsed into events + datapoints, and rules are evaluated automatically.</p>
            <div className='space-y-3'>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Select Plant</label>
                <select value={selectedPlantId} onChange={e => { setSelectedPlantId(e.target.value); const p = plantConfigs.find(pp => pp.id === e.target.value); setDvmIngestMac(p?.mac_address || ''); }} className='w-full border border-gray-300 rounded-lg px-4 py-2'>
                  <option value=''>Select</option>
                  {validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name} — MAC: {p.mac_address}</option>)}
                </select>
              </div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Gateway MAC</label>
                <input value={dvmIngestMac} onChange={e => setDvmIngestMac(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2' placeholder='AA:BB:CC:DD:EE:01' />
              </div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Sensor JSON Payload</label>
                <textarea value={dvmJsonInput} onChange={e => setDvmJsonInput(e.target.value)} rows={6} className='w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-xs' placeholder='{"power_consumption_kwh": 4500, "flow_rate_m3h": 85.5, "temperature_c": 45.2, "gas_concentration_ppm": 55.3, "humidity_pct": 55.0, "irradiance_wm2": 0}' />
              </div>
              <button onClick={async () => {
                if (!user || !selectedPlantId || !dvmIngestMac) return;
                setDvmIngesting(true); setError(''); setSuccess('');
                try {
                  let sensorData: Record<string, unknown>;
                  try { sensorData = dvmJsonInput.trim() ? JSON.parse(dvmJsonInput) : {
                    power_consumption_kwh: (Math.random() * 5000 + 2000).toFixed(2),
                    flow_rate_m3h: (Math.random() * 100 + 50).toFixed(2),
                    temperature_c: (Math.random() * 50 + 20).toFixed(1),
                    gas_concentration_ppm: (Math.random() * 100 + 10).toFixed(1),
                    humidity_pct: (Math.random() * 30 + 40).toFixed(1),
                    irradiance_wm2: (Math.random() * 800 + 100).toFixed(0),
                  }; } catch { setError('Invalid JSON'); setDvmIngesting(false); return; }
                  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dvm-ingest`;
                  const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                    body: JSON.stringify({ plant_config_id: selectedPlantId, user_id: user.id, gateway_mac: dvmIngestMac, interval_minutes: 15, sensor_data: sensorData, timestamp: new Date().toISOString() }),
                  });
                  if (!res.ok) throw new Error(`Ingest failed (${res.status})`);
                  const result = await res.json();
                  setSuccess(`Ingested: ${result.datapoints_created} datapoints, ${result.alerts?.length || 0} alerts. Event: ${result.event_id?.slice(0, 8)}…`);
                  await loadData();
                } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
                finally { setDvmIngesting(false); }
              }} disabled={dvmIngesting || !selectedPlantId || !dvmIngestMac} className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2'>
                {dvmIngesting ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />} Ingest via Gateway
              </button>
            </div>
          </div>

          {/* Create model */}
          <div className='bg-white rounded-xl shadow p-6 max-w-4xl'>
            <h2 className='text-xl font-bold text-gray-900 mb-2 flex items-center gap-2'><FlaskConical className='w-5 h-5 text-purple-600' /> Model Definition (YAML)</h2>
            <p className='text-gray-600 mb-4 text-sm'>Define a calculation model with inputs, static inputs, and output expressions.</p>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div><label className='block text-sm font-medium text-gray-700 mb-1'>Model Name</label><input value={dvmModelName} onChange={e => setDvmModelName(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2' placeholder='Biochar CDR Model' /></div>
                <div><label className='block text-sm font-medium text-gray-700 mb-1'>Plant</label>
                <select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2'><option value=''>Select</option>{validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name}</option>)}</select></div>
              </div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>YAML Definition</label>
                <textarea value={dvmModelYaml} onChange={e => setDvmModelYaml(e.target.value)} rows={8} className='w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-xs' placeholder={'model:\n  name: Biochar CDR\n  inputs:\n    - id: biochar_mass, datapoint_type: biochar_mass\n  static_inputs:\n    - id: ef, value: 3.67\n  outputs:\n    - id: net_removal, expression: biochar_mass * ef'} />
              </div>
              <button onClick={async () => {
                if (!user || !selectedPlantId || !dvmModelName || !dvmModelYaml) return;
                setLoading(true); setError(''); setSuccess('');
                try {
                  const slug = dvmModelName.toLowerCase().replace(/\s+/g, '-');
                  await supabase.from('dvm_models').insert({ plant_config_id: selectedPlantId, user_id: user.id, name: dvmModelName, slug, version: 1, yaml_definition: dvmModelYaml, is_active: true });
                  setSuccess(`Model "${dvmModelName}" created.`); setDvmModelName(''); setDvmModelYaml(''); await loadData();
                } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
                finally { setLoading(false); }
              }} disabled={loading || !selectedPlantId || !dvmModelName} className='px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2'>
                {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <FlaskConical className='w-4 h-4' />} Create Model
              </button>
            </div>
            {dvmModels.length > 0 && <div className='mt-4 space-y-2'><h3 className='text-sm font-semibold text-gray-700 mb-2'>Models</h3>{dvmModels.map(m => <div key={m.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'><div className='flex items-center gap-3'><FlaskConical className='w-4 h-4 text-purple-500' /><div><span className='font-medium text-sm'>{m.name}</span><span className='text-xs text-gray-500 ml-2'>v{m.version}</span></div></div><span className='text-xs text-gray-400'>{m.slug}</span></div>)}</div>}
          </div>

          {/* Run model */}
          <div className='bg-white rounded-xl shadow p-6 max-w-4xl'>
            <h2 className='text-xl font-bold text-gray-900 mb-2 flex items-center gap-2'><Layers className='w-5 h-5 text-green-600' /> Run Model</h2>
            <div className='space-y-3'>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Select Model</label>
                <select value={dvmRunModelId} onChange={e => setDvmRunModelId(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2'><option value=''>Select</option>{dvmModels.map(m => <option key={m.id} value={m.id}>{m.name} v{m.version}</option>)}</select>
              </div>
              <button onClick={async () => {
                if (!user || !dvmRunModelId) return;
                setLoading(true); setError(''); setSuccess('');
                try {
                  const now = new Date(); const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dvm-model-run`;
                  const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                    body: JSON.stringify({ model_id: dvmRunModelId, user_id: user.id, start_time: start.toISOString(), end_time: now.toISOString() }),
                  });
                  if (!res.ok) throw new Error(`Model run failed (${res.status})`);
                  const result = await res.json();
                  if (result.error) throw new Error(result.error);
                  setSuccess(`Model run complete: ${result.datapoints_used} datapoints used. Outputs: ${JSON.stringify(result.outputs)}`);
                  await loadData();
                } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
                finally { setLoading(false); }
              }} disabled={loading || !dvmRunModelId} className='px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2'>
                {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Layers className='w-4 h-4' />} Run Model
              </button>
            </div>
            {dvmModelRuns.length > 0 && <div className='mt-4 space-y-2'><h3 className='text-sm font-semibold text-gray-700 mb-2'>Recent Runs</h3>{dvmModelRuns.map(r => <div key={r.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'><div className='flex items-center gap-3'><Layers className='w-4 h-4 text-green-500' /><div><span className='font-medium text-sm'>{r.state}</span><span className='text-xs text-gray-500 ml-2'>{new Date(r.created_at).toLocaleString('en-IN')}</span></div></div><AuthBadge status={r.state === 'COMPLETE' ? 'authenticated' : r.state === 'FAILED' ? 'failed' : 'pending'} label={r.state} size='sm' /></div>)}</div>}
          </div>

          {/* Data rules */}
          <div className='bg-white rounded-xl shadow p-6 max-w-4xl'>
            <h2 className='text-xl font-bold text-gray-900 mb-2 flex items-center gap-2'><Bell className='w-5 h-5 text-amber-600' /> Data Quality Rules</h2>
            <p className='text-gray-600 mb-4 text-sm'>Rules use VALUE, PREVIOUS_VALUE, AND, OR. Example: VALUE {'>'} 100</p>
            <div className='grid grid-cols-3 gap-3'>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Rule Name</label><input value={dvmRuleName} onChange={e => setDvmRuleName(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2' placeholder='High temperature' /></div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Expression</label><input value={dvmRuleExpr} onChange={e => setDvmRuleExpr(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2' placeholder={'VALUE > 80'} /></div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Alert Message</label><input value={dvmRuleMsg} onChange={e => setDvmRuleMsg(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2' placeholder='Temperature exceeds threshold' /></div>
            </div>
            <button onClick={async () => {
              if (!user || !selectedPlantId || !dvmRuleName || !dvmRuleExpr) return;
              setLoading(true); setError(''); setSuccess('');
              try {
                await supabase.from('dvm_data_rules').insert({ plant_config_id: selectedPlantId, user_id: user.id, name: dvmRuleName, expression: dvmRuleExpr, action: 'ALERT', alert_message: dvmRuleMsg || dvmRuleName });
                setSuccess(`Rule "${dvmRuleName}" created.`); setDvmRuleName(''); setDvmRuleExpr(''); setDvmRuleMsg(''); await loadData();
              } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
              finally { setLoading(false); }
            }} disabled={loading || !selectedPlantId || !dvmRuleName} className='mt-3 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center gap-2'>
              {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Bell className='w-4 h-4' />} Create Rule
            </button>
            {dvmAlerts.length > 0 && <div className='mt-4 space-y-2'><h3 className='text-sm font-semibold text-gray-700 mb-2'>Active Alerts</h3>{dvmAlerts.map(a => <div key={a.id} className='flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg'><div className='flex items-center gap-3'><Bell className='w-4 h-4 text-red-500' /><span className='text-sm text-red-700'>{a.message}</span></div><span className='text-xs text-gray-400'>{new Date(a.created_at).toLocaleString('en-IN')}</span></div>)}</div>}
          </div>

          {/* Events + Ledgers summary */}
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='bg-white rounded-xl shadow p-6'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'><Activity className='w-4 h-4 text-blue-500' /> Recent Events ({dvmEvents.length})</h3>
              <div className='space-y-2 max-h-48 overflow-y-auto'>{dvmEvents.map(e => <div key={e.id} className='flex items-center justify-between p-2 bg-gray-50 rounded text-xs'><span className='text-gray-600'>{new Date(e.timestamp).toLocaleString('en-IN')}</span><span className='text-gray-400'>{e.id.slice(0, 8)}</span></div>)}{dvmEvents.length === 0 && <p className='text-sm text-gray-400'>No events yet</p>}</div>
            </div>
            <div className='bg-white rounded-xl shadow p-6'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'><Database className='w-4 h-4 text-teal-500' /> Ledgers ({dvmLedgers.length})</h3>
              <div className='space-y-2'>{dvmLedgers.map(l => <div key={l.id} className='flex items-center justify-between p-2 bg-gray-50 rounded text-xs'><span className='font-medium text-gray-700'>{l.name}</span><span className='text-gray-500'>{l.balance} {l.unit}</span></div>)}{dvmLedgers.length === 0 && <p className='text-sm text-gray-400'>No ledgers yet</p>}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'mizan' && (
        <div className='space-y-6'>
          {/* Omani Mizan CIVV Engine */}
          <div className='bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow p-6 max-w-4xl border border-emerald-200'>
            <div className='flex items-center gap-3 mb-2'>
              <Globe className='w-6 h-6 text-emerald-700' />
              <h2 className='text-xl font-bold text-gray-900'>Omani Mizan CIVV Engine</h2>
              <span className='px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-medium'>Oman Net Zero 2050</span>
            </div>
            <p className='text-gray-700 mb-4 text-sm'>Ingest industrial historian streams (AVEVA PI / Honeywell PHD), validate thermodynamic data, and mint Black Tokens (emissions liability) + Green Tokens (verified removals) via Wrapped dRMV protocol.</p>

            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Facility ID</label><input value={mizanFacilityId} onChange={e => setMizanFacilityId(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm' placeholder='OM-SOHAR-PETROCHEM-04' /></div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>TPM Device ID</label><input value={mizanTpmId} onChange={e => setMizanTpmId(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm' placeholder='ATECC608B-OMAN-8891' /></div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Governorate</label>
                <select value={mizanGovernorate} onChange={e => setMizanGovernorate(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm'>
                  <option>North Al Batinah</option><option>South Al Batinah</option><option>Al Wusta</option><option>Dhofar</option><option>Muscat</option>
                </select>
              </div>
              <div><label className='block text-sm font-medium text-gray-700 mb-1'>Plant (optional)</label>
                <select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm'><option value=''>None</option>{validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name}</option>)}</select>
              </div>
            </div>

            <div className='bg-white rounded-lg p-4 border border-gray-200 mb-4'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>Historian Tags (PI / PHD)</h3>
              <div className='grid grid-cols-3 gap-4'>
                <div><label className='block text-xs text-gray-500 mb-1'>PI_TAG_CO2_MASS_FLOW (kg/s)</label><input type='number' step='0.1' value={mizanCo2Flow} onChange={e => setMizanCo2Flow(Number(e.target.value))} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' /></div>
                <div><label className='block text-xs text-gray-500 mb-1'>PI_TAG_STACK_TEMP_K</label><input type='number' step='0.1' value={mizanStackTemp} onChange={e => setMizanStackTemp(Number(e.target.value))} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' /></div>
                <div><label className='block text-xs text-gray-500 mb-1'>PI_TAG_CCS_RECOVERY_KG_S</label><input type='number' step='0.1' value={mizanCcsRecovery} onChange={e => setMizanCcsRecovery(Number(e.target.value))} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' /></div>
              </div>
            </div>

            {/* Computed preview */}
            <div className='grid grid-cols-3 gap-3 mb-4'>
              <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-center'><Flame className='w-5 h-5 text-red-500 mx-auto mb-1' /><div className='text-xs text-red-600'>Gross Emitted</div><div className='text-lg font-bold text-red-700'>{((mizanCo2Flow * 3600) / 1000).toFixed(2)} <span className='text-xs'>tCO2/hr</span></div></div>
              <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center'><Leaf className='w-5 h-5 text-emerald-500 mx-auto mb-1' /><div className='text-xs text-emerald-600'>Captured (CCS)</div><div className='text-lg font-bold text-emerald-700'>{((mizanCcsRecovery * 3600) / 1000).toFixed(2)} <span className='text-xs'>tCO2/hr</span></div></div>
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 text-center'><ShieldCheck className='w-5 h-5 text-amber-500 mx-auto mb-1' /><div className='text-xs text-amber-600'>Net Emitted</div><div className='text-lg font-bold text-amber-700'>{Math.max(0, ((mizanCo2Flow * 3600) / 1000) - ((mizanCcsRecovery * 3600) / 1000)).toFixed(2)} <span className='text-xs'>tCO2/hr</span></div></div>
            </div>

            <button onClick={async () => {
              if (!user) return;
              setMizanProcessing(true); setError(''); setSuccess('');
              try {
                const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dvm-mizan-civv`;
                const res = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                  body: JSON.stringify({ plant_config_id: selectedPlantId || null, user_id: user.id, facility_id: mizanFacilityId, tpm_device_id: mizanTpmId, governorate: mizanGovernorate, dispatch_to_mizan: true, historian_data: { timestamp: Math.floor(Date.now() / 1000), PI_TAG_CO2_MASS_FLOW: mizanCo2Flow, PI_TAG_STACK_TEMP_K: mizanStackTemp, PI_TAG_CCS_RECOVERY_KG_S: mizanCcsRecovery } }),
                });
                if (!res.ok) throw new Error(`CIVV processing failed (${res.status})`);
                const result = await res.json();
                if (result.error) throw new Error(result.error);
                setSuccess(`Verified: ${result.tokens_minted.length} tokens minted. Black: ${result.wrapped_drmv.mint_black_tokens} tCO2e, Green: ${result.wrapped_drmv.mint_green_tokens} tCO2e. Dispatched to Mizan.`);
                await loadData();
              } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
              finally { setMizanProcessing(false); }
            }} disabled={mizanProcessing || !mizanFacilityId || !user} className='px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center gap-2'>
              {mizanProcessing ? <Loader2 className='w-4 h-4 animate-spin' /> : <Globe className='w-4 h-4' />} Process &amp; Dispatch to Mizan
            </button>
          </div>

          {/* Token balance summary */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='bg-white rounded-xl shadow p-5'>
              <div className='flex items-center gap-2 mb-3'><Flame className='w-5 h-5 text-red-500' /><h3 className='text-sm font-semibold text-gray-700'>Black Tokens (dRMV-B)</h3></div>
              <div className='text-3xl font-bold text-red-600'>{mizanTokens.filter(t => t.token_class === 'BLACK').reduce((s, t) => s + Number(t.quantity), 0).toFixed(2)}</div>
              <div className='text-xs text-gray-500 mt-1'>tCO2e emissions liability</div>
              <div className='mt-2 text-xs text-gray-400'>{mizanTokens.filter(t => t.token_class === 'BLACK').length} mint events</div>
            </div>
            <div className='bg-white rounded-xl shadow p-5'>
              <div className='flex items-center gap-2 mb-3'><Leaf className='w-5 h-5 text-emerald-500' /><h3 className='text-sm font-semibold text-gray-700'>Green Tokens (dRMV-G)</h3></div>
              <div className='text-3xl font-bold text-emerald-600'>{mizanTokens.filter(t => t.token_class === 'GREEN').reduce((s, t) => s + Number(t.quantity), 0).toFixed(2)}</div>
              <div className='text-xs text-gray-500 mt-1'>tCO2e verified removals</div>
              <div className='mt-2 text-xs text-gray-400'>{mizanTokens.filter(t => t.token_class === 'GREEN').length} mint events</div>
            </div>
          </div>

          {/* Recent CIVV records */}
          <div className='bg-white rounded-xl shadow p-6 max-w-4xl'>
            <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'><Activity className='w-4 h-4 text-emerald-500' /> Recent CIVV Records</h3>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {mizanRecords.map(r => (
                <div key={r.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs'>
                  <div className='flex items-center gap-3'>
                    <Globe className='w-4 h-4 text-emerald-500' />
                    <div>
                      <div className='font-medium text-gray-700'>{r.facility_id}</div>
                      <div className='text-gray-400'>{new Date(r.timestamp).toLocaleString('en-IN')} — Hash: {r.civv_hash_proof?.slice(0, 16)}…</div>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-red-600'>B: {Number(r.net_emitted_tco2_hr).toFixed(1)}</span>
                    <span className='text-emerald-600'>G: {Number(r.captured_ccs_tco2_hr).toFixed(1)}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${r.mizan_dispatch_status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.mizan_dispatch_status}</span>
                    {r.article_6_2_itmo_eligible && <span className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs'>ITMO</span>}
                  </div>
                </div>
              ))}
              {mizanRecords.length === 0 && <p className='text-sm text-gray-400'>No CIVV records yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
