import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';

type SensorData = Database['public']['Tables']['sensor_data']['Row'];

export default function CarbonDashboard() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMac, setSelectedMac] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadSensorData();
      subscribeToSensorData();
    }
  }, [user]);

  async function loadSensorData() {
    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select(`
          *,
          assets!inner(
            project_id,
            projects!inner(developer_id)
          )
        `)
        .eq('assets.projects.developer_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSensorData(data as any || []);
      if (data && data.length > 0) {
        setSelectedMac(data[0].mac_address || '');
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToSensorData() {
    const subscription = supabase
      .channel('sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
        },
        (payload) => {
          setSensorData((current) => [payload.new as SensorData, ...current].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Carbon Dashboard - Real-time Sensor Data</h2>
        {selectedMac && (
          <div className="mt-2 flex items-center space-x-4 text-sm">
            <div>
              <span className="text-gray-600">Mac Id:</span>
              <span className="ml-2 font-mono">{selectedMac}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {sensorData.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sensor Data</h3>
            <p className="text-gray-500">No sensor readings have been recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage P1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage P2</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage P3</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current P1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current P2</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current P3</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sensorData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{data.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(data.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.frequency?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.voltage_phase1?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.voltage_phase2?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.voltage_phase3?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.current_phase1?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.current_phase2?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.current_phase3?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {data.active_total?.toFixed(2) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
