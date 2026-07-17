import { useState, useMemo } from 'react';
import {
  Shield,
  Cpu,
  Layers,
  FileJson,
  Database,
  CheckCircle,
  AlertTriangle,
  Zap,
  Droplet,
  Wind,
  Building,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

export type ClubId =
  | 'CLUB1_DEFRA'
  | 'CLUB2_ASHRAE'
  | 'CLUB3_RE_EE'
  | 'CLUB4_NBS_ARR'
  | 'CLUB5_BIO'
  | 'CLUB6_COMMUNITY';

export interface IndustrialProfile {
  id: string;
  name: string;
  sector: 'STEEL' | 'ALUMINUM' | 'CEMENT';
  type: string;
  location: string;
  sku: string;
  annualBaselineGEI: number;
  currentProductOutput: number;
  defaultTelemetry: Record<string, number>;
}

export interface GatewayMetadata {
  gatewayId: string;
  firmwareVersion: string;
  containerHashes: Record<ClubId, string>;
  hsmSlot: string;
}

const INDUSTRIAL_PROFILES: IndustrialProfile[] = [
  {
    id: 'steel-eaf-01',
    name: 'GFL-Sub Electra Steel-1',
    sector: 'STEEL',
    type: 'Electric Arc Furnace (EAF)',
    location: 'Gujarat, India (Hazira Zone)',
    sku: 'SKU-STEEL-HR-EAF-04',
    annualBaselineGEI: 0.85,
    currentProductOutput: 1250,
    defaultTelemetry: {
      gridElectricityKwh: 650000,
      evaporativeWaterLossM3: 2450.5,
      pumpingEfficiencyKwhM3: 1.65,
      gridEmissionFactor: 0.00058,
      refrigerantLeakageKg: 4.2,
      refrigerantGwp: 2088,
      wasteHeatRecoveryKwh: 45000,
      offsetBiocharTons: 0,
    },
  },
  {
    id: 'steel-bfbof-02',
    name: 'Maha-Blast Steel-2',
    sector: 'STEEL',
    type: 'Blast Furnace / Basic Oxygen Furnace',
    location: 'Odisha, India',
    sku: 'SKU-STEEL-SLAB-BF-09',
    annualBaselineGEI: 1.98,
    currentProductOutput: 4500,
    defaultTelemetry: {
      gridElectricityKwh: 1200000,
      evaporativeWaterLossM3: 9800.0,
      pumpingEfficiencyKwhM3: 1.82,
      gridEmissionFactor: 0.00068,
      refrigerantLeakageKg: 12.5,
      refrigerantGwp: 1430,
      wasteHeatRecoveryKwh: 380000,
      offsetBiocharTons: 15.5,
    },
  },
  {
    id: 'alu-smelter-01',
    name: 'Ind-Alum Primary-1',
    sector: 'ALUMINUM',
    type: 'Primary Smelting (Hall-Héroult)',
    location: 'Gujarat, India',
    sku: 'SKU-AL-INGOT-997',
    annualBaselineGEI: 14.2,
    currentProductOutput: 650,
    defaultTelemetry: {
      gridElectricityKwh: 9100000,
      evaporativeWaterLossM3: 14200.0,
      pumpingEfficiencyKwhM3: 1.55,
      gridEmissionFactor: 0.00058,
      refrigerantLeakageKg: 18.0,
      refrigerantGwp: 2088,
      wasteHeatRecoveryKwh: 0,
      offsetBiocharTons: 0,
    },
  },
  {
    id: 'alu-recycle-02',
    name: 'EcoMelt SecondaryAlu-2',
    sector: 'ALUMINUM',
    type: 'Secondary Recycling & Remelting',
    location: 'Maharashtra, India',
    sku: 'SKU-AL-BILLET-6063',
    annualBaselineGEI: 0.95,
    currentProductOutput: 800,
    defaultTelemetry: {
      gridElectricityKwh: 280000,
      evaporativeWaterLossM3: 850.0,
      pumpingEfficiencyKwhM3: 1.4,
      gridEmissionFactor: 0.00061,
      refrigerantLeakageKg: 1.5,
      refrigerantGwp: 2088,
      wasteHeatRecoveryKwh: 65000,
      offsetBiocharTons: 5.0,
    },
  },
  {
    id: 'cement-dry-01',
    name: 'Kutch Portland Cement-1',
    sector: 'CEMENT',
    type: 'Dry Process Portland Clinker Line',
    location: 'Gujarat, India',
    sku: 'SKU-CEM-OPC-53',
    annualBaselineGEI: 0.82,
    currentProductOutput: 5000,
    defaultTelemetry: {
      gridElectricityKwh: 480000,
      evaporativeWaterLossM3: 3100.0,
      pumpingEfficiencyKwhM3: 1.95,
      gridEmissionFactor: 0.00058,
      refrigerantLeakageKg: 6.0,
      refrigerantGwp: 2088,
      wasteHeatRecoveryKwh: 210000,
      offsetBiocharTons: 0,
    },
  },
  {
    id: 'cement-blended-02',
    name: 'Saurashtra Slag Cement-2',
    sector: 'CEMENT',
    type: 'Blended Slag / Fly-Ash Milling Line',
    location: 'Gujarat, India',
    sku: 'SKU-CEM-PSC-02',
    annualBaselineGEI: 0.54,
    currentProductOutput: 6200,
    defaultTelemetry: {
      gridElectricityKwh: 390000,
      evaporativeWaterLossM3: 1850.0,
      pumpingEfficiencyKwhM3: 1.7,
      gridEmissionFactor: 0.00058,
      refrigerantLeakageKg: 2.1,
      refrigerantGwp: 2088,
      wasteHeatRecoveryKwh: 185000,
      offsetBiocharTons: 25.0,
    },
  },
];

const GATEWAY_CONFIG: GatewayMetadata = {
  gatewayId: 'BLK-GW-H10-SECURE-NODE-0X9F4',
  firmwareVersion: 'v4.14.2-HSM-PROD',
  containerHashes: {
    CLUB1_DEFRA: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    CLUB2_ASHRAE: 'sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b496264d1d124',
    CLUB3_RE_EE: 'sha256:9c1a3b8d7e6f5e4c3b2a1a0f9e8d7c6b5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d',
    CLUB4_NBS_ARR: 'sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    CLUB5_BIO: 'sha256:7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e',
    CLUB6_COMMUNITY: 'sha256:0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e',
  },
  hsmSlot: 'Hardware-HSM-Slot-03-Nitro',
};

const generateMockSignature = (payloadString: string) => {
  let hash = 0;
  for (let i = 0; i < payloadString.length; i++) {
    const char = payloadString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `0xSIG_DEMO_${Math.abs(hash).toString(16).toUpperCase()}_F82D91`;
};

const generateMockMerkleRoot = (sig: string, id: string) => {
  return `0xMRKL_DEMO_${btoa(sig + id).slice(0, 16).toUpperCase()}`;
};

export default function DMRVCalculator() {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    INDUSTRIAL_PROFILES[0].id
  );
  const [telemetryOverrides, setTelemetryOverrides] = useState<
    Record<string, number>
  >({});
  const [activeTab, setActiveTab] = useState<'METRICS' | 'JSON_PAYLOAD'>(
    'METRICS'
  );

  const activeProfile = useMemo(() => {
    const base = INDUSTRIAL_PROFILES.find(
      (p) => p.id === selectedProfileId
    )!;
    return {
      ...base,
      telemetry: { ...base.defaultTelemetry, ...telemetryOverrides },
    };
  }, [selectedProfileId, telemetryOverrides]);

  const handleTelemetryChange = (key: string, value: number) => {
    setTelemetryOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const resetTelemetry = () => setTelemetryOverrides({});

  const computationResults = useMemo(() => {
    const t = activeProfile.telemetry;

    const club1PumpingEnergyKwh =
      t.evaporativeWaterLossM3 * t.pumpingEfficiencyKwhM3;
    const club1EmissionsTons = club1PumpingEnergyKwh * t.gridEmissionFactor;
    const club1TokensMinted = Math.floor(club1EmissionsTons);

    const club2GridEmissions = t.gridElectricityKwh * t.gridEmissionFactor;
    const club2RefrigerantEmissions =
      (t.refrigerantLeakageKg / 1000) * t.refrigerantGwp;
    const club2TotalGrossEmissions =
      club2GridEmissions + club2RefrigerantEmissions;
    const club2TokensMinted = Math.floor(club2TotalGrossEmissions);

    const club3AvoidedEmissions =
      t.wasteHeatRecoveryKwh * t.gridEmissionFactor;
    const club3TokensMinted = Math.floor(club3AvoidedEmissions * 10) / 10;

    const club4SequestrationTons =
      activeProfile.currentProductOutput * 0.002;
    const club4TokensMinted = Math.floor(club4SequestrationTons * 100) / 100;

    const club5AvoidedEmissions = t.offsetBiocharTons * 2.85;
    const club5TokensMinted = Math.floor(club5AvoidedEmissions);

    const club6AvoidedEmissions = activeProfile.currentProductOutput * 0.005;
    const club6TokensMinted = Math.floor(club6AvoidedEmissions);

    const totalBlackLiability =
      club1EmissionsTons + club2TotalGrossEmissions;
    const totalGreenCredits =
      club3AvoidedEmissions +
      club4SequestrationTons +
      club5AvoidedEmissions +
      club6AvoidedEmissions;

    const netEmissions = totalBlackLiability - totalGreenCredits;
    const calculatedGEI =
      activeProfile.currentProductOutput > 0
        ? netEmissions / activeProfile.currentProductOutput
        : 0;

    // Total energy consumed = grid electricity + pumping energy + WHR (recovered)
    // Kept separate from carbon so energy and carbon ledgers are independent.
    const totalEnergyConsumedKwh =
      t.gridElectricityKwh + club1PumpingEnergyKwh;
    const totalEnergyRecoveredKwh = t.wasteHeatRecoveryKwh;
    const netEnergyKwh = totalEnergyConsumedKwh - totalEnergyRecoveredKwh;

    // Embedded carbon per gram of product (tCO2e/tonne → kgCO2e/kg → gCO2e/g)
    // 1 tCO2e/tonne = 1 kgCO2e/kg = 1 gCO2e/g, so GEI value maps directly.
    const embeddedCarbonPerGram = calculatedGEI; // gCO2e per gram of product
    const embeddedCarbonPerKg = calculatedGEI; // kgCO2e per kg of product

    // Energy intensity per gram of product (kWh/tonne → Wh/kg → mWh/g)
    const energyIntensityPerGram =
      activeProfile.currentProductOutput > 0
        ? (netEnergyKwh / activeProfile.currentProductOutput) * 1000 // Wh/kg
        : 0;

    const geiReductionPercentage =
      activeProfile.annualBaselineGEI !== 0
        ? ((activeProfile.annualBaselineGEI - calculatedGEI) /
            activeProfile.annualBaselineGEI) *
          100
        : 0;
    const complianceStatus =
      calculatedGEI <= activeProfile.annualBaselineGEI
        ? 'COMPLIANT'
        : 'NON_COMPLIANT';

    return {
      club1: {
        pumpingEnergyKwh: club1PumpingEnergyKwh,
        emissions: club1EmissionsTons,
        tokens: club1TokensMinted,
      },
      club2: {
        gridEmissions: club2GridEmissions,
        refrigerantEmissions: club2RefrigerantEmissions,
        totalEmissions: club2TotalGrossEmissions,
        tokens: club2TokensMinted,
      },
      club3: {
        avoidedEmissions: club3AvoidedEmissions,
        tokens: club3TokensMinted,
      },
      club4: {
        sequestration: club4SequestrationTons,
        tokens: club4TokensMinted,
      },
      club5: {
        avoidedEmissions: club5AvoidedEmissions,
        tokens: club5TokensMinted,
      },
      club6: {
        avoidedEmissions: club6AvoidedEmissions,
        tokens: club6TokensMinted,
      },
      energyLedger: {
        totalEnergyConsumedKwh,
        totalEnergyRecoveredKwh,
        netEnergyKwh,
        energyIntensityWhPerKg: energyIntensityPerGram,
      },
      embeddedCarbon: {
        perGram: embeddedCarbonPerGram,
        perKg: embeddedCarbonPerKg,
        perTonne: calculatedGEI,
        unit: 'gCO2e/g (equivalently kgCO2e/kg or tCO2e/tonne)',
      },
      aggregates: {
        totalBlackLiability,
        totalGreenCredits,
        netEmissions,
        calculatedGEI,
        geiReductionPercentage,
        complianceStatus,
      },
    };
  }, [activeProfile]);

  const liveEdgeJsonFrame = useMemo(() => {
    const payload = {
      edgeGatewayMetadata: {
        gatewayId: GATEWAY_CONFIG.gatewayId,
        firmware: GATEWAY_CONFIG.firmwareVersion,
        hsmCryptographicSlot: GATEWAY_CONFIG.hsmSlot,
        timestampEpoch: Math.floor(Date.now() / 1000),
        isoDateTime: new Date().toISOString(),
      },
      skuAttribution: {
        productId: activeProfile.id,
        skuCode: activeProfile.sku,
        sectorClassification: activeProfile.sector,
        facilityType: activeProfile.type,
        productionBatchVolumeTonnes: activeProfile.currentProductOutput,
      },
      rawModbusTelemetryBuffer: activeProfile.telemetry,
      isolatedCalculationEngines: {
        blackTokenClub1Defra: {
          containerHash: GATEWAY_CONFIG.containerHashes.CLUB1_DEFRA,
          evaluatedFormula:
            'CO2e = (WaterLossM3 * PumpingEffKwhM3) * GridEF',
          computedOutputs: {
            derivedPumpingEnergyKwh: computationResults.club1.pumpingEnergyKwh,
            calculatedCO2eTons: computationResults.club1.emissions,
            mintedBlackLiabilityTokens: computationResults.club1.tokens,
          },
        },
        blackTokenClub2Ashrae: {
          containerHash: GATEWAY_CONFIG.containerHashes.CLUB2_ASHRAE,
          evaluatedFormula:
            'CO2e = (ElectricityKwh * GridEF) + ((RefrigerantKg / 1000) * GWP)',
          computedOutputs: {
            facilityGridEmissionsTons: computationResults.club2.gridEmissions,
            refrigerantFugitiveEmissionsTons:
              computationResults.club2.refrigerantEmissions,
            netOperationalEmissionsTons:
              computationResults.club2.totalEmissions,
            mintedBlackLiabilityTokens: computationResults.club2.tokens,
          },
        },
        greenTokenClub1ReEe: {
          containerHash: GATEWAY_CONFIG.containerHashes.CLUB3_RE_EE,
          computedOutputs: {
            avoidedEmissionsTons: computationResults.club3.avoidedEmissions,
            mintedGreenTokens: computationResults.club3.tokens,
          },
        },
        greenTokenClub2NbsArr: {
          containerHash: GATEWAY_CONFIG.containerHashes.CLUB4_NBS_ARR,
          computedOutputs: {
            calculatedSequestrationTons:
              computationResults.club4.sequestration,
            mintedGreenTokens: computationResults.club4.tokens,
          },
        },
        greenTokenClub3Biochar: {
          containerHash: GATEWAY_CONFIG.containerHashes.CLUB5_BIO,
          computedOutputs: {
            stabilizationAvoidedTons:
              computationResults.club5.avoidedEmissions,
            mintedGreenTokens: computationResults.club5.tokens,
          },
        },
        greenTokenClub4Community: {
          containerHash: GATEWAY_CONFIG.containerHashes.CLUB6_COMMUNITY,
          computedOutputs: {
            avoidedEmissionsTons: computationResults.club6.avoidedEmissions,
            mintedGreenTokens: computationResults.club6.tokens,
          },
        },
      },
      realTimeLedgerState: {
        facilityBaselineGEI: activeProfile.annualBaselineGEI,
        calculatedBatchGEI: computationResults.aggregates.calculatedGEI,
        netBatchCarbonBalanceTCO2e: computationResults.aggregates.netEmissions,
        regulatoryComplianceStatus:
          computationResults.aggregates.complianceStatus,
        energyLedger: {
          totalEnergyConsumedKwh:
            computationResults.energyLedger.totalEnergyConsumedKwh,
          totalEnergyRecoveredKwh:
            computationResults.energyLedger.totalEnergyRecoveredKwh,
          netEnergyKwh: computationResults.energyLedger.netEnergyKwh,
          energyIntensityWhPerKg:
            computationResults.energyLedger.energyIntensityWhPerKg,
        },
        embeddedCarbonPerGramOfProduct:
          computationResults.embeddedCarbon.perGram,
        embeddedCarbonPerKgOfProduct:
          computationResults.embeddedCarbon.perKg,
        embeddedCarbonUnit:
          computationResults.embeddedCarbon.unit,
        icmPortalFormA_AutofillPayload: {
          field_104_gross_emissions:
            computationResults.aggregates.totalBlackLiability,
          field_105_credited_mitigation:
            computationResults.aggregates.totalGreenCredits,
          field_106_net_gei_score: computationResults.aggregates.calculatedGEI,
          field_107_total_energy_consumed_kwh:
            computationResults.energyLedger.totalEnergyConsumedKwh,
          field_108_energy_recovered_kwh:
            computationResults.energyLedger.totalEnergyRecoveredKwh,
          field_109_embedded_carbon_per_gram:
            computationResults.embeddedCarbon.perGram,
          field_110_energy_intensity_wh_per_kg:
            computationResults.energyLedger.energyIntensityWhPerKg,
        },
      },
    };

    const payloadStr = JSON.stringify(payload, null, 2);
    const signature = generateMockSignature(payloadStr);
    const merkleRoot = generateMockMerkleRoot(signature, activeProfile.id);

    return {
      stringified: payloadStr,
      cryptoAnchor: {
        hardwareSignature: signature,
        merkleTreeRootHash: merkleRoot,
        attestationStatus:
          'SIMULATED_DEMO_ONLY_NOT_A_REAL_ATTESTATION',
      },
    };
  }, [activeProfile, computationResults]);

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased rounded-xl overflow-hidden">
      <div className="p-4 md:p-8">
        <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold tracking-widest uppercase mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Edge Gateway dMRV Node Active
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Layers className="text-emerald-500 w-8 h-8" />
              Blockvolt CIVV Edge Calculator
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1">
              Demo carbon asset & liability ledger calculator simulating
              high-fidelity industrial telemetry pipelines for CCTS & CBAM
              style accounting frameworks. All cryptographic values below are
              simulated for demonstration only.
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono flex flex-col gap-1 w-full md:w-auto">
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">GATEWAY_ID:</span>
              <span className="text-blue-400 font-bold">
                {GATEWAY_CONFIG.gatewayId}
              </span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">FW_VERSION:</span>
              <span className="text-slate-300">
                {GATEWAY_CONFIG.firmwareVersion}
              </span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">HSM_MODULE:</span>
              <span className="text-emerald-400">
                {GATEWAY_CONFIG.hsmSlot}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Target Industrial Node
              </h2>
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-mono text-slate-500">
                  Select Monitored Asset (6 Test Cases)
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => {
                    setSelectedProfileId(e.target.value);
                    setTelemetryOverrides({});
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {INDUSTRIAL_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      [{profile.sector}] {profile.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/60 text-xs space-y-3 font-mono">
                <div className="border-b border-slate-900 pb-2">
                  <span className="text-slate-500 block text-[10px] uppercase">
                    SKU Attribution Registry
                  </span>
                  <span className="text-emerald-400 font-bold text-sm tracking-tight">
                    {activeProfile.sku}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      SECTOR
                    </span>
                    {activeProfile.sector}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      PROCESS LINE
                    </span>
                    {activeProfile.type}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    GEOGRAPHICAL COMPLIANCE ZONE
                  </span>
                  <span className="text-slate-200 text-[11px]">
                    {activeProfile.location}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      REGULATORY BASELINE
                    </span>
                    <span className="text-yellow-500 font-bold">
                      {activeProfile.annualBaselineGEI}{' '}
                      <span className="text-[9px] font-normal text-slate-400">
                        tCO2e/t
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">
                      EPOCH OUTPUT
                    </span>
                    <span className="text-blue-400 font-bold">
                      {activeProfile.currentProductOutput}{' '}
                      <span className="text-[9px] font-normal text-slate-400">
                        Tonnes
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono text-slate-400">
                  Hardware Attestation
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                DEMO_KEY
              </span>
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Modbus Ingestion Register Pipeline (15-Min Buffer)
              </h2>
              <button
                onClick={resetTelemetry}
                disabled={Object.keys(telemetryOverrides).length === 0}
                className="text-xs font-mono flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
              >
                <RefreshCw className="w-3 h-3" /> Reset Registers
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3.5 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
                <h3 className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" /> Evaporative &
                  Fluid Dynamics
                </h3>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Evaporative Water Loss (m³)
                    </span>
                    <span className="text-slate-500">Reg: 0x4001</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={activeProfile.telemetry.evaporativeWaterLossM3}
                    onChange={(e) =>
                      handleTelemetryChange(
                        'evaporativeWaterLossM3',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Pumping Specific Work (kWh/m³)
                    </span>
                    <span className="text-slate-500">Reg: 0x4002</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={activeProfile.telemetry.pumpingEfficiencyKwhM3}
                    onChange={(e) =>
                      handleTelemetryChange(
                        'pumpingEfficiencyKwhM3',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3.5 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
                <h3 className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" /> Operational
                  Power & Fugitives
                </h3>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Grid Import Energy (kWh)
                    </span>
                    <span className="text-slate-500">Reg: 0x4010</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={activeProfile.telemetry.gridElectricityKwh}
                    onChange={(e) =>
                      handleTelemetryChange(
                        'gridElectricityKwh',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-yellow-500 font-mono focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Refrigerant Leakage Velocity (kg)
                    </span>
                    <span className="text-slate-500">Reg: 0x4024</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={activeProfile.telemetry.refrigerantLeakageKg}
                    onChange={(e) =>
                      handleTelemetryChange(
                        'refrigerantLeakageKg',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-purple-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-3.5 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 md:col-span-2">
                <h3 className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" /> Mitigation &
                  Offset Injection Buffers
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">
                        WHR Clean Generation (kWh)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="100"
                      value={activeProfile.telemetry.wasteHeatRecoveryKwh}
                      onChange={(e) =>
                        handleTelemetryChange(
                          'wasteHeatRecoveryKwh',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">
                        High-Temp Biochar Fixed (Tons)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={activeProfile.telemetry.offsetBiocharTons}
                      onChange={(e) =>
                        handleTelemetryChange(
                          'offsetBiocharTons',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">
                        Grid EF (tCO₂e/kWh)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.00001"
                      value={activeProfile.telemetry.gridEmissionFactor}
                      onChange={(e) =>
                        handleTelemetryChange(
                          'gridEmissionFactor',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-400 font-mono focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 opacity-[0.02] pointer-events-none font-mono text-[120px] text-white select-none whitespace-nowrap font-black">
            CCTS_CORE
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                Gross Industrial Liabilities
              </span>
              <span className="text-3xl font-black text-red-500 font-mono tracking-tight">
                {computationResults.aggregates.totalBlackLiability.toFixed(4)}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-1">
                tCO₂e Across Black Clubs
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between border-l border-slate-800/80 pl-0 md:pl-6">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                Real-time Mitigation Credits
              </span>
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {computationResults.aggregates.totalGreenCredits.toFixed(4)}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-1">
                tCO₂e Clean Tokenized Offsets
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between border-l border-slate-800/80 pl-0 md:pl-6">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                Calculated Epoch GEI Score
              </span>
              <span className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                {computationResults.aggregates.calculatedGEI.toFixed(5)}
                <span className="text-xs font-normal text-slate-500">
                  tCO₂e/T
                </span>
              </span>
              <span className="text-xs text-slate-400 font-mono block mt-1">
                Target Baseline:{' '}
                <span className="text-yellow-500 font-bold">
                  {activeProfile.annualBaselineGEI}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center items-start border-l border-slate-800/80 pl-0 md:pl-6 bg-slate-950/40 p-4 rounded-lg border border-slate-800/40">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
              ICM Platform Status
            </span>
            {computationResults.aggregates.complianceStatus === 'COMPLIANT' ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20 w-full justify-center">
                <CheckCircle className="w-4 h-4 shrink-0" />
                COMPLIANT (+
                {computationResults.aggregates.geiReductionPercentage.toFixed(
                  1
                )}
                %)
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-sm bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 w-full justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                NON-COMPLIANT
              </div>
            )}
            <span className="text-[9px] font-mono text-slate-500 mt-2 text-center block w-full">
              Form A Autofill State Standardized
            </span>
          </div>
        </section>

        {/* Energy & Embedded Carbon Ledger — kept separate from carbon tokens */}
        <section className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Energy & Embedded Carbon Ledger (Independent from Token Ledger)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Total Energy Consumed</span>
              <span className="text-xl font-black text-yellow-500 font-mono">
                {computationResults.energyLedger.totalEnergyConsumedKwh.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-1">kWh (Grid + Pumping)</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Energy Recovered (WHR)</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {computationResults.energyLedger.totalEnergyRecoveredKwh.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-1">kWh</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Net Energy Intensity</span>
              <span className="text-xl font-black text-blue-400 font-mono">
                {computationResults.energyLedger.energyIntensityWhPerKg.toFixed(4)}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-1">Wh/kg of product</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Embedded Carbon per Gram</span>
              <span className="text-xl font-black text-red-400 font-mono">
                {computationResults.embeddedCarbon.perGram.toFixed(6)}
              </span>
              <span className="text-xs text-slate-500 font-mono block mt-1">gCO₂e / gram of product</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Embedded per kg:</span> <span className="text-slate-300">{computationResults.embeddedCarbon.perKg.toFixed(5)} kgCO₂e/kg</span></div>
              <div className="flex justify-between mt-1"><span className="text-slate-500">Embedded per tonne:</span> <span className="text-slate-300">{computationResults.embeddedCarbon.perTonne.toFixed(5)} tCO₂e/tonne</span></div>
              <div className="flex justify-between mt-1"><span className="text-slate-500">Net energy (kWh):</span> <span className="text-slate-300">{computationResults.energyLedger.netEnergyKwh.toLocaleString()} kWh</span></div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 font-mono text-[11px] text-slate-500">
              <span className="text-slate-400 font-semibold block mb-1">Ledger Separation Note</span>
              Energy and carbon are tracked independently. Black tokens (1 tCO₂e = 1 token) and green tokens (1 tCO₂e removed/avoided = 1 token) are minted separately. Energy intensity (Wh/kg) and embedded carbon (gCO₂e/g) are reported as independent metrics per gram of product.
            </div>
          </div>
        </section>

        <div className="mb-4 flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-150 border-b-2 font-mono ${
              activeTab === 'METRICS'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" /> 6-Club Asset Matrix
            </div>
          </button>
          <button
            onClick={() => setActiveTab('JSON_PAYLOAD')}
            className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-150 border-b-2 font-mono ${
              activeTab === 'JSON_PAYLOAD'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4" /> Live Cryptographic JSON Output
            </div>
          </button>
        </div>

        {activeTab === 'METRICS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                badge: 'BLACK TOKEN CLUB 1',
                title: 'Defra Pumping Engine',
                desc: 'Calculates indirect liability from electrical energy required to pump replacement water lost to facility evaporation circuits.',
                details: [
                  {
                    label: 'Pumping Load:',
                    value: `${computationResults.club1.pumpingEnergyKwh.toFixed(2)} kWh`,
                  },
                  {
                    label: 'Calculated CO₂e:',
                    value: `${computationResults.club1.emissions.toFixed(5)} t`,
                    highlight: 'red',
                  },
                ],
                tokens: computationResults.club1.tokens,
                tokenType: 'BLACK',
              },
              {
                badge: 'BLACK TOKEN CLUB 2',
                title: 'ASHRAE Standard 228',
                desc: 'Evaluates net operational framework building balance including raw electricity draw and metric fugitive HVAC refrigerant losses.',
                details: [
                  {
                    label: 'Grid Footprint:',
                    value: `${computationResults.club2.gridEmissions.toFixed(4)} t`,
                  },
                  {
                    label: 'Fugitive Losses:',
                    value: `${computationResults.club2.refrigerantEmissions.toFixed(4)} t`,
                  },
                  {
                    label: 'Total Balance:',
                    value: `${computationResults.club2.totalEmissions.toFixed(4)} t`,
                    highlight: 'white',
                  },
                ],
                tokens: computationResults.club2.tokens,
                tokenType: 'BLACK',
              },
              {
                badge: 'GREEN TOKEN CLUB 1',
                title: 'RE + Energy Efficiency',
                desc: 'Tracks avoided grid emissions derived from on-site generation integrations like Waste Heat Recovery (WHR) loops.',
                details: [
                  {
                    label: 'WHR Volume:',
                    value: `${activeProfile.telemetry.wasteHeatRecoveryKwh} kWh`,
                  },
                  {
                    label: 'Avoided CO₂e:',
                    value: `${computationResults.club3.avoidedEmissions.toFixed(4)} t`,
                    highlight: 'green',
                  },
                ],
                tokens: computationResults.club3.tokens,
                tokenType: 'GREEN',
              },
              {
                badge: 'GREEN TOKEN CLUB 2',
                title: 'NBS / ARR / AWD / ERW',
                desc: 'Nature-Based Solutions, Enhanced Rock Weathering and Alternate Wetting/Drying agriculture buffer monitoring modules.',
                details: [
                  {
                    label: 'Sequestration Rate:',
                    value: '0.002 t/Batch Tonne',
                  },
                  {
                    label: 'Calculated Offsets:',
                    value: `${computationResults.club4.sequestration.toFixed(4)} t`,
                    highlight: 'green',
                  },
                ],
                tokens: computationResults.club4.tokens,
                tokenType: 'GREEN',
              },
              {
                badge: 'GREEN TOKEN CLUB 3',
                title: 'Bio-Molecules & Biochar',
                desc: 'Advanced technical tracking evaluating high-stability pyrolysis biochar, SAF, bio-methanol, and synthetic gas configurations.',
                details: [
                  {
                    label: 'Biochar Mass Co-Location:',
                    value: `${activeProfile.telemetry.offsetBiocharTons} Tons`,
                  },
                  {
                    label: 'Avoided Footprint:',
                    value: `${computationResults.club5.avoidedEmissions.toFixed(4)} t`,
                    highlight: 'green',
                  },
                ],
                tokens: computationResults.club5.tokens,
                tokenType: 'GREEN',
              },
              {
                badge: 'GREEN TOKEN CLUB 4',
                title: 'Community Cookstoves',
                desc: 'UNFCCC MEP / Gold Standard clean distribution tracking framework assessing socio-environmental regional offset points.',
                details: [
                  {
                    label: 'MEP Allocation Multiplier:',
                    value: '0.005 fixed',
                  },
                  {
                    label: 'Avoided Factor:',
                    value: `${computationResults.club6.avoidedEmissions.toFixed(4)} t`,
                    highlight: 'green',
                  },
                ],
                tokens: computationResults.club6.tokens,
                tokenType: 'GREEN',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        card.tokenType === 'BLACK'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {card.badge}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Isolated Container
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    {card.desc}
                  </p>

                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/60 font-mono text-xs space-y-2 mb-4">
                    {card.details.map((d, i) => (
                      <div
                        key={i}
                        className={`flex justify-between ${
                          d.highlight === 'white'
                            ? 'border-t border-slate-900 pt-1 text-slate-200 font-semibold'
                            : ''
                        }`}
                      >
                        <span className="text-slate-500">{d.label}</span>
                        <span
                          className={
                            d.highlight === 'red'
                              ? 'text-red-400 font-semibold'
                              : d.highlight === 'green'
                              ? 'text-emerald-400 font-semibold'
                              : 'text-slate-300'
                          }
                        >
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                  <span className="text-xs font-mono text-slate-400">
                    Minted {card.tokenType === 'BLACK' ? 'Liability' : 'Asset'}:
                  </span>
                  <span
                    className={`text-sm font-black font-mono px-2 py-0.5 border rounded ${
                      card.tokenType === 'BLACK'
                        ? 'text-red-500 bg-red-950/60 border-red-800/80'
                        : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
                    }`}
                  >
                    {card.tokens} {card.tokenType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'JSON_PAYLOAD' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs overflow-auto max-h-[600px] shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                <span className="text-slate-400 font-bold flex items-center gap-2">
                  <FileJson className="text-blue-400 w-4 h-4" />{' '}
                  EDGE_LEDGER_BROADCAST_FRAME.json
                </span>
                <span className="text-[10px] text-slate-500">
                  UTF-8 / Encoding Verified
                </span>
              </div>
              <pre className="text-slate-300 whitespace-pre text-left">
                {liveEdgeJsonFrame.stringified}
              </pre>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white uppercase font-mono mb-3 tracking-wider flex items-center gap-2">
                  <Shield className="text-emerald-400 w-4 h-4" /> Demo Signature
                  Anchor
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  The values below are generated by a simple in-browser
                  checksum for demo purposes only. They are not real
                  cryptographic signatures and provide no security guarantee —
                  do not use this pattern in production.
                </p>

                <div className="space-y-4 font-mono text-[11px]">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500 block mb-1 uppercase text-[9px]">
                      Demo Checksum Signature
                    </span>
                    <span className="text-blue-400 break-all select-all font-bold">
                      {liveEdgeJsonFrame.cryptoAnchor.hardwareSignature}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500 block mb-1 uppercase text-[9px]">
                      Demo Merkle-style Root
                    </span>
                    <span className="text-yellow-500 break-all select-all font-bold">
                      {liveEdgeJsonFrame.cryptoAnchor.merkleTreeRootHash}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    State:{' '}
                    {liveEdgeJsonFrame.cryptoAnchor.attestationStatus}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs text-slate-400">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-purple-400" /> VVB Audit
                  Trail Verification
                </h4>
                <p className="text-[11px] leading-relaxed">
                  In a production deployment, third-party verification
                  entities (VVB) would query a secure gateway hash registry to
                  confirm calculation containers conform to ISO 14064-3 and
                  CCTS mandates, backed by real HSM-issued signatures rather
                  than the demo checksum used here.
                </p>
                <div className="bg-slate-950 p-2.5 rounded text-[10px] space-y-1 text-slate-500 border border-slate-800">
                  <div>
                    Defra Image Hash:{' '}
                    <span className="text-slate-400">
                      {GATEWAY_CONFIG.containerHashes.CLUB1_DEFRA.slice(0, 20)}
                      ...
                    </span>
                  </div>
                  <div>
                    ASHRAE Image Hash:{' '}
                    <span className="text-slate-400">
                      {GATEWAY_CONFIG.containerHashes.CLUB2_ASHRAE.slice(0, 20)}
                      ...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-slate-500 gap-4">
          <div>
            Continuous Inversion dMRV Architecture &copy; 2026 Blockvolt Power
            Systems (Demo Build)
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-500/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ICM
              API SIMULATED
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">BEE Form-A Automated Pipeline</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
