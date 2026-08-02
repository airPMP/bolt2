export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Role = 'auditor' | 'developer' | 'buyer' | 'community';
export type ProjectStatus = 'PENDING_AUDITOR' | 'REGISTRY_VALIDATED' | 'DATA_STREAMING' | 'CREDITS_ISSUED';
export type AuthStatus = 'pending' | 'authenticated' | 'failed';
export type MethodologyStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id: string;
  user_type: Role;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string | null;
  available_credits: number;
  pending_credits: number;
  retired_credits: number;
  total_value: number;
  updated_at: string;
}

export interface CivvGateway {
  id: string;
  gateway_name: string;
  mac_address: string;
  firmware_version: string;
  sensor_count: number;
  sensors: Json;
  ship_status: 'pending' | 'shipped' | 'locked';
  shipped_to: string | null;
  shipped_at: string | null;
  locked_to_plant_id: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlantConfig {
  id: string;
  plant_name: string;
  plant_code: string;
  industry: string;
  ghg_calculator_type: string;
  token_type: 'black' | 'green';
  club: string | null;
  registry: string;
  methodology: string;
  scope_level: string;
  civv_gateway_id: string | null;
  mac_address: string | null;
  auditor_id: string;
  developer_id: string | null;
  status: ProjectStatus;
  config_json: Json;
  created_at: string;
  updated_at: string;
}

export interface PersonaCredential {
  id: string;
  user_id: string;
  credential_type: 'registry' | 'exchange' | 'wallet';
  provider: string;
  api_key: string | null;
  api_endpoint: string | null;
  username: string | null;
  password: string | null;
  auth_status: AuthStatus;
  verified_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface AuthStamp {
  id: string;
  user_id: string;
  persona: string;
  provider: string;
  provider_type: string;
  status: AuthStatus;
  stamp_hash: string | null;
  stamped_at: string;
  expires_at: string | null;
  metadata: Json;
}

export interface DataSubmission {
  id: string;
  user_id: string;
  plant_config_id: string;
  mac_address: string;
  registry: string;
  payload: Json;
  interval_minutes: number;
  submission_status: 'pending' | 'submitted' | 'failed';
  registry_response: Json;
  submitted_at: string;
}

export interface TokenMint {
  id: string;
  user_id: string;
  plant_config_id: string;
  registry: string;
  token_type: string;
  quantity: number;
  serial_number: string | null;
  mint_status: 'pending' | 'minted' | 'failed';
  wallet_address: string | null;
  registry_response: Json;
  minted_at: string;
}

export interface ExchangeListing {
  id: string;
  user_id: string;
  token_mint_id: string | null;
  exchange: string;
  token_type: string;
  quantity: number;
  price_per_unit: number | null;
  listing_status: 'pending' | 'listed' | 'sold' | 'failed';
  exchange_response: Json;
  listed_at: string;
}

export interface CommunityMethodology {
  id: string;
  contributor_id: string;
  contributor_name: string | null;
  registry: string;
  methodology_title: string;
  methodology_id: string | null;
  version: string;
  formula: string;
  approach: 'bottom-up' | 'top-down';
  required_sensor_types: string[];
  sensor_mapping: Json;
  constants: Json;
  emission_factors: Json;
  description: string | null;
  status: MethodologyStatus;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  usage_count: number;
  total_revenue: number;
  contributor_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface MethodologySimulation {
  id: string;
  methodology_id: string;
  user_id: string;
  days: number;
  interval_minutes: number;
  synthetic_data: Json;
  results: Json;
  summary: Json;
  created_at: string;
}

export interface MethodologyUsage {
  id: string;
  methodology_id: string;
  project_id: string | null;
  user_id: string;
  blocks: number;
  fee_per_block: number;
  contributor_share: number;
  contributor_earnings: number;
  recorded_at: string;
}

export interface BoqItem {
  id: string;
  sensor_type: string;
  part_number: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  created_at: string;
}
