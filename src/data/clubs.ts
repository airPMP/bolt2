export interface GreenClub {
  id: string;
  name: string;
  description: string;
  registries: string[];
  methodologies: string[];
  defaultSensors: string[];
}

export const GREEN_CLUBS: GreenClub[] = [
  {
    id: 're_bess',
    name: 'RE + BESS',
    description: 'Renewable Energy with Battery Energy Storage — REC issuance (1 REC = 1 MWh net eligible)',
    registries: ['irec', 'verra', 'gold_standard'],
    methodologies: ['re_bess', 'ashrae228'],
    defaultSensors: ['BLK-M-KWH', 'BLK-GW-H4'],
  },
  {
    id: 'nbs',
    name: 'NbS / ARR',
    description: 'Nature-based Solutions — Afforestation, Reforestation, Revegetation',
    registries: ['verra', 'gold_standard', 'gcc', 'puro'],
    methodologies: ['vm0047', 'nbs_arr'],
    defaultSensors: ['BLK-S-CO2', 'BLK-GW-H4'],
  },
  {
    id: 'biochar',
    name: 'Biochar',
    description: 'Pyrolysis biochar carbon removal — durable CDR',
    registries: ['isometric', 'puro', 'verra'],
    methodologies: ['biochar_v1.2'],
    defaultSensors: ['BLK-S-CO2', 'BLK-S-FLOW', 'BLK-GW-H4'],
  },
  {
    id: 'community',
    name: 'Community Energy',
    description: 'Cookstoves, off-grid solar, community energy access',
    registries: ['gold_standard', 'verra'],
    methodologies: ['tpddtec'],
    defaultSensors: ['BLK-M-KWH', 'BLK-GW-H4'],
  },
];
