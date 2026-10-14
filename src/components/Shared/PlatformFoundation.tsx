import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Cpu, ClipboardList, History, BookOpen, ShieldCheck,
  Plus, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle,
  ChevronRight, MapPin, Wrench, Calendar, ArrowRight, FileText,
  Layers, FlaskConical, TrendingUp, AlertTriangle, Database
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type {
  Organization, OrganizationMember, Site, Equipment, EquipmentCalibration,
  WorkflowStage, WorkflowEvent, AuditTrailEntry,
  A6Methodology, A6Parameter, FeatureTruthLedgerEntry,
  OrgType, MemberRole, EquipmentType, EquipmentStatus, FeatureStatus, BacklogPriority
} from '../../types';

type PlatformTab = 'overview' | 'devices' | 'workflow' | 'audit' | 'methodology' | 'ledger';

export default function PlatformFoundation() {
  const { user } = useAuth();
  const [tab, setTab] = useState<PlatformTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [org, setOrg] = useState<Organization | null>(null);
  const [, setMembers] = useState<OrganizationMember[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [calibrations, setCalibrations] = useState<EquipmentCalibration[]>([]);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditTrailEntry[]>([]);
  const [methodologies, setMethodologies] = useState<A6Methodology[]>([]);
  const [parameters, setParameters] = useState<A6Parameter[]>([]);
  const [ledger, setLedger] = useState<FeatureTruthLedgerEntry[]>([]);

  // Device form state
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [devModel, setDevModel] = useState('');
  const [devType, setDevType] = useState<EquipmentType>('sensor');
  const [devSerial, setDevSerial] = useState('');
  const [devPartNum, setDevPartNum] = useState('');
  const [devFirmware, setDevFirmware] = useState('');
  const [devCustodian, setDevCustodian] = useState('');
  const [devSiteId, setDevSiteId] = useState('');

  // Calibration form
  const [showCalibForm, setShowCalibForm] = useState(false);
  const [calibEquipmentId, setCalibEquipmentId] = useState('');
  const [calibRangeMin, setCalibRangeMin] = useState<number | ''>('');
  const [calibRangeMax, setCalibRangeMax] = useState<number | ''>('');
  const [calibAccuracy, setCalibAccuracy] = useState('');
  const [calibCert, setCalibCert] = useState('');
  const [calibDueDate, setCalibDueDate] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load or create org for this user
      const memberRes = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id);
      let orgId: string | null = memberRes.data?.[0]?.organization_id || null;

      if (!orgId) {
        // Auto-create a default org
        const profileRes = await supabase.from('user_profiles').select('company_name').eq('id', user.id).maybeSingle();
        const orgName = profileRes.data?.company_name || `${user.email?.split('@')[0] || 'New'} Organization`;
        const { data: newOrg } = await supabase.from('organizations').insert({ name: orgName, org_type: 'developer' as OrgType }).select().single();
        if (newOrg) {
          await supabase.from('organization_members').insert({ organization_id: newOrg.id, user_id: user.id, role: 'owner' as MemberRole });
          orgId = newOrg.id;
          setOrg(newOrg);
        }
      } else {
        const orgRes = await supabase.from('organizations').select('*').eq('id', orgId).maybeSingle();
        if (orgRes.data) setOrg(orgRes.data);
      }

      if (!orgId) return;

      const [memRes, sitesRes, equipRes, calibRes, stagesRes, eventsRes, auditRes, methRes, paramRes, ledgerRes] = await Promise.all([
        supabase.from('organization_members').select('*').eq('organization_id', orgId),
        supabase.from('sites').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        supabase.from('equipment').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
        supabase.from('equipment_calibration').select('*, equipment!inner(organization_id)').order('created_at', { ascending: false }),
        supabase.from('workflow_stages').select('*').order('stage_order', { ascending: true }),
        supabase.from('workflow_events').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(30),
        supabase.from('audit_trail').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('a6_methodologies').select('*').order('created_at', { ascending: false }),
        supabase.from('a6_parameters').select('*').order('created_at', { ascending: false }),
        supabase.from('feature_truth_ledger').select('*').order('priority', { ascending: true }).order('feature_id', { ascending: true }),
      ]);

      if (memRes.data) setMembers(memRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
      if (equipRes.data) setEquipment(equipRes.data);
      if (calibRes.data) setCalibrations(calibRes.data as unknown as EquipmentCalibration[]);
      if (stagesRes.data) setStages(stagesRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (auditRes.data) setAuditEntries(auditRes.data);
      if (methRes.data) setMethodologies(methRes.data);
      if (paramRes.data) setParameters(paramRes.data);
      if (ledgerRes.data) setLedger(ledgerRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function addDevice() {
    if (!user || !org || !devModel) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await supabase.from('equipment').insert({
        organization_id: org.id, site_id: devSiteId || null,
        device_type: devType, model: devModel, serial_number: devSerial,
        part_number: devPartNum, firmware_version: devFirmware, custodian: devCustodian,
        status: 'commissioned' as EquipmentStatus,
      });
      setSuccess(`Device "${devModel}" registered.`);
      setShowDeviceForm(false); setDevModel(''); setDevSerial(''); setDevPartNum(''); setDevFirmware(''); setDevCustodian('');
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function addCalibration() {
    if (!user || !calibEquipmentId) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await supabase.from('equipment_calibration').insert({
        equipment_id: calibEquipmentId,
        range_min: calibRangeMin === '' ? null : Number(calibRangeMin),
        range_max: calibRangeMax === '' ? null : Number(calibRangeMax),
        accuracy: calibAccuracy || null,
        calibration_certificate: calibCert || null,
        next_calibration_due: calibDueDate || null,
      });
      setSuccess('Calibration record added.');
      setShowCalibForm(false); setCalibEquipmentId(''); setCalibRangeMin(''); setCalibRangeMax(''); setCalibAccuracy(''); setCalibCert(''); setCalibDueDate('');
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  const tabs: { id: PlatformTab; label: string; icon: typeof Building2 }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'devices', label: 'Device Registry', icon: Cpu },
    { id: 'workflow', label: 'Workflow Engine', icon: ClipboardList },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'methodology', label: 'Methodology Catalogue', icon: BookOpen },
    { id: 'ledger', label: 'Truth Ledger', icon: ShieldCheck },
  ];

  const statusColors: Record<string, string> = {
    implemented: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
    planned: 'bg-amber-100 text-amber-700',
    not_started: 'bg-gray-100 text-gray-600',
    deprecated: 'bg-red-100 text-red-700',
  };
  const priorityColors: Record<string, string> = {
    P0: 'bg-red-100 text-red-700', P1: 'bg-amber-100 text-amber-700',
    P2: 'bg-blue-100 text-blue-700', P3: 'bg-gray-100 text-gray-600',
  };

  const now = new Date();
  const overdueCalibrations = calibrations.filter(c => c.next_calibration_due && new Date(c.next_calibration_due) < now);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Platform Foundation</h1>
        <p className="text-gray-600">Canonical data model, workflow engine, device registry, methodology catalogue, and truth ledger</p>
      </div>

      {error && <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span className="text-sm">{error}</span></div>}
      {success && <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /><span className="text-sm">{success}</span></div>}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${tab === t.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" />{t.label}
          </button>
        ); })}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Building2, label: 'Organization', value: org?.name || '—', sub: org?.org_type || '', color: 'bg-blue-500' },
              { icon: Cpu, label: 'Devices Registered', value: equipment.length, sub: `${overdueCalibrations.length} calibrations overdue`, color: 'bg-purple-500' },
              { icon: ClipboardList, label: 'Workflow Stages', value: stages.length, sub: `${events.length} events logged`, color: 'bg-emerald-500' },
              { icon: ShieldCheck, label: 'Truth Ledger Items', value: ledger.length, sub: `${ledger.filter(l => l.status === 'implemented').length} implemented`, color: 'bg-amber-500' },
            ].map(s => { const Icon = s.icon; return (
              <div key={s.label} className="bg-white rounded-xl shadow p-5">
                <div className={`${s.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}><Icon className="w-5 h-5 text-white" /></div>
                <div className="text-xl font-bold text-gray-900 truncate">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
                <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
              </div>
            ); })}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-500" /> P0 Items Status</h3>
              <div className="space-y-2">
                {ledger.filter(l => l.priority === 'P0').slice(0, 8).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-600">{l.feature_id}</span>
                    <span className="text-gray-700 truncate ml-2 flex-1">{l.feature_name}</span>
                    <span className={`px-2 py-0.5 rounded-full ${statusColors[l.status]}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Sites & Equipment</h3>
              <div className="space-y-2">
                {sites.length === 0 && equipment.length === 0 && <p className="text-sm text-gray-400">No sites or devices yet. Register devices in the Device Registry tab.</p>}
                {sites.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium text-gray-700">{s.name}</span></div>
                    <span className="text-gray-400">{equipment.filter(e => e.site_id === s.id).length} devices</span>
                  </div>
                ))}
                {equipment.slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-purple-400" /><span className="font-medium text-gray-700">{e.model}</span><span className="text-gray-400">{e.serial_number}</span></div>
                    <span className={`px-1.5 py-0.5 rounded ${e.status === 'active' ? 'bg-emerald-100 text-emerald-600' : e.status === 'faulty' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{e.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE REGISTRY */}
      {tab === 'devices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Cpu className="w-5 h-5 text-purple-600" /> Device Registry</h2>
                <p className="text-gray-600 text-sm mt-1">Every device has unique identity, model, firmware, calibration status, and commissioning history.</p>
              </div>
              <button onClick={() => setShowDeviceForm(!showDeviceForm)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Register Device</button>
            </div>

            {showDeviceForm && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Device Type</label>
                    <select value={devType} onChange={e => setDevType(e.target.value as EquipmentType)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="sensor">Sensor</option><option value="gateway">Gateway</option><option value="meter">Meter</option>
                      <option value="analyser">Analyser</option><option value="weighbridge">Weighbridge</option><option value="weather_station">Weather Station</option>
                    </select>
                  </div>
                  <div><label className="block text-xs text-gray-500 mb-1">Model *</label><input value={devModel} onChange={e => setDevModel(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="BLK-S-CO2" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Serial Number</label><input value={devSerial} onChange={e => setDevSerial(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="SN-001" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Part Number</label><input value={devPartNum} onChange={e => setDevPartNum(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="BLK-S-CO2" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Firmware Version</label><input value={devFirmware} onChange={e => setDevFirmware(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="1.2.0" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Custodian</label><input value={devCustodian} onChange={e => setDevCustodian(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Field Tech Name" /></div>
                  <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Site (optional)</label>
                    <select value={devSiteId} onChange={e => setDevSiteId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">None</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addDevice} disabled={loading || !devModel} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Device
                </button>
              </div>
            )}

            {overdueCalibrations.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{overdueCalibrations.length} device(s) have overdue calibrations.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Type</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Model</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Serial</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Firmware</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Calibration</th>
                </tr></thead>
                <tbody>
                  {equipment.map(e => {
                    const calib = calibrations.find(c => c.equipment_id === e.id);
                    const overdue = calib?.next_calibration_due && new Date(calib.next_calibration_due) < now;
                    return (
                      <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{e.device_type}</span></td>
                        <td className="py-2 px-2 font-medium text-gray-800">{e.model}</td>
                        <td className="py-2 px-2 text-gray-500 font-mono text-xs">{e.serial_number || '—'}</td>
                        <td className="py-2 px-2 text-gray-500 text-xs">{e.firmware_version || '—'}</td>
                        <td className="py-2 px-2"><span className={`px-1.5 py-0.5 rounded text-xs ${e.status === 'active' ? 'bg-emerald-100 text-emerald-600' : e.status === 'faulty' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{e.status}</span></td>
                        <td className="py-2 px-2 text-xs">
                          {calib ? <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-500'}>{overdue ? 'OVERDUE' : 'OK'} — due {new Date(calib.next_calibration_due || '').toLocaleDateString()}</span>
                                 : <button onClick={() => { setShowCalibForm(true); setCalibEquipmentId(e.id); }} className="text-blue-600 hover:underline">Add calibration</button>}
                        </td>
                      </tr>
                    );
                  })}
                  {equipment.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-400">No devices registered yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {showCalibForm && (
            <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /> Add Calibration Record</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="block text-xs text-gray-500 mb-1">Range Min</label><input type="number" value={calibRangeMin} onChange={e => setCalibRangeMin(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Range Max</label><input type="number" value={calibRangeMax} onChange={e => setCalibRangeMax(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Accuracy</label><input value={calibAccuracy} onChange={e => setCalibAccuracy(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="±0.5%" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Certificate Ref</label><input value={calibCert} onChange={e => setCalibCert(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="CAL-2026-001" /></div>
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Next Calibration Due</label><input type="date" value={calibDueDate} onChange={e => setCalibDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={addCalibration} disabled={loading || !calibEquipmentId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save</button>
                <button onClick={() => setShowCalibForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW ENGINE */}
      {tab === 'workflow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-emerald-600" /> Workflow Stages</h2>
            <p className="text-gray-600 text-sm mb-4">Projects move through configurable stages. Every transition has actor, timestamp, evidence, and reason.</p>
            <div className="flex flex-wrap items-center gap-2">
              {stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`px-3 py-2 rounded-lg text-sm font-medium ${s.is_terminal ? 'bg-gray-200 text-gray-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                    <span className="text-xs text-gray-400 mr-1">{s.stage_order}</span>{s.display_name}
                    {s.allowed_transitions.length > 0 && <span className="text-xs text-gray-400 ml-2">→ {s.allowed_transitions.join(', ')}</span>}
                  </div>
                  {i < stages.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><History className="w-4 h-4 text-blue-500" /> Recent Workflow Events</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-700">{e.from_stage || 'init'} → {e.to_stage}</span>
                      {e.reason && <span className="text-gray-500 ml-2">— {e.reason}</span>}
                    </div>
                  </div>
                  <span className="text-gray-400">{new Date(e.created_at).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {events.length === 0 && <p className="text-sm text-gray-400">No workflow events yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL */}
      {tab === 'audit' && (
        <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><History className="w-5 h-5 text-amber-600" /> Audit Trail</h2>
          <p className="text-gray-600 text-sm mb-4">Append-only log. Original records are retained; corrections create superseding events with reason and authority.</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditEntries.map(a => (
              <div key={a.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-xs">
                <div className="flex items-center gap-3 flex-1">
                  {a.action === 'create' && <Plus className="w-3.5 h-3.5 text-emerald-500" />}
                  {a.action === 'update' && <Wrench className="w-3.5 h-3.5 text-blue-500" />}
                  {a.action === 'delete' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                  {a.action === 'correct' && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">{a.action} — {a.entity_type}</div>
                    {a.reason && <div className="text-gray-500">Reason: {a.reason}</div>}
                    {a.authority && <div className="text-gray-400">Authority: {a.authority}</div>}
                    {a.superseded_by && <div className="text-amber-600">Superseded by: {a.superseded_by.slice(0, 8)}…</div>}
                  </div>
                </div>
                <span className="text-gray-400">{new Date(a.created_at).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {auditEntries.length === 0 && <p className="text-sm text-gray-400">No audit entries yet.</p>}
          </div>
        </div>
      )}

      {/* METHODOLOGY CATALOGUE */}
      {tab === 'methodology' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600" /> Methodology Catalogue</h2>
            <p className="text-gray-600 text-sm mb-4">Each methodology includes programme, version, effective date, required evidence, monitoring frequency, and supersession state.</p>
            <div className="space-y-2">
              {methodologies.map(m => (
                <div key={m.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="font-medium text-gray-800">{m.programme} — {m.methodology_id}</span>
                        <span className="text-gray-500 text-xs ml-2">v{m.version}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : m.status === 'superseded' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>{m.status}</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-7">{m.activity_applicability}</div>
                  {m.description && <div className="text-xs text-gray-500 ml-7 mt-1">{m.description}</div>}
                  <div className="flex items-center gap-4 ml-7 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Effective: {new Date(m.effective_date).toLocaleDateString()}</span>
                    {m.monitoring_frequency && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {m.monitoring_frequency}</span>}
                  </div>
                </div>
              ))}
              {methodologies.length === 0 && <p className="text-sm text-gray-400">No methodologies loaded.</p>}
            </div>
          </div>

          {parameters.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-teal-500" /> Parameter Register ({parameters.length})</h3>
              <div className="space-y-2">
                {parameters.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <div><span className="font-medium text-gray-700">{p.parameter_name}</span>{p.unit && <span className="text-gray-400 ml-2">({p.unit})</span>}</div>
                    <div className="flex items-center gap-3">
                      {p.current_value !== null && <span className="text-gray-600">Value: {p.current_value}</span>}
                      {p.source && <span className="text-gray-400">{p.source}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRUTH LEDGER */}
      {tab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 max-w-5xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Feature Truth Ledger</h2>
            <p className="text-gray-600 text-sm mb-4">Every public claim has a status, evidence link, product owner, last test date, limitations, and approved wording.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">ID</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Priority</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Feature</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Area</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Approved Wording</th>
                </tr></thead>
                <tbody>
                  {ledger.map(l => (
                    <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 font-mono font-medium text-gray-700">{l.feature_id}</td>
                      <td className="py-2 px-2"><span className={`px-1.5 py-0.5 rounded ${priorityColors[l.priority as BacklogPriority] || 'bg-gray-100 text-gray-600'}`}>{l.priority}</span></td>
                      <td className="py-2 px-2 text-gray-700">{l.feature_name}</td>
                      <td className="py-2 px-2 text-gray-500">{l.backlog_area}</td>
                      <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded-full ${statusColors[l.status as FeatureStatus] || 'bg-gray-100 text-gray-600'}`}>{l.status.replace('_', ' ')}</span></td>
                      <td className="py-2 px-2 text-gray-500 max-w-xs truncate">{l.approved_wording}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-400">No ledger entries yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary by area */}
          <div className="grid md:grid-cols-3 gap-4">
            {['Governance', 'Platform', 'CIVV Hardware', 'A6 Navigator', 'Security', 'Registry'].map(area => {
              const items = ledger.filter(l => l.backlog_area === area);
              if (items.length === 0) return null;
              const implemented = items.filter(l => l.status === 'implemented').length;
              return (
                <div key={area} className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> {area}</h3>
                    <span className="text-xs text-gray-400">{implemented}/{items.length} done</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(implemented / items.length) * 100}%` }} />
                  </div>
                  <div className="space-y-1">
                    {items.map(l => <div key={l.id} className="flex items-center justify-between text-xs"><span className="font-mono text-gray-500">{l.feature_id}</span><span className={`px-1.5 py-0.5 rounded ${statusColors[l.status as FeatureStatus] || 'bg-gray-100'}`}>{l.status.replace('_', ' ')}</span></div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
