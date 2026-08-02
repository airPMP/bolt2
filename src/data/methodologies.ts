export interface Methodology {
  id: string;
  name: string;
  tokenType: 'black' | 'green';
  formula: string;
  applicable_sectors: string[];
  scope: string[];
}

export const METHODOLOGIES: Methodology[] = [
  { id: 'DEFRA_Evaporative_v1', name: 'DEFRA Evaporative Cooling v1', tokenType: 'black', formula: 'E = (Q_cooling * 10 * 3.5) * 0.82', applicable_sectors: ['steel', 'cement', 'aluminium', 'power'], scope: ['scope1', 'scope2'] },
  { id: 'ASHRAE_228_NetZero_v1', name: 'ASHRAE 228 Net Zero Buildings', tokenType: 'black', formula: 'ENERGY * 0.82 - 100', applicable_sectors: ['steel', 'cement', 'aluminium', 'power', 'chlor-alkali', 'pulp-paper'], scope: ['scope1', 'scope2', 'scope3'] },
  { id: 'ACM0002_A6.4-MEP014-A03', name: 'ACM0002 — Grid-connected Solar PV', tokenType: 'green', formula: 'ENERGY * 0.82 - 50', applicable_sectors: ['solar'], scope: ['scope2'] },
  { id: 'VM0047_ARR_v1', name: 'VM0047 — ARR Afforestation/Reforestation', tokenType: 'green', formula: 'SOIL_C * 44/12 * 0.78', applicable_sectors: ['nbs', 'biochar'], scope: ['scope1'] },
  { id: 'GS-TPV-Biochar_v1', name: 'GS-TPV Biochar Methodology', tokenType: 'green', formula: 'SOIL_C * 44/12 * 0.78 * (1 - 0.1)', applicable_sectors: ['biochar', 'nbs'], scope: ['scope1'] },
  { id: 'GS-Cookstoves_v1', name: 'Gold Standard Cookstoves', tokenType: 'green', formula: 'FLOW * 0.5 * 365', applicable_sectors: ['nbs'], scope: ['scope1', 'scope3'] },
  { id: 'GEI_Steel_Emission_v1', name: 'GEI Steel Emission Intensity', tokenType: 'black', formula: '(CO2 + 500) / 1000', applicable_sectors: ['steel'], scope: ['scope1', 'scope2'] },
  { id: 'GEI_Cement_Emission_v1', name: 'GEI Cement Emission Intensity', tokenType: 'black', formula: '(CO2 + 300) / 800', applicable_sectors: ['cement'], scope: ['scope1', 'scope2'] },
];
