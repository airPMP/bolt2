export interface Methodology {
  id: string;
  name: string;
  tokenType: 'black' | 'green';
  formula: string;
  applicable_sectors: string[];
  scope: string[];
}

export const METHODOLOGIES: Methodology[] = [
  {
    id: 'DEFRA_Evaporative_v1',
    name: 'DEFRA Evaporative Cooling v1',
    tokenType: 'black',
    formula: 'E = (Q_cooling × ΔT × COP) × EF_grid',
    applicable_sectors: ['steel', 'cement', 'aluminium', 'power'],
    scope: ['scope1', 'scope2'],
  },
  {
    id: 'ASHRAE_228_NetZero_v1',
    name: 'ASHRAE 228 Net Zero Buildings',
    tokenType: 'black',
    formula: 'E = Σ(bldg_energy × EF_factor) − Σ(RE_generation)',
    applicable_sectors: ['steel', 'cement', 'aluminium', 'power', 'chlor-alkali', 'pulp-paper'],
    scope: ['scope1', 'scope2', 'scope3'],
  },
  {
    id: 'ACM0002_A6.4-MEP014-A03',
    name: 'ACM0002 — Grid-connected Solar PV',
    tokenType: 'green',
    formula: 'ER = (E_gen × EF_grid) − (E_aux × EF_aux)',
    applicable_sectors: ['solar'],
    scope: ['scope2'],
  },
  {
    id: 'VM0047_ARR_v1',
    name: 'VM0047 — ARR Afforestation/Reforestation',
    tokenType: 'green',
    formula: 'ER = (ΔBiomass × CF × 44/12) − (E_leak × LF)',
    applicable_sectors: ['nbs', 'biochar'],
    scope: ['scope1'],
  },
  {
    id: 'GS-TPV-Biochar_v1',
    name: 'GS-TPV Biochar Methodology',
    tokenType: 'green',
    formula: 'ER = (M_biochar × C_content × 44/12) × (1 − P_decomp)',
    applicable_sectors: ['biochar', 'nbs'],
    scope: ['scope1'],
  },
  {
    id: 'GS-Cookstoves_v1',
    name: 'Gold Standard Cookstoves',
    tokenType: 'green',
    formula: 'ER = (N_stoves × U_fuel × EF_baseline − EF_project) × N_days',
    applicable_sectors: ['nbs'],
    scope: ['scope1', 'scope3'],
  },
  {
    id: 'GEI_Steel_Emission_v1',
    name: 'GEI Steel Emission Intensity',
    tokenType: 'black',
    formula: 'EI = (E_direct + E_indirect) / T_steel',
    applicable_sectors: ['steel'],
    scope: ['scope1', 'scope2'],
  },
  {
    id: 'GEI_Cement_Emission_v1',
    name: 'GEI Cement Emission Intensity',
    tokenType: 'black',
    formula: 'EI = (E_kiln + E_grind + E_aux) / T_clinker',
    applicable_sectors: ['cement'],
    scope: ['scope1', 'scope2'],
  },
];
