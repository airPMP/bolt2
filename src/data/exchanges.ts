export interface Exchange {
  id: string;
  name: string;
  type: string;
  api_endpoint: string;
  api_doc: string;
  auth_type: string;
  supported_tokens: string[];
}

export const EXCHANGES: Exchange[] = [
  {
    id: 'iex',
    name: 'IEX (Indian Energy Exchange)',
    type: 'compliance',
    api_endpoint: 'https://api.iex.co/v2/carbon',
    api_doc: 'IEX Carbon Market API — REC and CCC trading',
    auth_type: 'API Key + Trading Account',
    supported_tokens: ['I-REC', 'CCC'],
  },
  {
    id: 'icm-exchange',
    name: 'ICM Exchange',
    type: 'compliance',
    api_endpoint: 'https://exchange.icm.gov.in/api/v1',
    api_doc: 'ICM Exchange — Carbon Credit Certificate trading',
    auth_type: 'BIS + Exchange Member ID',
    supported_tokens: ['CCC'],
  },
  {
    id: 'aircarbon',
    name: 'AirCarbon Exchange',
    type: 'voluntary',
    api_endpoint: 'https://trade.aircarbon.co/api/v1/exchange',
    api_doc: 'AirCarbon — Tokenized voluntary carbon trading',
    auth_type: 'API Key + Wallet Signature',
    supported_tokens: ['VCU', 'GS-VER', 'ACU', 'I-REC'],
  },
];
