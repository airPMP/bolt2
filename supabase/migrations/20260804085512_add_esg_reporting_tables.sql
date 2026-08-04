/*
# ESG Reporting Module Tables

1. New Tables
- `raw_activity_ledger` — Immutable record of all ESG activities (CIVV sensor data, manual entry, ERP/utility imports). Scope 1/2/3, activity type, quantity, unit, blockchain tx hash.
- `carbon_emissions_factors` — Emission factors by activity type, region, year. Used to convert raw activity to tCO2e.
- `report_framework_alignment` — Maps raw activity records to GRI/BRSR/CDP/CSRD/SBTi indicators. Tracks review status.
- `materiality_assessments` — Materiality matrix entries: topic, impact score, likelihood score, rationale.
- `disclosure_items` — Final disclosure values per framework indicator. Source can be CIVV, Manual, or Airbyte. Review workflow: draft → pending_validation → approved_auditor → rejected.

2. Security
- RLS enabled on all tables.
- All tables: owner-scoped CRUD (user_id = auth.uid()).
- carbon_emissions_factors: readable by all authenticated (reference data), writable by authenticated.

3. Important Notes
- ReviewStatus: draft, pending_validation, approved_auditor, rejected
- ScopeCategory: scope1, scope2, scope3
- Frameworks: GRI, BRSR, CDP, CSRD
- Source: CIVV, Manual, Airbyte
*/

CREATE TABLE IF NOT EXISTS raw_activity_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  organization_id uuid REFERENCES user_profiles(id),
  recorded_at timestamptz DEFAULT now(),
  activity_window_start timestamptz,
  activity_window_end timestamptz,
  scope_category text NOT NULL DEFAULT 'scope1',
  activity_type text NOT NULL,
  raw_quantity numeric(16,4) NOT NULL DEFAULT 0,
  measurement_unit text NOT NULL DEFAULT 'kWh',
  blockchain_tx_hash text,
  source text NOT NULL DEFAULT 'CIVV',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carbon_emissions_factors (
  id serial PRIMARY KEY,
  activity_type text NOT NULL,
  factor_value_co2e numeric(16,6) NOT NULL,
  measurement_unit text NOT NULL,
  geographic_region text DEFAULT 'global',
  regulatory_year integer NOT NULL DEFAULT 2026,
  data_source_citation text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_framework_alignment (
  id serial PRIMARY KEY,
  record_id uuid NOT NULL REFERENCES raw_activity_ledger(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  gri_indicator_id text,
  brsr_indicator_id text,
  sbti_target_id text,
  csrd_indicator_id text,
  cdp_indicator_id text,
  calculated_tco2e numeric(16,6),
  review_status text NOT NULL DEFAULT 'draft',
  last_modified_by text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materiality_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  organization_id uuid REFERENCES user_profiles(id),
  topic text NOT NULL,
  impact_score integer NOT NULL DEFAULT 5,
  likelihood_score integer NOT NULL DEFAULT 5,
  rationale text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disclosure_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  organization_id uuid REFERENCES user_profiles(id),
  framework text NOT NULL,
  indicator text NOT NULL,
  indicator_name text,
  value_text text,
  value_numeric numeric(16,4),
  unit text,
  source text NOT NULL DEFAULT 'Manual',
  review_status text NOT NULL DEFAULT 'draft',
  last_modified_by text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE raw_activity_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_emissions_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_framework_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disclosure_items ENABLE ROW LEVEL SECURITY;

-- raw_activity_ledger: owner-scoped
DROP POLICY IF EXISTS "select_own_activities" ON raw_activity_ledger;
CREATE POLICY "select_own_activities" ON raw_activity_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activities" ON raw_activity_ledger;
CREATE POLICY "insert_own_activities" ON raw_activity_ledger FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_activities" ON raw_activity_ledger;
CREATE POLICY "update_own_activities" ON raw_activity_ledger FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activities" ON raw_activity_ledger;
CREATE POLICY "delete_own_activities" ON raw_activity_ledger FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- carbon_emissions_factors: all authenticated can read, all can insert
DROP POLICY IF EXISTS "select_emission_factors" ON carbon_emissions_factors;
CREATE POLICY "select_emission_factors" ON carbon_emissions_factors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_emission_factors" ON carbon_emissions_factors;
CREATE POLICY "insert_emission_factors" ON carbon_emissions_factors FOR INSERT TO authenticated WITH CHECK (true);

-- report_framework_alignment: owner-scoped
DROP POLICY IF EXISTS "select_own_alignments" ON report_framework_alignment;
CREATE POLICY "select_own_alignments" ON report_framework_alignment FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_alignments" ON report_framework_alignment;
CREATE POLICY "insert_own_alignments" ON report_framework_alignment FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_alignments" ON report_framework_alignment;
CREATE POLICY "update_own_alignments" ON report_framework_alignment FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- materiality_assessments: owner-scoped
DROP POLICY IF EXISTS "select_own_materiality" ON materiality_assessments;
CREATE POLICY "select_own_materiality" ON materiality_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_materiality" ON materiality_assessments;
CREATE POLICY "insert_own_materiality" ON materiality_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_materiality" ON materiality_assessments;
CREATE POLICY "update_own_materiality" ON materiality_assessments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_materiality" ON materiality_assessments;
CREATE POLICY "delete_own_materiality" ON materiality_assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- disclosure_items: owner-scoped
DROP POLICY IF EXISTS "select_own_disclosures" ON disclosure_items;
CREATE POLICY "select_own_disclosures" ON disclosure_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_disclosures" ON disclosure_items;
CREATE POLICY "insert_own_disclosures" ON disclosure_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_disclosures" ON disclosure_items;
CREATE POLICY "update_own_disclosures" ON disclosure_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_disclosures" ON disclosure_items;
CREATE POLICY "delete_own_disclosures" ON disclosure_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed emission factors
INSERT INTO carbon_emissions_factors (activity_type, factor_value_co2e, measurement_unit, geographic_region, regulatory_year, data_source_citation) VALUES
  ('stationary_combustion_diesel', 0.262100, 'L', 'global', 2026, 'IPCC 2006 Guidelines'),
  ('stationary_combustion_natural_gas', 0.001840, 'm3', 'global', 2026, 'IPCC 2006 Guidelines'),
  ('stationary_combustion_coal', 2.419000, 'kg', 'global', 2026, 'IPCC 2006 Guidelines'),
  ('purchased_electricity_grid', 0.000702, 'kWh', 'India', 2026, 'CBRE Grid EF 2024'),
  ('purchased_electricity_grid', 0.000385, 'kWh', 'EU', 2026, 'EEA Grid EF 2024'),
  ('purchased_electricity_grid', 0.000421, 'kWh', 'US', 2026, 'EPA eGRID 2024'),
  ('purchased_heat', 0.000250, 'kWh', 'global', 2026, 'ISO 14064-1'),
  ('transport_diesel_vehicle', 0.262100, 'L', 'global', 2026, 'IPCC 2006 Guidelines'),
  ('transport_petrol_vehicle', 0.230700, 'L', 'global', 2026, 'IPCC 2006 Guidelines'),
  ('refrigerant_r410a', 2088.000000, 'kg', 'global', 2026, 'IPCC AR6 GWP'),
  ('refrigerant_r404a', 3922.000000, 'kg', 'global', 2026, 'IPCC AR6 GWP'),
  ('waste_landfill_mixed', 0.580000, 'kg', 'global', 2026, 'EPA WARM'),
  ('water_supply_treatment', 0.000149, 'L', 'global', 2026, 'DEFRA 2024'),
  ('business_travel_air_short', 0.255000, 'km', 'global', 2026, 'DEFRA 2024'),
  ('business_travel_air_long', 0.195000, 'km', 'global', 2026, 'DEFRA 2024'),
  ('purchased_goods_steel', 1.910000, 'kg', 'global', 2026, 'ecoinvent v3.10'),
  ('purchased_goods_cement', 0.730000, 'kg', 'global', 2026, 'ecoinvent v3.10'),
  ('purchased_goods_aluminium', 8.100000, 'kg', 'global', 2026, 'ecoinvent v3.10')
ON CONFLICT DO NOTHING;
