export interface Methodology {
  id: string;
  name: string;
  formula: string;
  applicable_sectors: string[];
  tokenType: 'black' | 'green';
}

export const METHODOLOGIES: Methodology[] = [
  {
    id: 'ashrae228',
    name: 'ASHRAE 228 Net-Zero Carbon',
    formula: 'NetGHG = Σ(E_import*EF) - Σ(E_export*EF) + Σ(L_ref*GWP)',
    applicable_sectors: ['all'],
    tokenType: 'black',
  },
  {
    id: 'defra',
    name: 'Defra Evaporative Pumping',
    formula: 'CO2 = V_evap * EC_pump * EF_grid',
    applicable_sectors: ['cement', 'steel', 'power'],
    tokenType: 'black',
  },
  {
    id: 'vm0047',
    name: 'Verra VM0047 ARR',
    formula: 'ERy = ΔC_biomass + ΔC_SOC - GHG_project',
    applicable_sectors: ['nbs'],
    tokenType: 'green',
  },
  {
    id: 'biochar_v1.2',
    name: 'Isometric Biochar v1.2',
    formula: 'CDR = M_biochar * fC_fixed * 44/12 - E_proc',
    applicable_sectors: ['biochar'],
    tokenType: 'green',
  },
  {
    id: 'tpddtec',
    name: 'Gold Standard TPDDTEC Cookstoves',
    formula: 'ERy = B_fuel_saved * EF_fuel - Leakage',
    applicable_sectors: ['community'],
    tokenType: 'green',
  },
  {
    id: 're_bess',
    name: 'RE + BESS (Solar/Wind + Storage)',
    formula: 'REC = (E_inject - E_aux) for solar/wind; (E_solar - E_charge + E_discharge) for hybrid',
    applicable_sectors: ['re_bess'],
    tokenType: 'green',
  },
  {
    id: 'nbs_arr',
    name: 'NbS / ARR (Afforestation)',
    formula: 'ERy = ΔC_biomass + ΔC_SOC - GHG_project - Leakage',
    applicable_sectors: ['nbs'],
    tokenType: 'green',
  },
];
