import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sun,
  Wind,
  Leaf,
  Factory,
  TreePine,
  Droplets,
  Building2,
  Activity,
  Server,
  Cpu,
  Wifi,
  Lock,
  FileJson,
  CheckCircle,
  AlertTriangle,
  Zap,
  Thermometer,
  Gauge,
  Radio,
  MapPin,
  Clock,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Database,
  Shield
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

type ProjectType = 'solar_bess' | 'wind' | 'biomass' | 'wte' | 'forestry' | 'green_h2' | 'industrial_cbam';

interface SensorReading {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'online' | 'offline' | 'warning';
  range?: { min: number; max: number };
}

interface GatewayStatus {
  id: string;
  mac: string;
  firmware: string;
  lastSync: string;
  packetsSent: number;
  hsmStatus: 'active' | 'inactive';
  mqttConnected: boolean;
}

interface ProjectConfig {
  id: ProjectType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  registries: string[];
  methodologies: { id: string; name: string; formula: string }[];
  sensors: { id: string; name: string; unit: string; range: { min: number; max: number } }[];
  gateway: string;
  calculator: { name: string; formula: string };
}

interface RegistrySubmission {
  registry: string;
  status: 'pending' | 'validated' | 'submitted' | 'approved';
  credits: number;
  serialNumber?: string;
  timestamp: string;
}

// ==================== PROJECT CONFIGURATIONS ====================

const PROJECT_CONFIGS: Record<ProjectType, ProjectConfig> = {
  solar_bess: {
    id: 'solar_bess',
    name: 'Solar + BESS',
    icon: Sun,
    registries: ['I-REC', 'REC (India)', 'CERC', 'EnergyTag'],
    methodologies: [
      { id: 'AMS-I.D', name: 'Grid Connected Renewable Electricity', formula: 'REC = MWh × EF_grid' },
      { id: 'ACM0001', name: 'Consolidated Baseline', formula: 'ER = EG_y × (EF_grid - EF_om)' }
    ],
    sensors: [
      { id: 'PV_INV', name: 'PV Inverter Power', unit: 'kW', range: { min: 0, max: 1000 } },
      { id: 'MTR_EXP', name: 'Export Meter', unit: 'kWh', range: { min: 0, max: 50000 } },
      { id: 'MTR_IMP', name: 'Import Meter', unit: 'kWh', range: { min: 0, max: 5000 } },
      { id: 'BESS_SOC', name: 'Battery SOC', unit: '%', range: { min: 0, max: 100 } },
      { id: 'GHI', name: 'Irradiance', unit: 'W/m²', range: { min: 0, max: 1200 } },
      { id: 'TEMP', name: 'Ambient Temp', unit: '°C', range: { min: -10, max: 50 } },
      { id: 'HUMID', name: 'Humidity', unit: '%', range: { min: 0, max: 100 } },
      { id: 'GPS', name: 'GPS Location', unit: 'lat,lon', range: { min: -180, max: 180 } },
      { id: 'FREQ', name: 'Grid Frequency', unit: 'Hz', range: { min: 47.5, max: 52.5 } }
    ],
    gateway: 'CIVV-GW-SOL',
    calculator: {
      name: 'REC Calculator',
      formula: 'ΔkWh = Export - Import; REC = ΔkWh × EF_grid'
    }
  },
  wind: {
    id: 'wind',
    name: 'Wind Farm',
    icon: Wind,
    registries: ['I-REC', 'REC (India)', 'EnergyTag'],
    methodologies: [
      { id: 'AMS-I.D', name: 'Grid Connected Wind', formula: 'ER = EG_y × EF_grid' },
      { id: 'ACM0002', name: 'Consolidated Wind', formula: 'ER = Σ(P_i × EF_grid)' }
    ],
    sensors: [
      { id: 'WIND_SPD', name: 'Wind Speed', unit: 'm/s', range: { min: 0, max: 30 } },
      { id: 'WIND_DIR', name: 'Wind Direction', unit: '°', range: { min: 0, max: 360 } },
      { id: 'ROTOR_RPM', name: 'Rotor RPM', unit: 'rpm', range: { min: 0, max: 25 } },
      { id: 'PWR_OUT', name: 'Power Output', unit: 'kW', range: { min: 0, max: 3000 } },
      { id: 'TEMP', name: 'Ambient Temp', unit: '°C', range: { min: -10, max: 50 } },
      { id: 'TRF_MTR', name: 'Transformer Meter', unit: 'kWh', range: { min: 0, max: 100000 } },
      { id: 'YAW', name: 'Yaw Angle', unit: '°', range: { min: 0, max: 360 } },
      { id: 'PITCH', name: 'Blade Pitch', unit: '°', range: { min: 0, max: 90 } }
    ],
    gateway: 'CIVV-GW-WIND',
    calculator: {
      name: 'Wind Power Calculator',
      formula: 'P = 0.5 × ρ × A × v³ × Cp; ER = Σ(kWh) × EF_grid'
    }
  },
  biomass: {
    id: 'biomass',
    name: 'Biomass Power',
    icon: Leaf,
    registries: ['Verra VCS', 'Gold Standard', 'Article 6 (ITMO)', 'CCTS India'],
    methodologies: [
      { id: 'AMS-I.D', name: 'Biomass Renewable Energy', formula: 'ER = EG_y × EF_grid - Σ BE' },
      { id: 'AMS-I.C', name: 'Thermal Energy Production', formula: 'ER = HG_y × EF_fuel' },
      { id: 'VM0036', name: 'Biomass Methodology', formula: 'ER = Baseline - Project' }
    ],
    sensors: [
      { id: 'FUEL_WT', name: 'Fuel Weight', unit: 'kg/hr', range: { min: 0, max: 50000 } },
      { id: 'MOISTURE', name: 'Fuel Moisture', unit: '%', range: { min: 0, max: 60 } },
      { id: 'BOILER_TMP', name: 'Boiler Temp', unit: '°C', range: { min: 0, max: 600 } },
      { id: 'STEAM_PR', name: 'Steam Pressure', unit: 'bar', range: { min: 0, max: 80 } },
      { id: 'STEAM_FLOW', name: 'Steam Flow', unit: 'T/hr', range: { min: 0, max: 50 } },
      { id: 'TURBINE_PWR', name: 'Turbine Power', unit: 'kW', range: { min: 0, max: 10000 } },
      { id: 'ASH_WT', name: 'Ash Output', unit: 'kg/hr', range: { min: 0, max: 5000 } },
      { id: 'CH4_FLUE', name: 'Flue CH4', unit: 'ppm', range: { min: 0, max: 100 } },
      { id: 'CO2_FLUE', name: 'Flue CO2', unit: '%', range: { min: 0, max: 20 } },
      { id: 'GRID_MTR', name: 'Grid Export', unit: 'kWh', range: { min: 0, max: 200000 } }
    ],
    gateway: 'CIVV-GW-BIO',
    calculator: {
      name: 'Biomass Emission Calculator',
      formula: 'ER = (EG_y × EF_grid) - (Σ fuel_i × EF_i) - PE'
    }
  },
  wte: {
    id: 'wte',
    name: 'Waste to Energy',
    icon: Factory,
    registries: ['Gold Standard', 'Verra VCS', 'Article 6', 'CCTS India'],
    methodologies: [
      { id: 'AMS-III.G', name: 'Landfill Methane Recovery', formula: 'ER = CH4_destroyed × GWP - PE' },
      { id: 'ACM0001', name: 'WTE Electricity Generation', formula: 'ER = EG × EF_grid - PE' },
      { id: 'VM0040', name: 'Waste Processing', formula: 'ER = GHG_baseline - GHG_project' }
    ],
    sensors: [
      { id: 'WASTE_WT', name: 'Waste Input', unit: 'tonnes/hr', range: { min: 0, max: 100 } },
      { id: 'CH4_FLOW', name: 'Methane Flow', unit: 'Nm³/hr', range: { min: 0, max: 5000 } },
      { id: 'CO2_FLOW', name: 'CO2 Flow', unit: 'Nm³/hr', range: { min: 0, max: 10000 } },
      { id: 'GAS_TMP', name: 'Gas Temperature', unit: '°C', range: { min: 0, max: 200 } },
      { id: 'GAS_PR', name: 'Gas Pressure', unit: 'mbar', range: { min: 0, max: 2000 } },
      { id: 'FLARE_TMP', name: 'Flare Temp', unit: '°C', range: { min: 0, max: 1200 } },
      { id: 'FLARE_FLOW', name: 'Flare Flow', unit: 'Nm³/hr', range: { min: 0, max: 8000 } },
      { id: 'GAS_COMP', name: 'Gas Composition', unit: '% CH4', range: { min: 0, max: 100 } },
      { id: 'LEACHATE', name: 'Leachate Volume', unit: 'm³/hr', range: { min: 0, max: 100 } },
      { id: 'PWR_GEN', name: 'Power Generated', unit: 'kWh', range: { min: 0, max: 50000 } }
    ],
    gateway: 'CIVV-GW-WTE',
    calculator: {
      name: 'WTE Emission Calculator',
      formula: 'ER = (CH4_captured × GWP_CH4) - (E_combust + E_electric)' }
  },
  forestry: {
    id: 'forestry',
    name: 'Forestry / ARR',
    icon: TreePine,
    registries: ['Verra VCS', 'Gold Standard', 'Article 6', 'Puro.earth', 'Isometric'],
    methodologies: [
      { id: 'VM0047', name: 'ARR Methodology', formula: 'C = Δbiomass × CF × 44/12' },
      { id: 'VM0015', name: 'REDD+ Framework', formula: 'ER = ΔC - ΔC_bsl' },
      { id: 'AR-ACM0003', name: 'A/R Consolidated', formula: 'ER = C_tree + C_soil - C_loss' }
    ],
    sensors: [
      { id: 'DEND_01', name: 'Dendrometer 1', unit: 'mm', range: { min: 0, max: 500 } },
      { id: 'DEND_02', name: 'Dendrometer 2', unit: 'mm', range: { min: 0, max: 500 } },
      { id: 'DEND_03', name: 'Dendrometer 3', unit: 'mm', range: { min: 0, max: 500 } },
      { id: 'LIDAR_HT', name: 'LiDAR Height', unit: 'm', range: { min: 0, max: 50 } },
      { id: 'GPS_ZONE', name: 'GPS Zone', unit: 'polygon', range: { min: 0, max: 1 } },
      { id: 'RAIN', name: 'Rainfall', unit: 'mm/hr', range: { min: 0, max: 100 } },
      { id: 'SOIL_MOIST', name: 'Soil Moisture', unit: '%', range: { min: 0, max: 100 } },
      { id: 'SOIL_Temp', name: 'Soil Temp', unit: '°C', range: { min: -10, max: 50 } },
      { id: 'CAM_TREE', name: 'Tree Camera', unit: 'image', range: { min: 0, max: 1 } },
      { id: 'SAT_NDVI', name: 'Satellite NDVI', unit: 'index', range: { min: 0, max: 1 } }
    ],
    gateway: 'CIVV-GW-FOREST',
    calculator: {
      name: 'Forestry Carbon Calculator',
      formula: 'C_stock = Σ(Volume_i × BEF × WD × CF) × 44/12' }
  },
  green_h2: {
    id: 'green_h2',
    name: 'Green Hydrogen',
    icon: Droplets,
    registries: ['CertifHy', 'EnergyTag', 'CBAM', 'RED II', 'TÜV SÜD'],
    methodologies: [
      { id: 'ISO-22859', name: 'Green Hydrogen Standard', formula: 'CI = E_input / H2_output' },
      { id: 'RFNBO', name: 'Renewable Fuels of Non-Bio', formula: 'GHG = Σ(E_i × EF_i) / M_H2' }
    ],
    sensors: [
      { id: 'ELE_ZER_PWR', name: 'Electrolyzer Power', unit: 'kW', range: { min: 0, max: 10000 } },
      { id: 'H2_FLOW', name: 'H2 Flow', unit: 'Nm³/hr', range: { min: 0, max: 1000 } },
      { id: 'H2_PRESS', name: 'H2 Pressure', unit: 'bar', range: { min: 0, max: 350 } },
      { id: 'H2_TEMP', name: 'H2 Temp', unit: '°C', range: { min: 0, max: 100 } },
      { id: 'H2_PURITY', name: 'H2 Purity', unit: '%', range: { min: 99, max: 100 } },
      { id: 'WATER_IN', name: 'Water Input', unit: 'L/hr', range: { min: 0, max: 2000 } },
      { id: 'O2_FLOW', name: 'O2 Output', unit: 'Nm³/hr', range: { min: 0, max: 500 } },
      { id: 'RE_PWR', name: 'Renewable Power', unit: 'kW', range: { min: 0, max: 15000 } },
      { id: 'STACK_TMP', name: 'Stack Temp', unit: '°C', range: { min: 0, max: 80 } },
      { id: 'CURR_DEN', name: 'Current Density', unit: 'A/cm²', range: { min: 0, max: 2 } }
    ],
    gateway: 'CIVV-GW-H2',
    calculator: {
      name: 'H2 Carbon Intensity Calculator',
      formula: 'CI = (E_grid × EF_grid + E_RE × EF_RE) / M_H2' }
  },
  industrial_cbam: {
    id: 'industrial_cbam',
    name: 'Industrial CBAM',
    icon: Building2,
    registries: ['EU CBAM', 'EU ETS', 'National ETS'],
    methodologies: [
      { id: 'CBAM-Steel', name: 'Steel Embedded Emissions', formula: 'SEE = (E_dir + E_indir) / Prod' },
      { id: 'CBAM-Cement', name: 'Cement Embedded Emissions', formula: 'SEE = CO2_process + E_thermal × EF' },
      { id: 'CBAM-Al', name: 'Aluminium Embedded Emissions', formula: 'SEE = Σ(E_scope1 + E_scope2 × EF)' }
    ],
    sensors: [
      { id: 'EL_MTR', name: 'Electricity', unit: 'MWh', range: { min: 0, max: 5000 } },
      { id: 'NG_FLOW', name: 'Natural Gas', unit: 'Nm³/hr', range: { min: 0, max: 50000 } },
      { id: 'STEAM_FLOW', name: 'Steam', unit: 'T/hr', range: { min: 0, max: 200 } },
      { id: 'O2_FLOW', name: 'Oxygen', unit: 'Nm³/hr', range: { min: 0, max: 30000 } },
      { id: 'COAL_WT', name: 'Coal/Petcoke', unit: 'kg/hr', range: { min: 0, max: 100000 } },
      { id: 'COKEDUST', name: 'Coke Dust', unit: 'kg/hr', range: { min: 0, max: 50000 } },
      { id: 'AIR_CMP', name: 'Compressed Air', unit: 'Nm³/hr', range: { min: 0, max: 100000 } },
      { id: 'PROD_WT', name: 'Product Output', unit: 'tonnes/hr', range: { min: 0, max: 500 } },
      { id: 'CO2_FLUE', name: 'Flue CO2', unit: '%', range: { min: 0, max: 25 } },
      { id: 'GPS_PLANT', name: 'Plant GPS', unit: 'lat,lon', range: { min: -180, max: 180 } }
    ],
    gateway: 'CIVV-GW-CBAM',
    calculator: {
      name: 'CBAM SEE Calculator',
      formula: 'SEE = (Σ Scope1 + Σ Scope2 × EF_grid) / Production_tonnes' }
  }
};

// ==================== MAIN COMPONENT ====================

export default function BlockVoltWorkerNode() {
  const [selectedProject, setSelectedProject] = useState<ProjectType>('solar_bess');
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sensors: true,
    gateway: true,
    json: true,
    calculator: true,
    registry: true,
    nft: false
  });
  const [submissionQueue, setSubmissionQueue] = useState<RegistrySubmission[]>([]);
  const [merkleHash, setMerkleHash] = useState<string>('');
  const [jsonOutput, setJsonOutput] = useState<object | null>(null);

  const config = PROJECT_CONFIGS[selectedProject];

  // Generate random sensor value within range
  const generateSensorValue = useCallback((min: number, max: number) => {
    const range = max - min;
    const base = min + Math.random() * range;
    const variation = (Math.random() - 0.5) * range * 0.1;
    return Math.max(min, Math.min(max, base + variation));
  }, []);

  // Simulate sensor readings
  const simulateSensors = useCallback(() => {
    const timestamp = new Date().toISOString();
    const readings: SensorReading[] = config.sensors.map(sensor => {
      const value = generateSensorValue(sensor.range.min, sensor.range.max);
      const status: 'online' | 'offline' | 'warning' =
        Math.random() > 0.98 ? 'offline' :
        Math.random() > 0.95 ? 'warning' : 'online';
      return {
        id: sensor.id,
        name: sensor.name,
        value: parseFloat(value.toFixed(2)),
        unit: sensor.unit,
        timestamp,
        status
      };
    });
    setSensorReadings(readings);
    return readings;
  }, [config, generateSensorValue]);

  // Update gateway status
  const updateGateway = useCallback(() => {
    const gw: GatewayStatus = {
      id: config.gateway,
      mac: `AA:BB:CC:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}`,
      firmware: 'v2.4.1',
      lastSync: new Date().toISOString(),
      packetsSent: cycleCount + 1,
      hsmStatus: 'active',
      mqttConnected: Math.random() > 0.02
    };
    setGatewayStatus(gw);
    return gw;
  }, [config, cycleCount]);

  // Generate signed JSON packet
  const generateJSONPacket = useCallback((readings: SensorReading[], gw: GatewayStatus) => {
    const packet = {
      plant_id: selectedProject.toUpperCase(),
      gateway_id: gw.id,
      mac_address: gw.mac,
      timestamp: new Date().toISOString(),
      interval_minutes: 15,
      sensors: readings.reduce((acc, r) => {
        acc[r.id] = r.value;
        return acc;
      }, {} as Record<string, number>),
      gps: readings.find(r => r.id.includes('GPS'))?.value || '16.982, 73.884',
      signature: `ECDSA-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      hsm_attestation: gw.hsmStatus === 'active' ? 'VERIFIED' : 'PENDING',
      merkle_index: cycleCount
    };
    return packet;
  }, [selectedProject, cycleCount]);

  // Calculate credits based on methodology
  const calculateCredits = useCallback((readings: SensorReading[]) => {
    const getValue = (id: string) => readings.find(r => r.id === id)?.value || 0;
    const EF_grid = 0.82; // tCO2/MWh default
    const GWP_CH4 = 28;

    let credits = 0;

    switch (selectedProject) {
      case 'solar_bess':
        const exportKwh = getValue('MTR_EXP');
        const importKwh = getValue('MTR_IMP');
        const netKwh = (exportKwh - importKwh) / 1000; // Convert to MWh
        credits = netKwh * EF_grid;
        break;
      case 'wind':
        const turbineOutput = getValue('PWR_OUT');
        credits = (turbineOutput * 0.25) / 1000 * EF_grid; // 15 min period
        break;
      case 'biomass':
        const bioPower = getValue('TURBINE_PWR');
        const fuelKg = getValue('FUEL_WT');
        credits = (bioPower * 0.25 / 1000 * EF_grid) - (fuelKg * 0.001 * 0.1);
        credits = Math.max(0, credits);
        break;
      case 'wte':
        const ch4Flow = getValue('CH4_FLOW');
        credits = (ch4Flow * 0.25 * 0.00071 * GWP_CH4); // Nm³ to tonnes CH4
        break;
      case 'forestry':
        const dendAvg = (getValue('DEND_01') + getValue('DEND_02') + getValue('DEND_03')) / 3;
        credits = (dendAvg / 1000) * 0.5 * 0.48 * 3.667; // Simplified biomass formula
        break;
      case 'green_h2':
        const h2Output = getValue('H2_FLOW');
        const rePower = getValue('RE_PWR');
        const h2CI = (rePower * 0.25 * 0.02) / (h2Output * 0.0899); // kg H2
        credits = (4.5 - h2CI) * h2Output * 0.0899; // vs grey H2 baseline
        credits = Math.max(0, credits);
        break;
      case 'industrial_cbam':
        const electricity = getValue('EL_MTR');
        const gasFlow = getValue('NG_FLOW');
        const production = getValue('PROD_WT');
        if (production > 0) {
          const scope2 = electricity * 0.25 * EF_grid;
          const scope1 = gasFlow * 0.25 * 0.002; // Natural gas EF
          const see = (scope1 + scope2) / production;
          credits = (1.8 - see) * production; // vs EU default
          credits = Math.max(0, credits);
        }
        break;
    }

    return parseFloat(credits.toFixed(4));
  }, [selectedProject]);

  // Generate Merkle hash
  const generateMerkleHash = useCallback((packet: object) => {
    const str = JSON.stringify(packet);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`;
  }, []);

  // Run one cycle
  const runCycle = useCallback(() => {
    const readings = simulateSensors();
    const gw = updateGateway();
    const packet = generateJSONPacket(readings, gw);
    const credits = calculateCredits(readings);
    const hash = generateMerkleHash(packet);

    setJsonOutput(packet);
    setMerkleHash(hash);
    setCycleCount(prev => prev + 1);

    // Update registry submissions
    config.registries.forEach((registry, idx) => {
      setSubmissionQueue(prev => {
        const existing = prev.find(s => s.registry === registry);
        if (existing) {
          return prev.map(s => s.registry === registry ? {
            ...s,
            credits: s.credits + credits,
            status: cycleCount > 5 ? 'validated' : 'pending'
          } : s);
        }
        return [...prev, {
          registry,
          status: 'pending',
          credits,
          timestamp: new Date().toISOString()
        }];
      });
    });
  }, [config, simulateSensors, updateGateway, generateJSONPacket, calculateCredits, generateMerkleHash, cycleCount]);

  // Auto-run simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      runCycle();
      interval = setInterval(runCycle, 5000); // Every 5 seconds for demo
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize first readings
  useEffect(() => {
    runCycle();
  }, [selectedProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Export JSON
  const exportJSON = () => {
    if (!jsonOutput) return;
    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CIVV_${config.gateway}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCredits = submissionQueue.reduce((sum, s) => sum + s.credits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">BlockVolt CIVV Worker Node</h2>
                <p className="text-slate-400 mt-1">Real-time dMRV Data Pipeline for Carbon Registries</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isRunning ? 'Running' : 'Stopped'}
              </div>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isRunning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRunning ? <Activity className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {isRunning ? 'Stop' : 'Start'} Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(PROJECT_CONFIGS) as [ProjectType, ProjectConfig][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedProject(key);
                    setCycleCount(0);
                    setSubmissionQueue([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedProject === key
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Sensors & Gateway */}
        <div className="xl:col-span-1 space-y-6">
          {/* Gateway Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('gateway')}
              className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-slate-100 to-slate-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-900">CIVV Gateway</span>
              </div>
              {expandedSections['gateway'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {expandedSections['gateway'] && gatewayStatus && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Gateway ID</p>
                    <p className="text-sm font-mono font-semibold text-slate-900">{gatewayStatus.id}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">MAC Address</p>
                    <p className="text-sm font-mono font-semibold text-slate-900">{gatewayStatus.mac}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Firmware</p>
                    <p className="text-sm font-semibold text-slate-900">{gatewayStatus.firmware}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Packets Sent</p>
                    <p className="text-sm font-semibold text-slate-900">{gatewayStatus.packetsSent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${gatewayStatus.hsmStatus === 'active' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="text-xs text-slate-600">HSM: {gatewayStatus.hsmStatus.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className={`w-4 h-4 ${gatewayStatus.mqttConnected ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-xs text-slate-600">MQTT: {gatewayStatus.mqttConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Last sync: {gatewayStatus.lastSync}
                </div>
              </div>
            )}
          </div>

          {/* Sensor Readings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('sensors')}
              className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-900">Sensor Bundle ({sensorReadings.length} nodes)</span>
              </div>
              {expandedSections['sensors'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {expandedSections['sensors'] && (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {sensorReadings.map((reading) => (
                  <div key={reading.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        reading.status === 'online' ? 'bg-emerald-500' :
                        reading.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{reading.name}</p>
                        <p className="text-xs text-slate-500">{reading.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{reading.value}</p>
                      <p className="text-xs text-slate-500">{reading.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - JSON & Calculator */}
        <div className="xl:col-span-1 space-y-6">
          {/* JSON Output */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('json')}
              className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-slate-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <FileJson className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-slate-900">15-Minute JSON Packet</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); exportJSON(); }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); runCycle(); }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </button>
                {expandedSections['json'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </button>
            {expandedSections['json'] && jsonOutput && (
              <div className="p-4">
                <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto max-h-80">
                  {JSON.stringify(jsonOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Calculator */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('calculator')}
              className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-slate-900">Methodology Calculator</span>
              </div>
              {expandedSections['calculator'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {expandedSections['calculator'] && (
              <div className="p-5 space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Methodology</p>
                  <p className="text-sm font-medium text-emerald-900 mt-1">{config.methodologies[0].name}</p>
                  <p className="text-xs text-emerald-700 mt-2 font-mono">{config.methodologies[0].formula}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registry Calculation</p>
                  <p className="text-sm font-mono bg-slate-100 p-2 rounded text-slate-700">{config.calculator.formula}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                    <p className="text-xs opacity-90">Cycle Credits</p>
                    <p className="text-2xl font-bold mt-1">{submissionQueue[0]?.credits.toFixed(4) || '0.0000'}</p>
                    <p className="text-xs opacity-75 mt-1">tCO2e / 15 min</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white">
                    <p className="text-xs opacity-90">Total Accumulated</p>
                    <p className="text-2xl font-bold mt-1">{totalCredits.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-1">tCO2e ({cycleCount} cycles)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Merkle Root */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Merkle Root Hash</span>
            </div>
            <p className="text-xs font-mono text-emerald-400 break-all">{merkleHash || 'Pending...'}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span>Cycle: {cycleCount}</span>
              <span>Chain: Polygon Mumbai</span>
            </div>
          </div>
        </div>

        {/* Right Column - Registry & NFT */}
        <div className="xl:col-span-1 space-y-6">
          {/* Registry Submissions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('registry')}
              className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-violet-50 to-slate-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-violet-600" />
                <span className="font-semibold text-slate-900">Registry Submissions</span>
              </div>
              {expandedSections['registry'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {expandedSections['registry'] && (
              <div className="p-5 space-y-3">
                {config.registries.map((registry) => {
                  const submission = submissionQueue.find(s => s.registry === registry);
                  return (
                    <div key={registry} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{registry}</p>
                        <p className="text-xs text-slate-500">Credits: {submission?.credits.toFixed(2) || '0'} tCO2e</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        submission?.status === 'validated' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {submission?.status === 'validated' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {submission?.status || 'pending'}
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-slate-200">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
                    <ArrowRight className="w-4 h-4" />
                    Submit to Registries
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NFT Minting */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('nft')}
              className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-slate-900">NFT Minting Pipeline</span>
              </div>
              {expandedSections['nft'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {expandedSections['nft'] && (
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  {[
                    { step: 'Daily Validation', status: 'completed' },
                    { step: 'Digital Signature', status: 'completed' },
                    { step: 'Merkle Tree Build', status: cycleCount > 3 ? 'completed' : 'pending' },
                    { step: 'IPFS Upload', status: cycleCount > 5 ? 'completed' : 'pending' },
                    { step: 'Polygon Mint', status: cycleCount > 10 ? 'completed' : 'pending' },
                    { step: 'Wallet Credit', status: cycleCount > 15 ? 'completed' : 'pending' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}>
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                      </div>
                      <span className={`text-sm ${item.status === 'completed' ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                        {item.step}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">NFT Metadata</p>
                  <div className="mt-2 space-y-1 text-xs font-mono text-indigo-900">
                    <p>Token ID: {cycleCount > 10 ? `#${(cycleCount * 7).toString(16).toUpperCase()}` : 'Pending'}</p>
                    <p>Contract: 0x7a3d...f8c2</p>
                    <p>Network: Polygon Mumbai</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Methodologies */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-emerald-600" />
              Available Methodologies
            </h3>
            <div className="space-y-2">
              {config.methodologies.map((method) => (
                <div key={method.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{method.id}</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">{config.registries[0]}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{method.name}</p>
                  <p className="text-xs font-mono text-slate-500 mt-1">{method.formula}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Product Passport Preview */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Digital Product Passport Preview
          </h3>
          <span className="text-xs text-slate-400">ISO 14021 / EU DPP Compliant</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">Project Type</p>
            <p className="text-lg font-semibold text-white mt-1">{config.name}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">Verified Credits</p>
            <p className="text-lg font-semibold text-emerald-400 mt-1">{totalCredits.toFixed(2)} tCO2e</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">Registry</p>
            <p className="text-lg font-semibold text-white mt-1">{config.registries[0]}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">Vintage</p>
            <p className="text-lg font-semibold text-white mt-1">{new Date().getFullYear()}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <span>Sensor Data: {sensorReadings.length} nodes</span>
          <span>Gateway: {gatewayStatus?.id}</span>
          <span>HSM: {gatewayStatus?.hsmStatus.toUpperCase()}</span>
          <span>JSON Packets: {cycleCount}</span>
        </div>
      </div>
    </div>
  );
}

// Import Calculator icon from lucide-react if not available
function Calculator({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </svg>
  );
}
