export interface ActivityTypeOption {
  value: string;
  label: string;
  scope: 'scope1' | 'scope2' | 'scope3';
  defaultUnit: string;
}

export const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { value: 'stationary_combustion_diesel', label: 'Stationary Combustion — Diesel', scope: 'scope1', defaultUnit: 'L' },
  { value: 'stationary_combustion_natural_gas', label: 'Stationary Combustion — Natural Gas', scope: 'scope1', defaultUnit: 'm3' },
  { value: 'stationary_combustion_coal', label: 'Stationary Combustion — Coal', scope: 'scope1', defaultUnit: 'kg' },
  { value: 'transport_diesel_vehicle', label: 'Transport — Diesel Vehicle', scope: 'scope1', defaultUnit: 'L' },
  { value: 'transport_petrol_vehicle', label: 'Transport — Petrol Vehicle', scope: 'scope1', defaultUnit: 'L' },
  { value: 'refrigerant_r410a', label: 'Refrigerant — R410A', scope: 'scope1', defaultUnit: 'kg' },
  { value: 'refrigerant_r404a', label: 'Refrigerant — R404A', scope: 'scope1', defaultUnit: 'kg' },
  { value: 'purchased_electricity_grid', label: 'Purchased Electricity (Grid)', scope: 'scope2', defaultUnit: 'kWh' },
  { value: 'purchased_heat', label: 'Purchased Heat / Steam', scope: 'scope2', defaultUnit: 'kWh' },
  { value: 'waste_landfill_mixed', label: 'Waste — Landfill (Mixed)', scope: 'scope3', defaultUnit: 'kg' },
  { value: 'water_supply_treatment', label: 'Water Supply & Treatment', scope: 'scope3', defaultUnit: 'L' },
  { value: 'business_travel_air_short', label: 'Business Travel — Air (Short Haul)', scope: 'scope3', defaultUnit: 'km' },
  { value: 'business_travel_air_long', label: 'Business Travel — Air (Long Haul)', scope: 'scope3', defaultUnit: 'km' },
  { value: 'purchased_goods_steel', label: 'Purchased Goods — Steel', scope: 'scope3', defaultUnit: 'kg' },
  { value: 'purchased_goods_cement', label: 'Purchased Goods — Cement', scope: 'scope3', defaultUnit: 'kg' },
  { value: 'purchased_goods_aluminium', label: 'Purchased Goods — Aluminium', scope: 'scope3', defaultUnit: 'kg' },
];

export const EMISSION_FACTORS: Record<string, { factor: number; unit: string; citation: string }> = {
  stationary_combustion_diesel: { factor: 0.2621, unit: 'L', citation: 'IPCC 2006' },
  stationary_combustion_natural_gas: { factor: 0.00184, unit: 'm3', citation: 'IPCC 2006' },
  stationary_combustion_coal: { factor: 2.419, unit: 'kg', citation: 'IPCC 2006' },
  purchased_electricity_grid: { factor: 0.000702, unit: 'kWh', citation: 'CBRE Grid EF 2024' },
  purchased_heat: { factor: 0.00025, unit: 'kWh', citation: 'ISO 14064-1' },
  transport_diesel_vehicle: { factor: 0.2621, unit: 'L', citation: 'IPCC 2006' },
  transport_petrol_vehicle: { factor: 0.2307, unit: 'L', citation: 'IPCC 2006' },
  refrigerant_r410a: { factor: 2088.0, unit: 'kg', citation: 'IPCC AR6 GWP' },
  refrigerant_r404a: { factor: 3922.0, unit: 'kg', citation: 'IPCC AR6 GWP' },
  waste_landfill_mixed: { factor: 0.58, unit: 'kg', citation: 'EPA WARM' },
  water_supply_treatment: { factor: 0.000149, unit: 'L', citation: 'DEFRA 2024' },
  business_travel_air_short: { factor: 0.255, unit: 'km', citation: 'DEFRA 2024' },
  business_travel_air_long: { factor: 0.195, unit: 'km', citation: 'DEFRA 2024' },
  purchased_goods_steel: { factor: 1.91, unit: 'kg', citation: 'ecoinvent v3.10' },
  purchased_goods_cement: { factor: 0.73, unit: 'kg', citation: 'ecoinvent v3.10' },
  purchased_goods_aluminium: { factor: 8.1, unit: 'kg', citation: 'ecoinvent v3.10' },
};

export const REGIONS = ['global', 'India', 'EU', 'US', 'UK', 'Asia-Pacific'];
