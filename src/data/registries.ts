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
  { id: 'VERRA', name: 'Verra (VCS)', type: 'voluntary', credit_unit: 'VCU', wallet: 'Verra Registry Wallet', api_endpoint: 'https://api.verra.org/v1', api_doc: 'Verra API v1', auth_type: 'OAuth 2.0 + API Key' },
  { id: 'ICM', name: 'ICM (Indian Carbon Market)', type: 'compliance', credit_unit: 'CCC', wallet: 'ICM Custody Wallet', api_endpoint: 'https://icm-sandbox.beeindia.gov.in/api/v1', api_doc: 'ICM Compliance API', auth_type: 'BIS Certificate + API Key' },
  { id: 'CCTS', name: 'CCTS (Carbon Credit Trading Scheme)', type: 'compliance', credit_unit: 'CCC', wallet: 'CCTS Custody', api_endpoint: 'https://ccts.gov.in/api/v1', api_doc: 'CCTS API', auth_type: 'API Key + Entity ID' },
  { id: 'GOLD_STANDARD', name: 'Gold Standard', type: 'voluntary', credit_unit: 'GS-VER', wallet: 'Gold Standard Registry', api_endpoint: 'https://registry.goldstandard.org/api/v1', api_doc: 'Gold Standard API', auth_type: 'OAuth 2.0' },
  { id: 'I_TRACK', name: 'I-TRACK (I-REC Registry)', type: 'voluntary', credit_unit: 'I-REC', wallet: 'I-TRACK Custody Account', api_endpoint: 'https://irec.energyregistry.org/api/v1', api_doc: 'I-TRACK API', auth_type: 'API Key + Account ID' },
  { id: 'PURO', name: 'Puro.earth', type: 'voluntary', credit_unit: 'CORC', wallet: 'Puro Registry', api_endpoint: 'https://registry.puro.earth/api/v1', api_doc: 'Puro.earth API', auth_type: 'API Key' },
  { id: 'ISOMETRIC', name: 'Isometric', type: 'voluntary', credit_unit: 'ICR', wallet: 'Isometric Registry', api_endpoint: 'https://registry.isometric.com/api/v1', api_doc: 'Isometric API', auth_type: 'API Key + Org ID' },
  { id: 'CERC', name: 'CERC (Carbon Emission Reduction Credit)', type: 'compliance', credit_unit: 'CERC', wallet: 'CERC Custody', api_endpoint: 'https://cerc.gov.in/api/v1', api_doc: 'CERC API', auth_type: 'API Key + Entity Cert' },
];
