import { useState, useEffect, useCallback } from 'react';
import { Building2, Send, Coins, TrendingUp, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Wifi, FingerprintPattern as Fingerprint, Zap, Clock, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { REGISTRIES } from '../../data/registries';
import { EXCHANGES } from '../../data/exchanges';
import AuthBadge from '../Shared/AuthBadge';
import AuthStampPanel from '../Shared/AuthStampPanel';
import type { AuthStamp, PlantConfig, PersonaCredential, DataSubmission, TokenMint, ExchangeListing, Wallet } from '../../types';

type DevTab = 'overview' | 'credentials' | 'submit' | 'mint' | 'exchange' | 'wallet';

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

  // Forms
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [registryCredForm, setRegistryCredForm] = useState({ apiKey: '', username: '', password: '' });
  const [exchangeCredForm, setExchangeCredForm] = useState({ exchange: '', apiKey: '', username: '', password: '' });
  const [mintForm, setMintForm] = useState({ quantity: 0, tokenType: '' });
  const [exchangeForm, setExchangeForm] = useState({ exchange: '', quantity: 0, pricePerUnit: 0 });

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


  const registryCred = credentials.find(c => c.credential_type === 'registry');
  const exchangeCreds = credentials.filter(c => c.credential_type === 'exchange');
  const validatedPlants = plantConfigs.filter(p => p.status === 'registry_validated' || p.status === 'mac_locked');

  // Authenticate with registry (developer's plant credentials)
  async function handleRegistryAuth() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.id === selectedPlantId);
      if (!plant) throw new Error('Select a plant first');
      const registry = REGISTRIES.find(r => r.id === plant.registry);
      if (!registry) throw new Error('Registry not found');

      // Save credential
      const { data: credData } = await supabase.from('persona_credentials').insert({
        user_id: user.id,
        credential_type: 'registry',
        provider: registry.id,
        api_key: registryCredForm.apiKey,
        username: registryCredForm.username,
        password: registryCredForm.password,
        api_endpoint: registry.api_endpoint,
        auth_status: 'pending',
        metadata: { plant_code: plant.plant_code, mac_address: plant.mac_address },
      }).select().single();

      // Simulate auth
      await new Promise(r => setTimeout(r, 1200));

      await supabase.from('persona_credentials')
        .update({ auth_status: 'authenticated', verified_at: new Date().toISOString() })
        .eq('id', credData.id);

      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'developer',
        provider: registry.id,
        provider_type: 'registry',
        status: 'authenticated',
        stamp_hash: `DEV-REG-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { plant_code: plant.plant_code, mac_address: plant.mac_address },
      });

      setSuccess(`Registry authenticated with ${registry.name} for plant ${plant.plant_code}. Green tick stamped.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally { setLoading(false); }
  }

  // Push 15-min data to registry
  async function handlePushData() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.id === selectedPlantId);
      if (!plant) throw new Error('Select a plant');
      if (!plant.mac_address) throw new Error('Plant has no MAC address locked');

      // Generate 15-min sensor payload
      const payload = {
        plant_code: plant.plant_code,
        mac_address: plant.mac_address,
        timestamp: new Date().toISOString(),
        interval: '15min',
        sensor_data: {
          power_consumption_kwh: (Math.random() * 5000 + 2000).toFixed(2),
          flow_rate_m3h: (Math.random() * 100 + 50).toFixed(2),
          temperature_c: (Math.random() * 50 + 20).toFixed(1),
          gas_concentration_ppm: (Math.random() * 100 + 10).toFixed(1),
          humidity_pct: (Math.random() * 30 + 40).toFixed(1),
          irradiance_wm2: (Math.random() * 800 + 100).toFixed(0),
        },
        ghg_calculator_type: plant.ghg_calculator_type,
        methodology: plant.methodology,
        registry: plant.registry,
      };

      // Simulate registry submission
      await new Promise(r => setTimeout(r, 1500));

      const registryResponse = {
        status: 'accepted',
        submission_id: `SUB-${Date.now().toString(36).toUpperCase()}`,
        data_points: 6,
        verified: true,
        message: '15-min data accepted by registry',
      };

      await supabase.from('data_submissions').insert({
        user_id: user.id,
        plant_config_id: plant.id,
        mac_address: plant.mac_address,
        registry: plant.registry,
        payload,
        interval_minutes: 15,
        submission_status: 'submitted',
        registry_response: registryResponse,
      });

      setSuccess(`15-min data pushed to ${plant.registry.toUpperCase()} registry. Submission ID: ${registryResponse.submission_id}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
    } finally { setLoading(false); }
  }

  // Mint tokens to wallet
  async function handleMintTokens() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.id === selectedPlantId);
      if (!plant) throw new Error('Select a plant');

      const registry = REGISTRIES.find(r => r.id === plant.registry);
      const tokenType = mintForm.tokenType || (plant.token_type === 'black' ? 'CCC' : 'I-REC');

      // Simulate mint
      await new Promise(r => setTimeout(r, 1500));

      const serialNumber = `${registry?.credit_unit}-${Date.now().toString(36).toUpperCase()}`;
      const registryResponse = {
        status: 'minted',
        serial_number: serialNumber,
        quantity: mintForm.quantity,
        wallet: registry?.wallet,
        message: `${mintForm.quantity} ${tokenType} tokens minted to wallet`,
      };

      await supabase.from('token_mints').insert({
        user_id: user.id,
        plant_config_id: plant.id,
        registry: plant.registry,
        token_type: tokenType,
        quantity: mintForm.quantity,
        serial_number: serialNumber,
        mint_status: 'minted',
        wallet_address: registry?.wallet,
        registry_response: registryResponse,
      });

      // Update wallet
      if (wallet) {
        await supabase.from('wallets')
          .update({ available_credits: wallet.available_credits + mintForm.quantity, total_value: wallet.total_value + mintForm.quantity * 2100 })
          .eq('id', wallet.id);
      }

      // Stamp
      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'developer',
        provider: plant.registry,
        provider_type: 'token_mint',
        status: 'authenticated',
        stamp_hash: `MINT-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { quantity: mintForm.quantity, token_type: tokenType, serial: serialNumber },
      });

      setSuccess(`${mintForm.quantity} ${tokenType} tokens minted to ${registry?.wallet}. Serial: ${serialNumber}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally { setLoading(false); }
  }

  // Authenticate with exchange
  async function handleExchangeAuth() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const exchange = EXCHANGES.find(e => e.id === exchangeCredForm.exchange);
      if (!exchange) throw new Error('Select an exchange');

      const { data: credData } = await supabase.from('persona_credentials').insert({
        user_id: user.id,
        credential_type: 'exchange',
        provider: exchange.id,
        api_key: exchangeCredForm.apiKey,
        username: exchangeCredForm.username,
        password: exchangeCredForm.password,
        api_endpoint: exchange.api_endpoint,
        auth_status: 'pending',
        metadata: { exchange_name: exchange.name },
      }).select().single();

      await new Promise(r => setTimeout(r, 1200));

      await supabase.from('persona_credentials')
        .update({ auth_status: 'authenticated', verified_at: new Date().toISOString() })
        .eq('id', credData.id);

      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'developer',
        provider: exchange.id,
        provider_type: 'exchange',
        status: 'authenticated',
        stamp_hash: `DEV-EXC-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { exchange_name: exchange.name },
      });

      setSuccess(`Exchange authenticated with ${exchange.name}. Green tick stamped.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally { setLoading(false); }
  }

  // Push tokens to exchange
  async function handlePushToExchange() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const lastMint = tokenMints[tokenMints.length - 1];
      if (!lastMint) throw new Error('No tokens minted yet');
      const exchange = EXCHANGES.find(e => e.id === exchangeForm.exchange);
      if (!exchange) throw new Error('Select an exchange');

      await new Promise(r => setTimeout(r, 1500));

      const exchangeResponse = {
        status: 'listed',
        listing_id: `LST-${Date.now().toString(36).toUpperCase()}`,
        exchange: exchange.name,
        quantity: exchangeForm.quantity,
        price_per_unit: exchangeForm.pricePerUnit,
        total_value: exchangeForm.quantity * exchangeForm.pricePerUnit,
      };

      await supabase.from('exchange_listings').insert({
        user_id: user.id,
        token_mint_id: lastMint.id,
        exchange: exchange.id,
        token_type: lastMint.token_type,
        quantity: exchangeForm.quantity,
        price_per_unit: exchangeForm.pricePerUnit,
        listing_status: 'listed',
        exchange_response: exchangeResponse,
      });

      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'developer',
        provider: exchange.id,
        provider_type: 'exchange_listing',
        status: 'authenticated',
        stamp_hash: `LST-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { listing_id: exchangeResponse.listing_id, quantity: exchangeForm.quantity },
      });

      setSuccess(`${exchangeForm.quantity} ${lastMint.token_type} tokens listed on ${exchange.name}. Listing ID: ${exchangeResponse.listing_id}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Listing failed');
    } finally { setLoading(false); }
  }

  const tabs: { id: DevTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'credentials', label: 'Registry Auth', icon: Fingerprint },
    { id: 'submit', label: 'Push 15-min Data', icon: Send },
    { id: 'mint', label: 'Mint Tokens', icon: Coins },
    { id: 'exchange', label: 'Exchange Auth & List', icon: TrendingUp },
    { id: 'wallet', label: 'My Wallet', icon: Database },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Project Developer Dashboard</h1>
        <p className="text-gray-600">Authenticate with registry, push 15-min plant data, mint tokens, and list on exchanges</p>
      </div>

      <div className="mb-6">
        <AuthStampPanel stamps={stamps} loading={false} />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${tab === t.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard icon={Building2} label="Validated Plants" value={validatedPlants.length} color="bg-blue-500" />
          <StatCard icon={Send} label="Data Submissions" value={submissions.length} color="bg-green-500" />
          <StatCard icon={Coins} label="Tokens Minted" value={tokenMints.reduce((s, m) => s + Number(m.quantity), 0)} color="bg-amber-500" />
          <StatCard icon={TrendingUp} label="Exchange Listings" value={exchangeListings.length} color="bg-purple-500" />
          <StatCard icon={Database} label="Wallet Credits" value={wallet?.available_credits || 0} color="bg-teal-500" />
          <StatCard icon={Fingerprint} label="Auth Stamps" value={stamps.length} color="bg-slate-700" />
        </div>
      )}

      {/* Registry Auth */}
      {tab === 'credentials' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registry Authentication (Plant Credentials)</h2>
          <p className="text-gray-600 mb-4 text-sm">Enter your plant credentials to authenticate with the carbon registry. This is the developer's own plant API credentials, NOT the VVB credentials.</p>

          {registryCred && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Authenticated with {REGISTRIES.find(r => r.id === registryCred.provider)?.name}</span>
              <AuthBadge status="authenticated" label="Green Tick" size="sm" />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plant</label>
              <select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Plant</option>
                {validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name} ({p.plant_code}) — {p.registry.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plant API Username</label>
                <input value={registryCredForm.username} onChange={e => setRegistryCredForm(f => ({ ...f, username: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Plant username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plant API Password</label>
                <input type="password" value={registryCredForm.password} onChange={e => setRegistryCredForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Plant password" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plant API Key</label>
              <input value={registryCredForm.apiKey} onChange={e => setRegistryCredForm(f => ({ ...f, apiKey: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="API key" />
            </div>
            <button onClick={handleRegistryAuth} disabled={loading || !selectedPlantId}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
              Authenticate & Stamp
            </button>
          </div>
        </div>
      )}

      {/* Push 15-min Data */}
      {tab === 'submit' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Push 15-Minute Sensor Data to Registry</h2>
          <p className="text-gray-600 mb-4 text-sm">Push real-time sensor data from the CIVV gateway (MAC-locked) to the registry using the same plant ID and MAC address.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plant</label>
              <select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Plant</option>
                {validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name} — MAC: {p.mac_address}</option>)}
              </select>
            </div>
            {selectedPlantId && (
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-gray-400" />
                <AuthBadge status={registryCred ? 'authenticated' : 'pending'} label={registryCred ? 'Registry Connected' : 'Registry Not Connected'} />
              </div>
            )}
            <button onClick={handlePushData} disabled={loading || !selectedPlantId || !registryCred}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Push 15-min Data
            </button>
          </div>
          {submissions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Submissions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {submissions.slice(0, 10).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">{new Date(s.submitted_at).toLocaleString('en-IN')}</span>
                      <span className="text-xs text-gray-500">· {s.registry.toUpperCase()}</span>
                    </div>
                    <AuthBadge status={s.submission_status === 'submitted' ? 'authenticated' : 'failed'} label={s.submission_status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mint Tokens */}
      {tab === 'mint' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mint Carbon Tokens to Wallet</h2>
          <p className="text-gray-600 mb-4 text-sm">Mint carbon credits, RECs, or emission tokens to your wallet using the registry API.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plant</label>
              <select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Plant</option>
                {validatedPlants.map(p => <option key={p.id} value={p.id}>{p.plant_name} ({p.plant_code})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token Type</label>
                <input value={mintForm.tokenType} onChange={e => setMintForm(f => ({ ...f, tokenType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="e.g. CCC, I-REC, VCU" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input type="number" value={mintForm.quantity} onChange={e => setMintForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>
            </div>
            <button onClick={handleMintTokens} disabled={loading || !selectedPlantId || !mintForm.quantity}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              Mint Tokens
            </button>
          </div>
          {tokenMints.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Minted Tokens</h3>
              <div className="space-y-2">
                {tokenMints.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="font-medium text-sm text-gray-900">{m.quantity} {m.token_type}</span>
                        <span className="text-xs text-gray-500 ml-2">Serial: {m.serial_number}</span>
                      </div>
                    </div>
                    <AuthBadge status={m.mint_status === 'minted' ? 'authenticated' : 'failed'} label={m.mint_status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exchange Auth & List */}
      {tab === 'exchange' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Exchange Authentication</h2>
            <p className="text-gray-600 mb-4 text-sm">Authenticate with the carbon exchange using your exchange credentials (NOT registry credentials). This is for IEX, ICM, or AirCarbon exchange.</p>

            {exchangeCreds.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {exchangeCreds.map(c => (
                  <div key={c.id} className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">{EXCHANGES.find(e => e.id === c.provider)?.name}</span>
                    <AuthBadge status="authenticated" label="Green Tick" size="sm" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Exchange</label>
                <select value={exchangeCredForm.exchange} onChange={e => setExchangeCredForm(f => ({ ...f, exchange: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Select Exchange</option>
                  {EXCHANGES.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Username</label>
                  <input value={exchangeCredForm.username} onChange={e => setExchangeCredForm(f => ({ ...f, username: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Exchange username" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Password</label>
                  <input type="password" value={exchangeCredForm.password} onChange={e => setExchangeCredForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Exchange password" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exchange API Key</label>
                <input value={exchangeCredForm.apiKey} onChange={e => setExchangeCredForm(f => ({ ...f, apiKey: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Exchange API key" />
              </div>
              <button onClick={handleExchangeAuth} disabled={loading || !exchangeCredForm.exchange}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                Authenticate & Stamp
              </button>
            </div>
          </div>

          {tokenMints.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Push Tokens to Exchange</h2>
              <p className="text-gray-600 mb-4 text-sm">List your minted tokens on the exchange for trading.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exchange</label>
                    <select value={exchangeForm.exchange} onChange={e => setExchangeForm(f => ({ ...f, exchange: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option value="">Select</option>
                      {EXCHANGES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input type="number" value={exchangeForm.quantity} onChange={e => setExchangeForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price/Unit (₹)</label>
                    <input type="number" value={exchangeForm.pricePerUnit} onChange={e => setExchangeForm(f => ({ ...f, pricePerUnit: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                  </div>
                </div>
                <button onClick={handlePushToExchange} disabled={loading || !exchangeForm.exchange || !exchangeForm.quantity}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  List on Exchange
                </button>
              </div>
              {exchangeListings.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Exchange Listings</h3>
                  {exchangeListings.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-gray-900">{l.quantity} {l.token_type} on {EXCHANGES.find(e => e.id === l.exchange)?.name}</span>
                        <span className="text-xs text-gray-500">₹{l.price_per_unit}/unit</span>
                      </div>
                      <AuthBadge status={l.listing_status === 'listed' ? 'authenticated' : 'failed'} label={l.listing_status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wallet */}
      {tab === 'wallet' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Wallet</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-teal-50 rounded-lg">
              <div className="text-xs text-teal-600 mb-1">Available Credits</div>
              <div className="text-2xl font-bold text-teal-700">{wallet?.available_credits || 0}</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-xs text-amber-600 mb-1">Pending Credits</div>
              <div className="text-2xl font-bold text-amber-700">{wallet?.pending_credits || 0}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Total Value (₹)</div>
              <div className="text-2xl font-bold text-purple-700">{wallet?.total_value?.toLocaleString('en-IN') || 0}</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Token History</h3>
            <div className="space-y-2">
              {tokenMints.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">{m.quantity} {m.token_type}</span>
                    <span className="text-xs text-gray-500">{new Date(m.minted_at).toLocaleString('en-IN')}</span>
                  </div>
                  <AuthBadge status={m.mint_status === 'minted' ? 'authenticated' : 'failed'} label={m.mint_status} size="sm" />
                </div>
              ))}
              {tokenMints.length === 0 && <p className="text-sm text-gray-400">No tokens minted yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
