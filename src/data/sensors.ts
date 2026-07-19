export interface Sensor {
  id: string;
  name: string;
  scope: 'scope1' | 'scope2' | 'scope3' | 'gateway' | 'ambient';
  unit: string;
  price: number;
}

export const SENSORS: Sensor[] = [
  { id: 'BLK-S-CO2', name: 'NDIR CO2 Process Sensor', scope: 'scope1', unit: 'ppm', price: 1850 },
  { id: 'BLK-S-FLOW', name: 'Thermal Mass Flow Meter', scope: 'scope1', unit: 'Nm³/h', price: 2400 },
  { id: 'BLK-S-FLUOR', name: 'Fluorocarbon Emissions Monitor (CF4/C2F6)', scope: 'scope1', unit: 'ppm', price: 4200 },
  { id: 'BLK-S-CH4P', name: 'Methane Process Sensor', scope: 'scope1', unit: 'ppm', price: 2100 },
  { id: 'BLK-M-KWH', name: 'Grid Electricity Meter (LT)', scope: 'scope2', unit: 'kWh', price: 320 },
  { id: 'BLK-M-KWH-HV', name: 'Grid Electricity Meter (HV)', scope: 'scope2', unit: 'kWh', price: 780 },
  { id: 'BLK-M-THRML', name: 'Thermal Energy Meter (Steam/Hot Water)', scope: 'scope2', unit: 'GJ', price: 1450 },
  { id: 'BLK-S-WTE', name: 'Waste-to-Energy Weighbridge + Calorimeter', scope: 'scope3', unit: 't', price: 3600 },
  { id: 'BLK-GW-H4', name: 'ERTH Gateway H4 (4-channel IoT Aggregator)', scope: 'gateway', unit: 'unit', price: 950 },
  { id: 'BLK-S-AQI', name: 'Ambient Air Quality Sensor (PM/NOx/SOx)', scope: 'ambient', unit: 'AQI', price: 540 },
];

export const sensorById = (id: string) => SENSORS.find((s) => s.id === id);
