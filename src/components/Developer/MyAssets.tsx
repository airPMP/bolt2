import { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Sun } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';

type Asset = Database['public']['Tables']['assets']['Row'];
type WeatherData = Database['public']['Tables']['weather_data']['Row'];

export default function MyAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAssets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAsset) {
      loadWeatherData(selectedAsset.id);
    }
  }, [selectedAsset]);

  async function loadAssets() {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          projects!inner(developer_id)
        `)
        .eq('projects.developer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data as any || []);
      if (data && data.length > 0) {
        setSelectedAsset(data[0] as any);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeatherData(assetId: string) {
    try {
      const { data, error } = await supabase
        .from('weather_data')
        .select('*')
        .eq('asset_id', assetId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setWeatherData(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading assets...</p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assets Found</h3>
          <p className="text-gray-500">You haven't added any assets yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Assets Dashboard</h2>
      </div>

      <div className="p-6">
        {assets.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Asset</label>
            <select
              className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2"
              value={selectedAsset?.id}
              onChange={(e) => {
                const asset = assets.find(a => a.id === e.target.value);
                if (asset) setSelectedAsset(asset);
              }}
            >
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </div>
        )}

        {selectedAsset && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedAsset.name}</h3>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Plant Capacity</div>
                  <div className="text-3xl font-bold text-gray-900">{selectedAsset.capacity} kWp</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Current Power</div>
                  <div className="text-3xl font-bold text-green-600">{selectedAsset.current_power} kWh</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Asset Type</div>
                  <div className="font-medium capitalize">{selectedAsset.asset_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Commissioned Date</div>
                  <div className="font-medium">{selectedAsset.commissioned_date || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Asset Details</h4>
                <div className="space-y-3">
                  {selectedAsset.manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manufacturer:</span>
                      <span className="font-medium">{selectedAsset.manufacturer}</span>
                    </div>
                  )}
                  {selectedAsset.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{selectedAsset.model}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lifetime Energy:</span>
                    <span className="font-medium">{selectedAsset.lifetime_energy} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sensor Uptime:</span>
                    <span className="font-medium">{selectedAsset.sensor_uptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Inverters:</span>
                    <span className="font-medium">{selectedAsset.total_inverters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Meters:</span>
                    <span className="font-medium">{selectedAsset.total_meters}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-6 border border-blue-100">
                <h4 className="text-lg font-semibold mb-4">Current Weather</h4>
                {weatherData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Cloud className="w-8 h-8 text-blue-500 mr-3" />
                        <div>
                          <div className="font-medium">Condition</div>
                          <div className="text-sm text-gray-600 capitalize">{weatherData.condition || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Thermometer className="w-5 h-5 text-red-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Temperature</span>
                          <span className="font-medium">{weatherData.temperature}°C</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="w-5 h-5 text-blue-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Humidity</span>
                          <span className="font-medium">{weatherData.humidity}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Sun className="w-5 h-5 text-yellow-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Irradiation</span>
                          <span className="font-medium">{weatherData.irradiation} W/m²</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No weather data available</p>
                )}
              </div>
            </div>

            {selectedAsset.location && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Location Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{selectedAsset.location}</span>
                  </div>
                  {selectedAsset.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium">{selectedAsset.city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
