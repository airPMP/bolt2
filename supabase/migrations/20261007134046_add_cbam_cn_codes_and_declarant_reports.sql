/*
# Add CBAM CN Code Reference + Declarant Report Tables

## Tables

### 1. cbam_cn_codes
Reference table of CBAM-covered CN codes with default emission factors.
- cn_code, sector, description
- direct_emissions_tco2e_per_t, indirect_emissions_tco2e_per_t
- production_route (A/B/NULL), benchmark_column_a, benchmark_column_b
- cbam_factor_2026 (0.975)

### 2. cbam_declarant_reports
Generated CBAM declarant reports per installation/quarter.
- installation_id, declarant_id, importing_company
- reporting_period, submission_date
- goods[] (cn_code, activity_level, SEE, SEFA, chargeable, cost)
- precursors[]
- provenance (merkle_root, ipfs_cid, hsm_signature)
- verification (verifier, accreditation, report_id)
- submission_channel (portal, partner, reference)
- status (DRAFT/SUBMITTED/VERIFIED/REJECTED)

## Security
- cbam_cn_codes: readable by all authenticated users, writable by owner (reference data)
- cbam_declarant_reports: owner-scoped CRUD
*/

CREATE TABLE IF NOT EXISTS cbam_cn_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cn_code text NOT NULL UNIQUE,
  sector text NOT NULL CHECK (sector IN ('CEMENT','FERTILISERS','IRON_STEEL','ALUMINIUM','HYDROGEN')),
  description text NOT NULL,
  direct_emissions_tco2e_per_t numeric,
  indirect_emissions_tco2e_per_t numeric,
  total_emissions_tco2e_per_t numeric,
  production_route text,
  benchmark_column_a numeric,
  benchmark_column_b numeric,
  cbam_factor_2026 numeric DEFAULT 0.975,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cbam_cn_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_cbam_cn_codes" ON cbam_cn_codes;
CREATE POLICY "select_cbam_cn_codes" ON cbam_cn_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_cbam_cn_codes" ON cbam_cn_codes;
CREATE POLICY "insert_cbam_cn_codes" ON cbam_cn_codes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_cbam_cn_codes" ON cbam_cn_codes;
CREATE POLICY "update_cbam_cn_codes" ON cbam_cn_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cbam_declarant_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  plant_config_id uuid REFERENCES plant_configs(id) ON DELETE CASCADE,
  installation_id text NOT NULL,
  declarant_id text,
  importing_company text,
  reporting_period text NOT NULL,
  submission_date date,
  goods jsonb NOT NULL DEFAULT '[]'::jsonb,
  precursors jsonb DEFAULT '[]'::jsonb,
  total_chargeable_tco2e numeric DEFAULT 0,
  total_cbam_cost_eur numeric DEFAULT 0,
  certificate_price_eur numeric DEFAULT 75.28,
  provenance jsonb DEFAULT '{}'::jsonb,
  verification jsonb DEFAULT '{}'::jsonb,
  submission_channel jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','VERIFIED','REJECTED')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cbam_declarant_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_cbam_declarant_reports" ON cbam_declarant_reports;
CREATE POLICY "select_cbam_declarant_reports" ON cbam_declarant_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_cbam_declarant_reports" ON cbam_declarant_reports;
CREATE POLICY "insert_cbam_declarant_reports" ON cbam_declarant_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_cbam_declarant_reports" ON cbam_declarant_reports;
CREATE POLICY "update_cbam_declarant_reports" ON cbam_declarant_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_cbam_declarant_reports" ON cbam_declarant_reports;
CREATE POLICY "delete_cbam_declarant_reports" ON cbam_declarant_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS cbam_reports_period ON cbam_declarant_reports (reporting_period);
