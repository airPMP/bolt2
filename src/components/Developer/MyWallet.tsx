import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function MyWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWalletData();
      loadTransactions();
    }
  }, [user]);

  async function loadWalletData() {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (!data && user) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setWallet(newWallet);
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">My Wallet</h2>
      </div>

      <div className="p-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Available Credits</div>
              <div className="text-4xl font-bold text-gray-900">
                {wallet?.available_credits?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">tCO2</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Pending Credits</div>
              <div className="text-4xl font-bold text-yellow-600">
                {wallet?.pending_credits?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">tCO2</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Retired Credits</div>
              <div className="text-4xl font-bold text-blue-600">
                {wallet?.retired_credits?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">tCO2</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-green-200 text-center">
            <div className="text-sm text-gray-600 mb-2">Estimated Total Value</div>
            <div className="text-3xl font-bold text-green-600">
              ${wallet?.total_value?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          txn.transaction_type === 'purchase' ? 'bg-blue-100 text-blue-800' :
                          txn.transaction_type === 'sale' ? 'bg-green-100 text-green-800' :
                          txn.transaction_type === 'retirement' ? 'bg-gray-100 text-gray-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.amount.toFixed(2)} tCO2
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${txn.price_per_credit?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${txn.total_price?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                          txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          txn.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
