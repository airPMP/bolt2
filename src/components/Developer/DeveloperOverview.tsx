import { useState, useEffect } from 'react';
import { Award, Activity, DollarSign, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const mockCredits = [
  { month: 'Jan', generated: 2400, verified: 2100, retired: 1900 },
  { month: 'Feb', generated: 2800, verified: 2500, retired: 2200 },
  { month: 'Mar', generated: 3200, verified: 2900, retired: 2600 },
  { month: 'Apr', generated: 3600, verified: 3300, retired: 3000 },
  { month: 'May', generated: 4000, verified: 3700, retired: 3400 },
  { month: 'Jun', generated: 4200, verified: 4000, retired: 3800 }
];

export default function DeveloperOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCredits: 0,
    activeAssets: 0,
    estimatedValue: 0,
    averageUptime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  async function loadStats() {
    try {
      const [creditsResult, assetsResult, walletResult] = await Promise.all([
        supabase
          .from('carbon_credits')
          .select('credit_amount', { count: 'exact' })
          .eq('projects.developer_id', user?.id),
        supabase
          .from('assets')
          .select('id, sensor_uptime', { count: 'exact' })
          .eq('projects.developer_id', user?.id),
        supabase
          .from('wallets')
          .select('total_value')
          .eq('user_id', user?.id)
          .maybeSingle(),
      ]);

      const totalCredits = creditsResult.data?.reduce((sum: number, c: any) => sum + (c.credit_amount || 0), 0) || 0;
      const activeAssets = assetsResult.count || 0;
      const avgUptime = assetsResult.data?.reduce((sum: number, a: any) => sum + (a.sensor_uptime || 0), 0) / (assetsResult.data?.length || 1);

      setStats({
        totalCredits: Math.round(totalCredits),
        activeAssets,
        estimatedValue: walletResult.data?.total_value || 0,
        averageUptime: avgUptime || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Credits</span>
            <Award className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalCredits.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">tCO2 generated</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Active Assets</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeAssets}</div>
          <div className="text-sm text-gray-600 mt-1">IoT devices</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Est. Value</span>
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">${Math.round(stats.estimatedValue).toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">Portfolio value</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Sensor Health</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.averageUptime.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">Average uptime</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Credit Generation Forecast</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockCredits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="generated" fill="#10b981" name="Credits Generated" />
              <Bar dataKey="verified" fill="#3b82f6" name="Credits Verified" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
