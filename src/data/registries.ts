export interface Registry {
  id: string;
  name: string;
  type: 'compliance' | 'voluntary';
  credit_unit: string;
  wallet: string;
  api_endpoint: string;
  api_doc: string;
  auth_type: string;
}

export const REGISTRIES: Registry[] = [
  {
    id: 'verr',
    name: 'Verra (VCS)',
    type: 'voluntary',
    credit_unit: 'VCU',
    wallet: 'Verra Registry Wallet',
    api_endpoint: 'https://registry.verra.org/api/v1',
    api_doc: 'Verra API v1 — Project submission, validation, issuance',
    auth_type: 'OAuth 2.0 + API Key',
  },
  {
    id: 'icm',
    name: 'ICM (Indian Carbon Market)',
    type: 'compliance',
    credit_unit: 'CCC',
    wallet: 'ICM Custody Wallet',
    api_endpoint: 'https://icm.gov.in/api/v2',
    api_doc: 'ICM Compliance API v2 — GEI obligated entities',
    auth_type: 'BIS Certificate + API Key',
  },
  {
    id: 'i-rec',
    name: 'I-REC Registry',
    type: 'voluntary',
    credit_unit: 'I-REC',
    wallet: 'I-REC Custody Account',
    api_endpoint: 'https://irec.energyregistry.org/api/v1',
    api_doc: 'I-REC API v1 — Renewable Energy Certificate issuance',
    auth_type: 'API Key + Account ID',
  },
  {
    id: 'gold-standard',
    name: 'Gold Standard',
    type: 'voluntary',
    credit_unit: 'GS-VER',
    wallet: 'Gold Standard Registry',
    api_endpoint: 'https://registry.goldstandard.org/api/v1',
    api_doc: 'Gold Standard API — VER issuance and retirement',
    auth_type: 'OAuth 2.0',
  },
  {
    id: 'acm',
    name: 'ACM (AirCarbon Market)',
    type: 'voluntary',
    credit_unit: 'ACU',
    wallet: 'AirCarbon Custody',
    api_endpoint: 'https://trade.aircarbon.co/api/v1',
    api_doc: 'AirCarbon API — Tokenized carbon credits',
    auth_type: 'API Key + Wallet Signature',
  },
];
