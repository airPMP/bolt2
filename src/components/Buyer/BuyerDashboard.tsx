import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Loader2, CheckCircle, AlertCircle, Fingerprint,
  Wallet, TrendingUp, Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { REGISTRIES } from '../../data/registries';
import { EXCHANGES } from '../../data/exchanges';
import AuthBadge from '../Shared/AuthBadge';
import AuthStampPanel from '../Shared/AuthStampPanel';
import type { AuthStamp, PersonaCredential, ExchangeListing, Wallet as WalletType } from '../../types';

type BuyerTab = 'overview' | 'credentials' | 'buy' | 'history';

export default function BuyerDashboard() {
  const { user, userProfile } = useAuth();
  const [tab, setTab] = useState<BuyerTab>('overview');
  const [credentials, setCredentials] = useState<PersonaCredential[]>([]);
  const [stamps, setStamps] = useState<AuthStamp[]>([]);
  const [listings, setListings] = useState<ExchangeListing[]>([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [registryCredForm, setRegistryCredForm] = useState({ provider: '', apiKey: '', username: '', password: '' });
  const [walletCredForm, setWalletCredForm] = useState({ apiKey: '', walletAddress: '' });
  const [exchangeCredForm, setExchangeCredForm] = useState({ exchange: '', apiKey: '', username: '', password: '' });
  const [buyForm, setBuyForm] = useState({ listingId: '', quantity: 0, pricePerUnit: 0 });

  const loadData = useCallback(async () => {
    if (!user) return;
    const [creds, stampsRes, listRes, wal] = await Promise.all([
      supabase.from('persona_credentials').select('*').eq('user_id', user.id),
      supabase.from('auth_stamps').select('*').eq('user_id', user.id).order('stamped_at', { ascending: false }),
      supabase.from('exchange_listings').select('*').eq('listing_status', 'listed').order('listed_at', { ascending: false }),
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    if (creds.data) setCredentials(creds.data);
    if (stampsRes.data) setStamps(stampsRes.data);
    if (listRes.data) setListings(listRes.data);
    if (wal.data) setWallet(wal.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const registryCred = credentials.find(c => c.credential_type === 'registry');
  const walletCred = credentials.find(c => c.credential_type === 'wallet');
  const exchangeCreds = credentials.filter(c => c.credential_type === 'exchange');

  // Authenticate with registry
  async function handleRegistryAuth() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const registry = REGISTRIES.find(r => r.id === registryCredForm.provider);
      if (!registry) throw new Error('Select a registry');

      const { data: credData } = await supabase.from('persona_credentials').insert({
        user_id: user.id,
        credential_type: 'registry',
        provider: registry.id,
        api_key: registryCredForm.apiKey,
        username: registryCredForm.username,
        password: registryCredForm.password,
        api_endpoint: registry.api_endpoint,
        auth_status: 'pending',
        metadata: { registry_name: registry.name, buyer: userProfile?.company_name },
      }).select().single();

      await new Promise(r => setTimeout(r, 1200));

      await supabase.from('persona_credentials')
        .update({ auth_status: 'authenticated', verified_at: new Date().toISOString() })
        .eq('id', credData.id);

      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'buyer',
        provider: registry.id,
        provider_type: 'registry',
        status: 'authenticated',
        stamp_hash: `BUY-REG-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { registry_name: registry.name },
      });

      setSuccess(`Registry authenticated with ${registry.name}. Green tick stamped.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally { setLoading(false); }
  }

  // Authenticate wallet
  async function handleWalletAuth() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const { data: credData } = await supabase.from('persona_credentials').insert({
        user_id: user.id,
        credential_type: 'wallet',
        provider: 'blockvolt-wallet',
        api_key: walletCredForm.apiKey,
        api_endpoint: walletCredForm.walletAddress,
        auth_status: 'pending',
        metadata: { wallet_address: walletCredForm.walletAddress },
      }).select().single();

      await new Promise(r => setTimeout(r, 1000));

      await supabase.from('persona_credentials')
        .update({ auth_status: 'authenticated', verified_at: new Date().toISOString() })
        .eq('id', credData.id);

      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'buyer',
        provider: 'blockvolt-wallet',
        provider_type: 'wallet',
        status: 'authenticated',
        stamp_hash: `BUY-WAL-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { wallet_address: walletCredForm.walletAddress },
      });

      setSuccess('Wallet authenticated. Green tick stamped.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
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
        persona: 'buyer',
        provider: exchange.id,
        provider_type: 'exchange',
        status: 'authenticated',
        stamp_hash: `BUY-EXC-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { exchange_name: exchange.name },
      });

      setSuccess(`Exchange authenticated with ${exchange.name}. Green tick stamped.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally { setLoading(false); }
  }

  // Execute buy
  async function handleBuy() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const listing = listings.find(l => l.id === buyForm.listingId);
      if (!listing) throw new Error('Select a listing');
      if (!registryCred) throw new Error('Registry not authenticated');
      if (!walletCred) throw new Error('Wallet not authenticated');
      const exchangeCred = exchangeCreds.find(c => c.provider === listing.exchange);
      if (!exchangeCred) throw new Error('Exchange not authenticated');

      await new Promise(r => setTimeout(r, 1500));

      const totalPrice = buyForm.quantity * (listing.price_per_unit || 0);

      // Update listing status
      await supabase.from('exchange_listings')
        .update({ listing_status: 'sold' })
        .eq('id', listing.id);

      // Debit wallet
      if (wallet) {
        await supabase.from('wallets')
          .update({ available_credits: wallet.available_credits + buyForm.quantity, total_value: wallet.total_value + totalPrice })
          .eq('id', wallet.id);
      }

      // Stamp
      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'buyer',
        provider: listing.exchange,
        provider_type: 'purchase',
        status: 'authenticated',
        stamp_hash: `PUR-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { listing_id: listing.id, quantity: buyForm.quantity, total_price: totalPrice, token_type: listing.token_type },
      });

      setSuccess(`Purchase complete: ${buyForm.quantity} ${listing.token_type} for ₹${totalPrice.toLocaleString('en-IN')}. Stamped and recorded.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally { setLoading(false); }
  }

  const tabs: { id: BuyerTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: ShoppingCart },
    { id: 'credentials', label: 'Credentials', icon: Fingerprint },
    { id: 'buy', label: 'Buy Credits', icon: TrendingUp },
    { id: 'history', label: 'Transaction History', icon: Wallet },
  ];

  const allAuthed = !!(registryCred && walletCred && exchangeCreds.length > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Credit Buyer Dashboard</h1>
        <p className="text-gray-600">Authenticate with registry, wallet, and exchange to purchase carbon credits</p>
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

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Registry Auth</span>
              </div>
              <AuthBadge status={registryCred ? 'authenticated' : 'pending'} label={registryCred ? REGISTRIES.find(r => r.id === registryCred.provider)?.name || 'Authenticated' : 'Not Connected'} />
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-teal-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-sm text-gray-500">Wallet Auth</span>
              </div>
              <AuthBadge status={walletCred ? 'authenticated' : 'pending'} label={walletCred ? 'Wallet Connected' : 'Not Connected'} />
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Exchange Auth</span>
              </div>
              <AuthBadge status={exchangeCreds.length > 0 ? 'authenticated' : 'pending'} label={exchangeCreds.length > 0 ? `${exchangeCreds.length} Exchange(s)` : 'Not Connected'} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-lg">
                <div className="text-xs text-teal-600 mb-1">Available Credits</div>
                <div className="text-2xl font-bold text-teal-700">{wallet?.available_credits || 0}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-600 mb-1">Total Value (₹)</div>
                <div className="text-2xl font-bold text-purple-700">{wallet?.total_value?.toLocaleString('en-IN') || 0}</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-xs text-amber-600 mb-1">Auth Stamps</div>
                <div className="text-2xl font-bold text-amber-700">{stamps.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials */}
      {tab === 'credentials' && (
        <div className="space-y-6">
          {/* Registry Auth */}
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Registry Credentials</h2>
            <p className="text-gray-600 mb-4 text-sm">Authenticate with the carbon registry using your buyer registry credentials.</p>
            {registryCred && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Authenticated with {REGISTRIES.find(r => r.id === registryCred.provider)?.name}</span>
                <AuthBadge status="authenticated" label="Green Tick" size="sm" />
              </div>
            )}
            {!registryCred && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registry</label>
                  <select value={registryCredForm.provider} onChange={e => setRegistryCredForm(f => ({ ...f, provider: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option value="">Select Registry</option>
                    {REGISTRIES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input value={registryCredForm.username} onChange={e => setRegistryCredForm(f => ({ ...f, username: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="Registry username" />
                  <input type="password" value={registryCredForm.password} onChange={e => setRegistryCredForm(f => ({ ...f, password: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="Registry password" />
                </div>
                <input value={registryCredForm.apiKey} onChange={e => setRegistryCredForm(f => ({ ...f, apiKey: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Registry API key" />
                <button onClick={handleRegistryAuth} disabled={loading || !registryCredForm.provider} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />} Authenticate & Stamp
                </button>
              </div>
            )}
          </div>

          {/* Wallet Auth */}
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Wallet Credentials</h2>
            <p className="text-gray-600 mb-4 text-sm">Authenticate your wallet for debit operations during purchase.</p>
            {walletCred && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Wallet authenticated</span>
                <AuthBadge status="authenticated" label="Green Tick" size="sm" />
              </div>
            )}
            {!walletCred && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                  <input value={walletCredForm.walletAddress} onChange={e => setWalletCredForm(f => ({ ...f, walletAddress: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono" placeholder="0x..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet API Key</label>
                  <input value={walletCredForm.apiKey} onChange={e => setWalletCredForm(f => ({ ...f, apiKey: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Wallet API key" />
                </div>
                <button onClick={handleWalletAuth} disabled={loading} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} Authenticate & Stamp
                </button>
              </div>
            )}
          </div>

          {/* Exchange Auth */}
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Exchange Credentials</h2>
            <p className="text-gray-600 mb-4 text-sm">Authenticate with the exchange for transaction API access.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Exchange</label>
                <select value={exchangeCredForm.exchange} onChange={e => setExchangeCredForm(f => ({ ...f, exchange: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Select Exchange</option>
                  {EXCHANGES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={exchangeCredForm.username} onChange={e => setExchangeCredForm(f => ({ ...f, username: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="Exchange username" />
                <input type="password" value={exchangeCredForm.password} onChange={e => setExchangeCredForm(f => ({ ...f, password: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="Exchange password" />
              </div>
              <input value={exchangeCredForm.apiKey} onChange={e => setExchangeCredForm(f => ({ ...f, apiKey: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Exchange API key" />
              <button onClick={handleExchangeAuth} disabled={loading || !exchangeCredForm.exchange} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />} Authenticate & Stamp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Credits */}
      {tab === 'buy' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Buy Carbon Credits</h2>
          <p className="text-gray-600 mb-4 text-sm">Select a listing and execute a buy. All three credentials (registry, wallet, exchange) must be authenticated.</p>

          {/* Auth status check */}
          <div className="mb-4 flex flex-wrap gap-3">
            <AuthBadge status={registryCred ? 'authenticated' : 'pending'} label={registryCred ? 'Registry ✓' : 'Registry ✗'} />
            <AuthBadge status={walletCred ? 'authenticated' : 'pending'} label={walletCred ? 'Wallet ✓' : 'Wallet ✗'} />
            <AuthBadge status={exchangeCreds.length > 0 ? 'authenticated' : 'pending'} label={exchangeCreds.length > 0 ? 'Exchange ✓' : 'Exchange ✗'} />
          </div>

          {!allAuthed && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">Please authenticate all three credentials in the Credentials tab before buying.</p>
            </div>
          )}

          {listings.length === 0 ? (
            <p className="text-sm text-gray-400">No listings available. Waiting for developers to list tokens on exchanges.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {listings.map(l => (
                  <div key={l.id} onClick={() => setBuyForm({ listingId: l.id, quantity: l.quantity, pricePerUnit: l.price_per_unit || 0 })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${buyForm.listingId === l.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{l.quantity} {l.token_type}</div>
                          <div className="text-xs text-gray-500">{EXCHANGES.find(e => e.id === l.exchange)?.name} · ₹{l.price_per_unit}/unit</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">₹{(l.quantity * (l.price_per_unit || 0)).toLocaleString('en-IN')}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {buyForm.listingId && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input type="number" value={buyForm.quantity} onChange={e => setBuyForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Price (₹)</label>
                      <div className="text-lg font-bold text-gray-900 py-2">{(buyForm.quantity * buyForm.pricePerUnit).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <button onClick={handleBuy} disabled={loading || !allAuthed}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    Execute Purchase & Stamp
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>
          <div className="space-y-2">
            {stamps.filter(s => s.provider_type === 'purchase').map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-purple-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Purchase on {EXCHANGES.find(e => e.id === s.provider)?.name || s.provider}</span>
                    <span className="text-xs text-gray-500 ml-2">{new Date(s.stamped_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">#{s.stamp_hash?.slice(0, 12)}</span>
                  <AuthBadge status="authenticated" label="Stamped" size="sm" />
                </div>
              </div>
            ))}
            {stamps.filter(s => s.provider_type === 'purchase').length === 0 && (
              <p className="text-sm text-gray-400">No purchases yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
