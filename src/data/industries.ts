export interface Industry {
  id: string;
  name: string;
  scope1_sensors: string[];
  scope2_sensors: string[];
  scope3_sensors: string[];
}

export const INDUSTRIES: Industry[] = [
  {
    id: 'cement',
    name: 'Cement',
    scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW'],
    scope2_sensors: ['BLK-M-KWH', 'BLK-M-THRML'],
    scope3_sensors: ['BLK-S-WTE'],
  },
  {
    id: 'aluminium',
    name: 'Aluminium',
    scope1_sensors: ['BLK-S-FLUOR', 'BLK-S-FLOW'],
    scope2_sensors: ['BLK-M-KWH-HV'],
    scope3_sensors: ['BLK-S-WTE'],
  },
  {
    id: 'steel',
    name: 'Steel',
    scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW', 'BLK-S-CH4P'],
    scope2_sensors: ['BLK-M-KWH', 'BLK-M-THRML'],
    scope3_sensors: ['BLK-S-WTE'],
  },
  {
    id: 'power',
    name: 'Power Generation',
    scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW'],
    scope2_sensors: ['BLK-M-KWH'],
    scope3_sensors: ['BLK-S-WTE'],
  },
  {
    id: 'chlor-alkali',
    name: 'Chlor-Alkali',
    scope1_sensors: ['BLK-S-FLUOR', 'BLK-S-CO2'],
    scope2_sensors: ['BLK-M-KWH'],
    scope3_sensors: ['BLK-S-WTE'],
  },
  {
    id: 'pulp-paper',
    name: 'Pulp & Paper',
    scope1_sensors: ['BLK-S-CO2', 'BLK-S-FLOW'],
    scope2_sensors: ['BLK-M-KWH'],
    scope3_sensors: ['BLK-S-WTE'],
  },
];
