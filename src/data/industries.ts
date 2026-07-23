export interface Industry {
  id: string;
  name: string;
  sector: string;
  geiObligated: boolean;
}

export const INDUSTRIES: Industry[] = [
  { id: 'steel', name: 'Steel', sector: 'Heavy Industry', geiObligated: true },
  { id: 'cement', name: 'Cement', sector: 'Heavy Industry', geiObligated: true },
  { id: 'aluminium', name: 'Aluminium', sector: 'Heavy Industry', geiObligated: true },
  { id: 'power', name: 'Power Generation', sector: 'Energy', geiObligated: true },
  { id: 'chlor-alkali', name: 'Chlor-Alkali', sector: 'Chemical', geiObligated: true },
  { id: 'pulp-paper', name: 'Pulp & Paper', sector: 'Manufacturing', geiObligated: true },
  { id: 'solar', name: 'Solar RE', sector: 'Renewable Energy', geiObligated: false },
  { id: 'wind', name: 'Wind RE', sector: 'Renewable Energy', geiObligated: false },
  { id: 'nbs', name: 'NbS / Afforestation', sector: 'Nature-Based', geiObligated: false },
  { id: 'biochar', name: 'Biochar', sector: 'Removal', geiObligated: false },
];
