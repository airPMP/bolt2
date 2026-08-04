import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Download, Grid3x3, Eye, CreditCard as Edit3, Lock, ListFilter as Filter, ChartBar as BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ACTIVITY_TYPES } from '../../data/esg';
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS } from '../../data/frameworks';
import { calculateEmissions, generateDisclosureFromActivity, aggregateEmissionsByScope } from '../../lib/esgEngine';
import type {
  RawActivityLedger, ReportFrameworkAlignment, MaterialityAssessment, DisclosureItem,
  ScopeCategory, ReviewStatus, ESGFramework, DataSource
} from '../../types';

type ESGTab = 'overview' | 'activities' | 'materiality' | 'disclosures' | 'export';

export default function ESGDashboard() {
  const { user, userProfile } = useAuth();
  const [tab, setTab] = useState<ESGTab>('overview');
  const [activities, setActivities] = useState<RawActivityLedger[]>([]);
  const [alignments, setAlignments] = useState<ReportFrameworkAlignment[]>([]);
  const [materiality, setMateriality] = useState<MaterialityAssessment[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState<'all' | ESGFramework>('all');

  // Activity form
  const [actForm, setActForm] = useState({
    activityType: '',
    scope: 'scope1' as ScopeCategory,
    quantity: 0,
    unit: '',
    source: 'Manual' as DataSource,
  });

  // Materiality form
  const [matForm, setMatForm] = useState({ topic: '', impact: 5, likelihood: 5, rationale: '' });

  const loadData = useCallback(async () => {
    if (!user) return;
    const [actRes, alignRes, matRes, discRes] = await Promise.all([
      supabase.from('raw_activity_ledger').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('report_framework_alignment').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('materiality_assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('disclosure_items').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    ]);
    if (actRes.data) setActivities(actRes.data);
    if (alignRes.data) setAlignments(alignRes.data);
    if (matRes.data) setMateriality(matRes.data);
    if (discRes.data) setDisclosures(discRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const emissionsSummary = aggregateEmissionsByScope(
    alignments.map(a => ({ scope_category: (activities.find(act => act.id === a.record_id)?.scope_category || 'scope1') as ScopeCategory, calculated_tco2e: a.calculated_tco2e }))
  );

  async function handleAddActivity() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      if (!actForm.activityType || !actForm.quantity) throw new Error('Fill in all fields');
      const activityType = ACTIVITY_TYPES.find(a => a.value === actForm.activityType);
      const scope = activityType?.scope || actForm.scope;
      const unit = actForm.unit || activityType?.defaultUnit || 'unit';

      // Insert raw activity
      const { data: actData, error: actErr } = await supabase.from('raw_activity_ledger').insert({
        user_id: user.id, organization_id: user.id,
        scope_category: scope, activity_type: actForm.activityType,
        raw_quantity: actForm.quantity, measurement_unit: unit,
        source: actForm.source, activity_window_start: new Date(Date.now() - 86400000).toISOString(),
        activity_window_end: new Date().toISOString(),
      }).select().single();
      if (actErr) throw actErr;

      // Calculate emissions
      const calc = calculateEmissions(actForm.activityType, actForm.quantity, scope);

      // Create framework alignment
      const { error: alignErr } = await supabase.from('report_framework_alignment').insert({
        record_id: actData.id, user_id: user.id,
        gri_indicator_id: calc.mapping.gri,
        brsr_indicator_id: calc.mapping.brsr,
        sbti_target_id: calc.mapping.sbti,
        csrd_indicator_id: calc.mapping.csrd,
        cdp_indicator_id: calc.mapping.cdp,
        calculated_tco2e: calc.tco2e,
        review_status: 'pending_validation',
        last_modified_by: userProfile?.company_name || user.email,
      });
      if (alignErr) throw alignErr;

      // Auto-create disclosure items for each framework
      const frameworks: Array<{ fw: ESGFramework; indicator: string }> = [
        { fw: 'GRI', indicator: calc.mapping.gri },
        { fw: 'BRSR', indicator: calc.mapping.brsr || 'BRSR Principle 6' },
        { fw: 'CDP', indicator: calc.mapping.cdp || 'C4.3' },
        { fw: 'CSRD', indicator: calc.mapping.csrd || 'ESRS E1-6' },
      ];
      for (const { fw, indicator } of frameworks) {
        const disc = generateDisclosureFromActivity(fw, indicator, calc.tco2e, actForm.source, userProfile?.company_name || user.email);
        await supabase.from('disclosure_items').insert({
          user_id: user.id, organization_id: user.id,
          framework: fw, indicator, indicator_name: null,
          value_text: disc.value_text, value_numeric: disc.value_numeric,
          unit: disc.unit, source: disc.source, review_status: disc.review_status,
          last_modified_by: disc.last_modified_by,
        });
      }

      setSuccess(`Activity recorded. Calculated: ${calc.tco2e.toFixed(6)} tCO2e. Mapped to GRI/BRSR/CDP/CSRD.`);
      setActForm({ activityType: '', scope: 'scope1', quantity: 0, unit: '', source: 'Manual' });
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleAddMateriality() {
    if (!user) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      if (!matForm.topic) throw new Error('Enter a topic');
      const { error: insertErr } = await supabase.from('materiality_assessments').insert({
        user_id: user.id, organization_id: user.id,
        topic: matForm.topic, impact_score: matForm.impact, likelihood_score: matForm.likelihood,
        rationale: matForm.rationale, created_by: userProfile?.company_name || user.email,
      });
      if (insertErr) throw insertErr;
      setSuccess('Materiality assessment added.');
      setMatForm({ topic: '', impact: 5, likelihood: 5, rationale: '' });
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleUpdateDisclosureStatus(discId: string, status: ReviewStatus) {
    setLoading(true); setError('');
    try {
      await supabase.from('disclosure_items').update({
        review_status: status, last_modified_by: userProfile?.company_name || user?.email,
        updated_at: new Date().toISOString(),
      }).eq('id', discId);
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }

  function handleExport(format: 'pdf' | 'html' | 'xml') {
    const approved = disclosures.filter(d => d.review_status === 'approved_auditor');
    if (approved.length === 0) { setError('No approved disclosures to export.'); return; }

    if (format === 'html') {
      const html = generateHTMLReport(approved, emissionsSummary, materiality);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `esg-report-${new Date().toISOString().slice(0, 10)}.html`;
      a.click(); URL.revokeObjectURL(url);
      setSuccess('HTML report exported.');
    } else if (format === 'xml') {
      const xml = generateXMLReport(approved);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `esg-report-${new Date().toISOString().slice(0, 10)}.xml`;
      a.click(); URL.revokeObjectURL(url);
      setSuccess('XML report exported.');
    } else {
      const html = generateHTMLReport(approved, emissionsSummary, materiality);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `esg-report-${new Date().toISOString().slice(0, 10)}.html`;
      a.click(); URL.revokeObjectURL(url);
      setSuccess('PDF report exported (HTML format — print to PDF from browser).');
    }
  }

  const filteredDisclosures = frameworkFilter === 'all' ? disclosures : disclosures.filter(d => d.framework === frameworkFilter);
  const approvedCount = disclosures.filter(d => d.review_status === 'approved_auditor').length;
  const pendingCount = disclosures.filter(d => d.review_status === 'pending_validation').length;
  const draftCount = disclosures.filter(d => d.review_status === 'draft').length;

  const tabs: { id: ESGTab; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'activities', label: 'Activity Ledger', icon: FileText },
    { id: 'materiality', label: 'Materiality', icon: Grid3x3 },
    { id: 'disclosures', label: 'Disclosures', icon: Eye },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">ESG Reporting Workspace</h2>
          <span className="ml-auto text-xs text-gray-500">{approvedCount} approved · {pendingCount} pending · {draftCount} draft</span>
        </div>

        {error && <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span className="text-xs">{error}</span></div>}
        {success && <div className="mb-3 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /><span className="text-xs">{success}</span></div>}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {tabs.map(t => { const Icon = t.icon; return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          ); })}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-red-50 rounded-lg"><div className="text-xs text-red-600 mb-1">Scope 1 (tCO2e)</div><div className="text-xl font-bold text-red-700">{emissionsSummary.scope1.toFixed(4)}</div></div>
              <div className="p-3 bg-amber-50 rounded-lg"><div className="text-xs text-amber-600 mb-1">Scope 2 (tCO2e)</div><div className="text-xl font-bold text-amber-700">{emissionsSummary.scope2.toFixed(4)}</div></div>
              <div className="p-3 bg-green-50 rounded-lg"><div className="text-xs text-green-600 mb-1">Scope 3 (tCO2e)</div><div className="text-xl font-bold text-green-700">{emissionsSummary.scope3.toFixed(4)}</div></div>
              <div className="p-3 bg-indigo-50 rounded-lg"><div className="text-xs text-indigo-600 mb-1">Total (tCO2e)</div><div className="text-xl font-bold text-indigo-700">{emissionsSummary.total.toFixed(4)}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Activities Recorded</h3>
                <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
                <p className="text-xs text-gray-500 mt-1">{activities.filter(a => a.source === 'CIVV').length} from CIVV · {activities.filter(a => a.source === 'Manual').length} manual</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Framework Coverage</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['GRI', 'BRSR', 'CDP', 'CSRD'] as ESGFramework[]).map(fw => {
                    const count = disclosures.filter(d => d.framework === fw).length;
                    return <span key={fw} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{fw}: {count}</span>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Ledger */}
        {tab === 'activities' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Activity to Ledger</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Activity Type</label>
                  <select value={actForm.activityType} onChange={e => { const at = ACTIVITY_TYPES.find(a => a.value === e.target.value); setActForm(f => ({ ...f, activityType: e.target.value, scope: at?.scope || f.scope, unit: at?.defaultUnit || f.unit })); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {ACTIVITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input type="number" value={actForm.quantity} onChange={e => setActForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input value={actForm.unit} onChange={e => setActForm(f => ({ ...f, unit: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="auto" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                  <select value={actForm.source} onChange={e => setActForm(f => ({ ...f, source: e.target.value as DataSource }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="Manual">Manual</option><option value="CIVV">CIVV Sensor</option><option value="Airbyte">Airbyte (ERP)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddActivity} disabled={loading || !actForm.activityType || !actForm.quantity} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add Activity & Calculate
              </button>
            </div>

            {activities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity Records ({activities.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Activity</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Scope</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Qty</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Unit</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Source</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">tCO2e</th>
                    </tr></thead>
                    <tbody>
                      {activities.map(act => {
                        const align = alignments.find(a => a.record_id === act.id);
                        return (
                          <tr key={act.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-xs">{ACTIVITY_TYPES.find(a => a.value === act.activity_type)?.label || act.activity_type}</td>
                            <td className="py-2 px-2"><span className={`text-xs px-1.5 py-0.5 rounded-full ${act.scope_category === 'scope1' ? 'bg-red-100 text-red-700' : act.scope_category === 'scope2' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{act.scope_category}</span></td>
                            <td className="py-2 px-2 text-right text-xs font-mono">{act.raw_quantity}</td>
                            <td className="py-2 px-2 text-xs">{act.measurement_unit}</td>
                            <td className="py-2 px-2"><span className="text-xs flex items-center gap-1">{act.source === 'CIVV' ? <Lock className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3 text-gray-400" />}{act.source}</span></td>
                            <td className="py-2 px-2 text-right text-xs font-mono font-medium">{align?.calculated_tco2e?.toFixed(6) || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Materiality */}
        {tab === 'materiality' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Materiality Assessment</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Topic</label><input value={matForm.topic} onChange={e => setMatForm(f => ({ ...f, topic: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Water consumption in operations" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Impact (1-10)</label><input type="number" min={1} max={10} value={matForm.impact} onChange={e => setMatForm(f => ({ ...f, impact: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Likelihood (1-10)</label><input type="number" min={1} max={10} value={matForm.likelihood} onChange={e => setMatForm(f => ({ ...f, likelihood: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="mt-3"><label className="block text-xs font-medium text-gray-600 mb-1">Rationale</label><input value={matForm.rationale} onChange={e => setMatForm(f => ({ ...f, rationale: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Why is this topic material?" /></div>
              <button onClick={handleAddMateriality} disabled={loading || !matForm.topic} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add Assessment</button>
            </div>

            {materiality.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Materiality Matrix ({materiality.length})</h3>
                <div className="grid gap-2">
                  {materiality.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col items-center w-12"><span className="text-xs text-gray-500">I</span><span className="text-lg font-bold text-gray-900">{m.impact_score}</span></div>
                      <div className="flex flex-col items-center w-12"><span className="text-xs text-gray-500">L</span><span className="text-lg font-bold text-gray-900">{m.likelihood_score}</span></div>
                      <div className="flex-1"><div className="text-sm font-medium text-gray-900">{m.topic}</div>{m.rationale && <div className="text-xs text-gray-500">{m.rationale}</div>}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.impact_score * m.likelihood_score >= 50 ? 'bg-red-100 text-red-700' : m.impact_score * m.likelihood_score >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                        {m.impact_score * m.likelihood_score >= 50 ? 'High Priority' : m.impact_score * m.likelihood_score >= 25 ? 'Medium Priority' : 'Low Priority'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclosures */}
        {tab === 'disclosures' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <button onClick={() => setFrameworkFilter('all')} className={`text-xs px-3 py-1 rounded-full ${frameworkFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
              {(['GRI', 'BRSR', 'CDP', 'CSRD'] as ESGFramework[]).map(fw => <button key={fw} onClick={() => setFrameworkFilter(fw)} className={`text-xs px-3 py-1 rounded-full ${frameworkFilter === fw ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{fw}</button>)}
            </div>

            {filteredDisclosures.length === 0 ? <p className="text-sm text-gray-400">No disclosures yet. Add activities to auto-generate disclosures.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Framework</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Indicator</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">Value</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Unit</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Source</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Action</th>
                  </tr></thead>
                  <tbody>
                    {filteredDisclosures.map(d => (
                      <tr key={d.id} className="border-b border-gray-100">
                        <td className="py-2 px-2"><span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{d.framework}</span></td>
                        <td className="py-2 px-2 text-xs">{d.indicator}</td>
                        <td className="py-2 px-2 text-right text-xs font-mono">{d.value_numeric?.toFixed(4) || d.value_text || '—'}</td>
                        <td className="py-2 px-2 text-xs">{d.unit || '—'}</td>
                        <td className="py-2 px-2"><span className="text-xs flex items-center gap-1">{d.source === 'CIVV' ? <Lock className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3 text-gray-400" />}{d.source}</span></td>
                        <td className="py-2 px-2"><span className={`text-xs px-2 py-0.5 rounded-full ${REVIEW_STATUS_COLORS[d.review_status]}`}>{REVIEW_STATUS_LABELS[d.review_status]}</span></td>
                        <td className="py-2 px-2 text-center">
                          {d.review_status !== 'approved_auditor' ? (
                            <button onClick={() => handleUpdateDisclosureStatus(d.id, 'approved_auditor')} disabled={loading} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">Approve</button>
                          ) : (
                            <button onClick={() => handleUpdateDisclosureStatus(d.id, 'draft')} disabled={loading} className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">Revert</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Export */}
        {tab === 'export' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Export ESG Report</h3>
              <p className="text-xs text-gray-500 mb-4">Export approved disclosures as a formatted report. Only approved items are included.</p>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleExport('pdf')} disabled={approvedCount === 0} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 disabled:opacity-50 flex flex-col items-center gap-2">
                  <Download className="w-6 h-6 text-indigo-600" /><span className="text-sm font-medium">PDF / HTML</span><span className="text-xs text-gray-500">Print-ready report</span>
                </button>
                <button onClick={() => handleExport('html')} disabled={approvedCount === 0} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 disabled:opacity-50 flex flex-col items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" /><span className="text-sm font-medium">HTML</span><span className="text-xs text-gray-500">Web-viewable</span>
                </button>
                <button onClick={() => handleExport('xml')} disabled={approvedCount === 0} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 disabled:opacity-50 flex flex-col items-center gap-2">
                  <FileText className="w-6 h-6 text-amber-600" /><span className="text-sm font-medium">Regulatory XML</span><span className="text-xs text-gray-500">XBRL-style</span>
                </button>
              </div>
              {approvedCount === 0 && <p className="text-xs text-amber-600 mt-3">No approved disclosures. Approve disclosures in the Disclosures tab first.</p>}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Report Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Total Disclosures:</span> <span className="font-medium">{disclosures.length}</span></div>
                <div><span className="text-gray-500">Approved:</span> <span className="font-medium text-emerald-600">{approvedCount}</span></div>
                <div><span className="text-gray-500">Pending:</span> <span className="font-medium text-amber-600">{pendingCount}</span></div>
                <div><span className="text-gray-500">Draft:</span> <span className="font-medium text-gray-600">{draftCount}</span></div>
                <div><span className="text-gray-500">Total Emissions:</span> <span className="font-medium">{emissionsSummary.total.toFixed(4)} tCO2e</span></div>
                <div><span className="text-gray-500">Materiality Topics:</span> <span className="font-medium">{materiality.length}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateHTMLReport(disclosures: DisclosureItem[], emissions: { scope1: number; scope2: number; scope3: number; total: number }, materiality: MaterialityAssessment[]): string {
  const grouped: Record<string, DisclosureItem[]> = {};
  for (const d of disclosures) { (grouped[d.framework] ||= []).push(d); }

  const fwSections = Object.entries(grouped).map(([fw, items]) => `
    <section><h2>${fw} Disclosures</h2><table><thead><tr><th>Indicator</th><th>Value</th><th>Unit</th><th>Source</th></tr></thead><tbody>
    ${items.map(d => `<tr><td>${d.indicator}</td><td>${d.value_numeric?.toFixed(4) || d.value_text || '—'}</td><td>${d.unit || ''}</td><td>${d.source}</td></tr>`).join('')}
    </tbody></table></section>`).join('');

  const matRows = materiality.map(m => `<tr><td>${m.topic}</td><td>${m.impact_score}</td><td>${m.likelihood_score}</td><td>${m.rationale || ''}</td></tr>`).join('');

  return `<!DOCTYPE html><html><head><title>ESG Report — ${new Date().toLocaleDateString()}</title><style>
  body{font-family:Inter,Arial,sans-serif;max-width:900px;margin:0 auto;padding:40px;color:#333}
  h1{color:#4f46e5;border-bottom:2px solid #4f46e5;padding-bottom:10px}
  h2{color:#4f46e5;margin-top:30px}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
  th{background:#f5f5f5}
  .summary{display:flex;gap:20px;margin:20px 0}
  .summary div{flex:1;padding:15px;border-radius:8px;text-align:center}
  </style></head><body>
  <h1>ERTH ESG Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <div class="summary">
  <div style="background:#fef2f2"><strong>Scope 1</strong><br>${emissions.scope1.toFixed(4)} tCO2e</div>
  <div style="background:#fffbeb"><strong>Scope 2</strong><br>${emissions.scope2.toFixed(4)} tCO2e</div>
  <div style="background:#f0fdf4"><strong>Scope 3</strong><br>${emissions.scope3.toFixed(4)} tCO2e</div>
  <div style="background:#eef2ff"><strong>Total</strong><br>${emissions.total.toFixed(4)} tCO2e</div>
  </div>
  ${materiality.length > 0 ? `<section><h2>Materiality Matrix</h2><table><thead><tr><th>Topic</th><th>Impact</th><th>Likelihood</th><th>Rationale</th></tr></thead><tbody>${matRows}</tbody></table></section>` : ''}
  ${fwSections}
  </body></html>`;
}

function generateXMLReport(disclosures: DisclosureItem[]): string {
  const items = disclosures.map(d => `    <Disclosure framework="${d.framework}" indicator="${d.indicator}" source="${d.source}">
      <Value numeric="${d.value_numeric || 0}" unit="${d.unit || ''}">${d.value_numeric?.toFixed(4) || d.value_text || ''}</Value>
      <Status>${d.review_status}</Status>
    </Disclosure>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ESGReport generated="${new Date().toISOString()}">
  <Disclosures>
${items}
  </Disclosures>
</ESGReport>`;
}
