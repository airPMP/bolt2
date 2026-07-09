import { useState, useMemo } from 'react';
import {
  Calculator,
  Plane,
  Factory,
  Leaf,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Info,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

type CalculationTab = 'corsia' | 'cbam' | 'biochar' | 'pnl' | 'methodology';

interface CORSIAInputs {
  safProduction: number;
  safEnergyContent: number;
  safLifecycleGHG: number;
  fossilJetBaseline: number;
  corsiaCreditPrice: number;
}

interface CBAMInputs {
  syngasVolume: number;
  syngasCO2Content: number;
  parasiticElectricity: number;
  gridEmissionFactor: number;
  etsPrice: number;
}

interface BiocharInputs {
  biocharMass: number;
  fixedCarbonPct: number;
  moisturePct: number;
  pyrolysisTemp: number;
  residenceTime: number;
  parasiticEnergy: number;
  transportDistance: number;
  permanenceFactor: number;
  corcPrice: number;
}

interface PnLInputs {
  safProduction: number;
  safPrice: number;
  renewableDieselProduction: number;
  renewableDieselPrice: number;
  naphthaProduction: number;
  naphthaPrice: number;
  bioCNGProduction: number;
  bioCNGPrice: number;
  bioBitumenProduction: number;
  bioBitumenPrice: number;
  driSyngasVolume: number;
  driSyngasPrice: number;
  biocharCredits: number;
  biocharCreditPrice: number;
  corsiaCredits: number;
  corsiaPrice: number;
  feedstockConsumption: number;
  feedstockCost: number;
  gridElectricity: number;
  gridElectricityPrice: number;
  omCost: number;
  depreciation: number;
  interestExpense: number;
  dmrvSubscription: number;
  isccCertification: number;
  logisticsCost: number;
  totalCapex: number;
  usdInrRate: number;
}

const defaultCORSIA: CORSIAInputs = {
  safProduction: 480,
  safEnergyContent: 43,
  safLifecycleGHG: 3.86,
  fossilJetBaseline: 89,
  corsiaCreditPrice: 75
};

const defaultCBAM: CBAMInputs = {
  syngasVolume: 7800000,
  syngasCO2Content: 0.286,
  parasiticElectricity: 1000,
  gridEmissionFactor: 0.82,
  etsPrice: 80
};

const defaultBiochar: BiocharInputs = {
  biocharMass: 25000,
  fixedCarbonPct: 78.4,
  moisturePct: 8.5,
  pyrolysisTemp: 685,
  residenceTime: 24.5,
  parasiticEnergy: 42500,
  transportDistance: 150,
  permanenceFactor: 0.915,
  corcPrice: 150
};

const defaultPnL: PnLInputs = {
  safProduction: 480,
  safPrice: 110000,
  renewableDieselProduction: 3000,
  renewableDieselPrice: 70000,
  naphthaProduction: 1000,
  naphthaPrice: 45000,
  bioCNGProduction: 2000,
  bioCNGPrice: 46000,
  bioBitumenProduction: 4000,
  bioBitumenPrice: 35000,
  driSyngasVolume: 7800000,
  driSyngasPrice: 12,
  biocharCredits: 25000,
  biocharCreditPrice: 90,
  corsiaCredits: 818,
  corsiaPrice: 75,
  feedstockConsumption: 90000,
  feedstockCost: 2500,
  gridElectricity: 1000,
  gridElectricityPrice: 6000,
  omCost: 250000000,
  depreciation: 180000000,
  interestExpense: 120000000,
  dmrvSubscription: 5000000,
  isccCertification: 2500000,
  logisticsCost: 150000000,
  totalCapex: 3550000000,
  usdInrRate: 83
};

export default function GHGCalculator() {
  const [activeTab, setActiveTab] = useState<CalculationTab>('corsia');
  const [corsiaInputs, setCORSIAInputs] = useState<CORSIAInputs>(defaultCORSIA);
  const [cbamInputs, setCBAMInputs] = useState<CBAMInputs>(defaultCBAM);
  const [biocharInputs, setBiocharInputs] = useState<BiocharInputs>(defaultBiochar);
  const [pnlInputs, setPnLInputs] = useState<PnLInputs>(defaultPnL);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    assumptions: true,
    methodology: true
  });

  const corsiaResults = useMemo(() => {
    const totalEnergy = corsiaInputs.safProduction * 1000 * corsiaInputs.safEnergyContent;
    const ghgReduction = (corsiaInputs.fossilJetBaseline - corsiaInputs.safLifecycleGHG) / 1000;
    const totalCredits = totalEnergy * ghgReduction;
    const revenueUsd = totalCredits * corsiaInputs.corsiaCreditPrice;
    const revenueInr = revenueUsd * pnlInputs.usdInrRate;
    const reductionPct = ((corsiaInputs.fossilJetBaseline - corsiaInputs.safLifecycleGHG) / corsiaInputs.fossilJetBaseline) * 100;

    return {
      totalEnergy,
      ghgReduction,
      totalCredits,
      revenueUsd,
      revenueInr,
      reductionPct
    };
  }, [corsiaInputs, pnlInputs.usdInrRate]);

  const cbamResults = useMemo(() => {
    const directEmissions = 0;
    const indirectEmissions = cbamInputs.parasiticElectricity * cbamInputs.gridEmissionFactor;
    const totalEmissions = directEmissions + indirectEmissions;
    const see = totalEmissions / (cbamInputs.syngasVolume / 1e6);
    const cbamDuty = cbamInputs.syngasVolume * 0.000286 * cbamInputs.etsPrice;
    const transitionalRelief = cbamDuty * 0.5;

    return {
      directEmissions,
      indirectEmissions,
      totalEmissions,
      see,
      cbamDuty,
      transitionalRelief
    };
  }, [cbamInputs]);

  const biocharResults = useMemo(() => {
    const dryMass = biocharInputs.biocharMass * (1 - biocharInputs.moisturePct / 100);
    const carbonSequestered = dryMass * (biocharInputs.fixedCarbonPct / 100);
    const grossCDR = carbonSequestered * (44 / 12);
    const processEmissions = biocharInputs.parasiticEnergy * 0.00082;
    const transportEmissions = biocharInputs.transportDistance * dryMass * 0.0001;
    const netCDR = grossCDR - processEmissions - transportEmissions;
    const permanenceAdjusted = netCDR * biocharInputs.permanenceFactor;
    const revenueUsd = permanenceAdjusted * biocharInputs.corcPrice;
    const revenueInr = revenueUsd * pnlInputs.usdInrRate;

    return {
      dryMass,
      carbonSequestered,
      grossCDR,
      processEmissions,
      transportEmissions,
      netCDR,
      permanenceAdjusted,
      revenueUsd,
      revenueInr
    };
  }, [biocharInputs, pnlInputs.usdInrRate]);

  const pnlResults = useMemo(() => {
    const safRevenue = pnlInputs.safProduction * pnlInputs.safPrice;
    const rdRevenue = pnlInputs.renewableDieselProduction * pnlInputs.renewableDieselPrice;
    const naphthaRevenue = pnlInputs.naphthaProduction * pnlInputs.naphthaPrice;
    const bioCNGRevenue = pnlInputs.bioCNGProduction * pnlInputs.bioCNGPrice;
    const bioBitumenRevenue = pnlInputs.bioBitumenProduction * pnlInputs.bioBitumenPrice;
    const driRevenue = pnlInputs.driSyngasVolume * pnlInputs.driSyngasPrice;
    const biocharCreditRevenue = pnlInputs.biocharCredits * pnlInputs.biocharCreditPrice * pnlInputs.usdInrRate;
    const corsiaRevenue = pnlInputs.corsiaCredits * pnlInputs.corsiaPrice * pnlInputs.usdInrRate;

    const totalRevenue = safRevenue + rdRevenue + naphthaRevenue + bioCNGRevenue + bioBitumenRevenue + driRevenue + biocharCreditRevenue + corsiaRevenue;

    const feedstockCost = pnlInputs.feedstockConsumption * pnlInputs.feedstockCost;
    const electricityCost = pnlInputs.gridElectricity * pnlInputs.gridElectricityPrice;
    const totalCOGS = feedstockCost + electricityCost + pnlInputs.omCost + pnlInputs.depreciation + pnlInputs.interestExpense + pnlInputs.dmrvSubscription + pnlInputs.isccCertification + pnlInputs.logisticsCost;

    const ebitda = totalRevenue - totalCOGS;
    const tax = ebitda > 0 ? ebitda * 0.25 : 0;
    const netProfit = ebitda - tax;
    const paybackYears = pnlInputs.totalCapex / netProfit;

    return {
      safRevenue,
      rdRevenue,
      naphthaRevenue,
      bioCNGRevenue,
      bioBitumenRevenue,
      driRevenue,
      biocharCreditRevenue,
      corsiaRevenue,
      totalRevenue,
      feedstockCost,
      electricityCost,
      totalCOGS,
      ebitda,
      tax,
      netProfit,
      paybackYears
    };
  }, [pnlInputs]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const exportToCSV = () => {
    const data = [
      ['CORSIA SAF Calculator'],
      ['Parameter', 'Value', 'Unit'],
      ['SAF Production', corsiaInputs.safProduction, 'tonnes/year'],
      ['SAF Energy Content', corsiaInputs.safEnergyContent, 'MJ/kg'],
      ['SAF Lifecycle GHG', corsiaInputs.safLifecycleGHG, 'gCO2e/MJ'],
      ['CORSIA Credits', corsiaResults.totalCredits.toFixed(2), 'tCO2e/year'],
      ['CORSIA Revenue', corsiaResults.revenueUsd.toFixed(2), 'USD/year'],
      [''],
      ['CBAM Calculator'],
      ['Parameter', 'Value', 'Unit'],
      ['Syngas Volume', cbamInputs.syngasVolume, 'Nm³/year'],
      ['Specific Embedded Emissions', cbamResults.see.toFixed(4), 'tCO2e/MWh'],
      ['CBAM Duty', cbamResults.cbamDuty.toFixed(2), 'EUR/year'],
      [''],
      ['Biochar CDR Calculator'],
      ['Parameter', 'Value', 'Unit'],
      ['Biochar Mass', biocharInputs.biocharMass, 'kg/year'],
      ['Net CDR', biocharResults.netCDR.toFixed(2), 'tCO2e'],
      ['Permanence Adjusted', biocharResults.permanenceAdjusted.toFixed(2), 'tCO2e'],
      ['CORC Revenue', biocharResults.revenueUsd.toFixed(2), 'USD/year']
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vardhad_ghg_calculator_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number, currency = 'INR') => {
    const prefix = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '\u20B9';
    return `${prefix}${formatNumber(num)}`;
  };

  const InputField = ({ label, value, onChange, unit, min = 0, max, step, tooltip }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    unit: string;
    min?: number;
    max?: number;
    step?: number;
    tooltip?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {tooltip && (
          <div className="relative group">
            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            <div className="absolute left-0 top-6 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step || 1}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
        <span className="text-sm text-gray-500 w-20">{unit}</span>
      </div>
    </div>
  );

  const ResultCard = ({ label, value, unit, highlight = false, trend }: {
    label: string;
    value: string;
    unit?: string;
    highlight?: boolean;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );

  const MethodologyCard = ({ title, formula, description, standard }: {
    title: string;
    formula: string;
    description: string;
    standard: string;
  }) => (
    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">{standard}</span>
      </div>
      <div className="mt-3 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-800 overflow-x-auto">
        {formula}
      </div>
      <p className="mt-3 text-sm text-gray-600">{description}</p>
    </div>
  );

  const tabs = [
    { id: 'corsia' as const, label: 'CORSIA SAF', icon: Plane },
    { id: 'cbam' as const, label: 'CBAM/DRI', icon: Factory },
    { id: 'biochar' as const, label: 'Biochar CDR', icon: Leaf },
    { id: 'pnl' as const, label: 'Financial P&L', icon: DollarSign },
    { id: 'methodology' as const, label: 'Methodologies', icon: Calculator }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">GHG Auditor's Calculator</h2>
                <p className="text-emerald-100 mt-1">Vardhad Biorefinery - Dual-Use Carbon Accounting</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCORSIAInputs(defaultCORSIA);
                  setCBAMInputs(defaultCBAM);
                  setBiocharInputs(defaultBiochar);
                  setPnLInputs(defaultPnL);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'text-emerald-600 border-emerald-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'corsia' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Plane className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">CORSIA SAF Credit Calculator</h3>
                    <p className="text-sm text-blue-700 mt-1">Calculate eligible emission reduction credits from Sustainable Aviation Fuel production under ICAO CORSIA framework.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('corsia_inputs')}>
                    <h3 className="text-lg font-semibold text-gray-900">Input Parameters</h3>
                    {expandedSections['corsia_inputs'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  {expandedSections['corsia_inputs'] !== false && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="SAF Production"
                        value={corsiaInputs.safProduction}
                        onChange={(v) => setCORSIAInputs(prev => ({ ...prev, safProduction: v }))}
                        unit="tonnes/year"
                        tooltip="Annual SAF output from Fischer-Tropsch unit"
                      />
                      <InputField
                        label="SAF Energy Content"
                        value={corsiaInputs.safEnergyContent}
                        onChange={(v) => setCORSIAInputs(prev => ({ ...prev, safEnergyContent: v }))}
                        unit="MJ/kg"
                        step={0.1}
                        tooltip="Lower heating value of SAF"
                      />
                      <InputField
                        label="SAF Lifecycle GHG"
                        value={corsiaInputs.safLifecycleGHG}
                        onChange={(v) => setCORSIAInputs(prev => ({ ...prev, safLifecycleGHG: v }))}
                        unit="gCO2e/MJ"
                        step={0.01}
                        tooltip="Well-to-wake lifecycle emissions"
                      />
                      <InputField
                        label="Fossil Jet Baseline"
                        value={corsiaInputs.fossilJetBaseline}
                        onChange={(v) => setCORSIAInputs(prev => ({ ...prev, fossilJetBaseline: v }))}
                        unit="gCO2e/MJ"
                        tooltip="CORSIA default reference value"
                      />
                      <InputField
                        label="CORSIA Credit Price"
                        value={corsiaInputs.corsiaCreditPrice}
                        onChange={(v) => setCORSIAInputs(prev => ({ ...prev, corsiaCreditPrice: v }))}
                        unit="USD/tCO2e"
                        tooltip="Market price for CORSIA-eligible emissions units"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Calculated Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ResultCard
                      label="Total Energy Content"
                      value={formatNumber(corsiaResults.totalEnergy)}
                      unit="MJ/year"
                    />
                    <ResultCard
                      label="GHG Reduction per MJ"
                      value={((corsiaInputs.fossilJetBaseline - corsiaInputs.safLifecycleGHG) / 1000).toFixed(4)}
                      unit="tCO2e/MJ"
                      trend="down"
                    />
                    <ResultCard
                      label="CORSIA Credits"
                      value={corsiaResults.totalCredits.toFixed(1)}
                      unit="tCO2e/year"
                      highlight
                      trend="up"
                    />
                    <ResultCard
                      label="Reduction vs Baseline"
                      value={`${corsiaResults.reductionPct.toFixed(1)}%`}
                      highlight
                    />
                    <ResultCard
                      label="Annual Revenue (USD)"
                      value={formatCurrency(corsiaResults.revenueUsd, 'USD')}
                      highlight
                    />
                    <ResultCard
                      label="Annual Revenue (INR)"
                      value={formatCurrency(corsiaResults.revenueInr)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">CORSIA Formula</h4>
                </div>
                <div className="p-3 bg-white rounded-lg font-mono text-sm">
                  Credits = (Baseline GHG - SAF Lifecycle GHG) × SAF Energy / 10^6 tCO2e
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cbam' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Factory className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900">CBAM Embedded CO2 Calculator</h3>
                    <p className="text-sm text-orange-700 mt-1">Calculate embedded emissions for DRI syngas exported to JSW/AMNS under EU CBAM regulation.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Input Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Syngas Volume"
                      value={cbamInputs.syngasVolume}
                      onChange={(v) => setCBAMInputs(prev => ({ ...prev, syngasVolume: v }))}
                      unit="Nm3/year"
                      tooltip="Annual syngas sent to DRI plant"
                    />
                    <InputField
                      label="Embedded CO2 Content"
                      value={cbamInputs.syngasCO2Content}
                      onChange={(v) => setCBAMInputs(prev => ({ ...prev, syngasCO2Content: v }))}
                      unit="tCO2e/GWh"
                      step={0.001}
                      tooltip="Embedded emissions per energy unit"
                    />
                    <InputField
                      label="Parasitic Electricity"
                      value={cbamInputs.parasiticElectricity}
                      onChange={(v) => setCBAMInputs(prev => ({ ...prev, parasiticElectricity: v }))}
                      unit="MWh/year"
                      tooltip="Grid electricity for gasifier operations"
                    />
                    <InputField
                      label="Grid Emission Factor"
                      value={cbamInputs.gridEmissionFactor}
                      onChange={(v) => setCBAMInputs(prev => ({ ...prev, gridEmissionFactor: v }))}
                      unit="tCO2e/MWh"
                      step={0.01}
                      tooltip="Indian grid average emission factor"
                    />
                    <InputField
                      label="EU ETS Price"
                      value={cbamInputs.etsPrice}
                      onChange={(v) => setCBAMInputs(prev => ({ ...prev, etsPrice: v }))}
                      unit="EUR/tCO2e"
                      tooltip="European carbon price"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">CBAM Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ResultCard
                      label="Direct Emissions"
                      value={cbamResults.directEmissions.toFixed(2)}
                      unit="tCO2e"
                    />
                    <ResultCard
                      label="Indirect Emissions"
                      value={cbamResults.indirectEmissions.toFixed(2)}
                      unit="tCO2e"
                    />
                    <ResultCard
                      label="Specific Embedded Emissions"
                      value={cbamResults.see.toFixed(4)}
                      unit="tCO2e/MWh"
                      highlight
                    />
                    <ResultCard
                      label="Annual CBAM Duty"
                      value={formatCurrency(cbamResults.cbamDuty, 'EUR')}
                      unit="/year"
                      highlight
                    />
                    <ResultCard
                      label="Transitional Relief (50%)"
                      value={formatCurrency(cbamResults.transitionalRelief, 'EUR')}
                      unit="/year"
                    />
                    <ResultCard
                      label="Net CBAM Payable"
                      value={formatCurrency(cbamResults.cbamDuty - cbamResults.transitionalRelief, 'EUR')}
                      unit="/year"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">CBAM Formula</h4>
                </div>
                <div className="p-3 bg-white rounded-lg font-mono text-sm">
                  SEE = (Direct Emissions + Indirect Emissions) / Activity Level (MWh)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'biochar' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Biochar CDR Calculator</h3>
                    <p className="text-sm text-green-700 mt-1">Calculate certified carbon removal from biochar production under Isometric/Puro.earth methodologies.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Input Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Biochar Mass"
                      value={biocharInputs.biocharMass}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, biocharMass: v }))}
                      unit="kg/year"
                      tooltip="Annual biochar output from gasifier"
                    />
                    <InputField
                      label="Fixed Carbon %"
                      value={biocharInputs.fixedCarbonPct}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, fixedCarbonPct: v }))}
                      unit="%"
                      step={0.1}
                      tooltip="Measured by monthly lab analysis"
                    />
                    <InputField
                      label="Moisture Content"
                      value={biocharInputs.moisturePct}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, moisturePct: v }))}
                      unit="%"
                      step={0.1}
                      tooltip="Water content in biochar"
                    />
                    <InputField
                      label="Pyrolysis Temperature"
                      value={biocharInputs.pyrolysisTemp}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, pyrolysisTemp: v }))}
                      unit="°C"
                      tooltip="Operating temperature for permanence verification"
                    />
                    <InputField
                      label="Residence Time"
                      value={biocharInputs.residenceTime}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, residenceTime: v }))}
                      unit="min"
                      step={0.5}
                      tooltip="Time at peak temperature"
                    />
                    <InputField
                      label="Parasitic Energy"
                      value={biocharInputs.parasiticEnergy}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, parasiticEnergy: v }))}
                      unit="kWh/year"
                      tooltip="Electricity consumption for operations"
                    />
                    <InputField
                      label="Transport Distance"
                      value={biocharInputs.transportDistance}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, transportDistance: v }))}
                      unit="km"
                      tooltip="Avg distance for feedstock transport"
                    />
                    <InputField
                      label="Permanence Factor"
                      value={biocharInputs.permanenceFactor}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, permanenceFactor: v }))}
                      unit=""
                      step={0.01}
                      tooltip="Isometric: 0.915 for 1000-yr permanence"
                    />
                    <InputField
                      label="CORC Price"
                      value={biocharInputs.corcPrice}
                      onChange={(v) => setBiocharInputs(prev => ({ ...prev, corcPrice: v }))}
                      unit="USD/tCO2e"
                      tooltip="Puro.earth carbon removal credit price"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">CDR Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ResultCard
                      label="Dry Mass"
                      value={formatNumber(biocharResults.dryMass)}
                      unit="kg"
                    />
                    <ResultCard
                      label="Carbon Sequestered"
                      value={formatNumber(biocharResults.carbonSequestered)}
                      unit="kg C"
                    />
                    <ResultCard
                      label="Gross CDR"
                      value={biocharResults.grossCDR.toFixed(2)}
                      unit="tCO2e"
                    />
                    <ResultCard
                      label="Process Emissions"
                      value={biocharResults.processEmissions.toFixed(2)}
                      unit="tCO2e"
                      trend="down"
                    />
                    <ResultCard
                      label="Transport Emissions"
                      value={biocharResults.transportEmissions.toFixed(2)}
                      unit="tCO2e"
                      trend="down"
                    />
                    <ResultCard
                      label="Net CDR"
                      value={biocharResults.netCDR.toFixed(2)}
                      unit="tCO2e"
                      highlight
                    />
                    <ResultCard
                      label="Permanence Adjusted"
                      value={biocharResults.permanenceAdjusted.toFixed(2)}
                      unit="tCO2e"
                      highlight
                      trend="up"
                    />
                    <ResultCard
                      label="Annual Revenue (USD)"
                      value={formatCurrency(biocharResults.revenueUsd, 'USD')}
                      highlight
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">Isometric Biochar v1.2 Formula</h4>
                </div>
                <div className="p-3 bg-white rounded-lg font-mono text-sm">
                  CDR = (M_biochar × fC_fixed × 44/12) - E_process - E_transport
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pnl' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-violet-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-violet-900">Financial P&L Calculator</h3>
                    <p className="text-sm text-violet-700 mt-1">20-year project financial model with all revenue streams and cost categories.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('revenue')}>
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Streams</h3>
                    {expandedSections['revenue'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  {expandedSections['revenue'] !== false && (
                    <div className="space-y-3">
                      <InputField
                        label="SAF Production"
                        value={pnlInputs.safProduction}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, safProduction: v }))}
                        unit="tonnes/year"
                      />
                      <InputField
                        label="SAF Price"
                        value={pnlInputs.safPrice}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, safPrice: v }))}
                        unit="INR/tonne"
                      />
                      <InputField
                        label="Renewable Diesel"
                        value={pnlInputs.renewableDieselProduction}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, renewableDieselProduction: v }))}
                        unit="tonnes/year"
                      />
                      <InputField
                        label="RD Price"
                        value={pnlInputs.renewableDieselPrice}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, renewableDieselPrice: v }))}
                        unit="INR/tonne"
                      />
                      <InputField
                        label="Bio-CNG Production"
                        value={pnlInputs.bioCNGProduction}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, bioCNGProduction: v }))}
                        unit="tonnes/year"
                      />
                      <InputField
                        label="Bio-CNG Price"
                        value={pnlInputs.bioCNGPrice}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, bioCNGPrice: v }))}
                        unit="INR/tonne"
                      />
                      <InputField
                        label="DRI Syngas Volume"
                        value={pnlInputs.driSyngasVolume}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, driSyngasVolume: v }))}
                        unit="Nm3/year"
                      />
                      <InputField
                        label="Biochar Credits"
                        value={pnlInputs.biocharCredits}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, biocharCredits: v }))}
                        unit="tCO2e/year"
                      />
                      <InputField
                        label="CORSIA Credits"
                        value={pnlInputs.corsiaCredits}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, corsiaCredits: v }))}
                        unit="tCO2e/year"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('costs')}>
                    <h3 className="text-lg font-semibold text-gray-900">Operating Costs</h3>
                    {expandedSections['costs'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  {expandedSections['costs'] !== false && (
                    <div className="space-y-3">
                      <InputField
                        label="Feedstock Cost"
                        value={pnlInputs.feedstockCost}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, feedstockCost: v }))}
                        unit="INR/tonne"
                      />
                      <InputField
                        label="Feedstock Volume"
                        value={pnlInputs.feedstockConsumption}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, feedstockConsumption: v }))}
                        unit="tonnes/year"
                      />
                      <InputField
                        label="Grid Electricity Cost"
                        value={pnlInputs.gridElectricityPrice}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, gridElectricityPrice: v }))}
                        unit="INR/MWh"
                      />
                      <InputField
                        label="O&M Cost"
                        value={pnlInputs.omCost}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, omCost: v }))}
                        unit="INR/year"
                      />
                      <InputField
                        label="Depreciation"
                        value={pnlInputs.depreciation}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, depreciation: v }))}
                        unit="INR/year"
                      />
                      <InputField
                        label="Interest Expense"
                        value={pnlInputs.interestExpense}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, interestExpense: v }))}
                        unit="INR/year"
                      />
                      <InputField
                        label="dMRV Subscription"
                        value={pnlInputs.dmrvSubscription}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, dmrvSubscription: v }))}
                        unit="INR/year"
                      />
                      <InputField
                        label="Logistics Cost"
                        value={pnlInputs.logisticsCost}
                        onChange={(v) => setPnLInputs(prev => ({ ...prev, logisticsCost: v }))}
                        unit="INR/year"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
                  <div className="space-y-3">
                    <ResultCard
                      label="Total Revenue"
                      value={formatCurrency(pnlResults.totalRevenue)}
                      unit="/year"
                      highlight
                      trend="up"
                    />
                    <ResultCard
                      label="Total COGS"
                      value={formatCurrency(pnlResults.totalCOGS)}
                      unit="/year"
                    />
                    <ResultCard
                      label="EBITDA"
                      value={formatCurrency(pnlResults.ebitda)}
                      unit="/year"
                      highlight={pnlResults.ebitda > 0}
                    />
                    <ResultCard
                      label="Tax (25%)"
                      value={formatCurrency(pnlResults.tax)}
                      unit="/year"
                    />
                    <ResultCard
                      label="Net Profit"
                      value={formatCurrency(pnlResults.netProfit)}
                      unit="/year"
                      highlight={pnlResults.netProfit > 0}
                    />
                    <ResultCard
                      label="Payback Period"
                      value={pnlResults.paybackYears.toFixed(1)}
                      unit="years"
                    />
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm text-gray-600">Total CAPEX</div>
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(pnlInputs.totalCapex)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm text-gray-600">USD/INR Rate</div>
                      <div className="text-xl font-bold text-gray-900">{pnlInputs.usdInrRate}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'methodology' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Carbon Certification Methodologies</h3>
                    <p className="text-sm text-gray-600 mt-1">Reference formulas for all applicable Vardhad carbon credit pathways.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MethodologyCard
                  title="CORSIA SAF Emissions Reduction"
                  standard="ICAO CORSIA"
                  formula="ER = (Baseline_LCA - SAF_LCA) × Energy_Content"
                  description="Emissions reduction credits for sustainable aviation fuel under ICAO's Carbon Offsetting and Reduction Scheme for International Aviation."
                />
                <MethodologyCard
                  title="CBAM Embedded Emissions"
                  standard="EU CBAM"
                  formula="SEE = (AttrEm_dir + AttrEm_indir) / AL"
                  description="Specific embedded emissions calculation for carbon-intensive goods imported into the EU under the Carbon Border Adjustment Mechanism."
                />
                <MethodologyCard
                  title="Biochar Carbon Removal"
                  standard="Isometric v1.2"
                  formula="CDR = (M_biochar × fC × 44/12) - E_proc - E_trans"
                  description="Carbon dioxide removal through biochar production and storage, with 1000-year permanence verification."
                />
                <MethodologyCard
                  title="Biochar CORC"
                  standard="Puro.earth ED2025"
                  formula="CORC = (M_biochar × fC × 44/12 - E_total) × PF"
                  description="Certified carbon removal credits for biochar under European Puro.earth standard with permanence factor adjustment."
                />
                <MethodologyCard
                  title="ARR Afforestation"
                  standard="Verra VM0047"
                  formula="ER = ΔC_biomass + ΔC_SOC - GHG_project"
                  description="Afforestation, Reforestation and Revegetation methodology for carbon sequestration in biomass and soil organic carbon."
                />
                <MethodologyCard
                  title="Methane Recovery"
                  standard="CDM AMS-III.D"
                  formula="ER = B0 × MCF × VS × 365 - PE"
                  description="Methane emission reductions from animal manure management and biogas production systems."
                />
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900">Important: Carbon Accounting Rules</h4>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Same syngas batch cannot claim both CORSIA SAF and CBAM credits (double-counting prohibition)</li>
                      <li>ERTH Fractional Split Agent allocates carbon atoms based on physical syngas flow direction</li>
                      <li>SAF pathway: syngas → Fischer-Tropsch → hydrotreating → jet fuel</li>
                      <li>CBAM pathway: syngas → JSW/AMNS blast furnace (PCI substitute)</li>
                      <li>All sensor data must be HSM-signed and Merkle-rooted for auditor verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
