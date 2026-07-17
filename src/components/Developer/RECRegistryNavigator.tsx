import { useState, useMemo, useCallback } from 'react';
import {
  Sun,
  Wind,
  Battery,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  FlaskConical,
  AlertTriangle,
  FileText,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface FormatOneOne {
  project_accreditation_number: string;
  installed_capacity_mw: number;
  metering_point_voltage_kv?: number;
  co_located_bess_capacity_mwh?: number;
  grid_synchronization_date: string;
  ppa_type: string;
}

interface FormC {
  nldc_project_registration_id: string;
  sldc_verified_injection_mwh?: number;
  auxiliary_energy_deduction_mwh?: number;
  raw_solar_generation_mwh?: number;
  energy_routed_to_bess_charging_mwh?: number;
  bess_discharge_to_grid_mwh?: number;
  rte_loss_deduction_mwh?: number;
  expected_net_rec_eligible_quantum: number;
  sldc_approved_eir_reference: string;
}

interface CercConfig {
  target_power_exchange: string;
  client_membership_code: string;
  depository_account_reference: string;
}

interface TestCase {
  id: string;
  icon: 'sun' | 'wind' | 'battery';
  label: string;
  simulation_id: string;
  facility_name: string;
  sldc_jurisdiction: string;
  fuel_type: string;
  formatOneOne: FormatOneOne;
  formC: FormC;
  cerc: CercConfig;
}

const REC_TEST_CASES: Record<string, TestCase> = {
  solar: {
    id: 'solar',
    icon: 'sun',
    label: 'Solar PV — 50 MW, Anantapur (AP)',
    simulation_id: 'TEST-REC-SOLAR-001',
    facility_name: 'Anantapur Clean Green Solar Facility',
    sldc_jurisdiction: 'Andhra Pradesh (APSLDC)',
    fuel_type: 'Solar_PV',
    formatOneOne: {
      project_accreditation_number: 'AP-SDA-SOL-2026-0892',
      installed_capacity_mw: 50.0,
      metering_point_voltage_kv: 132,
      grid_synchronization_date: '2025-10-15',
      ppa_type: 'Third_Party_Open_Access',
    },
    formC: {
      nldc_project_registration_id: 'NLDC-REG-AP-SOL-9912',
      sldc_verified_injection_mwh: 8420.5,
      auxiliary_energy_deduction_mwh: 42.1,
      expected_net_rec_eligible_quantum: 8378,
      sldc_approved_eir_reference: 'EIR-APSLDC-2026-06-892',
    },
    cerc: {
      target_power_exchange: 'IEX',
      client_membership_code: 'IEX-REC-SL-8921',
      depository_account_reference: 'GCIL-DEP-AP-SOL-892',
    },
  },
  wind: {
    id: 'wind',
    icon: 'wind',
    label: 'Wind — 30 MW, Sankari (TN)',
    simulation_id: 'TEST-REC-WIND-002',
    facility_name: 'Sankari Wind Energy Park',
    sldc_jurisdiction: 'Tamil Nadu (TNSLDC)',
    fuel_type: 'Wind_Onshore',
    formatOneOne: {
      project_accreditation_number: 'TN-SDA-WND-2026-0412',
      installed_capacity_mw: 30.0,
      metering_point_voltage_kv: 33,
      grid_synchronization_date: '2025-12-20',
      ppa_type: 'APPC_Preferential_Tariff',
    },
    formC: {
      nldc_project_registration_id: 'NLDC-REG-TN-WND-4412',
      sldc_verified_injection_mwh: 5120.4,
      auxiliary_energy_deduction_mwh: 10.24,
      expected_net_rec_eligible_quantum: 5110,
      sldc_approved_eir_reference: 'EIR-TNSLDC-2026-06-412',
    },
    cerc: {
      target_power_exchange: 'PXIL',
      client_membership_code: 'PXIL-REC-WND-4122',
      depository_account_reference: 'GCIL-DEP-TN-WND-412',
    },
  },
  hybrid: {
    id: 'hybrid',
    icon: 'battery',
    label: 'Hybrid Solar + BESS — 20 MW / 40 MWh, Kurnool (AP)',
    simulation_id: 'TEST-REC-HYBRID-003',
    facility_name: 'Kurnool Hybrid Solar-BESS Storage Plant',
    sldc_jurisdiction: 'Andhra Pradesh (APSLDC)',
    fuel_type: 'Solar_PV_with_Co_Located_BESS',
    formatOneOne: {
      project_accreditation_number: 'AP-SDA-HYB-2026-0951',
      installed_capacity_mw: 20.0,
      co_located_bess_capacity_mwh: 40.0,
      grid_synchronization_date: '2026-01-10',
      ppa_type: 'Bilateral_Virtual_PPA',
    },
    formC: {
      nldc_project_registration_id: 'NLDC-REG-AP-HYB-0951',
      raw_solar_generation_mwh: 3600.0,
      energy_routed_to_bess_charging_mwh: 1200.0,
      bess_discharge_to_grid_mwh: 1020.0,
      rte_loss_deduction_mwh: 180.0,
      expected_net_rec_eligible_quantum: 3420,
      sldc_approved_eir_reference: 'EIR-APSLDC-2026-06-951',
    },
    cerc: {
      target_power_exchange: 'IEX',
      client_membership_code: 'IEX-REC-HYB-0951',
      depository_account_reference: 'GCIL-DEP-AP-HYB-951',
    },
  },
};

const PLANT_ICONS = { sun: Sun, wind: Wind, battery: Battery };
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function demoChecksum(obj: unknown): string {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return `DEMO_${Math.abs(h).toString(16).toUpperCase()}`;
}

function getMockTestCase(plantType: string): TestCase {
  const tc = REC_TEST_CASES[plantType];
  if (!tc) {
    throw new Error(
      `Unknown plant type "${plantType}". Expected one of: ${Object.keys(
        REC_TEST_CASES
      ).join(', ')}`
    );
  }
  return tc;
}

function computeNetEligibleQuantum(testCase: TestCase): number {
  const f = testCase.formC;
  if (testCase.id === 'hybrid') {
    const net =
      (f.raw_solar_generation_mwh ?? 0) -
      (f.energy_routed_to_bess_charging_mwh ?? 0) +
      (f.bess_discharge_to_grid_mwh ?? 0);
    return Math.floor(net);
  }
  return Math.floor(
    (f.sldc_verified_injection_mwh ?? 0) -
      (f.auxiliary_energy_deduction_mwh ?? 0)
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PipelineStep {
  step: string;
  status: string;
  [key: string]: unknown;
}

interface PipelineResult {
  testCase: TestCase;
  trail: PipelineStep[];
  finalWallet: { recs: number; serial: string };
}

class RECAutomationEngine {
  simulateFailureAt: string | null;
  latencyMs: number;

  constructor({
    simulateFailureAt = null,
    latencyMs = 260,
  }: {
    simulateFailureAt?: string | null;
    latencyMs?: number;
  } = {}) {
    this.simulateFailureAt = simulateFailureAt;
    this.latencyMs = latencyMs;
  }

  async _maybeFail(stepName: string): Promise<void> {
    await delay(this.latencyMs);
    if (this.simulateFailureAt === stepName) {
      throw new Error(
        `Simulated outage at step "${stepName}" — endpoint unreachable or returned non-2xx.`
      );
    }
  }

  async submitFormatOneOne(testCase: TestCase): Promise<PipelineStep> {
    await this._maybeFail('formatOneOne');
    return {
      step: 'Format 1.1 — State Accreditation',
      status: 'ACCREDITED',
      project_accreditation_number:
        testCase.formatOneOne.project_accreditation_number,
    };
  }

  async fetchSLDCEIR(
    testCase: TestCase,
    billingMonth: string
  ): Promise<PipelineStep> {
    if (!MONTH_RE.test(billingMonth)) {
      throw new Error(
        `Invalid billing month "${billingMonth}". Expected format YYYY-MM.`
      );
    }
    await this._maybeFail('eir');
    return {
      step: 'Form-EIR — Energy Injection Report',
      status: 'APPROVED',
      billing_month: billingMonth,
      eir_reference: testCase.formC.sldc_approved_eir_reference,
    };
  }

  async submitNLDCFormB(testCase: TestCase): Promise<PipelineStep> {
    await this._maybeFail('formB');
    const payload = {
      project_accreditation_number:
        testCase.formatOneOne.project_accreditation_number,
      nldc_project_registration_id: testCase.formC.nldc_project_registration_id,
    };
    return {
      step: 'Form-B — National Project Registration',
      status: 'REGISTERED',
      registration_id: testCase.formC.nldc_project_registration_id,
      dmrv_hash: demoChecksum(payload),
    };
  }

  async submitNLDCFormC(
    testCase: TestCase,
    registrationId: string
  ): Promise<PipelineStep> {
    await this._maybeFail('formC');
    const quantum = computeNetEligibleQuantum(testCase);
    const serial = `REC-2026-06-${registrationId}-0001/${quantum}`;
    return {
      step: 'Form-C — REC Issuance',
      status: 'ISSUED',
      recs_issued: quantum,
      serial_range: serial,
      dmrv_verification: {
        payload_hash: demoChecksum(testCase.formC),
        status: 'DEMO_CHECKSUM_ONLY_NOT_A_CRYPTOGRAPHIC_ATTESTATION',
      },
    };
  }

  async submitCERCMembership(testCase: TestCase): Promise<PipelineStep> {
    await this._maybeFail('cerc');
    return {
      step: 'Format PX-REC — Exchange Membership',
      status: 'ACTIVE',
      exchange: testCase.cerc.target_power_exchange,
      client_code: testCase.cerc.client_membership_code,
      depository_account: testCase.cerc.depository_account_reference,
    };
  }

  async runFullPipeline(
    plantType: string,
    billingMonth: string
  ): Promise<PipelineResult> {
    const testCase = getMockTestCase(plantType);
    const trail: PipelineStep[] = [];

    const acc = await this.submitFormatOneOne(testCase);
    trail.push(acc);

    const eir = await this.fetchSLDCEIR(testCase, billingMonth);
    trail.push(eir);

    const formB = await this.submitNLDCFormB(testCase);
    trail.push(formB);

    const formC = await this.submitNLDCFormC(
      testCase,
      (formB.registration_id as string) ?? ''
    );
    trail.push(formC);

    const cerc = await this.submitCERCMembership(testCase);
    trail.push(cerc);

    return {
      testCase,
      trail,
      finalWallet: {
        recs: (formC.recs_issued as number) ?? 0,
        serial: (formC.serial_range as string) ?? '',
      },
    };
  }
}

interface RegressionResult {
  plantType: string;
  expected: number | null;
  actual: number | null;
  pass: boolean;
  serial?: string;
  error?: string;
}

async function runRegressionSuite(): Promise<RegressionResult[]> {
  const engine = new RECAutomationEngine({ latencyMs: 0 });
  const results: RegressionResult[] = [];
  for (const plantType of Object.keys(REC_TEST_CASES)) {
    const testCase = REC_TEST_CASES[plantType];
    try {
      const { finalWallet } = await engine.runFullPipeline(plantType, '2026-06');
      const expected = testCase.formC.expected_net_rec_eligible_quantum;
      results.push({
        plantType,
        expected,
        actual: finalWallet.recs,
        pass: finalWallet.recs === expected,
        serial: finalWallet.serial,
      });
    } catch (err) {
      results.push({
        plantType,
        expected: null,
        actual: null,
        pass: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

function buildLocalSummary(result: PipelineResult): string {
  const tc = result.testCase;
  const recs = result.finalWallet.recs.toLocaleString();
  const exchange = result.trail.find((s) => s.exchange)?.exchange ?? 'N/A';
  const stepsOk = result.trail.every((s) =>
    ['ACCREDITED', 'APPROVED', 'REGISTERED', 'ISSUED', 'ACTIVE'].includes(
      s.status
    )
  );
  const statusLine = stepsOk
    ? 'All five registration stages completed successfully.'
    : 'One or more stages did not complete — review the trail above.';
  return `${tc.facility_name} (${tc.fuel_type}, ${tc.sldc_jurisdiction}) has been processed through the full REC pipeline. ${statusLine} A total of ${recs} RECs were issued under serial ${result.finalWallet.serial}, and the project is now onboarded for trading on the ${exchange} exchange. Submit the generated Form-B and Form-C artifacts to the NLDC REC registry portal to finalize this batch.`;
}

export default function RECRegistryNavigator() {
  const [plantType, setPlantType] = useState('');
  const [billingMonth, setBillingMonth] = useState('2026-06');
  const [simulateFailureAt, setSimulateFailureAt] = useState('');
  const [running, setRunning] = useState(false);
  const [pipelineResult, setPipelineResult] =
    useState<PipelineResult | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [regressionResults, setRegressionResults] = useState<
    RegressionResult[] | null
  >(null);
  const [regressionRunning, setRegressionRunning] = useState(false);

  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const monthValid = MONTH_RE.test(billingMonth);
  const canRun = Boolean(plantType) && monthValid && !running;

  const handleRunPipeline = useCallback(async () => {
    setPipelineError(null);
    setPipelineResult(null);
    setAiSummary('');

    if (!plantType) {
      setPipelineError(
        'Select a plant / test case before running the pipeline.'
      );
      return;
    }
    if (!monthValid) {
      setPipelineError(
        'Billing month must be in YYYY-MM format (e.g. 2026-06).'
      );
      return;
    }

    setRunning(true);
    try {
      const engine = new RECAutomationEngine({
        simulateFailureAt: simulateFailureAt || null,
        latencyMs: 260,
      });
      const result = await engine.runFullPipeline(plantType, billingMonth);
      setPipelineResult(result);
    } catch (err) {
      setPipelineError(
        err instanceof Error ? err.message : 'Unknown pipeline error.'
      );
    } finally {
      setRunning(false);
    }
  }, [plantType, billingMonth, monthValid, simulateFailureAt]);

  const handleRunRegression = useCallback(async () => {
    setRegressionRunning(true);
    setRegressionResults(null);
    try {
      const results = await runRegressionSuite();
      setRegressionResults(results);
    } catch (err) {
      setRegressionResults([
        {
          plantType: 'suite',
          expected: null,
          actual: null,
          pass: false,
          error: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setRegressionRunning(false);
    }
  }, []);

  const handleGenerateAISummary = useCallback(async () => {
    if (!pipelineResult) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      await delay(300);
      setAiSummary(buildLocalSummary(pipelineResult));
    } catch (err) {
      setPipelineError(
        err instanceof Error ? err.message : 'Unknown error generating summary.'
      );
    } finally {
      setAiLoading(false);
    }
  }, [pipelineResult]);

  const stepFailureOptions = ['', 'formatOneOne', 'eir', 'formB', 'formC', 'cerc'];

  const testCaseList = useMemo(() => Object.values(REC_TEST_CASES), []);

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased rounded-xl overflow-hidden">
      <div className="p-4 md:p-8">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" /> AI-Assisted Registry Navigator —
            Demo Build
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FileText className="text-emerald-500 w-7 h-7" />
            REC Form Filler — India (SLDC → NLDC → CERC Exchange)
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl mt-2">
            Walks a plant through Format&nbsp;1.1 accreditation, the Energy
            Injection Report, Form‑B / Form‑C at the National REC Registry, and
            CERC exchange onboarding. This is a self-contained simulation — no
            live government or exchange endpoints are called.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
                1. Select Test Case
              </h2>
              <div className="space-y-2">
                {testCaseList.map((tc) => {
                  const Icon = PLANT_ICONS[tc.icon];
                  const active = plantType === tc.id;
                  return (
                    <button
                      key={tc.id}
                      onClick={() => {
                        setPlantType(tc.id);
                        setSimulateFailureAt('');
                        setPipelineError(null);
                        setPipelineResult(null);
                      }}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-mono">{tc.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-1">
                <label className="block text-xs font-mono text-slate-500">
                  Billing Month (YYYY-MM)
                </label>
                <input
                  type="text"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  placeholder="2026-06"
                  className={`w-full bg-slate-950 border rounded-lg p-2 text-sm font-mono focus:outline-none ${
                    monthValid
                      ? 'border-slate-800 text-slate-200 focus:border-emerald-500'
                      : 'border-red-600 text-red-300'
                  }`}
                />
                {!monthValid && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Must match YYYY-MM
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-1">
                <label className="block text-xs font-mono text-slate-500">
                  Error-handling test: simulate a failure at
                </label>
                <select
                  value={simulateFailureAt}
                  onChange={(e) => setSimulateFailureAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-yellow-500"
                >
                  {stepFailureOptions.map((s) => (
                    <option key={s} value={s}>
                      {s ? s : 'No simulated failure'}
                    </option>
                  ))}
                </select>
              </div>

              {simulateFailureAt && (
                <div className="mt-3 flex items-center justify-between gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-[11px] p-2 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Failure
                    simulation is ON for step "{simulateFailureAt}" — the
                    pipeline will intentionally fail there.
                  </span>
                  <button
                    onClick={() => setSimulateFailureAt('')}
                    className="underline underline-offset-2 shrink-0"
                  >
                    Clear
                  </button>
                </div>
              )}

              <button
                onClick={handleRunPipeline}
                disabled={!canRun}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold py-2.5 rounded-lg transition"
              >
                {running ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {running ? 'Running pipeline…' : 'Run REC Pipeline'}
              </button>

              {pipelineError && (
                <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2.5 rounded-lg">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Pipeline error</div>
                    <div className="font-mono">{pipelineError}</div>
                    <button
                      onClick={handleRunPipeline}
                      className="mt-1.5 flex items-center gap-1 text-red-200 underline underline-offset-2"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-400" /> Regression
                Suite
              </h2>
              <p className="text-[11px] text-slate-500 mb-3">
                Recomputes net REC-eligible quantum for all 3 plant types and
                checks it against the spec's stated values (8,378 / 5,110 /
                3,420).
              </p>
              <button
                onClick={handleRunRegression}
                disabled={regressionRunning}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold py-2 rounded-lg transition"
              >
                {regressionRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FlaskConical className="w-3.5 h-3.5" />
                )}
                {regressionRunning ? 'Running…' : 'Run Regression Suite'}
              </button>

              {regressionResults && (
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  {regressionResults.map((r) => (
                    <div
                      key={r.plantType}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded px-2 py-1.5"
                    >
                      <span className="text-slate-400">{r.plantType}</span>
                      {r.pass ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS ({r.actual})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> FAIL{' '}
                          {r.error
                            ? `(${r.error})`
                            : `(got ${r.actual}, expected ${r.expected})`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-400" /> Security Notes
              </h2>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li className="flex gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{' '}
                  No API keys or credentials are hardcoded anywhere in this demo.
                </li>
                <li className="flex gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />{' '}
                  All "hashes" are non-cryptographic demo checksums — never real
                  HSM/ATECC608A attestations.
                </li>
                <li className="flex gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{' '}
                  Billing month is regex-validated before use; no free-text is
                  sent unchecked to any step.
                </li>
                <li className="flex gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{' '}
                  No browser storage (localStorage/sessionStorage) is used —
                  state lives in memory only.
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {!pipelineResult && !running && (
              <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-10 text-center text-slate-500 text-sm">
                Select a plant, pick a billing month, and run the pipeline to see
                forms populate here.
              </div>
            )}

            {pipelineResult && (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white">
                      {pipelineResult.testCase.facility_name}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pipelineResult.testCase.simulation_id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-400 mb-4">
                    <div>
                      <span className="block text-slate-600">Fuel</span>
                      {pipelineResult.testCase.fuel_type}
                    </div>
                    <div>
                      <span className="block text-slate-600">Jurisdiction</span>
                      {pipelineResult.testCase.sldc_jurisdiction}
                    </div>
                    <div>
                      <span className="block text-slate-600">RECs Issued</span>
                      <span className="text-emerald-400 font-bold">
                        {pipelineResult.finalWallet.recs.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-600">Serial Range</span>
                      {pipelineResult.finalWallet.serial}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pipelineResult.trail.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs font-mono text-slate-300">
                          {s.step}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" /> AI
                      Compliance Summary
                    </h2>
                    <button
                      onClick={handleGenerateAISummary}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 text-xs font-mono bg-purple-600/80 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      {aiLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {aiLoading ? 'Generating…' : 'Generate'}
                    </button>
                  </div>

                  {aiSummary && (
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {aiSummary}
                    </p>
                  )}

                  {!aiSummary && !aiLoading && (
                    <p className="text-xs text-slate-500">
                      Click "Generate" for a plain-English readiness summary of
                      the pipeline above.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
