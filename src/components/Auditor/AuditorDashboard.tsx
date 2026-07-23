import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Server, Lock, Cpu, FileCheck, CheckCircle, Loader2,
  AlertCircle, ChevronRight, Send, Fingerprint, Wifi
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { INDUSTRIES } from '../../data/industries';
import { REGISTRIES } from '../../data/registries';
import { METHODOLOGIES } from '../../data/methodologies';
import { GREEN_CLUBS } from '../../data/clubs';
import AuthBadge from '../Shared/AuthBadge';
import AuthStampPanel from '../Shared/AuthStampPanel';
import type { AuthStamp, PlantConfig, CivvGateway, PersonaCredential } from '../../types';

type TokenType = 'black' | 'green';
type Step = 'credentials' | 'ghg' | 'civv' | 'lock' | 'submit';

interface AuditorState {
  tokenType: TokenType | null;
  industry: string;
  club: string;
  methodology: string;
  scopeLevel: 'scope1' | 'scope2' | 'scope3';
  registry: string;
  ghgCalculatorType: string;
  plantName: string;
  plantCode: string;
  gatewayName: string;
  macAddress: string;
  developerEmail: string;
}

const STEPS = [
  { id: 'credentials', label: 'VVB Credentials', icon: ShieldCheck },
  { id: 'ghg', label: 'GHG Calculator', icon: FileCheck },
  { id: 'civv', label: 'Ship CIVV Gateway', icon: Server },
  { id: 'lock', label: 'Lock MAC Address', icon: Lock },
  { id: 'submit', label: 'Submit to Registry', icon: Send },
] as const;

export default function AuditorDashboard() {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [state, setState] = useState<AuditorState>({
    tokenType: null,
    industry: '',
    club: '',
    methodology: '',
    scopeLevel: 'scope1',
    registry: '',
    ghgCalculatorType: '',
    plantName: '',
    plantCode: '',
    gatewayName: '',
    macAddress: '',
    developerEmail: '',
  });
  const [credentials, setCredentials] = useState<PersonaCredential[]>([]);
  const [stamps, setStamps] = useState<AuthStamp[]>([]);
  const [plantConfigs, setPlantConfigs] = useState<PlantConfig[]>([]);
  const [gateways, setGateways] = useState<CivvGateway[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registryAuthStatus, setRegistryAuthStatus] = useState<'pending' | 'authenticated' | 'failed'>('pending');

  // Credential form state
  const [credForm, setCredForm] = useState({
    provider: '',
    apiKey: '',
    username: '',
    password: '',
    apiEndpoint: '',
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    const [credRes, stampRes, plantRes, gwRes] = await Promise.all([
      supabase.from('persona_credentials').select('*').eq('user_id', user.id),
      supabase.from('auth_stamps').select('*').eq('user_id', user.id).order('stamped_at', { ascending: false }),
      supabase.from('plant_configs').select('*').order('created_at', { ascending: false }),
      supabase.from('civv_gateways').select('*').order('created_at', { ascending: false }),
    ]);
    if (credRes.data) setCredentials(credRes.data);
    if (stampRes.data) setStamps(stampRes.data);
    if (plantRes.data) setPlantConfigs(plantRes.data);
    if (gwRes.data) setGateways(gwRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const update = (patch: Partial<AuditorState>) => setState(s => ({ ...s, ...patch }));

  const applicableMethodologies = METHODOLOGIES.filter(m => {
    if (!state.tokenType || m.tokenType !== state.tokenType) return false;
    if (state.tokenType === 'black') return m.applicable_sectors.includes('all') || m.applicable_sectors.includes(state.industry);
    if (state.club) {
      const club = GREEN_CLUBS.find(c => c.id === state.club);
      return club?.methodologies.includes(m.id);
    }
    return false;
  });

  const availableRegistries = state.tokenType === 'green' && state.club
    ? REGISTRIES.filter(r => GREEN_CLUBS.find(c => c.id === state.club)?.registries.includes(r.id))
    : REGISTRIES;

  // Step 1: Save VVB credentials and authenticate with registry
  async function handleSaveCredentials() {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const registry = REGISTRIES.find(r => r.id === state.registry);
      if (!registry) throw new Error('Select a registry first');

      // Save credential
      const { data: credData, error: credErr } = await supabase
        .from('persona_credentials')
        .insert({
          user_id: user.id,
          credential_type: 'registry',
          provider: registry.id,
          api_key: credForm.apiKey,
          username: credForm.username,
          password: credForm.password,
          api_endpoint: registry.api_endpoint,
          auth_status: 'pending',
          metadata: { registry_name: registry.name, auth_type: registry.auth_type },
        })
        .select()
        .single();

      if (credErr) throw credErr;

      // Simulate registry auth verification (green tick)
      await new Promise(r => setTimeout(r, 1200));

      const stampHash = `VVB-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from('persona_credentials')
        .update({ auth_status: 'authenticated', verified_at: new Date().toISOString() })
        .eq('id', credData.id);

      // Create auth stamp
      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'auditor',
        provider: registry.id,
        provider_type: 'registry',
        status: 'authenticated',
        stamp_hash: stampHash,
        stamped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        metadata: { registry_name: registry.name, vvb: userProfile?.company_name },
      });

      setRegistryAuthStatus('authenticated');
      setSuccess(`VVB credentials authenticated with ${registry.name}. Green tick stamped.`);
      await loadData();
    } catch (err) {
      setRegistryAuthStatus('failed');
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Save plant config with GHG calculator
  async function handleSaveGhgConfig() {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const methodology = METHODOLOGIES.find(m => m.id === state.methodology);
      if (!methodology) throw new Error('Select a methodology');

      const { error: insertErr } = await supabase.from('plant_configs').insert({
        plant_name: state.plantName,
        plant_code: state.plantCode,
        industry: state.industry,
        ghg_calculator_type: state.ghgCalculatorType,
        token_type: state.tokenType,
        club: state.club,
        registry: state.registry,
        methodology: state.methodology,
        scope_level: state.scopeLevel,
        auditor_id: user.id,
        status: 'configured',
        config_json: {
          formula: methodology.formula,
          scope: methodology.scope,
          calculator_version: 'dMRV Engine v1',
        },
      });

      if (insertErr) throw insertErr;
      setSuccess('Plant configuration saved with GHG calculator type.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Ship CIVV gateway
  async function handleShipGateway() {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.from('civv_gateways').insert({
        gateway_name: state.gatewayName,
        mac_address: state.macAddress,
        firmware_version: 'v2.4.1',
        sensor_count: 6,
        sensors: [
          { id: 'SNS-001', type: 'power_meter', scope: 'scope2' },
          { id: 'SNS-002', type: 'flow_meter', scope: 'scope1' },
          { id: 'SNS-003', type: 'temperature', scope: 'scope1' },
          { id: 'SNS-004', type: 'gas_analyzer', scope: 'scope1' },
          { id: 'SNS-005', type: 'humidity', scope: 'scope1' },
          { id: 'SNS-006', type: 'irradiance', scope: 'scope2' },
        ],
        ship_status: 'shipped',
        shipped_to: state.plantName,
        shipped_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccess(`CIVV Gateway "${state.gatewayName}" shipped to ${state.plantName}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ship gateway');
    } finally {
      setLoading(false);
    }
  }

  // Step 4: Lock MAC address to plant config
  async function handleLockMac() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const plant = plantConfigs.find(p => p.plant_code === state.plantCode);
      const gateway = gateways.find(g => g.mac_address === state.macAddress);
      if (!plant) throw new Error('Plant config not found');
      if (!gateway) throw new Error('Gateway not found');

      // Lock gateway to plant
      await supabase.from('civv_gateways')
        .update({ locked_to_plant_id: plant.id, locked_at: new Date().toISOString(), ship_status: 'locked' })
        .eq('id', gateway.id);

      // Update plant config with gateway + MAC
      await supabase.from('plant_configs')
        .update({ civv_gateway_id: gateway.id, mac_address: state.macAddress, status: 'mac_locked' })
        .eq('id', plant.id);

      setSuccess(`MAC address ${state.macAddress} locked to plant ${state.plantName}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock MAC');
    } finally {
      setLoading(false);
    }
  }

  // Step 5: Submit plant data to registry for validation
  async function handleSubmitToRegistry() {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const plant = plantConfigs.find(p => p.plant_code === state.plantCode);
      const gateway = gateways.find(g => g.mac_address === state.macAddress);
      if (!plant) throw new Error('Plant config not found');
      if (!gateway) throw new Error('Gateway not found');

      const registry = REGISTRIES.find(r => r.id === state.registry);
      if (!registry) throw new Error('Registry not found');

      const submissionPayload = {
        plant_code: plant.plant_code,
        plant_name: plant.plant_name,
        industry: plant.industry,
        ghg_calculator_type: plant.ghg_calculator_type,
        token_type: plant.token_type,
        club: plant.club,
        registry: plant.registry,
        methodology: plant.methodology,
        scope_level: plant.scope_level,
        mac_address: plant.mac_address,
        config_json: plant.config_json,
        vvb_credentials: userProfile?.company_name,
        submission_type: 'project_validation',
        timestamp: new Date().toISOString(),
      };

      // Simulate registry API call
      await new Promise(r => setTimeout(r, 1500));

      const registryResponse = {
        status: 'validated',
        registry_project_id: `${registry.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        validation_status: 'approved',
        message: 'Project data validated by VVB. Ready for developer data submission.',
        validated_at: new Date().toISOString(),
      };

      // Save data submission
      await supabase.from('data_submissions').insert({
        user_id: user.id,
        plant_config_id: plant.id,
        mac_address: state.macAddress,
        registry: state.registry,
        payload: submissionPayload,
        interval_minutes: 0,
        submission_status: 'submitted',
        registry_response: registryResponse,
      });

      // Update plant status
      await supabase.from('plant_configs')
        .update({ status: 'registry_validated' })
        .eq('id', plant.id);

      // Create auth stamp for submission
      await supabase.from('auth_stamps').insert({
        user_id: user.id,
        persona: 'auditor',
        provider: state.registry,
        provider_type: 'registry_submission',
        status: 'authenticated',
        stamp_hash: `SUB-${Date.now().toString(36).toUpperCase()}`,
        stamped_at: new Date().toISOString(),
        metadata: { plant_code: plant.plant_code, validation_status: 'approved' },
      });

      setSuccess(`Plant data submitted and validated by ${registry.name}. Project ID: ${registryResponse.registry_project_id}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const registryCred = credentials.find(c => c.credential_type === 'registry');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Auditor / VVB Dashboard</h1>
        <p className="text-gray-600">
          Configure GHG calculator, ship CIVV gateway, lock MAC, and validate project data with registry credentials
        </p>
      </div>

      {/* Auth Status */}
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

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = stepIndex > i;
          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: VVB Credentials */}
      {step === 'credentials' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">VVB Registry Credentials</h2>
          <p className="text-gray-600 mb-4 text-sm">Enter your VVB (Verified Voluntary Body) credentials to authenticate with the carbon registry. This will be stamped with a green tick.</p>

          {/* Existing credentials */}
          {registryCred && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Authenticated with {REGISTRIES.find(r => r.id === registryCred.provider)?.name}
                </span>
                <AuthBadge status="authenticated" label="Green Tick" size="sm" />
              </div>
            </div>
          )}

          {/* Token type selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => update({ tokenType: 'black', industry: '', methodology: '', club: '' })}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${state.tokenType === 'black' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-slate-300'}`}>
              <ShieldCheck className="w-6 h-6 text-slate-900 mb-2" />
              <div className="font-semibold text-gray-900">Black Token</div>
              <div className="text-xs text-gray-500">Emission compliance (GEI)</div>
            </button>
            <button onClick={() => update({ tokenType: 'green', club: '', methodology: '', industry: '' })}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${state.tokenType === 'green' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
              <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="font-semibold text-gray-900">Green Token</div>
              <div className="text-xs text-gray-500">Carbon credits / RECs</div>
            </button>
          </div>

          {/* Registry selection */}
          {state.tokenType && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Registry</label>
              <select value={state.registry} onChange={e => { update({ registry: e.target.value }); setRegistryAuthStatus('pending'); }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Registry</option>
                {availableRegistries.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
            </div>
          )}

          {/* Credential form */}
          {state.registry && !registryCred && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VVB Username</label>
                  <input value={credForm.username} onChange={e => setCredForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="VVB username" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VVB Password</label>
                  <input type="password" value={credForm.password} onChange={e => setCredForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="VVB password" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registry API Key</label>
                <input value={credForm.apiKey} onChange={e => setCredForm(f => ({ ...f, apiKey: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="API key from registry" />
              </div>
              <button onClick={handleSaveCredentials} disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Authenticate & Stamp
              </button>
            </div>
          )}

          {registryCred && (
            <button onClick={() => setStep('ghg')} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
              Next: GHG Calculator →
            </button>
          )}
        </div>
      )}

      {/* Step 2: GHG Calculator */}
      {step === 'ghg' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assign GHG Calculator to Plant</h2>
          <p className="text-gray-600 mb-4 text-sm">Configure the plant with GHG calculator type, industry, club, methodology, and registry.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plant Name</label>
                <input value={state.plantName} onChange={e => update({ plantName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="e.g. Tata Steel Jamshedpur" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plant Code</label>
                <input value={state.plantCode} onChange={e => update({ plantCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="e.g. PLANT-TATA-JSR-001" />
              </div>
            </div>

            {state.tokenType === 'black' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry (GEI Sector)</label>
                <select value={state.industry} onChange={e => update({ industry: e.target.value, methodology: '' })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Select Industry</option>
                  {INDUSTRIES.filter(i => i.geiObligated).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            )}

            {state.tokenType === 'green' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Green Token Club</label>
                <div className="grid grid-cols-2 gap-3">
                  {GREEN_CLUBS.map(c => (
                    <button key={c.id} onClick={() => update({ club: c.id, methodology: '' })}
                      className={`p-3 rounded-lg border-2 text-left ${state.club === c.id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                      <div className="font-semibold text-sm text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{c.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GHG Calculator Type</label>
              <select value={state.ghgCalculatorType} onChange={e => update({ ghgCalculatorType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Calculator Type</option>
                <option value="dMRV_Engine_v1">dMRV Engine v1 (Sensor-based)</option>
                <option value="DEFRA_Calculator">DEFRA Evaporative Cooling Calculator</option>
                <option value="ASHRAE_228">ASHRAE 228 Net Zero Calculator</option>
                <option value="ACM0002_RE">ACM0002 Solar PV REC Calculator</option>
                <option value="VM0047_ARR">VM0047 ARR Calculator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label>
              <select value={state.methodology} onChange={e => update({ methodology: e.target.value })}
                disabled={applicableMethodologies.length === 0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Methodology</option>
                {applicableMethodologies.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {state.methodology && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-mono text-gray-500">Formula: </span>
                  <span className="text-xs font-mono text-gray-700">{METHODOLOGIES.find(m => m.id === state.methodology)?.formula}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scope Level</label>
              <div className="flex gap-2">
                {(['scope1', 'scope2', 'scope3'] as const).map(sc => (
                  <button key={sc} onClick={() => update({ scopeLevel: sc })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${state.scopeLevel === sc ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {sc.replace('scope', 'Scope ')}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSaveGhgConfig} disabled={loading || !state.plantName || !state.plantCode || !state.methodology || !state.ghgCalculatorType}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Save Plant Configuration
            </button>
          </div>

          {plantConfigs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Configured Plants</h3>
              <div className="space-y-2">
                {plantConfigs.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-sm text-gray-900">{p.plant_name}</span>
                      <span className="text-xs text-gray-500 ml-2">{p.plant_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{p.ghg_calculator_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'mac_locked' ? 'bg-amber-100 text-amber-700' : p.status === 'registry_validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Ship CIVV Gateway */}
      {step === 'civv' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ship Blockvolt CIVV Gateway</h2>
          <p className="text-gray-600 mb-4 text-sm">Configure and ship the CIVV hardware gateway to the plant. The gateway will collect sensor data and submit it to the registry.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gateway Name</label>
                <input value={state.gatewayName} onChange={e => update({ gatewayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="e.g. CIVV-GW-TATA-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MAC Address</label>
                <input value={state.macAddress} onChange={e => update({ macAddress: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono" placeholder="e.g. AA:BB:CC:DD:EE:01" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Gateway Specifications</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Firmware:</span> <span className="font-mono">v2.4.1</span></div>
                <div><span className="text-gray-500">Sensors:</span> <span className="font-medium">6 channels</span></div>
                <div><span className="text-gray-500">Protocol:</span> <span className="font-mono">MQTT/TLS</span></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Sensors: Power Meter (S2), Flow Meter (S1), Temperature (S1), Gas Analyzer (S1), Humidity (S1), Irradiance (S2)
              </div>
            </div>

            <button onClick={handleShipGateway} disabled={loading || !state.gatewayName || !state.macAddress}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Ship CIVV Gateway
            </button>
          </div>

          {gateways.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Shipped Gateways</h3>
              <div className="space-y-2">
                {gateways.map(gw => (
                  <div key={gw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-sm text-gray-900">{gw.gateway_name}</span>
                        <span className="text-xs font-mono text-gray-500 ml-2">{gw.mac_address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">v{gw.firmware_version}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        gw.ship_status === 'locked' ? 'bg-amber-100 text-amber-700' :
                        gw.ship_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{gw.ship_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Lock MAC */}
      {step === 'lock' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lock MAC Address to Plant Config</h2>
          <p className="text-gray-600 mb-4 text-sm">Lock the CIVV gateway MAC address to the plant configuration, binding it to the selected club, registry, and methodology.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plant Config</label>
              <select value={state.plantCode} onChange={e => {
                const plant = plantConfigs.find(p => p.plant_code === e.target.value);
                update({ plantCode: e.target.value, plantName: plant?.plant_name || '', macAddress: plant?.mac_address || state.macAddress });
              }} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Plant</option>
                {plantConfigs.map(p => <option key={p.id} value={p.plant_code}>{p.plant_name} ({p.plant_code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select CIVV Gateway (MAC Address)</label>
              <select value={state.macAddress} onChange={e => update({ macAddress: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Gateway</option>
                {gateways.filter(g => g.ship_status === 'shipped').map(g => (
                  <option key={g.id} value={g.mac_address}>{g.gateway_name} — {g.mac_address}</option>
                ))}
              </select>
            </div>

            {state.plantCode && state.macAddress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Lock Confirmation</span>
                </div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>Plant: <span className="font-mono">{state.plantCode}</span></div>
                  <div>MAC: <span className="font-mono">{state.macAddress}</span></div>
                  <div>This will bind the gateway hardware to the plant's club, registry, and methodology.</div>
                </div>
              </div>
            )}

            <button onClick={handleLockMac} disabled={loading || !state.plantCode || !state.macAddress}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Lock MAC Address
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Submit to Registry */}
      {step === 'submit' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Plant Data to Registry for Validation</h2>
          <p className="text-gray-600 mb-4 text-sm">Using your VVB credentials, push the plant configuration data to the registry for project submission validation.</p>

          {/* Auth status */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">VVB Auth:</span>
            </div>
            <AuthBadge status={registryAuthStatus} label={registryAuthStatus === 'authenticated' ? 'Authenticated' : registryAuthStatus === 'failed' ? 'Failed' : 'Pending'} />
            <div className="flex items-center gap-2 ml-4">
              <Wifi className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Registry:</span>
            </div>
            <AuthBadge status={registryAuthStatus} label={state.registry || 'Not selected'} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plant (MAC Locked)</label>
              <select value={state.plantCode} onChange={e => {
                const plant = plantConfigs.find(p => p.plant_code === e.target.value);
                update({ plantCode: e.target.value, plantName: plant?.plant_name || '', macAddress: plant?.mac_address || '', registry: plant?.registry || '' });
              }} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select Plant</option>
                {plantConfigs.filter(p => p.status === 'mac_locked').map(p => (
                  <option key={p.id} value={p.plant_code}>{p.plant_name} ({p.plant_code}) — MAC: {p.mac_address}</option>
                ))}
              </select>
            </div>

            {state.plantCode && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Submission Payload Preview</h3>
                <pre className="text-xs font-mono text-gray-600 overflow-x-auto">
{JSON.stringify({
  plant_code: state.plantCode,
  mac_address: state.macAddress,
  registry: state.registry,
  submission_type: 'project_validation',
  vvb: userProfile?.company_name,
}, null, 2)}
                </pre>
              </div>
            )}

            <button onClick={handleSubmitToRegistry} disabled={loading || !state.plantCode || registryAuthStatus !== 'authenticated'}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit to Registry for Validation
            </button>
          </div>

          {/* Validated plants */}
          {plantConfigs.filter(p => p.status === 'registry_validated').length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Registry-Validated Plants</h3>
              <div className="space-y-2">
                {plantConfigs.filter(p => p.status === 'registry_validated').map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-sm text-gray-900">{p.plant_name}</span>
                      <span className="text-xs text-gray-500">{p.plant_code}</span>
                    </div>
                    <AuthBadge status="authenticated" label="Validated" size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
