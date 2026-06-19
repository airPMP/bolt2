/*
  # Carbon Credit Platform Database Schema

  ## Overview
  Complete database schema for the Blockvolt ERTH carbon credit monitoring and trading platform.
  Includes IoT sensor integration, real-time monitoring, and payment processing capabilities.

  ## New Tables

  ### 1. `user_profiles`
  Extended user profile information beyond auth.users
  - `id` (uuid, references auth.users)
  - `user_type` (text) - 'auditor', 'developer', or 'buyer'
  - `company_name` (text)
  - `phone` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `projects`
  Carbon credit projects
  - `id` (uuid, primary key)
  - `project_code` (text, unique) - e.g., 'PROJ_001'
  - `name` (text)
  - `type` (text) - 'Energy', 'Renewable Energy', etc.
  - `methodology` (text) - e.g., 'ACM0011'
  - `status` (text) - 'Active', 'Verification', 'Pending'
  - `location` (text)
  - `vintage` (integer) - year
  - `verifier` (text)
  - `developer_id` (uuid, references user_profiles)
  - `total_credits` (integer)
  - `available_credits` (integer)
  - `price_per_credit` (decimal)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `assets`
  Physical assets (solar plants, IoT devices, etc.)
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `name` (text)
  - `asset_type` (text) - 'solar_plant', 'inverter', 'meter'
  - `capacity` (decimal) - in kWp
  - `location` (text)
  - `city` (text)
  - `commissioned_date` (date)
  - `mac_address` (text) - for IoT devices
  - `manufacturer` (text)
  - `model` (text)
  - `current_power` (decimal)
  - `lifetime_energy` (decimal)
  - `sensor_uptime` (decimal)
  - `total_inverters` (integer)
  - `total_meters` (integer)
  - `subscription_expiry` (date)
  - `metadata` (jsonb) - flexible storage for additional data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `sensor_data`
  Real-time sensor readings from IoT devices
  - `id` (bigserial, primary key)
  - `asset_id` (uuid, references assets)
  - `mac_address` (text)
  - `timestamp` (timestamptz)
  - `frequency` (decimal)
  - `voltage_phase1` (decimal)
  - `voltage_phase2` (decimal)
  - `voltage_phase3` (decimal)
  - `current_phase1` (decimal)
  - `current_phase2` (decimal)
  - `current_phase3` (decimal)
  - `active_power_phase1` (decimal)
  - `active_power_phase2` (decimal)
  - `active_power_phase3` (decimal)
  - `active_total` (decimal)
  - `temperature` (decimal)
  - `humidity` (decimal)
  - `irradiation` (decimal)
  - `created_at` (timestamptz)

  ### 5. `carbon_credits`
  Generated carbon credits
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `asset_id` (uuid, references assets)
  - `credit_amount` (decimal) - in tCO2
  - `generation_date` (date)
  - `status` (text) - 'generated', 'verified', 'available', 'sold', 'retired'
  - `vintage` (integer)
  - `verification_date` (date)
  - `verifier_id` (uuid, references user_profiles)
  - `serial_number` (text, unique)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)

  ### 6. `transactions`
  Credit transactions (buying, selling, retiring)
  - `id` (uuid, primary key)
  - `transaction_type` (text) - 'purchase', 'sale', 'retirement', 'transfer'
  - `credit_id` (uuid, references carbon_credits)
  - `buyer_id` (uuid, references user_profiles)
  - `seller_id` (uuid, references user_profiles)
  - `amount` (decimal) - in tCO2
  - `price_per_credit` (decimal)
  - `total_price` (decimal)
  - `status` (text) - 'pending', 'completed', 'failed', 'cancelled'
  - `payment_method` (text)
  - `payment_reference` (text)
  - `transaction_date` (timestamptz)
  - `completed_at` (timestamptz)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)

  ### 7. `wallets`
  User wallet balances
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `available_credits` (decimal)
  - `pending_credits` (decimal)
  - `retired_credits` (decimal)
  - `total_value` (decimal)
  - `updated_at` (timestamptz)

  ### 8. `verifications`
  Audit and verification records
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `verifier_id` (uuid, references user_profiles)
  - `verification_type` (text) - 'initial', 'periodic', 'final'
  - `status` (text) - 'pending', 'in_progress', 'completed', 'rejected'
  - `credits_verified` (decimal)
  - `verification_date` (date)
  - `report_url` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. `weather_data`
  Weather conditions for asset locations
  - `id` (uuid, primary key)
  - `asset_id` (uuid, references assets)
  - `timestamp` (timestamptz)
  - `condition` (text)
  - `temperature` (decimal)
  - `humidity` (decimal)
  - `irradiation` (decimal)
  - `wind_speed` (decimal)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on user_type
  - Auditors can view all projects and create verifications
  - Developers can manage their own projects and assets
  - Buyers can view available credits and create purchase transactions
*/

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('auditor', 'developer', 'buyer')),
  company_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  methodology text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Verification', 'Completed', 'Suspended')),
  location text,
  vintage integer,
  verifier text,
  developer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_credits integer DEFAULT 0,
  available_credits integer DEFAULT 0,
  price_per_credit decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (developer_id = auth.uid());

CREATE POLICY "Auditors can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'auditor'
    )
  );

CREATE POLICY "Buyers can view active projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    status = 'Active' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'buyer'
    )
  );

CREATE POLICY "Developers can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Developers can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (developer_id = auth.uid())
  WITH CHECK (developer_id = auth.uid());

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  asset_type text NOT NULL,
  capacity decimal(10,3),
  location text,
  city text,
  commissioned_date date,
  mac_address text,
  manufacturer text,
  model text,
  current_power decimal(10,3) DEFAULT 0,
  lifetime_energy decimal(15,3) DEFAULT 0,
  sensor_uptime decimal(5,2) DEFAULT 100,
  total_inverters integer DEFAULT 0,
  total_meters integer DEFAULT 0,
  subscription_expiry date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets of accessible projects"
  ON assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND (
        projects.developer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type IN ('auditor', 'buyer')
        )
      )
    )
  );

CREATE POLICY "Developers can insert assets for own projects"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can update assets for own projects"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.developer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.developer_id = auth.uid()
    )
  );

-- Sensor Data
CREATE TABLE IF NOT EXISTS sensor_data (
  id bigserial PRIMARY KEY,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  mac_address text,
  timestamp timestamptz NOT NULL,
  frequency decimal(10,8),
  voltage_phase1 decimal(10,7),
  voltage_phase2 decimal(10,7),
  voltage_phase3 decimal(10,7),
  current_phase1 decimal(10,8),
  current_phase2 decimal(10,8),
  current_phase3 decimal(10,8),
  active_power_phase1 decimal(10,8),
  active_power_phase2 decimal(10,8),
  active_power_phase3 decimal(10,8),
  active_total decimal(10,2),
  temperature decimal(5,2),
  humidity decimal(5,2),
  irradiation decimal(10,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_asset_timestamp ON sensor_data(asset_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_mac_timestamp ON sensor_data(mac_address, timestamp DESC);

ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sensor data of accessible assets"
  ON sensor_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      JOIN projects ON projects.id = assets.project_id
      WHERE assets.id = sensor_data.asset_id
      AND (
        projects.developer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type IN ('auditor', 'buyer')
        )
      )
    )
  );

-- Carbon Credits
CREATE TABLE IF NOT EXISTS carbon_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  credit_amount decimal(15,6) NOT NULL,
  generation_date date NOT NULL,
  status text DEFAULT 'generated' CHECK (status IN ('generated', 'verified', 'available', 'sold', 'retired')),
  vintage integer NOT NULL,
  verification_date date,
  verifier_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  serial_number text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carbon_credits_project ON carbon_credits(project_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_status ON carbon_credits(status);

ALTER TABLE carbon_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credits of accessible projects"
  ON carbon_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = carbon_credits.project_id
      AND (
        projects.developer_id = auth.uid()
        OR status IN ('available', 'sold')
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type = 'auditor'
        )
      )
    )
  );

CREATE POLICY "Developers can insert credits for own projects"
  ON carbon_credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = carbon_credits.project_id
      AND projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Auditors can update credit verification"
  ON carbon_credits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'auditor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'auditor'
    )
  );

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'retirement', 'transfer')),
  credit_id uuid REFERENCES carbon_credits(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  amount decimal(15,6) NOT NULL,
  price_per_credit decimal(10,2),
  total_price decimal(15,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method text,
  payment_reference text,
  transaction_date timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create purchase transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = auth.uid() AND
    transaction_type = 'purchase' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'buyer'
    )
  );

CREATE POLICY "Developers can create sale transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND
    transaction_type = 'sale' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'developer'
    )
  );

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  available_credits decimal(15,6) DEFAULT 0,
  pending_credits decimal(15,6) DEFAULT 0,
  retired_credits decimal(15,6) DEFAULT 0,
  total_value decimal(15,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Verifications
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  verifier_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  verification_type text NOT NULL CHECK (verification_type IN ('initial', 'periodic', 'final')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  credits_verified decimal(15,6),
  verification_date date,
  report_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_project ON verifications(project_id);
CREATE INDEX IF NOT EXISTS idx_verifications_verifier ON verifications(verifier_id);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view all verifications"
  ON verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'auditor'
    )
  );

CREATE POLICY "Developers can view verifications for own projects"
  ON verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = verifications.project_id
      AND projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Auditors can insert verifications"
  ON verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    verifier_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'auditor'
    )
  );

CREATE POLICY "Auditors can update own verifications"
  ON verifications FOR UPDATE
  TO authenticated
  USING (verifier_id = auth.uid())
  WITH CHECK (verifier_id = auth.uid());

-- Weather Data
CREATE TABLE IF NOT EXISTS weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  condition text,
  temperature decimal(5,2),
  humidity decimal(5,2),
  irradiation decimal(10,2),
  wind_speed decimal(5,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_data_asset_timestamp ON weather_data(asset_id, timestamp DESC);

ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view weather data of accessible assets"
  ON weather_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      JOIN projects ON projects.id = assets.project_id
      WHERE assets.id = weather_data.asset_id
      AND (
        projects.developer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type IN ('auditor', 'buyer')
        )
      )
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();