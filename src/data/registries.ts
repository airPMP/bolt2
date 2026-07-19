export interface Registry {
  id: string;
  name: string;
  type: 'compliance' | 'voluntary';
  api_endpoint: string;
  api_ready: boolean;
  credit_unit: string;
  wallet: string;
}

export const REGISTRIES: Registry[] = [
  {
    id: 'ccts',
    name: 'India CCTS (NSDL)',
    type: 'compliance',
    api_endpoint: 'https://icm.beeindia.gov.in/api/v1/form-a',
    api_ready: true,
    credit_unit: 'CCC',
    wallet: 'NSDL',
  },
  {
    id: 'verra',
    name: 'Verra VCS',
    type: 'voluntary',
    api_endpoint: 'https://registry.verra.org/api/v1/issuance',
    api_ready: true,
    credit_unit: 'VCU',
    wallet: 'Verra Custody',
  },
  {
    id: 'gold_standard',
    name: 'Gold Standard',
    type: 'voluntary',
    api_endpoint: 'https://registry.goldstandard.org/api/v1/issuance',
    api_ready: true,
    credit_unit: 'GS-VER',
    wallet: 'GS Custody',
  },
  {
    id: 'irec',
    name: 'I-TRACK (I-REC)',
    type: 'compliance',
    api_endpoint: 'https://api.evident.app/v1/irec/issuance',
    api_ready: true,
    credit_unit: 'I-REC',
    wallet: 'I-REC Custody',
  },
  {
    id: 'gcc',
    name: 'Global Carbon Council',
    type: 'voluntary',
    api_endpoint: 'https://registry.gcc.org/api/v1/issuance',
    api_ready: true,
    credit_unit: 'ACC',
    wallet: 'GCC Custody',
  },
  {
    id: 'isometric',
    name: 'Isometric',
    type: 'voluntary',
    api_endpoint: 'https://registry.isometric.com/api/v1/cdr',
    api_ready: true,
    credit_unit: 'CDR Unit',
    wallet: 'Isometric Custody',
  },
  {
    id: 'puro',
    name: 'Puro.earth',
    type: 'voluntary',
    api_endpoint: 'https://registry.puro.earth/api/v1/corc',
    api_ready: true,
    credit_unit: 'CORC',
    wallet: 'Puro Custody',
  },
];
