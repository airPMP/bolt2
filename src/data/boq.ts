export interface BoqItemData {
  sensor_type: string;
  part_number: string;
  description: string;
  price: number;
  category: string;
}

export const BOQ_ITEMS: BoqItemData[] = [
  { sensor_type: 'CO2', part_number: 'BLK-S-CO2', description: 'NDIR CO2 Sensor', price: 600, category: 'sensor' },
  { sensor_type: 'CH4', part_number: 'BLK-S-CH4', description: 'NDIR Methane Sensor', price: 750, category: 'sensor' },
  { sensor_type: 'N2O', part_number: 'BLK-S-N2O', description: 'N2O Gas Analyzer', price: 850, category: 'sensor' },
  { sensor_type: 'FLOW', part_number: 'BLK-S-FLOW', description: 'Electromagnetic Flow Meter', price: 550, category: 'sensor' },
  { sensor_type: 'ENERGY', part_number: 'BLK-M-KWH', description: 'Smart Energy Meter', price: 350, category: 'meter' },
  { sensor_type: 'TEMP', part_number: 'BLK-S-TEMP', description: 'RTD Temperature Sensor', price: 150, category: 'sensor' },
  { sensor_type: 'HUMIDITY', part_number: 'BLK-S-HUM', description: 'Humidity Sensor', price: 180, category: 'sensor' },
  { sensor_type: 'PRESSURE', part_number: 'BLK-S-PRES', description: 'Pressure Transmitter', price: 280, category: 'sensor' },
  { sensor_type: 'SOIL_C', part_number: 'BLK-S-SOILC', description: 'Soil Carbon Probe', price: 400, category: 'sensor' },
  { sensor_type: 'IRRADIANCE', part_number: 'BLK-S-IRR', description: 'Pyranometer (Solar Irradiance)', price: 320, category: 'sensor' },
  { sensor_type: 'PH', part_number: 'BLK-S-PH', description: 'pH Sensor', price: 220, category: 'sensor' },
  { sensor_type: 'TURBIDITY', part_number: 'BLK-S-TURB', description: 'Turbidity Sensor', price: 290, category: 'sensor' },
  { sensor_type: 'WIND_SPEED', part_number: 'BLK-S-WIND', description: 'Anemometer', price: 250, category: 'sensor' },
  { sensor_type: 'GATEWAY', part_number: 'BLK-GW-CIVV', description: 'Blockvolt CIVV Gateway', price: 1200, category: 'gateway' },
  { sensor_type: 'DATALOGGER', part_number: 'BLK-DL-01', description: 'Data Logger Unit', price: 450, category: 'datalogger' },
];
