export interface GreenClub {
  id: string;
  name: string;
  description: string;
  methodologies: string[];
  registries: string[];
}

export const GREEN_CLUBS: GreenClub[] = [
  {
    id: 're-bess',
    name: 'RE+BESS Club',
    description: 'Renewable Energy + Battery Energy Storage Systems',
    methodologies: ['ACM0002_A6.4-MEP014-A03'],
    registries: ['i-rec', 'verr'],
  },
  {
    id: 'nbs',
    name: 'NbS Club',
    description: 'Nature-based Solutions — Afforestation, Reforestation, ARR',
    methodologies: ['VM0047_ARR_v1'],
    registries: ['verr', 'gold-standard'],
  },
  {
    id: 'biochar',
    name: 'Biochar Club',
    description: 'Biochar production and sequestration',
    methodologies: ['GS-TPV-Biochar_v1'],
    registries: ['gold-standard', 'verr'],
  },
  {
    id: 'community',
    name: 'Community Club',
    description: 'Community projects — Cookstoves, water purification',
    methodologies: ['GS-Cookstoves_v1'],
    registries: ['gold-standard'],
  },
];
