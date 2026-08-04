export interface GreenClub {
  id: string;
  name: string;
  description: string;
  methodologies: string[];
  registries: string[];
}

export const GREEN_CLUBS: GreenClub[] = [
  { id: 're-bess', name: 'RE+BESS Club', description: 'Renewable Energy + Battery Energy Storage Systems', methodologies: ['ACM0002_A6.4-MEP014-A03'], registries: ['I_TRACK', 'VERRA'] },
  { id: 'nbs', name: 'NbS Club', description: 'Nature-based Solutions — Afforestation, Reforestation, ARR', methodologies: ['VM0047_ARR_v1'], registries: ['VERRA', 'GOLD_STANDARD'] },
  { id: 'biochar', name: 'Biochar Club', description: 'Biochar production and sequestration', methodologies: ['GS-TPV-Biochar_v1'], registries: ['GOLD_STANDARD', 'VERRA', 'PURO'] },
  { id: 'community', name: 'Community Club', description: 'Community projects — Cookstoves, water purification', methodologies: ['GS-Cookstoves_v1'], registries: ['GOLD_STANDARD'] },
  { id: 'wind', name: 'Wind RE Club', description: 'Onshore & offshore wind energy generation', methodologies: ['ACM0002_A6.4-MEP014-A03'], registries: ['I_TRACK', 'VERRA', 'GOLD_STANDARD'] },
  { id: 'solar-bess', name: 'Solar+BESS Club', description: 'Solar PV with Battery Energy Storage Systems', methodologies: ['ACM0002_A6.4-MEP014-A03'], registries: ['I_TRACK', 'VERRA'] },
  { id: 'biogas', name: 'Biogas Club', description: 'Biogas digesters and methane capture from organic waste', methodologies: ['AMS-III.D_v1'], registries: ['GOLD_STANDARD', 'VERRA'] },
  { id: 'energy-efficiency', name: 'Energy Efficiency Club', description: 'Industrial energy efficiency and waste heat recovery', methodologies: ['AMS-II.N_v1'], registries: ['GOLD_STANDARD', 'VERRA'] },
  { id: 'blue-carbon', name: 'Blue Carbon Club', description: 'Coastal wetlands — mangroves, seagrass, salt marsh', methodologies: ['VM0033_BlueCarbon_v1'], registries: ['VERRA', 'GOLD_STANDARD'] },
  { id: 'saf', name: 'SAF Club', description: 'Sustainable Aviation Fuel CORSIA compliance', methodologies: ['CORSIA_SAF_v1'], registries: ['VERRA', 'GOLD_STANDARD'] },
];
