/*
# Seed Platform Foundation with Realistic Dummy Data

Populates all platform tables with coherent test data so every
UI tab shows meaningful content:

1. Organizations: 3 orgs (developer, VVB, buyer)
2. Organization members: linking existing user_profiles
3. Sites: 3 industrial sites linked to existing projects
4. Equipment: 14 devices across all sites (gateways, sensors, meters, analysers)
5. Equipment calibration: 10 calibration records (some overdue, some current)
6. A6 parameters: 12 parameters linked to methodologies
7. Workflow events: 12 events showing project lifecycle progression
8. Audit trail: 10 entries showing create/update/correct actions

All IDs are hardcoded for deterministic linking.
*/

-- ============================================================
-- 1. Organizations
-- ============================================================
INSERT INTO organizations (id, name, org_type, country, jurisdiction, metadata) VALUES
  ('a1111111-0000-0000-0000-000000000001', 'Green Steel Industries', 'developer', 'IN', 'India', '{"gst":"27ABCDE1234F1Z5"}'),
  ('a1111111-0000-0000-0000-000000000002', 'TUV SUD South Asia', 'vvb', 'IN', 'India', '{"accreditation":"ESD-874-9"}'),
  ('a1111111-0000-0000-0000-000000000003', 'ThyssenKrupp AG', 'buyer', 'DE', 'Germany', '{"cbam_declarant":"DE-CBAM-2026-0089"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Organization members
-- ============================================================
INSERT INTO organization_members (organization_id, user_id, role) VALUES
  ('a1111111-0000-0000-0000-000000000001', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'owner'),
  ('a1111111-0000-0000-0000-000000000002', '78954419-3ce2-41d8-bd55-0660c77ae496', 'owner'),
  ('a1111111-0000-0000-0000-000000000003', '0a80abbd-f094-492a-a6c6-67231fec4afc', 'owner'),
  ('a1111111-0000-0000-0000-000000000001', 'e79fc393-bc58-4679-8a2c-578af52a2588', 'manager')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================================
-- 3. Sites (linked to existing projects)
-- ============================================================
INSERT INTO sites (id, organization_id, project_id, name, site_type, country, address, latitude, longitude, metadata) VALUES
  ('b2222222-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', '1418d63f-2fb1-4472-8bca-96d7d355214d', 'Cement Plant — Gulbarga', 'industrial', 'IN', 'Gulbarga, Karnataka, India', 17.3293, 76.8349, '{"capacity_tpd":4500}'),
  ('b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', '1ff3bc0d-f47c-43aa-a37a-a4bae9cd88c8', 'Steel BF-BOF — Jamshedpur', 'industrial', 'IN', 'Jamshedpur, Jharkhand, India', 22.8046, 86.2029, '{"capacity_mtpa":3.0}'),
  ('b2222222-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', '5df7fe41-9234-4058-95f4-8fb99fb9c485', 'Aluminium Smelter — Korba', 'industrial', 'IN', 'Korba, Chhattisgarh, India', 22.3592, 82.7493, '{"capacity_ktpy":250}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Equipment (14 devices across all sites)
-- ============================================================
INSERT INTO equipment (id, site_id, organization_id, device_type, model, manufacturer, serial_number, part_number, firmware_version, interface_type, commissioning_date, custodian, status) VALUES
  -- Site 1: Cement Plant
  ('c3333333-0000-0000-0000-000000000001', 'b2222222-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'gateway', 'BLK-GW-H10', 'BlockVolt', 'GW-GUL-001', 'BLK-GW-H10', '2.4.1', 'Modbus TCP', '2026-01-15', 'Rajesh Kumar', 'active'),
  ('c3333333-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'sensor', 'BLK-S-CO2', 'BlockVolt', 'SN-CO2-CEM-001', 'BLK-S-CO2', '1.2.0', 'Modbus RS-485', '2026-01-20', 'Rajesh Kumar', 'active'),
  ('c3333333-0000-0000-0000-000000000003', 'b2222222-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'sensor', 'BLK-S-FLOW', 'BlockVolt', 'SN-FLW-CEM-001', 'BLK-S-FLOW', '1.1.3', '4-20 mA', '2026-01-20', 'Rajesh Kumar', 'active'),
  ('c3333333-0000-0000-0000-000000000004', 'b2222222-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'weighbridge', 'BLK-S-WTE', 'BlockVolt', 'SN-WTE-CLK-001', 'BLK-S-WTE', '1.0.5', 'RS-485', '2026-02-01', 'Suresh Patel', 'active'),
  ('c3333333-0000-0000-0000-000000000005', 'b2222222-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'meter', 'BLK-M-KWH-HV', 'BlockVolt', 'SN-KWH-CEM-001', 'BLK-M-KWH-HV', '2.0.0', 'IEC 61850', '2026-01-18', 'Rajesh Kumar', 'maintenance'),
  -- Site 2: Steel Plant
  ('c3333333-0000-0000-0000-000000000010', 'b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'gateway', 'BLK-GW-H10', 'BlockVolt', 'GW-JMS-001', 'BLK-GW-H10', '2.4.1', 'Modbus TCP', '2025-11-10', 'Amit Singh', 'active'),
  ('c3333333-0000-0000-0000-000000000011', 'b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'sensor', 'BLK-S-CO2', 'BlockVolt', 'SN-CO2-BF-001', 'BLK-S-CO2', '1.2.0', 'Modbus RS-485', '2025-11-15', 'Amit Singh', 'active'),
  ('c3333333-0000-0000-0000-000000000012', 'b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'analyser', 'BLK-S-CH4', 'BlockVolt', 'SN-CH4-COKE-001', 'BLK-S-CH4', '1.1.0', 'Modbus RS-485', '2025-11-20', 'Amit Singh', 'active'),
  ('c3333333-0000-0000-0000-000000000013', 'b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'meter', 'BLK-M-KWH-HV', 'BlockVolt', 'SN-KWH-STEEL-001', 'BLK-M-KWH-HV', '2.0.0', 'IEC 61850', '2025-11-12', 'Amit Singh', 'active'),
  ('c3333333-0000-0000-0000-000000000014', 'b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'sensor', 'BLK-S-FLOW', 'BlockVolt', 'SN-FLW-BF-001', 'BLK-S-FLOW', '1.1.3', '4-20 mA', '2025-11-18', 'Amit Singh', 'faulty'),
  -- Site 3: Aluminium Smelter
  ('c3333333-0000-0000-0000-000000000020', 'b2222222-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'gateway', 'BLK-GW-H10', 'BlockVolt', 'GW-KRB-001', 'BLK-GW-H10', '2.3.0', 'Modbus TCP', '2025-09-05', 'Deepak Yadav', 'active'),
  ('c3333333-0000-0000-0000-000000000021', 'b2222222-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'sensor', 'BLK-S-CO2', 'BlockVolt', 'SN-CO2-POT-001', 'BLK-S-CO2', '1.2.0', 'Modbus RS-485', '2025-09-10', 'Deepak Yadav', 'active'),
  ('c3333333-0000-0000-0000-000000000022', 'b2222222-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'meter', 'BLK-M-KWH-HV', 'BlockVolt', 'SN-KWH-POT-001', 'BLK-M-KWH-HV', '2.0.0', 'IEC 61850', '2025-09-08', 'Deepak Yadav', 'active'),
  ('c3333333-0000-0000-0000-000000000023', 'b2222222-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'analyser', 'BLK-S-PFC', 'BlockVolt', 'SN-PFC-POT-001', 'BLK-S-PFC', '0.9.1', 'Modbus RS-485', '2025-09-12', 'Deepak Yadav', 'commissioned')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Equipment calibration (10 records — mix of current, overdue, upcoming)
-- ============================================================
INSERT INTO equipment_calibration (equipment_id, serial_number, range_min, range_max, accuracy, calibration_certificate, calibrated_at, next_calibration_due, drift_check_value, last_drift_check, notes) VALUES
  ('c3333333-0000-0000-0000-000000000002', 'SN-CO2-CEM-001', 0, 25, '±0.5% vol', 'CAL-2026-001-CEM', '2026-01-20T08:00:00Z', '2026-10-20T08:00:00Z', 0.02, '2026-10-01T08:00:00Z', 'Stack CO2 NDIR — good condition'),
  ('c3333333-0000-0000-0000-000000000003', 'SN-FLW-CEM-001', 0, 80000, '±2% RDG', 'CAL-2026-002-CEM', '2026-01-20T09:00:00Z', '2026-10-20T09:00:00Z', -0.5, '2026-10-01T08:00:00Z', 'Pitot tube flow — minor drift detected'),
  ('c3333333-0000-0000-0000-000000000004', 'SN-WTE-CLK-001', 0, 100000, '±0.1% FS', 'CAL-2026-003-CEM', '2026-02-01T08:00:00Z', '2027-02-01T08:00:00Z', 0.001, '2026-10-05T08:00:00Z', 'Weighbridge — calibration stable'),
  ('c3333333-0000-0000-0000-000000000005', 'SN-KWH-CEM-001', 0, 10000, '±0.2% RDG', 'CAL-2026-004-CEM', '2026-01-18T08:00:00Z', '2026-07-18T08:00:00Z', -1.2, '2026-09-15T08:00:00Z', 'HV kWh meter — OVERDUE, drift exceeds threshold'),
  ('c3333333-0000-0000-0000-000000000011', 'SN-CO2-BF-001', 0, 30, '±0.5% vol', 'CAL-2025-011-BF', '2025-11-15T08:00:00Z', '2026-08-15T08:00:00Z', 0.1, '2026-09-20T08:00:00Z', 'BF stack CO2 — OVERDUE, recalibration scheduled'),
  ('c3333333-0000-0000-0000-000000000012', 'SN-CH4-COKE-001', 0, 5, '±0.1% vol', 'CAL-2025-012-COKE', '2025-11-20T08:00:00Z', '2026-11-20T08:00:00Z', 0.005, '2026-10-01T08:00:00Z', 'TDLAS CH4 — within spec'),
  ('c3333333-0000-0000-0000-000000000013', 'SN-KWH-STEEL-001', 0, 50000, '±0.2% RDG', 'CAL-2025-013-STEEL', '2025-11-12T08:00:00Z', '2026-11-12T08:00:00Z', -0.3, '2026-10-01T08:00:00Z', 'Steel plant HV meter — OK'),
  ('c3333333-0000-0000-0000-000000000021', 'SN-CO2-POT-001', 0, 20, '±0.5% vol', 'CAL-2025-021-POT', '2025-09-10T08:00:00Z', '2026-09-10T08:00:00Z', 0.03, '2026-09-25T08:00:00Z', 'Potroom CO2 — OVERDUE, awaiting technician'),
  ('c3333333-0000-0000-0000-000000000022', 'SN-KWH-POT-001', 0, 100000, '±0.2% RDG', 'CAL-2025-022-POT', '2025-09-08T08:00:00Z', '2026-09-08T08:00:00Z', -2.1, '2026-09-25T08:00:00Z', 'Potline DC kWh — OVERDUE, significant drift'),
  ('c3333333-0000-0000-0000-000000000023', 'SN-PFC-POT-001', 0, 1, '±1% RDG', 'CAL-2025-023-PFC', '2025-09-12T08:00:00Z', '2026-03-12T08:00:00Z', NULL, NULL, 'PFC analyser — calibration expired, device newly commissioned')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. A6 Parameters (12 parameters linked to methodologies)
-- ============================================================
INSERT INTO a6_parameters (methodology_id, parameter_name, source, owner, unit, valid_range_min, valid_range_max, collection_frequency, method_version, current_value, description) 
SELECT m.id, p.param_name, p.source, p.owner, p.unit, p.min_val, p.max_val, p.freq, p.ver, p.value, p.descr
FROM (VALUES
  ('VM0003', 'grid_emission_factor', 'CEA India 2025', 'A6 Engine', 'tCO2/MWh', 0.5, 1.5, 'Annual', '1.0', 0.82, 'Regional grid emission factor for renewable energy projects'),
  ('VM0003', 'baseline_emission_rate', 'CEA India 2025', 'A6 Engine', 'tCO2/MWh', 0.5, 1.5, 'Annual', '1.0', 0.82, 'Combined margin emission factor for baseline calculation'),
  ('VM0041', 'process_emission_factor', 'IPCC 2006 Vol 3', 'A6 Engine', 'tCO2/t product', 0.1, 5.0, 'Annual', '1.0', 1.24, 'Cement clinker process emission factor'),
  ('VM0041', 'fuel_emission_factor', 'IPCC 2006 Vol 2', 'A6 Engine', 'tCO2/TJ', 50, 100, 'Annual', '1.0', 96.0, 'Default coal emission factor for kiln fuel'),
  ('VM0041', 'clinker_to_cement_ratio', 'Plant data', 'Plant Operator', 'ratio', 0.5, 0.95, 'Monthly', '1.0', 0.75, 'Clinker fraction in final cement'),
  ('TPDDTEC', 'default_fuel_consumption', 'CDM Tool 06', 'A6 Engine', 'kg fuel/household/day', 1, 10, 'Annual', '3.0', 3.5, 'Baseline fuel consumption per household'),
  ('TPDDTEC', 'improved_stove_efficiency', 'Manufacturer spec', 'A6 Engine', '%', 20, 60, 'Annual', '3.0', 42.0, 'Thermal efficiency of improved cookstove'),
  ('AR-ACM0003', 'biomass_growth_rate', 'IPCC GPG-LULUCF', 'A6 Engine', 'tDM/ha/yr', 2, 25, 'Annual', '2.0', 8.5, 'Mean annual biomass increment for tropical species'),
  ('AR-ACM0003', 'root_shoot_ratio', 'IPCC 2006 Vol 4', 'A6 Engine', 'ratio', 0.1, 0.5, 'Annual', '2.0', 0.24, 'Root-to-shoot ratio for tropical broadleaf'),
  ('CIVV-DMRV-001', 'stack_co2_concentration', 'CIVV sensor BLK-S-CO2', 'CIVV Gateway', '%', 0, 25, '15 minutes', '1.0', 14.2, 'Real-time stack CO2 concentration from NDIR sensor'),
  ('CIVV-DMRV-001', 'stack_flow_rate', 'CIVV sensor BLK-S-FLOW', 'CIVV Gateway', 'm3/h', 0, 100000, '15 minutes', '1.0', 52000.0, 'Volumetric stack gas flow rate from Pitot tube'),
  ('CIVV-DMRV-001', 'clinker_output_tonnes', 'CIVV weighbridge BLK-S-WTE', 'CIVV Gateway', 'tonnes', 0, 5000, 'per batch', '1.0', 62.5, 'Clinker production mass from weighbridge')
) AS p(prog, param_name, source, owner, unit, min_val, max_val, freq, ver, value, descr)
JOIN a6_methodologies m ON m.methodology_id = p.prog
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. Workflow events (12 events showing project lifecycle)
-- ============================================================
INSERT INTO workflow_events (project_id, organization_id, from_stage, to_stage, actor_id, reason, evidence_ref, metadata)
VALUES
  ('1418d63f-2fb1-4472-8bca-96d7d355214d', 'a1111111-0000-0000-0000-000000000001', NULL, 'draft', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Project created via Project Wizard', 'PW-2026-001', '{"source":"project_wizard"}'),
  ('1418d63f-2fb1-4472-8bca-96d7d355214d', 'a1111111-0000-0000-0000-000000000001', 'draft', 'registered', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Submitted project registration with PDD draft', 'PDD-2026-001', '{"pdd_version":"0.1"}'),
  ('1418d63f-2fb1-4472-8bca-96d7d355214d', 'a1111111-0000-0000-0000-000000000001', 'registered', 'data_streaming', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'CIVV gateway GW-GUL-001 commissioned and online', 'CIVV-2026-001', '{"gateway_id":"GW-GUL-001"}'),
  ('1418d63f-2fb1-4472-8bca-96d7d355214d', 'a1111111-0000-0000-0000-000000000001', 'data_streaming', 'monitoring', '7f50f227-7bff-499a-bd94-c6f4b0453845', '30 days of continuous data verified, entering monitoring phase', 'MON-2026-001', '{"days_streamed":30}'),
  ('1ff3bc0d-f47c-43aa-a37a-a4bae9cd88c8', 'a1111111-0000-0000-0000-000000000001', NULL, 'draft', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Steel BF-BOF project created', 'PW-2026-002', '{}'),
  ('1ff3bc0d-f47c-43aa-a37a-a4bae9cd88c8', 'a1111111-0000-0000-0000-000000000001', 'draft', 'registered', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'PDD submitted for VCS registration', 'PDD-2026-002', '{"registry":"VCS"}'),
  ('1ff3bc0d-f47c-43aa-a37a-a4bae9cd88c8', 'a1111111-0000-0000-0000-000000000001', 'registered', 'data_streaming', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Jamshedpur gateway online', 'CIVV-2026-002', '{}'),
  ('5df7fe41-9234-4058-95f4-8fb99fb9c485', 'a1111111-0000-0000-0000-000000000001', NULL, 'draft', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Aluminium smelter project created', 'PW-2026-003', '{}'),
  ('5df7fe41-9234-4058-95f4-8fb99fb9c485', 'a1111111-0000-0000-0000-000000000001', 'draft', 'registered', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Registered for VCS + CBAM dual pathway', 'PDD-2026-003', '{"pathway":"dual"}'),
  ('5df7fe41-9234-4058-95f4-8fb99fb9c485', 'a1111111-0000-0000-0000-000000000001', 'registered', 'data_streaming', '7f50f227-7bff-499a-bd94-c6f4b0453845', 'Korba smelter CIVV stack online', 'CIVV-2026-003', '{}'),
  ('5df7fe41-9234-4058-95f4-8fb99fb9c485', 'a1111111-0000-0000-0000-000000000001', 'data_streaming', 'monitoring', '7f50f227-7bff-499a-bd94-c6f4b0453845', '60 days continuous data, entering formal monitoring', 'MON-2026-003', '{"days_streamed":60}'),
  ('5df7fe41-9234-4058-95f4-8fb99fb9c485', 'a1111111-0000-0000-0000-000000000001', 'monitoring', 'verified', '78954419-3ce2-41d8-bd55-0660c77ae496', 'VVB verification complete — TUV SUD issued positive opinion', 'VR-2026-003', '{"vvb":"TUV_SUD","verdict":"positive"}');

-- ============================================================
-- 8. Audit trail (10 entries)
-- ============================================================
INSERT INTO audit_trail (entity_type, entity_id, action, actor_id, previous_state, new_state, reason, authority) VALUES
  ('equipment', 'c3333333-0000-0000-0000-000000000001', 'create', '7f50f227-7bff-499a-bd94-c6f4b0453845', NULL, '{"model":"BLK-GW-H10","serial":"GW-GUL-001","site":"Gulbarga"}'::jsonb, 'New gateway commissioned at Gulbarga cement plant', 'Owner'),
  ('equipment', 'c3333333-0000-0000-0000-000000000002', 'create', '7f50f227-7bff-499a-bd94-c6f4b0453845', NULL, '{"model":"BLK-S-CO2","serial":"SN-CO2-CEM-001","site":"Gulbarga"}'::jsonb, 'CO2 NDIR sensor installed on kiln stack', 'Owner'),
  ('equipment_calibration', 'c3333333-0000-0000-0000-000000000005', 'create', '7f50f227-7bff-499a-bd94-c6f4b0453845', NULL, '{"certificate":"CAL-2026-004-CEM","due":"2026-07-18"}'::jsonb, 'Initial calibration for HV kWh meter', 'Owner'),
  ('equipment', 'c3333333-0000-0000-0000-000000000005', 'update', '7f50f227-7bff-499a-bd94-c6f4b0453845', '{"status":"active"}'::jsonb, '{"status":"maintenance"}'::jsonb, 'HV kWh meter taken offline for recalibration — drift exceeded threshold', 'Owner'),
  ('equipment', 'c3333333-0000-0000-0000-000000000014', 'update', '7f50f227-7bff-499a-bd94-c6f4b0453845', '{"status":"active"}'::jsonb, '{"status":"faulty"}'::jsonb, 'BF flow sensor flagged faulty — readings out of range', 'Owner'),
  ('equipment_calibration', 'c3333333-0000-0000-0000-000000000021', 'correct', '78954419-3ce2-41d8-bd55-0660c77ae496', '{"drift_check_value":0.03}'::jsonb, '{"drift_check_value":0.05,"notes":"VVB requested recalibration verification"}'::jsonb, 'VVB identified calibration drift during verification audit — correction issued', 'TUV SUD Auditor'),
  ('workflow', '5df7fe41-9234-4058-95f4-8fb99fb9c485', 'create', '7f50f227-7bff-499a-bd94-c6f4b0453845', NULL, '{"to_stage":"draft"}'::jsonb, 'Project lifecycle initiated', 'Owner'),
  ('workflow', '5df7fe41-9234-4058-95f4-8fb99fb9c485', 'update', '78954419-3ce2-41d8-bd55-0660c77ae496', '{"to_stage":"monitoring"}'::jsonb, '{"to_stage":"verified"}'::jsonb, 'VVB verification passed — project advanced to verified stage', 'TUV SUD Auditor'),
  ('a6_parameter', '00000000-0000-0000-0000-000000000099', 'correct', '7f50f227-7bff-499a-bd94-c6f4b0453845', '{"current_value":0.80}'::jsonb, '{"current_value":0.82}'::jsonb, 'Grid emission factor updated from CEA 2024 to CEA 2025 values — impact report generated', 'A6 Engine Admin'),
  ('equipment', 'c3333333-0000-0000-0000-000000000023', 'create', '7f50f227-7bff-499a-bd94-c6f4b0453845', NULL, '{"model":"BLK-S-PFC","serial":"SN-PFC-POT-001","status":"commissioned"}'::jsonb, 'PFC analyser deployed for CF4/C2F6 monitoring at Korba potroom', 'Owner');
