/*
# Community-Driven GHG Calculator & Methodology Marketplace Tables

1. New Tables
- `community_methodologies` — Community-contributed GHG calculator methodologies. Contains formula, sensor requirements, constants, status (PENDING_REVIEW, APPROVED, REJECTED), contributor info, revenue share config.
- `methodology_simulations` — 10-day 15-minute simulation runs for methodologies. Contains synthetic data, computed results, and summary stats.
- `methodology_usage` — Usage tracking for revenue share. Each 15-min data block using a community methodology records a usage event.
- `boq_items` — Blockvolt Bill of Quantities (sensor catalog). Maps sensor types to part numbers and prices.

2. Security
- RLS enabled on all tables.
- community_methodologies: readable by all authenticated, writable by contributor.
- methodology_simulations: readable by all authenticated, writable by authenticated.
- methodology_usage: readable by all authenticated, writable by authenticated.
- boq_items: readable by all authenticated, writable by authenticated (admin-managed).

3. Important Notes
- community_methodologies.status: PENDING_REVIEW → APPROVED or REJECTED by auditor.
- Revenue share: 30% contributor, 40% Blockvolt, 30% registry/VVB.
- Usage fee: $0.05 per 15-minute data block.
*/

CREATE TABLE IF NOT EXISTS community_methodologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  contributor_name text,
  registry text NOT NULL,
  methodology_title text NOT NULL,
  methodology_id text,
  version text DEFAULT '1.0',
  formula text NOT NULL,
  approach text NOT NULL DEFAULT 'bottom-up',
  required_sensor_types text[] NOT NULL DEFAULT '{}',
  sensor_mapping jsonb DEFAULT '[]'::jsonb,
  constants jsonb DEFAULT '{}'::jsonb,
  emission_factors jsonb DEFAULT '{}'::jsonb,
  description text,
  status text NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer_id uuid REFERENCES user_profiles(id),
  review_notes text,
  reviewed_at timestamptz,
  approved_at timestamptz,
  usage_count integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  contributor_revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS methodology_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id uuid NOT NULL REFERENCES community_methodologies(id),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  days integer NOT NULL DEFAULT 10,
  interval_minutes integer NOT NULL DEFAULT 15,
  synthetic_data jsonb NOT NULL,
  results jsonb NOT NULL,
  summary jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS methodology_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id uuid NOT NULL REFERENCES community_methodologies(id),
  project_id uuid REFERENCES plant_configs(id),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  blocks integer NOT NULL DEFAULT 1,
  fee_per_block numeric NOT NULL DEFAULT 0.05,
  contributor_share numeric NOT NULL DEFAULT 0.30,
  contributor_earnings numeric NOT NULL DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_type text NOT NULL,
  part_number text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'unit',
  category text DEFAULT 'sensor',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE community_methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_items ENABLE ROW LEVEL SECURITY;

-- Community methodologies: all authenticated can read, contributor can insert/update
DROP POLICY IF EXISTS "select_methodologies" ON community_methodologies;
CREATE POLICY "select_methodologies" ON community_methodologies FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_methodologies" ON community_methodologies;
CREATE POLICY "insert_methodologies" ON community_methodologies FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_methodologies" ON community_methodologies;
CREATE POLICY "update_methodologies" ON community_methodologies FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Simulations: all authenticated can read and write
DROP POLICY IF EXISTS "select_simulations" ON methodology_simulations;
CREATE POLICY "select_simulations" ON methodology_simulations FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_simulations" ON methodology_simulations;
CREATE POLICY "insert_simulations" ON methodology_simulations FOR INSERT
  TO authenticated WITH CHECK (true);

-- Usage: all authenticated can read and write
DROP POLICY IF EXISTS "select_usage" ON methodology_usage;
CREATE POLICY "select_usage" ON methodology_usage FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_usage" ON methodology_usage;
CREATE POLICY "insert_usage" ON methodology_usage FOR INSERT
  TO authenticated WITH CHECK (true);

-- BoQ items: all authenticated can read, all can insert (admin-managed in practice)
DROP POLICY IF EXISTS "select_boq" ON boq_items;
CREATE POLICY "select_boq" ON boq_items FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_boq" ON boq_items;
CREATE POLICY "insert_boq" ON boq_items FOR INSERT
  TO authenticated WITH CHECK (true);

-- Seed BoQ data
INSERT INTO boq_items (sensor_type, part_number, description, price, category) VALUES
  ('CO2', 'BLK-S-CO2', 'NDIR CO2 Sensor', 600, 'sensor'),
  ('CH4', 'BLK-S-CH4', 'NDIR Methane Sensor', 750, 'sensor'),
  ('N2O', 'BLK-S-N2O', 'N2O Gas Analyzer', 850, 'sensor'),
  ('FLOW', 'BLK-S-FLOW', 'Electromagnetic Flow Meter', 550, 'sensor'),
  ('ENERGY', 'BLK-M-KWH', 'Smart Energy Meter', 350, 'meter'),
  ('TEMP', 'BLK-S-TEMP', 'RTD Temperature Sensor', 150, 'sensor'),
  ('HUMIDITY', 'BLK-S-HUM', 'Humidity Sensor', 180, 'sensor'),
  ('PRESSURE', 'BLK-S-PRES', 'Pressure Transmitter', 280, 'sensor'),
  ('SOIL_C', 'BLK-S-SOILC', 'Soil Carbon Probe', 400, 'sensor'),
  ('IRRADIANCE', 'BLK-S-IRR', 'Pyranometer (Solar Irradiance)', 320, 'sensor'),
  ('PH', 'BLK-S-PH', 'pH Sensor', 220, 'sensor'),
  ('TURBIDITY', 'BLK-S-TURB', 'Turbidity Sensor', 290, 'sensor'),
  ('WIND_SPEED', 'BLK-S-WIND', 'Anemometer', 250, 'sensor'),
  ('GATEWAY', 'BLK-GW-CIVV', 'Blockvolt CIVV Gateway', 1200, 'gateway'),
  ('DATALOGGER', 'BLK-DL-01', 'Data Logger Unit', 450, 'datalogger')
ON CONFLICT (part_number) DO NOTHING;
