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

// ============================================================
// dMRV Data Model (Mangrove-compatible)
// ============================================================

export type DvmDataType = 'NUMERIC' | 'TEXT' | 'GEO' | 'FILE' | 'BOOLEAN';
export type DvmModelRunState = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
export type DvmBatchType = 'INPUT' | 'PRODUCTION' | 'OUTPUT';
export type DvmBatchStatus = 'PENDING' | 'COMPLETE' | 'FLAGGED' | 'APPROVED';
export type DvmRuleAction = 'ALERT' | 'SUBSTITUTE' | 'BLOCK';
export type DvmCreditStatus = 'ACTIVE' | 'RESERVED' | 'DELIVERED' | 'RETIRED';

export interface DvmEventType {
  id: string;
  plant_config_id: string;
  user_id: string;
  name: string;
  slug: string;
  cadence: string | null;
  created_at: string;
}

export interface DvmDatapointType {
  id: string;
  event_type_id: string;
  name: string;
  slug: string;
  unit: string;
  data_type: DvmDataType;
  uncertainty: number;
  uncertainty_type: 'ABSOLUTE' | 'RELATIVE' | null;
  evidence_check: boolean;
  created_at: string;
}

export interface DvmEvent {
  id: string;
  event_type_id: string;
  plant_config_id: string;
  user_id: string;
  timestamp: string;
  metadata: Json;
  created_at: string;
}

export interface DvmDatapoint {
  id: string;
  event_id: string;
  datapoint_type_id: string;
  numeric_value: number | null;
  text_value: string | null;
  geo_value: Json | null;
  file_value: string | null;
  unit: string;
  uncertainty: number;
  hsm_signature: string | null;
  gateway_mac: string | null;
  merkle_proof: Json | null;
  captured_at: string;
  created_at: string;
}

export interface DvmModel {
  id: string;
  plant_config_id: string;
  user_id: string;
  name: string;
  slug: string;
  version: number;
  yaml_definition: string;
  is_active: boolean;
  created_at: string;
}

export interface DvmModelRun {
  id: string;
  model_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  state: DvmModelRunState;
  error_message: string | null;
  calculations: Json;
  outputs: Json;
  uncertainty: Json;
  created_at: string;
}

export interface DvmLedger {
  id: string;
  plant_config_id: string;
  user_id: string;
  name: string;
  slug: string;
  unit: string;
  balance: number;
  created_at: string;
}

export interface DvmBatch {
  id: string;
  ledger_id: string;
  user_id: string;
  batch_type: DvmBatchType;
  start_time: string;
  end_time: string;
  inputs: Json;
  outputs: Json;
  calculations: Json;
  uncertainty: number | null;
  status: DvmBatchStatus;
  created_at: string;
}

export interface DvmDataRule {
  id: string;
  plant_config_id: string;
  user_id: string;
  name: string;
  expression: string;
  action: DvmRuleAction;
  alert_message: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DvmRuleResult {
  id: string;
  rule_id: string;
  user_id: string;
  target_type: string;
  target_id: string | null;
  message: string;
  dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
}

export interface DvmCreditInventory {
  id: string;
  plant_config_id: string;
  user_id: string;
  issuance_ref: string | null;
  credit_type: string;
  quantity: number;
  vintage: string | null;
  registry_ref: string | null;
  serial_numbers: Json;
  status: DvmCreditStatus;
  created_at: string;
}

// ============================================================
// Mizan CIVV Engine (Oman Net Zero Centre Integration)
// ============================================================

export type MizanDispatchStatus = 'PENDING' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'FAILED';
export type MizanTokenClass = 'BLACK' | 'GREEN';
export type MizanTokenStatus = 'MINTED' | 'SETTLED' | 'TRANSFERRED' | 'RETIRED';

export interface MizanCivvRecord {
  id: string;
  plant_config_id: string | null;
  user_id: string;
  facility_id: string;
  tpm_device_id: string | null;
  governorate: string;
  country: string;
  timestamp: string;
  co2_mass_flow_kg_s: number;
  stack_temp_k: number | null;
  ccs_captured_kg_s: number;
  gross_emitted_tco2_hr: number;
  captured_ccs_tco2_hr: number;
  net_emitted_tco2_hr: number;
  civv_hash_proof: string | null;
  oman_net_zero_2050_aligned: boolean;
  article_6_2_itmo_eligible: boolean;
  jsonld_payload: Json;
  mizan_dispatch_status: MizanDispatchStatus;
  mizan_dispatch_response: Json | null;
  dispatched_at: string | null;
  created_at: string;
}

export interface MizanToken {
  id: string;
  record_id: string;
  user_id: string;
  token_class: MizanTokenClass;
  quantity: number;
  unit: string;
  settlement_status: MizanTokenStatus;
  article_6_2_eligible: boolean;
  mizan_registry_ref: string | null;
  created_at: string;
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

export type ScopeCategory = 'scope1' | 'scope2' | 'scope3';
export type ReviewStatus = 'draft' | 'pending_validation' | 'approved_auditor' | 'rejected';
export type ESGFramework = 'GRI' | 'BRSR' | 'CDP' | 'CSRD';
export type DataSource = 'CIVV' | 'Manual' | 'Airbyte';

export interface RawActivityLedger {
  id: string;
  user_id: string;
  organization_id: string | null;
  recorded_at: string;
  activity_window_start: string | null;
  activity_window_end: string | null;
  scope_category: ScopeCategory;
  activity_type: string;
  raw_quantity: number;
  measurement_unit: string;
  blockchain_tx_hash: string | null;
  source: DataSource;
  metadata: Json;
  created_at: string;
}

export interface CarbonEmissionsFactor {
  id: number;
  activity_type: string;
  factor_value_co2e: number;
  measurement_unit: string;
  geographic_region: string;
  regulatory_year: number;
  data_source_citation: string | null;
}

export interface ReportFrameworkAlignment {
  id: number;
  record_id: string;
  user_id: string;
  gri_indicator_id: string | null;
  brsr_indicator_id: string | null;
  sbti_target_id: string | null;
  csrd_indicator_id: string | null;
  cdp_indicator_id: string | null;
  calculated_tco2e: number | null;
  review_status: ReviewStatus;
  last_modified_by: string | null;
  updated_at: string;
}

export interface MaterialityAssessment {
  id: string;
  user_id: string;
  organization_id: string | null;
  topic: string;
  impact_score: number;
  likelihood_score: number;
  rationale: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DisclosureItem {
  id: string;
  user_id: string;
  organization_id: string | null;
  framework: ESGFramework;
  indicator: string;
  indicator_name: string | null;
  value_text: string | null;
  value_numeric: number | null;
  unit: string | null;
  source: DataSource;
  review_status: ReviewStatus;
  last_modified_by: string | null;
  updated_at: string;
}
