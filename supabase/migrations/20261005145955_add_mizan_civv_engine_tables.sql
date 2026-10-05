/*
# Add Mizan CIVV Engine Tables (Oman Net Zero Centre Integration)

## Overview
Supports the Omani Mizan CIVV engine that ingests industrial historian streams
(AVEVA PI / Honeywell PHD), validates thermodynamic data, and mints two token classes:
- Black Tokens (dRMV-B): emissions liability for unmitigated CO2
- Green Tokens (dRMV-G): verified removal credits (CCS, abatement)

## Security
- RLS enabled, owner-scoped CRUD.
*/

CREATE TABLE IF NOT EXISTS mizan_civv_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_config_id uuid REFERENCES plant_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  facility_id text NOT NULL,
  tpm_device_id text,
  governorate text DEFAULT 'North Al Batinah',
  country text DEFAULT 'OMAN',
  timestamp timestamptz NOT NULL DEFAULT now(),
  co2_mass_flow_kg_s numeric NOT NULL DEFAULT 0,
  stack_temp_k numeric,
  ccs_captured_kg_s numeric DEFAULT 0,
  gross_emitted_tco2_hr numeric DEFAULT 0,
  captured_ccs_tco2_hr numeric DEFAULT 0,
  net_emitted_tco2_hr numeric DEFAULT 0,
  civv_hash_proof text,
  oman_net_zero_2050_aligned boolean DEFAULT true,
  article_6_2_itmo_eligible boolean DEFAULT false,
  jsonld_payload jsonb DEFAULT '{}'::jsonb,
  mizan_dispatch_status text DEFAULT 'PENDING' CHECK (mizan_dispatch_status IN ('PENDING','DISPATCHED','ACKNOWLEDGED','FAILED')),
  mizan_dispatch_response jsonb,
  dispatched_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mizan_civv_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_mizan_civv_records" ON mizan_civv_records;
CREATE POLICY "select_mizan_civv_records" ON mizan_civv_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_mizan_civv_records" ON mizan_civv_records;
CREATE POLICY "insert_mizan_civv_records" ON mizan_civv_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_mizan_civv_records" ON mizan_civv_records;
CREATE POLICY "update_mizan_civv_records" ON mizan_civv_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_mizan_civv_records" ON mizan_civv_records;
CREATE POLICY "delete_mizan_civv_records" ON mizan_civv_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS mizan_civv_facility_ts ON mizan_civv_records (facility_id, timestamp);

CREATE TABLE IF NOT EXISTS mizan_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES mizan_civv_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  token_class text NOT NULL CHECK (token_class IN ('BLACK','GREEN')),
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'tCO2e',
  settlement_status text NOT NULL DEFAULT 'MINTED' CHECK (settlement_status IN ('MINTED','SETTLED','TRANSFERRED','RETIRED')),
  article_6_2_eligible boolean DEFAULT false,
  mizan_registry_ref text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mizan_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_mizan_tokens" ON mizan_tokens;
CREATE POLICY "select_mizan_tokens" ON mizan_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_mizan_tokens" ON mizan_tokens;
CREATE POLICY "insert_mizan_tokens" ON mizan_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_mizan_tokens" ON mizan_tokens;
CREATE POLICY "update_mizan_tokens" ON mizan_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_mizan_tokens" ON mizan_tokens;
CREATE POLICY "delete_mizan_tokens" ON mizan_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS mizan_tokens_record ON mizan_tokens (record_id);
CREATE INDEX IF NOT EXISTS mizan_tokens_class ON mizan_tokens (token_class, settlement_status);
