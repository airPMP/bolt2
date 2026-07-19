import { useState, useEffect } from 'react';
import { ShoppingCart, Award, DollarSign, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { fetchIEXMarket, type IEXMarketData } from '../../lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { Database } from '../../types/database';

type Project = Database['public']['Tables']['projects']['Row'];

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [market, setMarket] = useState<IEXMarketData | null>(null);
  const [marketInstrument, setMarketInstrument] = useState<'rec' | 'ccc'>('rec');
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    loadProjects();
    loadMarket();
  }, []);

  useEffect(() => {
    loadMarket();
  }, [marketInstrument]);

  async function loadProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'Active')
        .gt('available_credits', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarket() {
    setMarketLoading(true);
    try {
      const data = await fetchIEXMarket(marketInstrument);
      setMarket(data);
    } catch (error) {
      console.error('Error loading IEX market:', error);
    } finally {
      setMarketLoading(false);
    }
  }

  async function handlePurchase() {
    if (!selectedProject || !purchaseAmount || !user) return;
    setPurchaseLoading(true);
    setMessage('');
    try {
      const amount = parseFloat(purchaseAmount);
      const totalPrice = amount * (selectedProject.price_per_credit || 0);
      const { error } = await supabase
        .from('transactions')
        .insert({
          transaction_type: 'purchase',
          buyer_id: user.id,
          seller_id: selectedProject.developer_id,
          amount: amount,
          price_per_credit: selectedProject.price_per_credit,
          total_price: totalPrice,
          status: 'pending',
          payment_method: 'credit_card',
        });
      if (error) throw error;
      setMessage('Purchase request submitted successfully!');
      setPurchaseAmount('');
      setSelectedProject(null);
      loadProjects();
    } catch (error) {
      setMessage('Error processing purchase');
      console.error(error);
    } finally {
      setPurchaseLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Credit Marketplace</h1>
        <p className="text-gray-600">Purchase verified carbon credits and monitor IEX REC/CCC market prices</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* IEX Market Panel */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">IEX Market — Live REC / CCC Prices</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setMarketInstrument('rec')} className={`px-3 py-1 rounded text-sm font-medium ${marketInstrument === 'rec' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>REC</button>
              <button onClick={() => setMarketInstrument('ccc')} className={`px-3 py-1 rounded text-sm font-medium ${marketInstrument === 'ccc' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>CCC</button>
            </div>
            <button onClick={loadMarket} disabled={marketLoading} className="p-2 text-gray-500 hover:text-gray-700">
              <RefreshCw className={`w-4 h-4 ${marketLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {market && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block">Last Price</span>
                <span className="text-lg font-bold text-gray-900">₹{market.last_price.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block">Change</span>
                <span className={`text-lg font-bold ${market.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {market.change >= 0 ? '+' : ''}{market.change} ({market.change_pct}%)
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block">Session High</span>
                <span className="text-lg font-bold text-gray-900">₹{market.session_high.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block">Session Low</span>
                <span className="text-lg font-bold text-gray-900">₹{market.session_low.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block">Volume</span>
                <span className="text-lg font-bold text-gray-900">{market.session_volume.toLocaleString()}</span>
              </div>
            </div>

            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={market.intraday}>
                  <defs>
                    <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#marketGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bids</h4>
                <div className="space-y-1">
                  {market.order_book.bids.map((b, i) => (
                    <div key={i} className="flex justify-between text-sm bg-emerald-50 px-3 py-1.5 rounded">
                      <span className="font-medium text-emerald-700">₹{b.price.toLocaleString()}</span>
                      <span className="text-gray-500">{b.qty} units</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Asks</h4>
                <div className="space-y-1">
                  {market.order_book.asks.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm bg-red-50 px-3 py-1.5 rounded">
                      <span className="font-medium text-red-700">₹{a.price.toLocaleString()}</span>
                      <span className="text-gray-500">{a.qty} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{market.note}</p>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Available Projects</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Credits</span>
            <Award className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {projects.reduce((sum, p) => sum + (p.available_credits || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Avg Price</span>
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ${(projects.reduce((sum, p) => sum + (p.price_per_credit || 0), 0) / (projects.length || 1)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">{project.project_code}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.type}</p>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Location:</span><span className="font-medium">{project.location}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Vintage:</span><span className="font-medium">{project.vintage}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Available:</span><span className="font-medium">{project.available_credits} tCO2</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Price:</span><span className="font-bold text-green-600">${project.price_per_credit}/tCO2</span></div>
            </div>
            <button onClick={() => setSelectedProject(project)} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 mr-2" /> Purchase Credits
            </button>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Purchase Carbon Credits</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Project: {selectedProject.name}</p>
              <p className="text-sm text-gray-600 mb-2">Price: ${selectedProject.price_per_credit}/tCO2</p>
              <p className="text-sm text-gray-600">Available: {selectedProject.available_credits} tCO2</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (tCO2)</label>
              <input type="number" min="1" max={selectedProject.available_credits || 0} value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Enter amount" />
            </div>
            {purchaseAmount && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Amount:</span><span className="font-medium">{purchaseAmount} tCO2</span></div>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Price per credit:</span><span className="font-medium">${selectedProject.price_per_credit}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200"><span>Total:</span><span className="text-green-600">${(parseFloat(purchaseAmount) * (selectedProject.price_per_credit || 0)).toFixed(2)}</span></div>
              </div>
            )}
            <div className="flex space-x-3">
              <button onClick={() => { setSelectedProject(null); setPurchaseAmount(''); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={handlePurchase} disabled={!purchaseAmount || purchaseLoading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                {purchaseLoading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Projects Available</h3>
          <p className="text-gray-500">Check back later for available carbon credits</p>
        </div>
      )}
    </div>
  );
}
