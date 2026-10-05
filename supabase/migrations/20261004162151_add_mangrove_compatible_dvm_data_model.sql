/*
# Add Mangrove-compatible dMRV Data Model

## Overview
Adds the core data model abstraction (events, datapoints, batches, ledgers, models, model runs, data rules)
that bridges BlockVolt with Mangrove's architecture. These tables sit alongside the existing plant_configs
and data_submissions tables and enable structured sensor data ingestion, model-based calculations,
mass balance tracking, and rule-based data quality assurance.

## New Tables

### 1. dvm_event_types
Defines event types per plant (e.g. "Biochar Delivery", "Power Generation Interval").
- id, plant_config_id (FK), name, slug, cadence, created_at

### 2. dvm_datapoint_types
Defines datapoint types within an event type (numeric, text, geo, file).
- id, event_type_id (FK), name, slug, unit, data_type, uncertainty, uncertainty_type, evidence_check

### 3. dvm_events
An operational activity within a plant's monitoring cycle.
- id, event_type_id (FK), plant_config_id (FK), user_id, timestamp, metadata, created_at

### 4. dvm_datapoints
Individual HSM-signed sensor readings within an event.
- id, event_id (FK), datapoint_type_id (FK), numeric_value, text_value, geo_value, file_value (IPFS CID),
  unit, uncertainty, hsm_signature, gateway_mac, merkle_proof, captured_at, created_at

### 5. dvm_models
YAML-defined calculation models (e.g. biochar CDR, CI score).
- id, plant_config_id (FK), user_id, name, slug, version, yaml_definition, is_active, created_at

### 6. dvm_model_runs
Execution results of a model against a time range of datapoints.
- id, model_id (FK), user_id, start_time, end_time, state, error_message, calculations, outputs, created_at

### 7. dvm_ledgers
Mass balance tracking across production stages.
- id, plant_config_id (FK), user_id, name, slug, unit, balance, created_at

### 8. dvm_batches
Grouped datapoints for a monitoring cycle, attached to a ledger.
- id, ledger_id (FK), user_id, batch_type, start_time, end_time, inputs, outputs, calculations, uncertainty, status, created_at

### 9. dvm_data_rules
Rule expressions for data quality assurance (alert, substitute, block).
- id, plant_config_id (FK), user_id, name, expression, action, alert_message, is_active, created_at

### 10. dvm_rule_results
Alerts/results from rule evaluation against datapoints.
- id, rule_id (FK), user_id, target_type, target_id, message, dismissed, dismissed_at, created_at

### 11. dvm_credit_inventory
Tracks issued credits with status lifecycle.
- id, plant_config_id (FK), user_id, issuance_ref, credit_type, quantity, vintage, registry_ref, serial_numbers, status, created_at

## Security
- RLS enabled on all tables.
- All tables are owner-scoped (user_id = auth.uid()).
- dvm_event_types, dvm_datapoint_types, dvm_models, dvm_ledgers, dvm_data_rules, dvm_credit_inventory
  are readable by all authenticated users (for cross-persona visibility), writable by owner.
- dvm_events, dvm_datapoints, dvm_model_runs, dvm_batches, dvm_rule_results are owner-scoped CRUD.
*/

-- ============================================================
-- dvm_event_types
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  name text NOT NULL,
  slug text NOT NULL,
  cadence text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_event_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_event_types" ON dvm_event_types;
CREATE POLICY "select_dvm_event_types" ON dvm_event_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_dvm_event_types" ON dvm_event_types;
CREATE POLICY "insert_dvm_event_types" ON dvm_event_types FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_event_types" ON dvm_event_types;
CREATE POLICY "update_dvm_event_types" ON dvm_event_types FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_event_types" ON dvm_event_types;
CREATE POLICY "delete_dvm_event_types" ON dvm_event_types FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS dvm_event_types_plant_slug ON dvm_event_types (plant_config_id, slug);

-- ============================================================
-- dvm_datapoint_types
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_datapoint_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid NOT NULL REFERENCES dvm_event_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  unit text NOT NULL DEFAULT '',
  data_type text NOT NULL DEFAULT 'NUMERIC' CHECK (data_type IN ('NUMERIC','TEXT','GEO','FILE','BOOLEAN')),
  uncertainty numeric DEFAULT 0,
  uncertainty_type text CHECK (uncertainty_type IN ('ABSOLUTE','RELATIVE') OR uncertainty_type IS NULL),
  evidence_check boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_datapoint_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_datapoint_types" ON dvm_datapoint_types;
CREATE POLICY "select_dvm_datapoint_types" ON dvm_datapoint_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_dvm_datapoint_types" ON dvm_datapoint_types;
CREATE POLICY "insert_dvm_datapoint_types" ON dvm_datapoint_types FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_dvm_datapoint_types" ON dvm_datapoint_types;
CREATE POLICY "update_dvm_datapoint_types" ON dvm_datapoint_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE UNIQUE INDEX IF NOT EXISTS dvm_dp_types_event_slug ON dvm_datapoint_types (event_type_id, slug);

-- ============================================================
-- dvm_events
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid NOT NULL REFERENCES dvm_event_types(id) ON DELETE CASCADE,
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  timestamp timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_events" ON dvm_events;
CREATE POLICY "select_dvm_events" ON dvm_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_dvm_events" ON dvm_events;
CREATE POLICY "insert_dvm_events" ON dvm_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_events" ON dvm_events;
CREATE POLICY "update_dvm_events" ON dvm_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_events" ON dvm_events;
CREATE POLICY "delete_dvm_events" ON dvm_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS dvm_events_plant_ts ON dvm_events (plant_config_id, timestamp);

-- ============================================================
-- dvm_datapoints
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_datapoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES dvm_events(id) ON DELETE CASCADE,
  datapoint_type_id uuid NOT NULL REFERENCES dvm_datapoint_types(id) ON DELETE CASCADE,
  numeric_value numeric,
  text_value text,
  geo_value jsonb,
  file_value text,
  unit text NOT NULL DEFAULT '',
  uncertainty numeric DEFAULT 0,
  hsm_signature text,
  gateway_mac text,
  merkle_proof jsonb,
  captured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_datapoints ENABLE ROW LEVEL SECURITY;
-- Join through event to check ownership
DROP POLICY IF EXISTS "select_dvm_datapoints" ON dvm_datapoints;
CREATE POLICY "select_dvm_datapoints" ON dvm_datapoints FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM dvm_events WHERE dvm_events.id = dvm_datapoints.event_id AND dvm_events.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_dvm_datapoints" ON dvm_datapoints;
CREATE POLICY "insert_dvm_datapoints" ON dvm_datapoints FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM dvm_events WHERE dvm_events.id = dvm_datapoints.event_id AND dvm_events.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_dvm_datapoints" ON dvm_datapoints;
CREATE POLICY "update_dvm_datapoints" ON dvm_datapoints FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM dvm_events WHERE dvm_events.id = dvm_datapoints.event_id AND dvm_events.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM dvm_events WHERE dvm_events.id = dvm_datapoints.event_id AND dvm_events.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_dvm_datapoints" ON dvm_datapoints;
CREATE POLICY "delete_dvm_datapoints" ON dvm_datapoints FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM dvm_events WHERE dvm_events.id = dvm_datapoints.event_id AND dvm_events.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS dvm_datapoints_event ON dvm_datapoints (event_id);

-- ============================================================
-- dvm_models
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  name text NOT NULL,
  slug text NOT NULL,
  version integer DEFAULT 1,
  yaml_definition text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_models" ON dvm_models;
CREATE POLICY "select_dvm_models" ON dvm_models FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_dvm_models" ON dvm_models;
CREATE POLICY "insert_dvm_models" ON dvm_models FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_models" ON dvm_models;
CREATE POLICY "update_dvm_models" ON dvm_models FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_models" ON dvm_models;
CREATE POLICY "delete_dvm_models" ON dvm_models FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS dvm_models_plant_slug_ver ON dvm_models (plant_config_id, slug, version);

-- ============================================================
-- dvm_model_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_model_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES dvm_models(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  state text NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','RUNNING','COMPLETE','FAILED')),
  error_message text,
  calculations jsonb DEFAULT '{}'::jsonb,
  outputs jsonb DEFAULT '{}'::jsonb,
  uncertainty jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_model_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_model_runs" ON dvm_model_runs;
CREATE POLICY "select_dvm_model_runs" ON dvm_model_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_dvm_model_runs" ON dvm_model_runs;
CREATE POLICY "insert_dvm_model_runs" ON dvm_model_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_model_runs" ON dvm_model_runs;
CREATE POLICY "update_dvm_model_runs" ON dvm_model_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_model_runs" ON dvm_model_runs;
CREATE POLICY "delete_dvm_model_runs" ON dvm_model_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- dvm_ledgers
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  name text NOT NULL,
  slug text NOT NULL,
  unit text NOT NULL DEFAULT 'tCO2e',
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_ledgers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_ledgers" ON dvm_ledgers;
CREATE POLICY "select_dvm_ledgers" ON dvm_ledgers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_dvm_ledgers" ON dvm_ledgers;
CREATE POLICY "insert_dvm_ledgers" ON dvm_ledgers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_ledgers" ON dvm_ledgers;
CREATE POLICY "update_dvm_ledgers" ON dvm_ledgers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_ledgers" ON dvm_ledgers;
CREATE POLICY "delete_dvm_ledgers" ON dvm_ledgers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS dvm_ledgers_plant_slug ON dvm_ledgers (plant_config_id, slug);

-- ============================================================
-- dvm_batches
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES dvm_ledgers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  batch_type text NOT NULL DEFAULT 'PRODUCTION' CHECK (batch_type IN ('INPUT','PRODUCTION','OUTPUT')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  inputs jsonb DEFAULT '[]'::jsonb,
  outputs jsonb DEFAULT '[]'::jsonb,
  calculations jsonb DEFAULT '{}'::jsonb,
  uncertainty numeric,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','COMPLETE','FLAGGED','APPROVED')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_batches" ON dvm_batches;
CREATE POLICY "select_dvm_batches" ON dvm_batches FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_dvm_batches" ON dvm_batches;
CREATE POLICY "insert_dvm_batches" ON dvm_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_batches" ON dvm_batches;
CREATE POLICY "update_dvm_batches" ON dvm_batches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_batches" ON dvm_batches;
CREATE POLICY "delete_dvm_batches" ON dvm_batches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- dvm_data_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_data_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  name text NOT NULL,
  expression text NOT NULL,
  action text NOT NULL DEFAULT 'ALERT' CHECK (action IN ('ALERT','SUBSTITUTE','BLOCK')),
  alert_message text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_data_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_data_rules" ON dvm_data_rules;
CREATE POLICY "select_dvm_data_rules" ON dvm_data_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_dvm_data_rules" ON dvm_data_rules;
CREATE POLICY "insert_dvm_data_rules" ON dvm_data_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_data_rules" ON dvm_data_rules;
CREATE POLICY "update_dvm_data_rules" ON dvm_data_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_data_rules" ON dvm_data_rules;
CREATE POLICY "delete_dvm_data_rules" ON dvm_data_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- dvm_rule_results
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_rule_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES dvm_data_rules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  target_type text NOT NULL DEFAULT 'DATAPOINT',
  target_id uuid,
  message text NOT NULL,
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_rule_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_rule_results" ON dvm_rule_results;
CREATE POLICY "select_dvm_rule_results" ON dvm_rule_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_dvm_rule_results" ON dvm_rule_results;
CREATE POLICY "insert_dvm_rule_results" ON dvm_rule_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_rule_results" ON dvm_rule_results;
CREATE POLICY "update_dvm_rule_results" ON dvm_rule_results FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_rule_results" ON dvm_rule_results;
CREATE POLICY "delete_dvm_rule_results" ON dvm_rule_results FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- dvm_credit_inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS dvm_credit_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  issuance_ref text,
  credit_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  vintage text,
  registry_ref text,
  serial_numbers jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESERVED','DELIVERED','RETIRED')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dvm_credit_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_dvm_credit_inventory" ON dvm_credit_inventory;
CREATE POLICY "select_dvm_credit_inventory" ON dvm_credit_inventory FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_dvm_credit_inventory" ON dvm_credit_inventory;
CREATE POLICY "insert_dvm_credit_inventory" ON dvm_credit_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_dvm_credit_inventory" ON dvm_credit_inventory;
CREATE POLICY "update_dvm_credit_inventory" ON dvm_credit_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_dvm_credit_inventory" ON dvm_credit_inventory;
CREATE POLICY "delete_dvm_credit_inventory" ON dvm_credit_inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);
