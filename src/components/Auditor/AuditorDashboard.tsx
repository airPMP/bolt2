import { useState } from 'react';
import {
  Circle,
  Leaf,
  ShieldCheck,
  FileCheck,
  Wallet,
  ArrowLeftRight,
  Cpu,
  ChevronRight,
  FlaskConical,
  Globe,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { INDUSTRIES } from '../../data/industries';
import { REGISTRIES } from '../../data/registries';
import { METHODOLOGIES } from '../../data/methodologies';
import { GREEN_CLUBS } from '../../data/clubs';

import {
  fetchBoQ,
  submitToRegistry,
  walletMint,
  walletSell,
  type BoQResponse,
  type RegistrySubmitResponse,
  type WalletMintResponse,
  type WalletSellResponse,
} from '../../lib/api';
import WorkerPipeline, { usePipelineRunner } from '../Shared/WorkerPipeline';
import { useAuth } from '../../contexts/AuthContext';

type TokenType = 'black' | 'green';
type Phase = 'pdd' | 'monitoring';

interface WizardState {
  tokenType: TokenType | null;
  industry: string;
  club: string;
  methodology: string;
  scopeLevel: 'scope1' | 'scope2' | 'scope3';
  registry: string;
  country: string;
  phase: Phase;
  boq: BoQResponse | null;
  registryResult: RegistrySubmitResponse | null;
  mintResult: WalletMintResponse | null;
  sellResult: WalletSellResponse | null;
  error: string;
  loading: string | null;
}

const INITIAL_STATE: WizardState = {
  tokenType: null,
  industry: '',
  club: '',
  methodology: '',
  scopeLevel: 'scope1',
  registry: '',
  country: 'India',
  phase: 'pdd',
  boq: null,
  registryResult: null,
  mintResult: null,
  sellResult: null,
  error: '',
  loading: null,
};

const WIZARD_STEPS = [
  { id: 'token', label: 'Token Type', icon: Circle },
  { id: 'scope', label: 'Scope & Methodology', icon: FlaskConical },
  { id: 'registry', label: 'Registry', icon: Globe },
  { id: 'boq', label: 'Sensor BoQ', icon: Cpu },
  { id: 'pipeline', label: 'dMRV Pipeline', icon: ShieldCheck },
];

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [step, setStep] = useState(0);
  const [quantity, setQuantity] = useState('100');
  const { stages, running, run } = usePipelineRunner();

  const update = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch, error: '' }));

  const applicableMethodologies = METHODOLOGIES.filter((m) => {
    if (!state.tokenType) return false;
    if (m.tokenType !== state.tokenType) return false;
    if (state.tokenType === 'black') {
      return m.applicable_sectors.includes('all') || m.applicable_sectors.includes(state.industry);
    }
    if (state.club) {
      const club = GREEN_CLUBS.find((c) => c.id === state.club);
      return club?.methodologies.includes(m.id);
    }
    return true;
  });

  const availableRegistries =
    state.tokenType === 'green' && state.club
      ? REGISTRIES.filter((r) => GREEN_CLUBS.find((c) => c.id === state.club)?.registries.includes(r.id))
      : REGISTRIES;

  async function handleGenerateBoQ() {
    update({ loading: 'boq' });
    try {
      const result = await fetchBoQ({
        industry: state.tokenType === 'black' ? state.industry : undefined,
        club: state.tokenType === 'green' ? state.club : undefined,
        methodology: state.methodology,
        scopeLevel: state.scopeLevel,
        phase: state.phase,
      });
      update({ boq: result });
    } catch (err) {
      update({ error: err instanceof Error ? err.message : 'BoQ generation failed' });
    } finally {
      update({ loading: null });
    }
  }

  async function handleRunPipeline() {
    update({ loading: 'pipeline', error: '' });
    try {
      await run(async (key) => {
        if (key === 'registry') {
          const result = await submitToRegistry({
            registry: state.registry,
            projectId: 'AUDIT-' + Date.now(),
            methodology: state.methodology,
            phase: state.phase,
            tokenType: state.tokenType!,
            merkleRoot: state.boq?.samplePayload.merkle_root,
            hsmSignature: state.boq?.samplePayload.hsm_signature,
          });
          update({ registryResult: result });
          return result.credit_unit;
        }
        if (key === 'custody') {
          const reg = REGISTRIES.find((r) => r.id === state.registry);
          const result = await walletMint({
            seller: user?.id ?? 'producer-001',
            quantity: parseFloat(quantity),
            registry: state.registry,
            creditUnit: reg?.credit_unit ?? 'CCC',
          });
          update({ mintResult: result });
          return `${result.quantity} ${result.credit_unit}`;
        }
        if (key === 'exchange') {
          const reg = REGISTRIES.find((r) => r.id === state.registry);
          const result = await walletSell({
            seller: user?.id ?? 'producer-001',
            buyer: 'buyer-001',
            quantity: parseFloat(quantity),
            registry: state.registry,
            creditUnit: reg?.credit_unit ?? 'CCC',
          });
          update({ sellResult: result });
          return result.trade_ref;
        }
        return undefined;
      });
    } catch (err) {
      update({ error: err instanceof Error ? err.message : 'Pipeline failed' });
    } finally {
      update({ loading: null });
    }
  }

  function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canProceedFromScope =
    state.tokenType === 'black'
      ? !!state.industry && !!state.methodology
      : !!state.club && !!state.methodology;
  const canProceedFromRegistry = !!state.registry;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Auditor Dashboard</h1>
        <p className="text-gray-600">
          Black Token emission compliance &amp; Green Token carbon credit issuance — methodology to wallet settlement
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === i;
          const done = step > i;
          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
              {i < WIZARD_STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
            </div>
          );
        })}
      </div>

      {state.error && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{state.error}</span>
        </div>
      )}

      {/* Step 0: Token Type */}
      {step === 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => { update({ tokenType: 'black', industry: '', methodology: '', club: '' }); setStep(1); }}
            className="bg-white rounded-xl shadow-lg p-8 text-left hover:shadow-2xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-slate-900"
          >
            <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Black Token</h3>
            <p className="text-gray-600 mb-4">Emission compliance for GEI-obligated sectors (Cement, Steel, Aluminium, Power, Chlor-Alkali, Pulp &amp; Paper)</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.slice(0, 4).map((i) => (
                <span key={i.id} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{i.name}</span>
              ))}
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">+2 more</span>
            </div>
          </button>

          <button
            onClick={() => { update({ tokenType: 'green', club: '', methodology: '', industry: '' }); setStep(1); }}
            className="bg-white rounded-xl shadow-lg p-8 text-left hover:shadow-2xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-emerald-600"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center mb-4">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Green Token</h3>
            <p className="text-gray-600 mb-4">Carbon credits &amp; RECs from removal/avoidance projects (RE+BESS, NbS, Biochar, Community)</p>
            <div className="flex flex-wrap gap-2">
              {GREEN_CLUBS.map((c) => (
                <span key={c.id} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">{c.name}</span>
              ))}
            </div>
          </button>
        </div>
      )}

      {/* Step 1: Scope & Methodology */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {state.tokenType === 'black' ? 'Industry & Methodology' : 'Club & Methodology'}
          </h2>

          {state.tokenType === 'black' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry (GEI Obligated Sector)</label>
                <select value={state.industry} onChange={(e) => update({ industry: e.target.value, methodology: '' })} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scope Level</label>
                <div className="flex gap-2">
                  {(['scope1', 'scope2', 'scope3'] as const).map((sc) => (
                    <button key={sc} onClick={() => update({ scopeLevel: sc })} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${state.scopeLevel === sc ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {sc.replace('scope', 'Scope ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Green Token Club</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {GREEN_CLUBS.map((c) => (
                  <button key={c.id} onClick={() => update({ club: c.id, methodology: '' })} className={`p-4 rounded-lg border-2 text-left transition-colors ${state.club === c.id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label>
            <select value={state.methodology} onChange={(e) => update({ methodology: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" disabled={applicableMethodologies.length === 0}>
              <option value="">Select Methodology</option>
              {applicableMethodologies.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {state.methodology && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-mono text-gray-500">Formula: </span>
                <span className="text-xs font-mono text-gray-700">{METHODOLOGIES.find((m) => m.id === state.methodology)?.formula}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
            <div className="flex gap-2">
              {(['pdd', 'monitoring'] as const).map((p) => (
                <button key={p} onClick={() => update({ phase: p })} className={`px-4 py-2 rounded-lg text-sm font-medium uppercase ${state.phase === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {p === 'pdd' ? 'PDD / Validation' : 'Monitoring / Issuance'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input value={state.country} onChange={(e) => update({ country: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(0)} className="px-4 py-2 text-gray-600 hover:text-gray-900">← Back</button>
            <button onClick={() => setStep(2)} disabled={!canProceedFromScope} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              Next: Select Registry →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Registry */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Registry</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {availableRegistries.map((r) => (
              <button key={r.id} onClick={() => update({ registry: r.id })} className={`p-4 rounded-lg border-2 text-left transition-colors ${state.registry === r.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{r.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'compliance' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.type}</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">Credit: {r.credit_unit} · Custody: {r.wallet}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-1 truncate">{r.api_endpoint}</div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:text-gray-900">← Back</button>
            <button onClick={() => setStep(3)} disabled={!canProceedFromRegistry} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              Next: Generate BoQ →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: BoQ */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Sensor Bill of Quantities</h2>
              <button onClick={handleGenerateBoQ} disabled={state.loading === 'boq'} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium flex items-center gap-2">
                {state.loading === 'boq' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                Generate {state.phase === 'pdd' ? 'PDD' : 'Monitoring'} BoQ
              </button>
            </div>

            {state.boq && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4">Sensor ID</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Scope</th>
                        <th className="py-2 pr-4">Unit</th>
                        <th className="py-2 pr-4 text-right">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.boq.boq.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-mono text-xs">{item.id}</td>
                          <td className="py-2 pr-4">{item.name}</td>
                          <td className="py-2 pr-4"><span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{item.scope}</span></td>
                          <td className="py-2 pr-4 font-mono text-xs">{item.unit}</td>
                          <td className="py-2 pr-4 text-right font-medium">₹{item.unitPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={4} className="py-3 text-right">Total</td>
                        <td className="py-3 text-right text-lg">₹{state.boq.boq.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Sample Gateway Payload (dMRV)</h3>
                    <button onClick={() => downloadJson(state.boq!.samplePayload, 'sample-payload.json')} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700">
                      <Download className="w-3 h-3" /> Download JSON
                    </button>
                  </div>
                  <pre className="bg-slate-950 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(state.boq.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-600 hover:text-gray-900">← Back</button>
            <button onClick={() => setStep(4)} disabled={!state.boq} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              Next: Run dMRV Pipeline →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Pipeline */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">End-to-End dMRV Pipeline</h2>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Credit Quantity</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <button onClick={handleRunPipeline} disabled={running || state.loading === 'pipeline'} className="self-end px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center gap-2">
                  {running || state.loading === 'pipeline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {running ? 'Running...' : 'Run Full Pipeline'}
                </button>
              </div>
            </div>

            <WorkerPipeline stages={stages} />

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Pipeline stages:</span> Sensor data → HSM signature → Merkle root → NFT mint (Polygon) → Registry issuance → Wallet custody → Exchange trade (IEX/NSDL) → Buyer wallet settlement
            </div>
          </div>

          {/* Results */}
          {(state.registryResult || state.mintResult || state.sellResult) && (
            <div className="grid md:grid-cols-3 gap-4">
              {state.registryResult && (
                <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">Registry Issuance</h3>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Registry</dt><dd className="font-medium">{state.registryResult.registry}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-medium"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">{state.registryResult.status}</span></dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Credit Unit</dt><dd className="font-medium">{state.registryResult.credit_unit}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Custody</dt><dd className="font-medium">{state.registryResult.wallet_provider}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Tx Hash</dt><dd className="font-mono text-xs truncate max-w-[120px]">{state.registryResult.tx_hash}</dd></div>
                  </dl>
                </div>
              )}
              {state.mintResult && (
                <div className="bg-white rounded-xl shadow p-5 border-l-4 border-emerald-500">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-semibold text-gray-900">Wallet Custody (Mint)</h3>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-medium"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">{state.mintResult.status}</span></dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Quantity</dt><dd className="font-medium">{state.mintResult.quantity} {state.mintResult.credit_unit}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Registry</dt><dd className="font-medium">{state.mintResult.registry}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Tx Hash</dt><dd className="font-mono text-xs truncate max-w-[120px]">{state.mintResult.tx_hash}</dd></div>
                  </dl>
                </div>
              )}
              {state.sellResult && (
                <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowLeftRight className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Exchange Settlement</h3>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Exchange</dt><dd className="font-medium">{state.sellResult.exchange}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Trade Ref</dt><dd className="font-mono text-xs">{state.sellResult.trade_ref}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-medium"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">{state.sellResult.status}</span></dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Transferred</dt><dd className="font-medium">{state.sellResult.ccc_transferred} {state.sellResult.credit_unit}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Settlement</dt><dd className="font-medium">₹{state.sellResult.settlement_total.toLocaleString()}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          )}

          {/* Full JSON output */}
          {(state.registryResult || state.mintResult || state.sellResult) && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Full Pipeline Output (JSON)</h3>
                <button
                  onClick={() => downloadJson({ registry: state.registryResult, mint: state.mintResult, sell: state.sellResult }, 'pipeline-result.json')}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto">
                {JSON.stringify({ registry: state.registryResult, mint: state.mintResult, sell: state.sellResult }, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="px-4 py-2 text-gray-600 hover:text-gray-900">← Back</button>
            <button
              onClick={() => { setState(INITIAL_STATE); setStep(0); }}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
            >
              Start New Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
