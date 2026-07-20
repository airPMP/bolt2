// ── Shared dMRV Calculator Engine (client-side) ──
// Mirrors the /calculate edge function logic for instant client-side computation.

export type Club = 'black' | 'green';
export type BlackSubType = 'defra' | 'ashrae228';
export type GreenSubType = 're' | 'nbs_arr' | 'biochar' | 'cookstove';

export const EF_GRID_TCO2_PER_KWH = 0.00058;
export const EF_GRID_TCO2_PER_MWH = 0.82;

export interface DefraResult {
  plantId: string;
  club: 'black';
  subType: 'defra';
  pumpingEnergy_kwh: number;
  emissions_tco2e: number;
  blackTokensMinted: number;
  cumulativeUnminted: number;
  methodology: string;
  registry: string;
  compliance_ready: boolean;
}

export interface AshraeResult {
  plantId: string;
  club: 'black';
  subType: 'ashrae228';
  imported_emissions_tco2e: number;
  exported_credit_tco2e: number;
  refrigerant_leakage_tco2e: number;
  net_emissions_tco2e: number;
  blackTokensMinted: number;
  cumulativeUnminted: number;
  methodology: string;
  registry: string;
  compliance_ready: boolean;
}

export interface RecResult {
  plantId: string;
  club: 'green';
  subType: 're';
  MWh_generated: number;
  RECs_issued: number;
  avoided_tco2e: number;
  methodology: string;
  registry: string;
  energyTag: boolean;
}

export interface NbsArrResult {
  plantId: string;
  club: 'green';
  subType: 'nbs_arr';
  tree_count: number;
  total_biomass_t: number;
  tco2e_sequestered: number;
  methodology: string;
  registry: string;
}

export interface BiocharResult {
  plantId: string;
  club: 'green';
  subType: 'biochar';
  dryMass_kg: number;
  grossCDR_tco2e: number;
  processEmissions_tco2e: number;
  transportEmissions_tco2e: number;
  netCDR_tco2e: number;
  permanenceAdjusted_tco2e: number;
  methodology: string;
  registry: string;
}

export interface CookstoveResult {
  plantId: string;
  club: 'green';
  subType: 'cookstove';
  fuel_saved_tonnes: number;
  emission_factor: number;
  leakage_pct: number;
  emissionReductions_tco2e: number;
  methodology: string;
  registry: string;
}

export type CalcResult =
  | DefraResult
  | AshraeResult
  | RecResult
  | NbsArrResult
  | BiocharResult
  | CookstoveResult;

export function defraCalc(plantId: string, sensorData: Record<string, any>): DefraResult {
  const V_evap_m3 = sensorData.V_evap_m3 ?? sensorData.evaporativeWaterLossM3 ?? 0;
  const EC_pump = sensorData.EC_pump ?? sensorData.pumpingEfficiencyKwhM3 ?? 1.635;
  const EF_grid = sensorData.EF_grid_tco2_per_kwh ?? sensorData.gridEmissionFactor ?? EF_GRID_TCO2_PER_KWH;

  const pumpingEnergy_kwh = V_evap_m3 * EC_pump;
  const emissions_tco2e = pumpingEnergy_kwh * EF_grid;
  const blackTokens = Math.floor(emissions_tco2e);
  const remaining = +(emissions_tco2e - blackTokens).toFixed(6);

  return {
    plantId,
    club: 'black',
    subType: 'defra',
    pumpingEnergy_kwh: +pumpingEnergy_kwh.toFixed(4),
    emissions_tco2e: +emissions_tco2e.toFixed(6),
    blackTokensMinted: blackTokens,
    cumulativeUnminted: remaining,
    methodology: 'DEFRA_Evaporative_v1',
    registry: 'CCTS (NSDL)',
    compliance_ready: true,
  };
}

export function ashraeCalc(plantId: string, sensorData: Record<string, any>): AshraeResult {
  const E_import_kwh = sensorData.E_import_kwh ?? sensorData.gridElectricityKwh ?? 0;
  const EF_import = sensorData.EF_import ?? sensorData.gridEmissionFactor ?? EF_GRID_TCO2_PER_KWH;
  const E_export_kwh = sensorData.E_export_kwh ?? sensorData.wasteHeatRecoveryKwh ?? 0;
  const EF_export = sensorData.EF_export ?? EF_GRID_TCO2_PER_KWH;
  const refrigerant_charge_kg = sensorData.refrigerant_charge_kg ?? sensorData.refrigerantLeakageKg ?? 0;
  const leak_rate_pct = sensorData.leak_rate_pct ?? 10;
  const GWP_refrigerant = sensorData.GWP_refrigerant ?? sensorData.refrigerantGwp ?? 2088;

  const imported_emissions = E_import_kwh * EF_import;
  const exported_credit = E_export_kwh * EF_export;
  const refrigerant_leakage = (refrigerant_charge_kg * (leak_rate_pct / 100) * GWP_refrigerant) / 1000;
  const net_emissions = imported_emissions - exported_credit + refrigerant_leakage;
  const blackTokens = net_emissions > 0 ? Math.floor(net_emissions) : 0;
  const remaining = +(net_emissions - blackTokens).toFixed(6);

  return {
    plantId,
    club: 'black',
    subType: 'ashrae228',
    imported_emissions_tco2e: +imported_emissions.toFixed(6),
    exported_credit_tco2e: +exported_credit.toFixed(6),
    refrigerant_leakage_tco2e: +refrigerant_leakage.toFixed(6),
    net_emissions_tco2e: +net_emissions.toFixed(6),
    blackTokensMinted: blackTokens,
    cumulativeUnminted: remaining,
    methodology: 'ASHRAE_228_NetZero_v1',
    registry: 'CCTS (NSDL)',
    compliance_ready: true,
  };
}

export function recCalc(plantId: string, sensorData: Record<string, any>): RecResult {
  const MWh_generated = sensorData.MWh_generated ?? (sensorData.wasteHeatRecoveryKwh ? sensorData.wasteHeatRecoveryKwh / 1000 : 0);
  const EF_grid = sensorData.EF_grid_tco2_per_mwh ?? EF_GRID_TCO2_PER_MWH;

  const RECs = Math.floor(MWh_generated);
  const avoided_tco2e = RECs * EF_grid;

  return {
    plantId,
    club: 'green',
    subType: 're',
    MWh_generated: +MWh_generated.toFixed(4),
    RECs_issued: RECs,
    avoided_tco2e: +avoided_tco2e.toFixed(6),
    methodology: 'ACM0002_A6.4-MEP014-A03',
    registry: 'I-REC / CERC REC',
    energyTag: true,
  };
}

export function nbsArrCalc(plantId: string, trees: Array<{ dbh_cm: number; height_m: number; species: string }>): NbsArrResult {
  const carbon_fraction = 0.47;
  let total_biomass_t = 0;

  for (const tree of trees) {
    const agb_kg = 0.0673 * Math.pow(tree.dbh_cm, 2.528);
    total_biomass_t += agb_kg / 1000;
  }

  const carbon_t = total_biomass_t * carbon_fraction;
  const co2e_t = carbon_t * (44 / 12);

  return {
    plantId,
    club: 'green',
    subType: 'nbs_arr',
    tree_count: trees.length,
    total_biomass_t: +total_biomass_t.toFixed(6),
    tco2e_sequestered: +co2e_t.toFixed(6),
    methodology: 'VM0047_ARR_v1',
    registry: 'Verra VCS',
  };
}

export function biocharCalc(plantId: string, sensorData: Record<string, any>): BiocharResult {
  const M_biochar = sensorData.biocharMass ?? sensorData.M_biochar ?? 0;
  const fC_fixed = (sensorData.fixedCarbonPct ?? sensorData.fC_fixed ?? 78.4) / 100;
  const E_proc = (sensorData.parasiticEnergy ?? sensorData.E_proc ?? 0) * 0.00082;
  const E_transport = (sensorData.transportDistance ?? 0) * (M_biochar / 1000) * 0.0001;
  const permanenceFactor = sensorData.permanenceFactor ?? 0.915;

  const dryMass = M_biochar * (1 - (sensorData.moisturePct ?? 8.5) / 100);
  const grossCDR = dryMass * fC_fixed * (44 / 12);
  const netCDR = grossCDR - E_proc - E_transport;
  const permanenceAdjusted = netCDR * permanenceFactor;

  return {
    plantId,
    club: 'green',
    subType: 'biochar',
    dryMass_kg: +dryMass.toFixed(2),
    grossCDR_tco2e: +grossCDR.toFixed(6),
    processEmissions_tco2e: +E_proc.toFixed(6),
    transportEmissions_tco2e: +E_transport.toFixed(6),
    netCDR_tco2e: +netCDR.toFixed(6),
    permanenceAdjusted_tco2e: +permanenceAdjusted.toFixed(6),
    methodology: 'Isometric_Biochar_v1.2',
    registry: 'Isometric / Puro.earth',
  };
}

export function cookstoveCalc(plantId: string, sensorData: Record<string, any>): CookstoveResult {
  const B_fuel_saved = sensorData.B_fuel_saved ?? 0;
  const EF_fuel = sensorData.EF_fuel ?? 1.89;
  const leakage = sensorData.leakage ?? 0.05;

  const ER = B_fuel_saved * EF_fuel * (1 - leakage);

  return {
    plantId,
    club: 'green',
    subType: 'cookstove',
    fuel_saved_tonnes: B_fuel_saved,
    emission_factor: EF_fuel,
    leakage_pct: leakage * 100,
    emissionReductions_tco2e: +ER.toFixed(6),
    methodology: 'TPDDTEC_v1 (Gold Standard)',
    registry: 'Gold Standard / Verra',
  };
}

// ── Test plant sensor data presets ──
export interface TestPlant {
  plantId: string;
  name: string;
  sector: 'STEEL' | 'ALUMINUM' | 'CEMENT';
  club: Club;
  subType: string;
  sensorData: Record<string, any>;
  trees?: Array<{ dbh_cm: number; height_m: number; species: string }>;
}

export const TEST_PLANTS: TestPlant[] = [
  {
    plantId: 'TATA_STEEL_JAMSHEDPUR',
    name: 'Tata Steel Jamshedpur',
    sector: 'STEEL',
    club: 'black',
    subType: 'defra',
    sensorData: { V_evap_m3: 2100, EC_pump: 1.635, EF_grid_tco2_per_kwh: 0.00058 },
  },
  {
    plantId: 'TATA_STEEL_JAMSHEDPUR_AUX',
    name: 'Tata Steel Jamshedpur (Auxiliary Buildings)',
    sector: 'STEEL',
    club: 'black',
    subType: 'ashrae228',
    sensorData: { E_import_kwh: 850000, EF_import: 0.00058, E_export_kwh: 120000, EF_export: 0.00058, refrigerant_charge_kg: 8.5, leak_rate_pct: 10, GWP_refrigerant: 2088 },
  },
  {
    plantId: 'JSW_DOLVI',
    name: 'JSW Dolvi',
    sector: 'STEEL',
    club: 'black',
    subType: 'defra',
    sensorData: { V_evap_m3: 3200, EC_pump: 1.82, EF_grid_tco2_per_kwh: 0.00068 },
  },
  {
    plantId: 'VEDANTA_JHARSUGUDA',
    name: 'Vedanta Jharsuguda',
    sector: 'ALUMINUM',
    club: 'black',
    subType: 'defra',
    sensorData: { V_evap_m3: 14200, EC_pump: 1.55, EF_grid_tco2_per_kwh: 0.00058 },
  },
  {
    plantId: 'VEDANTA_JHARSUGUDA_SOLAR',
    name: 'Vedanta Jharsuguda (Solar PPA)',
    sector: 'ALUMINUM',
    club: 'green',
    subType: 're',
    sensorData: { MWh_generated: 4500, EF_grid_tco2_per_mwh: 0.82 },
  },
  {
    plantId: 'HINDALCO_RENUKOOT',
    name: 'Hindalco Renukoot',
    sector: 'ALUMINUM',
    club: 'black',
    subType: 'defra',
    sensorData: { V_evap_m3: 8500, EC_pump: 1.4, EF_grid_tco2_per_kwh: 0.00061 },
  },
  {
    plantId: 'CMTOE064MP_ULTRATECH_MAIHAR',
    name: 'UltraTech Maihar',
    sector: 'CEMENT',
    club: 'black',
    subType: 'defra',
    sensorData: { V_evap_m3: 3100, EC_pump: 1.95, EF_grid_tco2_per_kwh: 0.00058 },
  },
  {
    plantId: 'CMTOE064MP_ULTRATECH_MAIHAR_ARR',
    name: 'UltraTech Maihar (Quarry Afforestation)',
    sector: 'CEMENT',
    club: 'green',
    subType: 'nbs_arr',
    sensorData: {},
    trees: [
      { dbh_cm: 25.4, height_m: 12.2, species: 'Tectona grandis' },
      { dbh_cm: 30.1, height_m: 14.5, species: 'Dalbergia sissoo' },
      { dbh_cm: 18.7, height_m: 9.8, species: 'Acacia nilotica' },
    ],
  },
  {
    plantId: 'RAMCO_VIRUDHUNAGAR',
    name: 'Ramco Virudhunagar',
    sector: 'CEMENT',
    club: 'black',
    subType: 'defra',
    sensorData: { V_evap_m3: 1850, EC_pump: 1.7, EF_grid_tco2_per_kwh: 0.00058 },
  },
];

export function calculate(club: Club, subType: string, plantId: string, sensorData: Record<string, any>, trees?: Array<{ dbh_cm: number; height_m: number; species: string }>): CalcResult {
  if (club === 'black') {
    if (subType === 'defra') return defraCalc(plantId, sensorData);
    if (subType === 'ashrae228') return ashraeCalc(plantId, sensorData);
    throw new Error('Unknown Black Token sub-type: ' + subType);
  }
  if (club === 'green') {
    if (subType === 're') return recCalc(plantId, sensorData);
    if (subType === 'nbs_arr' || subType === 'nbs') return nbsArrCalc(plantId, trees ?? []);
    if (subType === 'biochar' || subType === 'biomolecule') return biocharCalc(plantId, sensorData);
    if (subType === 'cookstove') return cookstoveCalc(plantId, sensorData);
    throw new Error('Unknown Green Token sub-type: ' + subType);
  }
  throw new Error('Invalid club: ' + club);
}
