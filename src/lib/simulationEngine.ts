import { evaluate } from 'mathjs';
import type { CommunityMethodology, BoqItem } from '../types';

export interface SimulationBlock {
  timestamp: string;
  [key: string]: string | number;
}

export interface SimulationResult {
  timestamp: string;
  value: number | null;
  error?: string;
}

export interface SimulationSummary {
  totalBlocks: number;
  totalReduction: number;
  avgReduction: number;
  maxReduction: number;
  minReduction: number;
}

export interface SimulationOutput {
  data: SimulationBlock[];
  results: SimulationResult[];
  summary: SimulationSummary;
}

const SENSOR_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  CO2: { min: 400, max: 500, unit: 'ppm' },
  CH4: { min: 1.5, max: 3.0, unit: 'ppm' },
  N2O: { min: 0.3, max: 0.5, unit: 'ppm' },
  FLOW: { min: 100, max: 150, unit: 'm3h' },
  ENERGY: { min: 500, max: 600, unit: 'kwh' },
  TEMP: { min: 20, max: 50, unit: 'c' },
  HUMIDITY: { min: 40, max: 70, unit: 'pct' },
  PRESSURE: { min: 0.9, max: 1.1, unit: 'bar' },
  SOIL_C: { min: 2, max: 5, unit: 'pct' },
  IRRADIANCE: { min: 100, max: 900, unit: 'wm2' },
  PH: { min: 6, max: 8, unit: 'ph' },
  TURBIDITY: { min: 1, max: 10, unit: 'ntu' },
  WIND_SPEED: { min: 0, max: 15, unit: 'ms' },
};

export function generateSyntheticData(
  sensorTypes: string[],
  days: number = 10,
  intervalMinutes: number = 15
): SimulationBlock[] {
  const blocksPerDay = (24 * 60) / intervalMinutes;
  const totalBlocks = days * blocksPerDay;
  const data: SimulationBlock[] = [];

  for (let i = 0; i < totalBlocks; i++) {
    const block: SimulationBlock = {
      timestamp: new Date(Date.now() + i * intervalMinutes * 60000).toISOString(),
    };
    for (const type of sensorTypes) {
      const range = SENSOR_RANGES[type] || { min: 0, max: 1, unit: 'unit' };
      const value = range.min + Math.random() * (range.max - range.min);
      block[`${type}_${range.unit}`] = Number(value.toFixed(4));
      block[type] = Number(value.toFixed(4));
    }
    data.push(block);
  }
  return data;
}

export function runSimulation(methodology: CommunityMethodology, days: number = 10, intervalMinutes: number = 15): SimulationOutput {
  const sensorTypes = methodology.required_sensor_types || [];
  const data = generateSyntheticData(sensorTypes, days, intervalMinutes);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constants = (methodology.constants || {}) as Record<string, any>;

  const results: SimulationResult[] = data.map(block => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vars: Record<string, any> = { ...block, ...constants };
    try {
      const value = evaluate(methodology.formula, vars);
      return { timestamp: block.timestamp, value: typeof value === 'number' ? value : null };
    } catch (e) {
      return { timestamp: block.timestamp, value: null, error: e instanceof Error ? e.message : 'Evaluation error' };
    }
  });

  const validResults = results.filter(r => r.value !== null).map(r => r.value as number);
  const totalReduction = validResults.reduce((s, v) => s + v, 0);
  const summary: SimulationSummary = {
    totalBlocks: results.length,
    totalReduction,
    avgReduction: validResults.length ? totalReduction / validResults.length : 0,
    maxReduction: validResults.length ? Math.max(...validResults) : 0,
    minReduction: validResults.length ? Math.min(...validResults) : 0,
  };

  return { data, results, summary };
}

export function autoSelectSensors(requiredSensorTypes: string[], boqItems: BoqItem[]): Array<{ type: string; partNumber: string; price: number } | null> {
  return requiredSensorTypes.map(type => {
    const match = boqItems.find(b => b.sensor_type === type);
    return match ? { type, partNumber: match.part_number, price: match.price } : null;
  });
}

export function generateBoQ(sensorMapping: Array<{ type: string; partNumber: string; price: number } | null>): { items: Array<{ partNumber: string; description: string; price: number; quantity: number }>; total: number } {
  const items = sensorMapping.filter(Boolean).map(s => ({
    partNumber: s!.partNumber,
    description: `${s!.type} sensor`,
    price: s!.price,
    quantity: 1,
  }));
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, total };
}
