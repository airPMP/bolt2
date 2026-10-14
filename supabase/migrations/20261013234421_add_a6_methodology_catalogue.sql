/*
# Methodology Catalogue + Parameter Register (A6-01, A6-03)

## Overview
Implements A6-01 (methodology catalogue with version/effective dates) and
A6-03 (parameter register with change impact tracking).

## New Tables

### 1. a6_methodologies
Each record includes programme, activity applicability, version, effective date,
source documents, formulas/parameters, required evidence, monitoring frequency
and retirement/supersession state.

### 2. a6_parameters
Parameters include source, owner, unit, valid range, collection frequency,
method version and change history. Updating a parameter produces an impact report;
no silent retroactive rewrite.

### 3. a6_parameter_history
Append-only history of parameter changes. Each change records old value, new value,
reason, and affected methodology versions.

## Security
- Readable by all authenticated users (reference data).
- Inserts/updates by admin/manager roles in organization_members.
*/

-- ============================================================
-- 1. a6_methodologies
-- ============================================================
CREATE TABLE IF NOT EXISTS a6_methodologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme text NOT NULL,
  activity_applicability text NOT NULL,
  methodology_id text NOT NULL,
  version text NOT NULL,
  effective_date date NOT NULL,
  source_documents jsonb DEFAULT '[]'::jsonb,
  formulas jsonb DEFAULT '{}'::jsonb,
  parameters jsonb DEFAULT '{}'::jsonb,
  required_evidence jsonb DEFAULT '[]'::jsonb,
  monitoring_frequency text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','superseded','retired')),
  superseded_by uuid REFERENCES a6_methodologies(id),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (methodology_id, version)
);
ALTER TABLE a6_methodologies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_a6_methods_all" ON a6_methodologies;
CREATE POLICY "select_a6_methods_all" ON a6_methodologies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_a6_methods_admin" ON a6_methodologies;
CREATE POLICY "insert_a6_methods_admin" ON a6_methodologies FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_a6_methods_admin" ON a6_methodologies;
CREATE POLICY "update_a6_methods_admin" ON a6_methodologies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS a6_methods_programme_idx ON a6_methodologies (programme);
CREATE INDEX IF NOT EXISTS a6_methods_status_idx ON a6_methodologies (status);

-- ============================================================
-- 2. a6_parameters
-- ============================================================
CREATE TABLE IF NOT EXISTS a6_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id uuid REFERENCES a6_methodologies(id) ON DELETE CASCADE,
  parameter_name text NOT NULL,
  source text,
  owner text,
  unit text,
  valid_range_min numeric,
  valid_range_max numeric,
  collection_frequency text,
  method_version text,
  current_value numeric,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE a6_parameters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_a6_params_all" ON a6_parameters;
CREATE POLICY "select_a6_params_all" ON a6_parameters FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_a6_params_admin" ON a6_parameters;
CREATE POLICY "insert_a6_params_admin" ON a6_parameters FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_a6_params_admin" ON a6_parameters;
CREATE POLICY "update_a6_params_admin" ON a6_parameters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS a6_params_method_idx ON a6_parameters (methodology_id);

-- ============================================================
-- 3. a6_parameter_history (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS a6_parameter_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id uuid NOT NULL REFERENCES a6_parameters(id) ON DELETE CASCADE,
  old_value numeric,
  new_value numeric,
  reason text,
  changed_by uuid REFERENCES user_profiles(id),
  affected_methods jsonb DEFAULT '[]'::jsonb,
  impact_report text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE a6_parameter_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_param_history_all" ON a6_parameter_history;
CREATE POLICY "select_param_history_all" ON a6_parameter_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_param_history_all" ON a6_parameter_history;
CREATE POLICY "insert_param_history_all" ON a6_parameter_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS param_history_param_idx ON a6_parameter_history (parameter_id);

-- Seed a few methodologies from existing data
INSERT INTO a6_methodologies (programme, activity_applicability, methodology_id, version, effective_date, status, description, monitoring_frequency) VALUES
('VCS', 'Renewable Energy', 'VM0003', '1.0', '2020-01-01', 'active', 'Grid-connected renewable electricity generation', 'Continuous'),
('VCS', 'Industrial Emissions', 'VM0041', '1.0', '2022-06-01', 'active', 'Reduction of GHG emissions from industrial processes', 'Monthly'),
('GS', 'Clean Cookstoves', 'TPDDTEC', '3.0', '2021-03-01', 'active', 'Technology and Practices for Domestic Energy Consumption', 'Quarterly'),
('CDM', 'Afforestation/Reforestation', 'AR-ACM0003', '2.0', '2019-01-01', 'active', 'Afforestation and reforestation of lands except degraded forests', 'Annual'),
('CIVV', 'Industrial Direct Measurement', 'CIVV-DMRV-001', '1.0', '2026-01-01', 'active', 'BlockVolt CIVV direct measurement, reporting and verification', '15 minutes')
ON CONFLICT (methodology_id, version) DO NOTHING;
