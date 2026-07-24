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
  { id: 'IEX', name: 'IEX (Indian Energy Exchange)', type: 'compliance', api_endpoint: 'https://api.iex.co/v2/carbon', api_doc: 'IEX Carbon Market API — REC and CCC trading', auth_type: 'API Key + Trading Account', supported_tokens: ['I-REC', 'CCC'] },
  { id: 'PXIL', name: 'PXIL (Power Exchange India)', type: 'compliance', api_endpoint: 'https://api.pxil.co/v1/carbon', api_doc: 'PXIL Carbon API — REC and CCC trading', auth_type: 'API Key + Member ID', supported_tokens: ['I-REC', 'CCC'] },
  { id: 'AirCarbon', name: 'AirCarbon Exchange', type: 'voluntary', api_endpoint: 'https://trade.aircarbon.co/api/v1/exchange', api_doc: 'AirCarbon — Tokenized voluntary carbon trading', auth_type: 'API Key + Wallet Signature', supported_tokens: ['VCU', 'GS-VER', 'ACU', 'I-REC'] },
];
