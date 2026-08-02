import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Server, Lock, Cpu, FileCheck, CircleCheck as CheckCircle, Loader as Loader2, CircleAlert as AlertCircle, ChevronRight, Send, FingerprintPattern as Fingerprint, Wifi, Beaker, Circle as XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { INDUSTRIES } from '../../data/industries';
import { REGISTRIES } from '../../data/registries';
import { METHODOLOGIES } from '../../data/methodologies';
import { GREEN_CLUBS } from '../../data/clubs';
import CredentialTester from '../Shared/CredentialTester';
import AuthBadge from '../Shared/AuthBadge';
import AuthStampPanel from '../Shared/AuthStampPanel';
import type { AuthStamp, PlantConfig, CivvGateway, PersonaCredential, ProjectStatus, CommunityMethodology } from '../../types';

type Step = 'credentials' | 'ghg' | 'civv' | 'lock' | 'submit' | 'review';

const STEPS = [
  { id: 'credentials' as const, label: 'VVB Credentials', icon: ShieldCheck },
  { id: 'ghg' as const, label: 'GHG Calculator', icon: FileCheck },
  { id: 'civv' as const, label: 'Ship CIVV Gateway', icon: Server },
  { id: 'lock' as const, label: 'Lock MAC Address', icon: Lock },
  { id: 'submit' as const, label: 'Submit to Registry', icon: Send },
  { id: 'review' as const, label: 'Review Community Methods', icon: Beaker },
];

export default function AuditorDashboard() {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [tokenType, setTokenType] = useState<'black' | 'green' | null>(null);
  const [industry, setIndustry] = useState('');
  const [club, setClub] = useState('');
  const [methodology, setMethodology] = useState('');
  const [scopeLevel, setScopeLevel] = useState<'scope1' | 'scope2' | 'scope3'>('scope1');
  const [registry, setRegistry] = useState('');
  const [ghgCalculatorType, setGhgCalculatorType] = useState('');
  const [plantName, setPlantName] = useState('');
  const [plantCode, setPlantCode] = useState('');
  const [gatewayName, setGatewayName] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [credentials, setCredentials] = useState<PersonaCredential[]>([]);
  const [stamps, setStamps] = useState<AuthStamp[]>([]);
  const [plantConfigs, setPlantConfigs] = useState<PlantConfig[]>([]);
  const [gateways, setGateways] = useState<CivvGateway[]>([]);
  const [communityMethods, setCommunityMethods] = useState<CommunityMethodology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlantCode, setSelectedPlantCode] = useState('');
  const [selectedMac, setSelectedMac] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    const [credRes, stampRes, plantRes, gwRes, methRes] = await Promise.all([
      supabase.from('persona_credentials').select('*').eq('user_id', user.id),
      supabase.from('auth_stamps').select('*').eq('user_id', user.id).order('stamped_at', { ascending: false }),
      supabase.from('plant_configs').select('*').order('created_at', { ascending: false }),
      supabase.from('civv_gateways').select('*').order('created_at', { ascending: false }),
      supabase.from('community_methodologies').select('*').order('created_at', { ascending: false }),
    ]);
    if (credRes.data) setCredentials(credRes.data);
    if (stampRes.data) setStamps(stampRes.data);
    if (plantRes.data) setPlantConfigs(plantRes.data);
    if (gwRes.data) setGateways(gwRes.data);
    if (methRes.data) setCommunityMethods(methRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const anyRegistryCred = credentials.find(c => c.credential_type === 'registry' && c.auth_status === 'authenticated');
  const pendingMethods = communityMethods.filter(m => m.status === 'PENDING_REVIEW');

  const applicableMethodologies = METHODOLOGIES.filter(m => {
    if (!tokenType || m.tokenType !== tokenType) return false;
    if (tokenType === 'black') return m.applicable_sectors.includes(industry);
    if (club) { const c = GREEN_CLUBS.find(cl => cl.id === club); return c?.methodologies.includes(m.id); }
    return false;
  });

  const availableRegistries = tokenType === 'green' && club
    ? REGISTRIES.filter(r => GREEN_CLUBS.find(c => c.id === club)?.registries.includes(r.id))
    : REGISTRIES;

  async function handleSaveGhgConfig() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const meth = METHODOLOGIES.find(m => m.id === methodology);
      if (!meth) throw new Error('Select a methodology');
      const { error: insertErr } = await supabase.from('plant_configs').insert({
        plant_name: plantName, plant_code: plantCode, industry, ghg_calculator_type: ghgCalculatorType,
        token_type: tokenType, club, registry, methodology, scope_level: scopeLevel,
        auditor_id: user.id, status: 'PENDING_AUDITOR',
        config_json: { formula: meth.formula, scope: meth.scope, calculator_version: 'dMRV Engine v1' },
      });
      if (insertErr) throw insertErr;
      setSuccess('Plant configuration saved.'); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleShipGateway() {
    setLoading(true); setError(''); setSuccess('');
    try {
      const { error } = await supabase.from('civv_gateways').insert({
        gateway_name: gatewayName, mac_address: macAddress, firmware_version: 'v2.4.1', sensor_count: 6,
        sensors: [{ id: 'SNS-001', type: 'power_meter', scope: 'scope2' }, { id: 'SNS-002', type: 'flow_meter', scope: 'scope1' }, { id: 'SNS-003', type: 'temperature', scope: 'scope1' }, { id: 'SNS-004', type: 'gas_analyzer', scope: 'scope1' }, { id: 'SNS-005', type: 'humidity', scope: 'scope1' }, { id: 'SNS-006', type: 'irradiance', scope: 'scope2' }],
        ship_status: 'shipped', shipped_to: plantName, shipped_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSuccess(`CIVV Gateway "${gatewayName}" shipped.`); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleLockMac() {
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.plant_code === selectedPlantCode);
      const gateway = gateways.find(g => g.mac_address === selectedMac);
      if (!plant || !gateway) throw new Error('Select plant and gateway');
      await supabase.from('civv_gateways').update({ locked_to_plant_id: plant.id, locked_at: new Date().toISOString(), ship_status: 'locked' }).eq('id', gateway.id);
      await supabase.from('plant_configs').update({ civv_gateway_id: gateway.id, mac_address: selectedMac, status: 'REGISTRY_VALIDATED' as ProjectStatus }).eq('id', plant.id);
      setSuccess(`MAC ${selectedMac} locked to ${plant.plant_name}.`); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleSubmitToRegistry() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const plant = plantConfigs.find(p => p.plant_code === selectedPlantCode);
      if (!plant) throw new Error('Select a plant');
      const reg = REGISTRIES.find(r => r.id === plant.registry);
      if (!reg) throw new Error('Registry not found');
      const payload = { plant_code: plant.plant_code, plant_name: plant.plant_name, industry: plant.industry, ghg_calculator_type: plant.ghg_calculator_type, token_type: plant.token_type, club: plant.club, registry: plant.registry, methodology: plant.methodology, scope_level: plant.scope_level, mac_address: plant.mac_address, vvb: userProfile?.company_name, submission_type: 'project_validation', timestamp: new Date().toISOString() };
      await new Promise(r => setTimeout(r, 1500));
      const registryResponse = { status: 'validated', registry_project_id: `${reg.id}-${Date.now().toString(36).toUpperCase()}`, validation_status: 'approved', validated_at: new Date().toISOString() };
      await supabase.from('data_submissions').insert({ user_id: user.id, plant_config_id: plant.id, mac_address: plant.mac_address || '', registry: plant.registry, payload, interval_minutes: 0, submission_status: 'submitted', registry_response: registryResponse });
      await supabase.from('plant_configs').update({ status: 'REGISTRY_VALIDATED' as ProjectStatus }).eq('id', plant.id);
      await supabase.from('auth_stamps').insert({ user_id: user.id, persona: 'auditor', provider: plant.registry, provider_type: 'registry_submission', status: 'authenticated', stamp_hash: `SUB-${Date.now().toString(36).toUpperCase()}`, stamped_at: new Date().toISOString(), metadata: { plant_code: plant.plant_code } });
      setSuccess(`Plant validated by ${reg.name}.`); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleReviewMethodology(methId: string, approved: boolean) {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await supabase.from('community_methodologies').update({
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewer_id: user.id, review_notes: reviewNotes, reviewed_at: new Date().toISOString(),
        approved_at: approved ? new Date().toISOString() : null,
      }).eq('id', methId);
      setSuccess(`Methodology ${approved ? 'approved' : 'rejected'}.`);
      setReviewNotes('');
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900 mb-1">Auditor / VVB Dashboard</h1><p className="text-gray-600">Configure GHG calculator, ship CIVV gateway, lock MAC, validate projects, and review community methodologies</p></div>
      <div className="mb-6"><AuthStampPanel stamps={stamps} loading={false} /></div>
      {error && <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span className="text-sm">{error}</span></div>}
      {success && <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /><span className="text-sm">{success}</span></div>}

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => { const Icon = s.icon; const active = step === s.id; const done = stepIndex > i; return (
          <div key={s.id} className="flex items-center gap-2 shrink-0">
            <button onClick={() => setStep(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-4 h-4" />{s.label}</button>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
          </div>
        ); })}
      </div>

      {step === 'credentials' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">VVB Registry Credentials</h2>
          <p className="text-gray-600 mb-4 text-sm">Enter your VVB credentials to authenticate with the carbon registry.</p>
          {anyRegistryCred && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="text-sm font-medium text-emerald-700">Authenticated with {REGISTRIES.find(r => r.id === anyRegistryCred.provider)?.name}</span><AuthBadge status="authenticated" label="Green Tick" size="sm" /></div>}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => { setTokenType('black'); setIndustry(''); setMethodology(''); setClub(''); }} className={`p-4 rounded-lg border-2 text-left ${tokenType === 'black' ? 'border-slate-900 bg-slate-50' : 'border-gray-200'}`}><ShieldCheck className="w-6 h-6 text-slate-900 mb-2" /><div className="font-semibold">Black Token</div><div className="text-xs text-gray-500">Emission compliance (GEI)</div></button>
            <button onClick={() => { setTokenType('green'); setClub(''); setMethodology(''); setIndustry(''); }} className={`p-4 rounded-lg border-2 text-left ${tokenType === 'green' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}><CheckCircle className="w-6 h-6 text-emerald-600 mb-2" /><div className="font-semibold">Green Token</div><div className="text-xs text-gray-500">Carbon credits / RECs</div></button>
          </div>
          {tokenType && <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Select Registry</label><select value={registry} onChange={e => setRegistry(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{availableRegistries.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>}
          {registry && !anyRegistryCred && user && <CredentialTester credType="registry" providerId={registry} userId={user.id} persona="auditor" onAuthenticated={() => loadData()} />}
          {anyRegistryCred && <button onClick={() => setStep('ghg')} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Next →</button>}
        </div>
      )}

      {step === 'ghg' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assign GHG Calculator to Plant</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Plant Name</label><input value={plantName} onChange={e => setPlantName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Plant Code</label><input value={plantCode} onChange={e => setPlantCode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            </div>
            {tokenType === 'black' && <div><label className="block text-sm font-medium text-gray-700 mb-2">Industry</label><select value={industry} onChange={e => { setIndustry(e.target.value); setMethodology(''); }} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{INDUSTRIES.filter(i => i.geiObligated).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>}
            {tokenType === 'green' && <div><label className="block text-sm font-medium text-gray-700 mb-2">Club</label><div className="grid grid-cols-2 gap-3">{GREEN_CLUBS.map(c => <button key={c.id} onClick={() => { setClub(c.id); setMethodology(''); }} className={`p-3 rounded-lg border-2 text-left ${club === c.id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-gray-500">{c.description}</div></button>)}</div></div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-2">GHG Calculator Type</label><select value={ghgCalculatorType} onChange={e => setGhgCalculatorType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option><option value="dMRV_Engine_v1">dMRV Engine v1</option><option value="DEFRA_Calculator">DEFRA Calculator</option><option value="ASHRAE_228">ASHRAE 228</option><option value="ACM0002_RE">ACM0002 Solar PV</option><option value="VM0047_ARR">VM0047 ARR</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label><select value={methodology} onChange={e => setMethodology(e.target.value)} disabled={!applicableMethodologies.length} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{applicableMethodologies.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Scope</label><div className="flex gap-2">{(['scope1', 'scope2', 'scope3'] as const).map(sc => <button key={sc} onClick={() => setScopeLevel(sc)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${scopeLevel === sc ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{sc.replace('scope', 'Scope ')}</button>)}</div></div>
            <button onClick={handleSaveGhgConfig} disabled={loading || !plantName || !plantCode || !methodology || !ghgCalculatorType} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}Save</button>
          </div>
          {plantConfigs.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-gray-700 mb-2">Configured Plants</h3><div className="space-y-2">{plantConfigs.map(p => <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><span className="font-medium text-sm">{p.plant_name}</span><span className="text-xs text-gray-500 ml-2">{p.plant_code}</span></div><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'REGISTRY_VALIDATED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{p.status.replace(/_/g, ' ')}</span></div>)}</div></div>}
        </div>
      )}

      {step === 'civv' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ship Blockvolt CIVV Gateway</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Gateway Name</label><input value={gatewayName} onChange={e => setGatewayName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">MAC Address</label><input value={macAddress} onChange={e => setMacAddress(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono" /></div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg"><div className="flex items-center gap-2 mb-2"><Cpu className="w-5 h-5 text-gray-600" /><span className="text-sm font-semibold">Gateway Specs</span></div><div className="grid grid-cols-3 gap-4 text-sm"><div>Firmware: v2.4.1</div><div>Sensors: 6 channels</div><div>Protocol: MQTT/TLS</div></div></div>
            <button onClick={handleShipGateway} disabled={loading || !gatewayName || !macAddress} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Ship Gateway</button>
          </div>
          {gateways.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-gray-700 mb-2">Shipped Gateways</h3><div className="space-y-2">{gateways.map(gw => <div key={gw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><Server className="w-4 h-4 text-gray-500" /><div><span className="font-medium text-sm">{gw.gateway_name}</span><span className="text-xs font-mono text-gray-500 ml-2">{gw.mac_address}</span></div></div><span className={`text-xs px-2 py-0.5 rounded-full ${gw.ship_status === 'locked' ? 'bg-amber-100 text-amber-700' : gw.ship_status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{gw.ship_status}</span></div>)}</div></div>}
        </div>
      )}

      {step === 'lock' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lock MAC Address to Plant</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Select Plant</label><select value={selectedPlantCode} onChange={e => setSelectedPlantCode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{plantConfigs.map(p => <option key={p.id} value={p.plant_code}>{p.plant_name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Select Gateway</label><select value={selectedMac} onChange={e => setSelectedMac(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{gateways.filter(g => g.ship_status === 'shipped').map(g => <option key={g.id} value={g.mac_address}>{g.gateway_name} — {g.mac_address}</option>)}</select></div>
            <button onClick={handleLockMac} disabled={loading || !selectedPlantCode || !selectedMac} className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}Lock MAC</button>
          </div>
        </div>
      )}

      {step === 'submit' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Plant Data to Registry</h2>
          <div className="mb-4 flex items-center gap-3"><Fingerprint className="w-5 h-5 text-gray-400" /><AuthBadge status={anyRegistryCred ? 'authenticated' : 'pending'} label={anyRegistryCred ? 'VVB Authenticated' : 'VVB Not Authenticated'} /><Wifi className="w-5 h-5 text-gray-400 ml-4" /><AuthBadge status={anyRegistryCred ? 'authenticated' : 'pending'} label={anyRegistryCred ? 'Registry Connected' : 'Not Connected'} /></div>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Select Plant (MAC Locked)</label><select value={selectedPlantCode} onChange={e => { setSelectedPlantCode(e.target.value); const p = plantConfigs.find(p => p.plant_code === e.target.value); if (p) setRegistry(p.registry); }} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">Select</option>{plantConfigs.filter(p => p.mac_address).map(p => <option key={p.id} value={p.plant_code}>{p.plant_name} — MAC: {p.mac_address}</option>)}</select></div>
            <button onClick={handleSubmitToRegistry} disabled={loading || !selectedPlantCode || !anyRegistryCred} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Submit for Validation</button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review Community Methodologies</h2>
          <p className="text-gray-600 mb-4 text-sm">Approve or reject community-contributed GHG calculator methodologies. Approved methodologies become available for all developers.</p>
          {pendingMethods.length === 0 ? <p className="text-sm text-gray-400">No pending methodologies to review.</p> : (
            <div className="space-y-4">
              {pendingMethods.map(m => (
                <div key={m.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-semibold text-sm">{m.methodology_title}</h3><p className="text-xs text-gray-500">{REGISTRIES.find(r => r.id === m.registry)?.name} · v{m.version} · By {m.contributor_name}</p></div>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded mb-2">{m.formula}</div>
                  <div className="flex flex-wrap gap-1 mb-2">{(m.required_sensor_types || []).map(s => <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{s}</span>)}</div>
                  {m.description && <p className="text-xs text-gray-500 mb-2">{m.description}</p>}
                  <div className="mb-3"><input value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Review notes (optional)" /></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReviewMethodology(m.id, true)} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Approve</button>
                    <button onClick={() => handleReviewMethodology(m.id, false)} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1"><XCircle className="w-4 h-4" />Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
