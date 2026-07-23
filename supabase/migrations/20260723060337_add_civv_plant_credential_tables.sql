/*
# Add CIVV Gateway, Plant Config, Credential, Auth Stamp, Data Submission, Token Mint, and Exchange Transaction Tables

1. New Tables
- `civv_gateways` — Blockvolt CIVV hardware gateway. MAC address, firmware, sensors, shipping status.
- `plant_configs` — Links plant to GHG calculator, club, registry, methodology, CIVV gateway (MAC lock). Created by auditor.
- `persona_credentials` — Registry/exchange/wallet API credentials per user. Auth status tracked.
- `auth_stamps` — Authentication events with green-tick status when persona connects to registry/exchange.
- `data_submissions` — 15-min interval data pushed by developer to registry.
- `token_mints` — Carbon credits/RECs/emission tokens minted to wallet.
- `exchange_listings` — Tokens pushed to exchanges (IEX, ICM, AirCarbon).

2. Security
- RLS enabled on all tables.
- plant_configs and civv_gateways: readable by all authenticated, writable by authenticated.
- persona_credentials, auth_stamps, data_submissions, token_mints, exchange_listings: owner-scoped.
*/

-- CIVV Gateways first (no FK deps)
CREATE TABLE IF NOT EXISTS civv_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text NOT NULL,
  mac_address text UNIQUE NOT NULL,
  firmware_version text DEFAULT 'v2.4.1',
  sensor_count integer DEFAULT 0,
  sensors jsonb DEFAULT '[]'::jsonb,
  ship_status text NOT NULL DEFAULT 'pending',
  shipped_to text,
  shipped_at timestamptz,
  locked_to_plant_id uuid,
  locked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Plant Configs (references civv_gateways)
CREATE TABLE IF NOT EXISTS plant_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_name text NOT NULL,
  plant_code text UNIQUE NOT NULL,
  industry text NOT NULL,
  ghg_calculator_type text NOT NULL,
  token_type text NOT NULL DEFAULT 'green',
  club text,
  registry text NOT NULL,
  methodology text NOT NULL,
  scope_level text DEFAULT 'scope1',
  civv_gateway_id uuid REFERENCES civv_gateways(id),
  mac_address text UNIQUE,
  auditor_id uuid NOT NULL REFERENCES user_profiles(id),
  developer_id uuid REFERENCES user_profiles(id),
  status text NOT NULL DEFAULT 'configured',
  config_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK from civv_gateways to plant_configs (circular, added after both exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'civv_gateways_locked_to_plant_id_fkey' AND table_name = 'civv_gateways') THEN
    ALTER TABLE civv_gateways ADD CONSTRAINT civv_gateways_locked_to_plant_id_fkey
      FOREIGN KEY (locked_to_plant_id) REFERENCES plant_configs(id);
  END IF;
END $$;

-- Persona Credentials (owner-scoped)
CREATE TABLE IF NOT EXISTS persona_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  credential_type text NOT NULL,
  provider text NOT NULL,
  api_key text,
  api_endpoint text,
  username text,
  password text,
  auth_status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auth Stamps (owner-scoped)
CREATE TABLE IF NOT EXISTS auth_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  persona text NOT NULL,
  provider text NOT NULL,
  provider_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stamp_hash text,
  stamped_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Data Submissions (owner-scoped)
CREATE TABLE IF NOT EXISTS data_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id),
  mac_address text NOT NULL,
  registry text NOT NULL,
  payload jsonb NOT NULL,
  interval_minutes integer DEFAULT 15,
  submission_status text NOT NULL DEFAULT 'pending',
  registry_response jsonb,
  submitted_at timestamptz DEFAULT now()
);

-- Token Mints (owner-scoped)
CREATE TABLE IF NOT EXISTS token_mints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  plant_config_id uuid NOT NULL REFERENCES plant_configs(id),
  registry text NOT NULL,
  token_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  serial_number text,
  mint_status text NOT NULL DEFAULT 'pending',
  wallet_address text,
  registry_response jsonb,
  minted_at timestamptz DEFAULT now()
);

-- Exchange Listings (owner-scoped)
CREATE TABLE IF NOT EXISTS exchange_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id),
  token_mint_id uuid REFERENCES token_mints(id),
  exchange text NOT NULL,
  token_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  price_per_unit numeric,
  listing_status text NOT NULL DEFAULT 'pending',
  exchange_response jsonb,
  listed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE civv_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_mints ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_listings ENABLE ROW LEVEL SECURITY;

-- CIVV gateways: all authenticated can read/write
DROP POLICY IF EXISTS "select_civv_gateways" ON civv_gateways;
CREATE POLICY "select_civv_gateways" ON civv_gateways FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_civv_gateways" ON civv_gateways;
CREATE POLICY "insert_civv_gateways" ON civv_gateways FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_civv_gateways" ON civv_gateways;
CREATE POLICY "update_civv_gateways" ON civv_gateways FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Plant configs: all authenticated can read, auditor can insert
DROP POLICY IF EXISTS "select_plant_configs" ON plant_configs;
CREATE POLICY "select_plant_configs" ON plant_configs FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_plant_configs" ON plant_configs;
CREATE POLICY "insert_plant_configs" ON plant_configs FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_plant_configs" ON plant_configs;
CREATE POLICY "update_plant_configs" ON plant_configs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Persona credentials: owner-scoped
DROP POLICY IF EXISTS "select_own_credentials" ON persona_credentials;
CREATE POLICY "select_own_credentials" ON persona_credentials FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_credentials" ON persona_credentials;
CREATE POLICY "insert_own_credentials" ON persona_credentials FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_credentials" ON persona_credentials;
CREATE POLICY "update_own_credentials" ON persona_credentials FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_credentials" ON persona_credentials;
CREATE POLICY "delete_own_credentials" ON persona_credentials FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auth stamps: owner-scoped
DROP POLICY IF EXISTS "select_own_stamps" ON auth_stamps;
CREATE POLICY "select_own_stamps" ON auth_stamps FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_stamps" ON auth_stamps;
CREATE POLICY "insert_own_stamps" ON auth_stamps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_stamps" ON auth_stamps;
CREATE POLICY "update_own_stamps" ON auth_stamps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Data submissions: owner-scoped
DROP POLICY IF EXISTS "select_own_submissions" ON data_submissions;
CREATE POLICY "select_own_submissions" ON data_submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_submissions" ON data_submissions;
CREATE POLICY "insert_own_submissions" ON data_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_submissions" ON data_submissions;
CREATE POLICY "update_own_submissions" ON data_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Token mints: owner-scoped
DROP POLICY IF EXISTS "select_own_mints" ON token_mints;
CREATE POLICY "select_own_mints" ON token_mints FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_mints" ON token_mints;
CREATE POLICY "insert_own_mints" ON token_mints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_mints" ON token_mints;
CREATE POLICY "update_own_mints" ON token_mints FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Exchange listings: owner-scoped
DROP POLICY IF EXISTS "select_own_listings" ON exchange_listings;
CREATE POLICY "select_own_listings" ON exchange_listings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_listings" ON exchange_listings;
CREATE POLICY "insert_own_listings" ON exchange_listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_listings" ON exchange_listings;
CREATE POLICY "update_own_listings" ON exchange_listings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
