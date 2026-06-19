import { useState, useEffect } from 'react';
import { ShoppingCart, Award, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
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

  useEffect(() => {
    loadProjects();
  }, []);

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Credit Marketplace</h1>
        <p className="text-gray-600">Purchase verified carbon credits from active projects</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            ${(projects.reduce((sum, p) => sum + (p.price_per_credit || 0), 0) / projects.length || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">{project.project_code}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.type}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{project.location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vintage:</span>
                <span className="font-medium">{project.vintage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium">{project.available_credits} tCO2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price:</span>
                <span className="font-bold text-green-600">${project.price_per_credit}/tCO2</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedProject(project)}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Credits
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (tCO2)
              </label>
              <input
                type="number"
                min="1"
                max={selectedProject.available_credits || 0}
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Enter amount"
              />
            </div>

            {purchaseAmount && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{purchaseAmount} tCO2</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Price per credit:</span>
                  <span className="font-medium">${selectedProject.price_per_credit}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${(parseFloat(purchaseAmount) * (selectedProject.price_per_credit || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setPurchaseAmount('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={!purchaseAmount || purchaseLoading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
              >
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
