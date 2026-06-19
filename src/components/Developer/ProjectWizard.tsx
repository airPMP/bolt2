import { useState, useEffect } from 'react';
import { Globe, FileText, MapPin, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

const REGISTRY_METHODOLOGY_MAP: Record<string, { registries: { id: string; name: string; country: string; credit: string; defaultMethodology: string }[] }> = {
  "Clean Energy & Storage": {
    registries: [
      { id: "irec", name: "I‑TRACK (I‑REC)", country: "Global", credit: "I‑REC", defaultMethodology: "AMS‑I.D" },
      { id: "verra", name: "Verra VCS", country: "USA", credit: "VCU", defaultMethodology: "AMS‑I.D" },
      { id: "goldstandard", name: "Gold Standard", country: "Switzerland", credit: "GS‑VER", defaultMethodology: "AMS‑I.D" },
      { id: "isometric", name: "Isometric", country: "UK / USA", credit: "ISO‑CR", defaultMethodology: "ISO‑BiCRS" },
      { id: "rainbow", name: "Rainbow Standard", country: "Global", credit: "RCC", defaultMethodology: "RAIN‑SOLAR" }
    ]
  },
  "Nature‑Based, Forest & Agro": {
    registries: [
      { id: "verra", name: "Verra VCS", country: "USA", credit: "VCU", defaultMethodology: "VM0047" },
      { id: "goldstandard", name: "Gold Standard", country: "Switzerland", credit: "GS‑VER", defaultMethodology: "VM0047" },
      { id: "ccts", name: "India CCTS / NSDL", country: "India", credit: "CCC", defaultMethodology: "ICM‑ARR" },
      { id: "puro", name: "Puro.earth", country: "Finland", credit: "CORC", defaultMethodology: "CORC‑ARR" },
      { id: "isometric", name: "Isometric", country: "UK / USA", credit: "ISO‑CR", defaultMethodology: "ISO‑BIOCHAR" },
      { id: "rainbow", name: "Rainbow Standard", country: "Global", credit: "RCC", defaultMethodology: "RAIN‑ARR" }
    ]
  },
  "Industrial & Green Molecules": {
    registries: [
      { id: "gcc", name: "Global Carbon Council (GCC)", country: "Qatar", credit: "ACC", defaultMethodology: "CCUS10.001" },
      { id: "verra", name: "Verra VCS", country: "USA", credit: "VCU", defaultMethodology: "VM0038" },
      { id: "acr", name: "American Carbon Registry (ACR)", country: "USA", credit: "ERT", defaultMethodology: "ACR‑CCUS" },
      { id: "puro", name: "Puro.earth", country: "Finland", credit: "CORC", defaultMethodology: "PURO‑EW" },
      { id: "isometric", name: "Isometric", country: "UK / USA", credit: "ISO‑CR", defaultMethodology: "ISO‑EW" },
      { id: "rainbow", name: "Rainbow Standard", country: "Global", credit: "RCC", defaultMethodology: "RAIN‑CCUS" },
      { id: "safc", name: "SAFc Registry", country: "Global", credit: "SAFc", defaultMethodology: "IATA‑SAF" }
    ]
  },
  "Community‑Based": {
    registries: [
      { id: "goldstandard", name: "Gold Standard", country: "Switzerland", credit: "GS‑VER", defaultMethodology: "MMECD" },
      { id: "verra", name: "Verra VCS", country: "USA", credit: "VCU", defaultMethodology: "VM0026" },
      { id: "isometric", name: "Isometric", country: "UK / USA", credit: "ISO‑CR", defaultMethodology: "ISO‑BIOCHAR" },
      { id: "rainbow", name: "Rainbow Standard", country: "Global", credit: "RCC", defaultMethodology: "RAIN‑COOK" }
    ]
  }
};

const CLUB_BOQ: Record<string, { gateway: string; sensors: string[]; pricing: { gateway: number; sensors: number[]; setup: number } }> = {
  "Clean Energy & Storage": {
    gateway: "BLK‑GW‑H1",
    sensors: ["BLK‑M‑KWH", "BLK‑S‑AQI"],
    pricing: { gateway: 2499, sensors: [899, 799], setup: 1500 }
  },
  "Nature‑Based, Forest & Agro": {
    gateway: "BLK‑GW‑H4",
    sensors: ["BLK‑S‑DEND", "BLK‑S‑SOILC"],
    pricing: { gateway: 3299, sensors: [1299, 1499], setup: 1800 }
  },
  "Industrial & Green Molecules": {
    gateway: "BLK‑GW‑H10",
    sensors: ["BLK‑S‑CCUS", "BLK‑S‑CH4P"],
    pricing: { gateway: 5499, sensors: [2499, 2199], setup: 2500 }
  },
  "Community‑Based": {
    gateway: "BLK‑GW‑H4",
    sensors: ["BLK‑S‑WTE", "BLK‑S‑AQI"],
    pricing: { gateway: 3299, sensors: [1099, 799], setup: 1500 }
  }
};

const CLUB_DESCRIPTIONS: Record<string, string> = {
  "Clean Energy & Storage": "Solar, Wind, BESS, Green H2 — RECs, I‑RECs, CCCs, CORSIA‑eligible credits",
  "Nature‑Based, Forest & Agro": "ARR, REDD+, AWD Rice, Biochar, Mangrove — VCUs, GS‑VERs, ICMUs",
  "Industrial & Green Molecules": "CCUS, Waste‑to‑Energy, SAF, Biogas, Plastic Recycling, CBAM — VCUs, ACCs, CBAM Certificates",
  "Community‑Based": "Clean Cookstoves, Rural Electrification, E‑waste Recycling — GS‑VERs, small‑scale VCUs"
};

const DEFAULT_REGISTRY: Record<string, string> = {
  "Clean Energy & Storage": "irec",
  "Nature‑Based, Forest & Agro": "verra",
  "Industrial & Green Molecules": "gcc",
  "Community‑Based": "goldstandard"
};

const METHODOLOGY_DETAILS: Record<string, { description: string; period: string; formula?: string }> = {
  "VM0047": { description: "Afforestation, Reforestation and Revegetation", period: "30 years renewable", formula: "Credits = ΔC_tree + ΔC_understorey + ΔC_deadwood + ΔC_litter − ΔC_loss" },
  "AMS‑I.D": { description: "Grid connected renewable electricity generation", period: "10 years fixed", formula: "Credits = (EG_y × EF_grid) − (EG_y × EF_project)" },
  "CCUS10.001": { description: "Carbon Capture and Geological Storage", period: "15 years renewable", formula: "Credits = CO2_captured − CO2_process − CO2_transport − CO2_leakage" },
  "MMECD": { description: "Micro‑scale Methane Emission Capture and Destruction", period: "7 years fixed", formula: "Credits = (CH4_destroyed × GWP_CH4) − (E_combustion + E_electricity)" },
  "VM0038": { description: "Methane Emissions Reduction in Landfill Gas Capture", period: "10 years renewable", formula: "Credits = (CH4_captured × GWP_CH4) − (E_flare + E_electricity)" },
  "VM0026": { description: "Improved Cookstove Efficiency and Fuel Switching", period: "7 years fixed", formula: "Credits = Σ(Baseline_fuel_use − Project_fuel_use) × EF_fuel × GWP" },
  "ACR‑CCUS": { description: "Carbon Capture and Utilization/Storage", period: "15 years renewable", formula: "Credits = CO2_injected − (E_capture + E_transport + E_monitoring)" },
  "CORC‑ARR": { description: "Biochar Carbon Removal with Afforestation", period: "20 years renewable", formula: "Credits = C_biochar × Stability_factor + ΔC_biomass" },
  "ICM‑ARR": { description: "Indian Carbon Market Afforestation/Reforestation", period: "20 years fixed", formula: "Credits = ΔC_above + ΔC_below + ΔC_soil − ΔC_loss" },
  // Isometric protocols
  "ISO‑BiCRS": { description: "Biomass Carbon Removal and Storage (Biochar / Bio-oil)", period: "100+ years durable", formula: "Credits = C_stable − (E_pyrolysis + E_transport + E_feedstock)" },
  "ISO‑BIOCHAR": { description: "Biochar Production and Storage", period: "100+ years durable", formula: "Credits = (C_biochar × O:C_ratio_check) − (E_process + E_biomass)" },
  "ISO‑EW": { description: "Enhanced Weathering — Direct Measurement", period: "10,000+ years durable", formula: "Credits = Σ(measured_HCO3− × M_Ca/Mg × t) − (E_mining + E_crushing + E_transport)" },
  "ISO‑OAE": { description: "Ocean Alkalinity Enhancement", period: "10,000+ years durable", formula: "Credits = ΔDIC_measured × (1 − f_reversal) − E_addition" },
  "ISO‑DAC": { description: "Direct Air Capture and Storage", period: "1,000+ years durable", formula: "Credits = CO2_stored − (E_capture + E_transport + E_storage)" },
  // Puro.earth methodologies
  "PURO‑BIOCHAR": { description: "Biochar Carbon Removal", period: "200+ years", formula: "Credits = C_biochar × (1 − f_degradation) − E_pyrolysis" },
  "PURO‑EW": { description: "Enhanced Rock Weathering", period: "10,000+ years", formula: "Credits = Σ(Ca/Mg_release × f_carbonation × t) − (E_mining + E_transport)" },
  "PURO‑WOODY": { description: "Woody Biomass Burial / Storage", period: "100+ years", formula: "Credits = C_biomass × (1 − f_decay) − E_harvest" },
  "PURO‑BIOOIL": { description: "Bio-oil Geological Storage", period: "1,000+ years", formula: "Credits = C_biooil_injected × (1 − f_leakage) − E_production" },
  "PURO‑DACOS": { description: "Direct Air Capture and Ocean Storage", period: "1,000+ years", formula: "Credits = CO2_dissolved − (E_capture + E_transport + E_injection)" },
  "PURO‑MACS": { description: "Marine Anoxic Carbon Storage", period: "1,000+ years", formula: "Credits = C_sediment × (1 − f_remineralisation) − E_collection" },
  // Rainbow Standard methodologies
  "RAIN‑SOLAR": { description: "Solar PV Renewable Energy — Avoidance", period: "10 years fixed", formula: "Credits = (EG_y × EF_grid) − (EG_y × EF_project)" },
  "RAIN‑ARR": { description: "Afforestation / Reforestation — Removal", period: "30 years renewable", formula: "Credits = ΔC_biomass + ΔC_soil − ΔC_loss" },
  "RAIN‑CCUS": { description: "Carbon Capture, Utilization and Storage", period: "15 years renewable", formula: "Credits = CO2_sequestered − (E_capture + E_transport + E_injection)" },
  "RAIN‑COOK": { description: "Improved Cookstoves — Avoidance", period: "7 years fixed", formula: "Credits = Σ(Baseline_fuel − Project_fuel) × EF_fuel × GWP" },
  "RAIN‑BIOCHAR": { description: "Biochar Carbon Removal", period: "100+ years", formula: "Credits = C_biochar × Stability_factor − E_process" },
  "RAIN‑EW": { description: "Enhanced Weathering — Removal", period: "10,000+ years", formula: "Credits = Σ(measured_alkalinity × f_CO2 × t) − (E_mining + E_transport)" },
  // SAFc Registry methodologies
  "IATA‑SAF": { description: "Sustainable Aviation Fuel — Book & Claim", period: "1 year vintage", formula: "SAFc = (SAF_volume × LCA_reduction%) − (E_production + E_transport)" },
  "CORSIA‑SAF": { description: "CORSIA Eligible SAF", period: "3 year compliance", formula: "Credits = (Jet_fuel_replaced × CORSIA_EF) − (SAF_EI × SAF_volume)" },
  "RSB‑SAF": { description: "RSB Certified Sustainable Aviation Fuel", period: "1 year vintage", formula: "SAFc = SAF_volume × (EF_fossil − EF_SAF) × CORSIA_factor" }
};

interface LandData {
  area_ha: number;
  elevation_m: number;
  slope_pct: number;
  landUse: string;
}

export default function ProjectWizard() {
  const [step, setStep] = useState(1);
  const [club, setClub] = useState('');
  const [selectedRegistryId, setSelectedRegistryId] = useState('');
  const [selectedMethodology, setSelectedMethodology] = useState('');
  const [useDefault, setUseDefault] = useState(false);
  const [showBOQ, setShowBOQ] = useState(false);
  const [landData, setLandData] = useState<LandData | null>(null);
  const [ownershipValidated, setOwnershipValidated] = useState(false);
  const [ownershipMethod, setOwnershipMethod] = useState('');
  const [isGeneratingPdd, setIsGeneratingPdd] = useState(false);
  const [pddGenerated, setPddGenerated] = useState(false);

  const currentClubData = club ? REGISTRY_METHODOLOGY_MAP[club] : null;
  const currentBOQ = club ? CLUB_BOQ[club] : null;
  const selectedRegistry = currentClubData?.registries.find(r => r.id === selectedRegistryId);

  useEffect(() => {
    if (useDefault && club) {
      const defaultId = DEFAULT_REGISTRY[club];
      setSelectedRegistryId(defaultId);
      const reg = currentClubData?.registries.find(r => r.id === defaultId);
      if (reg) setSelectedMethodology(reg.defaultMethodology);
      setShowBOQ(true);
      setStep(3);
    }
  }, [useDefault, club, currentClubData]);

  const handleClubSelect = (value: string) => {
    setClub(value);
    setSelectedRegistryId('');
    setSelectedMethodology('');
    setShowBOQ(false);
    setUseDefault(false);
    setStep(2);
  };

  const handleRegistrySelect = (id: string) => {
    setSelectedRegistryId(id);
    setShowBOQ(true);
    const reg = currentClubData?.registries.find(r => r.id === id);
    if (reg) setSelectedMethodology(reg.defaultMethodology);
    setStep(3);
  };

  const handleMethodologyChange = (methodology: string) => {
    setSelectedMethodology(methodology);
  };

  const proceedToLocation = () => {
    setStep(4);
    setTimeout(() => {
      setLandData({ area_ha: 120, elevation_m: 900, slope_pct: 12, landUse: "Degraded pasture" });
    }, 800);
  };

  const handleOwnershipValidate = (method: string) => {
    setOwnershipMethod(method);
    setTimeout(() => setOwnershipValidated(true), 400);
  };

  const generatePDD = () => {
    setIsGeneratingPdd(true);
    setTimeout(() => {
      setIsGeneratingPdd(false);
      setPddGenerated(true);
      setStep(7);
    }, 2000);
  };

  const totalCost = currentBOQ
    ? currentBOQ.pricing.gateway + currentBOQ.pricing.sensors.reduce((a, b) => a + b, 0) + currentBOQ.pricing.setup
    : 0;

  const totalCreditsPerYear = 250000;

  const ClubsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(CLUB_BOQ).map(([key]) => (
        <button
          key={key}
          onClick={() => handleClubSelect(key)}
          className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            club === key ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"
          }`}
          tabIndex={0}
          role="radio"
          aria-checked={club === key}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{key}</h3>
          <p className="text-sm text-gray-600 mb-3">{CLUB_DESCRIPTIONS[key]}</p>
          <div className="flex flex-wrap gap-2">
            {CLUB_BOQ[key]?.sensors.map((s, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Default gateway: {CLUB_BOQ[key]?.gateway}
          </div>
        </button>
      ))}
    </div>
  );

  const RegistryTable = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Registries for {club}
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={useDefault}
            onChange={(e) => setUseDefault(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Use Default ({DEFAULT_REGISTRY[club]?.toUpperCase()})
        </label>
      </div>
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Methodology</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentClubData?.registries.map((reg) => (
              <tr
                key={reg.id}
                className={`cursor-pointer transition-colors hover:bg-emerald-50 ${
                  selectedRegistryId === reg.id ? "bg-emerald-50" : ""
                }`}
                onClick={() => handleRegistrySelect(reg.id)}
              >
                <td className="px-4 py-3">
                  <input
                    type="radio"
                    name="registry"
                    checked={selectedRegistryId === reg.id}
                    onChange={() => handleRegistrySelect(reg.id)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{reg.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{reg.country}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{reg.credit}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{reg.defaultMethodology}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {currentClubData?.registries.map((reg) => (
          <button
            key={reg.id}
            onClick={() => handleRegistrySelect(reg.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedRegistryId === reg.id
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{reg.name}</span>
              <span className="text-xs text-gray-500">{reg.country}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {reg.credit} — {reg.defaultMethodology}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const MethodologySelector = () => {
    const reg = selectedRegistry;
    if (!reg) return null;
    const details = METHODOLOGY_DETAILS[selectedMethodology] || METHODOLOGY_DETAILS[reg.defaultMethodology];
    // Build available methodologies for this registry based on club
    const availableMethods = (() => {
      const base = [reg.defaultMethodology];
      if (reg.id === 'isometric') {
        if (club === 'Clean Energy & Storage') base.push('ISO‑BiCRS', 'ISO‑DAC');
        if (club === 'Nature‑Based, Forest & Agro') base.push('ISO‑BIOCHAR', 'ISO‑OAE');
        if (club === 'Industrial & Green Molecules') base.push('ISO‑EW', 'ISO‑DAC', 'ISO‑OAE');
        if (club === 'Community‑Based') base.push('ISO‑BIOCHAR', 'ISO‑BiCRS');
      }
      if (reg.id === 'puro') {
        if (club === 'Nature‑Based, Forest & Agro') base.push('PURO‑BIOCHAR', 'PURO‑WOODY');
        if (club === 'Industrial & Green Molecules') base.push('PURO‑EW', 'PURO‑BIOOIL', 'PURO‑DACOS', 'PURO‑MACS');
      }
      if (reg.id === 'rainbow') {
        if (club === 'Clean Energy & Storage') base.push('RAIN‑SOLAR');
        if (club === 'Nature‑Based, Forest & Agro') base.push('RAIN‑ARR', 'RAIN‑BIOCHAR', 'RAIN‑EW');
        if (club === 'Industrial & Green Molecules') base.push('RAIN‑CCUS', 'RAIN‑EW');
        if (club === 'Community‑Based') base.push('RAIN‑COOK');
      }
      if (reg.id === 'safc') {
        base.push('CORSIA‑SAF', 'RSB‑SAF');
      }
      return [...new Set(base)];
    })();

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Methodology Selection</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">Registry:</span> {reg.name}
          <span className="mx-2">·</span>
          <span className="font-medium text-gray-900">Credit:</span> {reg.credit}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label>
          <select
            value={selectedMethodology}
            onChange={(e) => handleMethodologyChange(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {availableMethods.map((m) => (
              <option key={m} value={m}>{m} {m === reg.defaultMethodology ? '(Default)' : ''}</option>
            ))}
          </select>
        </div>
        {details && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700"><span className="font-medium">Description:</span> {details.description}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Crediting Period:</span> {details.period}</p>
            {details.formula && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 mt-2">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Calculation Formula</p>
                <p className="text-sm font-mono text-emerald-900 mt-1">{details.formula}</p>
              </div>
            )}
            <p className="text-sm text-gray-700"><span className="font-medium">Additionality:</span> Performance-based demonstration required via Blockvolt monitoring</p>
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={proceedToLocation}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors flex items-center gap-2"
          >
            Proceed to Location
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const BOQCard = () => {
    if (!currentBOQ) return null;
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Basic Bill of Quantities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Gateway</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{currentBOQ.gateway}</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">${currentBOQ.pricing.gateway.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Setup</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">Installation & Commissioning</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">${currentBOQ.pricing.setup.toLocaleString()}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Core Sensors</p>
          <div className="space-y-2">
            {currentBOQ.sensors.map((sensor, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-100">
                <span className="text-sm font-medium text-gray-700">{sensor}</span>
                <span className="text-sm text-emerald-600 font-medium">${currentBOQ.pricing.sensors[idx].toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-emerald-200 pt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Total Estimated Cost</span>
          <span className="text-xl font-bold text-emerald-700">${totalCost.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const LocationMap = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Enrichment</h3>
        {landData ? (
          <div className="space-y-4">
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Map preview loaded</p>
                <p className="text-xs text-gray-400 mt-1">Google Maps JavaScript API placeholder</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Area", value: `${landData.area_ha} ha` },
                { label: "Elevation", value: `${landData.elevation_m} m` },
                { label: "Slope", value: `${landData.slope_pct}%` },
                { label: "Land Use", value: landData.landUse }
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Fetching location data...</p>
          </div>
        )}
        {landData && !ownershipValidated && (
          <div className="mt-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-900">Land Ownership Validation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleOwnershipValidate("api")}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <p className="font-medium text-gray-900">Auto‑Validate</p>
                <p className="text-sm text-gray-500 mt-1">Query government land‑record API</p>
              </button>
              <button
                onClick={() => handleOwnershipValidate("manual")}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <p className="font-medium text-gray-900">Manual Geo‑tag</p>
                <p className="text-sm text-gray-500 mt-1">Draw boundary polygon on map</p>
              </button>
            </div>
          </div>
        )}
        {ownershipValidated && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Ownership Validated
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Method: {ownershipMethod === "api" ? "Government API" : "Manual geo‑tagging with polygon"}
              </p>
            </div>
            <button
              onClick={() => setStep(6)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Generate PDD
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const PDDGenerator = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">PDD / DPR Generation</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Pre‑filled Document
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Project Type", value: club },
          { label: "Registry", value: selectedRegistry?.name || "—" },
          { label: "Methodology", value: selectedMethodology || "—" },
          { label: "Credit Type", value: selectedRegistry?.credit || "—" },
          { label: "Location", value: landData ? `${landData.area_ha} ha, ${landData.elevation_m}m elevation` : "—" },
          { label: "Gateway", value: currentBOQ?.gateway || "—" },
          { label: "Ownership", value: ownershipValidated ? "Validated" : "Pending" },
          { label: "ITMO / Article 6", value: "CORSIA + Paris Agreement Ready" }
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      {!pddGenerated ? (
        <button
          onClick={generatePDD}
          disabled={isGeneratingPdd}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isGeneratingPdd ? (
            <>
              <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Generating...
            </>
          ) : (
            "Generate PDD / DPR Document"
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Document Generated Successfully</p>
              <p className="text-xs text-emerald-600">Blockvolt_PDD_{club.replace(/\s+/g, '_')}_{selectedRegistry?.id.toUpperCase()}.pdf</p>
            </div>
          </div>
          <button className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Proceed to Developer Dashboard →
          </button>
        </div>
      )}
    </div>
  );

  const DeveloperDashboard = () => {
    const [ledgerView, setLedgerView] = useState(false);
    const serialNumber = `BLK-${selectedRegistry?.id?.toUpperCase() || 'VCS'}-${Date.now().toString(36).toUpperCase()}`;
    const creditType = selectedRegistry?.credit || 'VCU';

    // dMRV Calculator inspired by Namibia UNFCCC repo
    const calculateCredits = () => {
      if (!landData || !selectedMethodology) return 0;
      const area = landData.area_ha;
      const days = 365;
      // Simplified sector-based calculator matching Namibia repo logic
      if (selectedMethodology.startsWith('AMS')) {
        // Energy: Solar / renewable
        const energyGen = area * 1500; // kWh/year/ha proxy
        const threshold = 55;
        const efHigh = 6.8;
        const efLow = 1.3;
        if (energyGen < threshold) return (energyGen / 1000) * efHigh;
        return (threshold / 1000) * efHigh + ((energyGen - threshold) / 1000) * efLow;
      }
      if (selectedMethodology.startsWith('VM0047') || selectedMethodology.startsWith('RAIN‑ARR') || selectedMethodology.startsWith('CORC') || selectedMethodology.startsWith('ICM')) {
        // Agriculture / ARR: hectares * days * emission factor
        const emissionFactor = 0.046; // tCO2e/ha/day proxy
        return area * days * emissionFactor;
      }
      if (selectedMethodology.startsWith('ISO') || selectedMethodology.startsWith('PURO')) {
        // CDR: durable removal — higher factor
        const cdrFactor = 2.5; // tCO2e/ha/day proxy for biochar/DAC
        return area * days * cdrFactor;
      }
      if (selectedMethodology.startsWith('IATA') || selectedMethodology.startsWith('CORSIA') || selectedMethodology.startsWith('RSB')) {
        // SAF: volume-based
        const safVolume = area * 0.5; // tonnes proxy
        const lcaReduction = 0.8;
        return safVolume * lcaReduction;
      }
      // Default
      return area * days * 0.046;
    };

    const estimatedCredits = Math.round(calculateCredits() * 100) / 100;

    return (
      <div className="space-y-6">
        {/* dMRV Credit Calculator — Namibia repo inspired */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">dMRV Credit Calculator</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Namibia DPG Fork
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Land Area</p>
              <p className="text-lg font-semibold text-gray-900">{landData?.area_ha || 0} ha</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Methodology</p>
              <p className="text-lg font-semibold text-gray-900">{selectedMethodology || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Est. Annual Credits</p>
              <p className="text-lg font-semibold text-emerald-600">{estimatedCredits.toLocaleString()} {creditType}</p>
            </div>
          </div>
          {METHODOLOGY_DETAILS[selectedMethodology]?.formula && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Formula Applied</p>
              <p className="text-sm font-mono text-emerald-900 mt-1">{METHODOLOGY_DETAILS[selectedMethodology].formula}</p>
            </div>
          )}
        </div>

        {/* Serial Number & Ledger — Namibia repo inspired */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credit Issuance & Ledger</h3>
            <button
              onClick={() => setLedgerView(!ledgerView)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {ledgerView ? 'Hide Ledger' : 'View Ledger'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Serial Number</p>
              <p className="text-sm font-mono text-gray-900 mt-1">{serialNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Credit Type</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{creditType}</p>
            </div>
          </div>
          {ledgerView && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 text-sm text-gray-900">Issuance</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{new Date().toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2 text-sm text-emerald-600 font-medium">+{estimatedCredits.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-sm text-gray-900">Transfer</td>
                    <td className="px-3 py-2 text-sm text-gray-500">—</td>
                    <td className="px-3 py-2 text-sm text-gray-500">—</td>
                    <td className="px-3 py-2 text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-sm text-gray-900">Retirement</td>
                    <td className="px-3 py-2 text-sm text-gray-500">—</td>
                    <td className="px-3 py-2 text-sm text-gray-500">—</td>
                    <td className="px-3 py-2 text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Developer Dashboard — dMRV Feed</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Credits Accrued", value: estimatedCredits.toLocaleString(), unit: creditType, color: "text-emerald-600" },
              { label: "Active Sensors", value: "4", unit: "devices", color: "text-blue-600" },
              { label: "Tree Growth (Avg)", value: "2.4", unit: "cm/month", color: "text-amber-600" },
              { label: "Soil Carbon Sequestration", value: "1.8", unit: "tCO₂e/ha", color: "text-purple-600" }
            ].map((metric) => (
              <div key={metric.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color} mt-1`}>{metric.value}</p>
                <p className="text-xs text-gray-400">{metric.unit}</p>
              </div>
            ))}
          </div>
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
            <div className="text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">dMRV Live Feed Chart</p>
              <p className="text-xs text-gray-400 mt-1">Real‑time sensor data stream</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Projected Credits (Year 1)</p>
              <p className="text-3xl font-bold mt-1">{totalCreditsPerYear.toLocaleString()}</p>
              <p className="text-sm opacity-75 mt-1">based on {selectedMethodology} methodology</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Token Balance</p>
              <p className="text-2xl font-bold mt-1">$BVT</p>
              <p className="text-sm opacity-75 mt-1">{estimatedCredits.toLocaleString()} {creditType} minted</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StepIndicator = () => {
    const steps = [
      { num: 1, label: "Club" },
      { num: 2, label: "Registry" },
      { num: 3, label: "Methodology" },
      { num: 4, label: "Location" },
      { num: 5, label: "Ownership" },
      { num: 6, label: "PDD" },
      { num: 7, label: "Dashboard" }
    ];
    return (
      <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                step === s.num
                  ? "bg-emerald-600 text-white"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs ml-1.5 whitespace-nowrap ${
                step === s.num ? "text-emerald-700 font-medium" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-6 sm:w-10 h-0.5 mx-1 sm:mx-2 ${step > s.num ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4">
            <Globe className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Blockvolt Developer Portal</h1>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Configure your carbon credit project — select a club, registry, and methodology to generate a pre‑filled PDD and dMRV dashboard.
          </p>
        </div>

        <StepIndicator />

        <div className="space-y-8">
          {step >= 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 wizard-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
                <h2 className="text-xl font-semibold text-gray-900">Select Project Club</h2>
              </div>
              <ClubsGrid />
            </div>
          )}

          {step >= 2 && club && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 wizard-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
                <h2 className="text-xl font-semibold text-gray-900">Select Registry & Methodology</h2>
                {selectedRegistry && (
                  <span className="ml-auto text-xs text-gray-400">{club}</span>
                )}
              </div>
              <RegistryTable />
            </div>
          )}

          {step >= 3 && selectedRegistry && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 wizard-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">3</span>
                <h2 className="text-xl font-semibold text-gray-900">Methodology & BOQ</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MethodologySelector />
                <BOQCard />
              </div>
            </div>
          )}

          {step >= 4 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 wizard-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">4</span>
                <h2 className="text-xl font-semibold text-gray-900">Location & Land Ownership</h2>
              </div>
              <LocationMap />
            </div>
          )}

          {step >= 6 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 wizard-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">6</span>
                <h2 className="text-xl font-semibold text-gray-900">PDD / DPR Generation</h2>
              </div>
              <PDDGenerator />
            </div>
          )}

          {step >= 7 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 wizard-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">7</span>
                <h2 className="text-xl font-semibold text-gray-900">Developer Dashboard</h2>
              </div>
              <DeveloperDashboard />
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-xs text-gray-400">
          Blockvolt Developer Portal v1.0 — Powered by dMRV Agentic AI
        </div>
      </div>
    </div>
  );
}


export default ProjectWizard