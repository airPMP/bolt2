/*
# Add all P1/P2/P3 backlog items to the Feature Truth Ledger

The truth ledger currently only has the 16 P0 items. This adds every
remaining item from the product backlog (P1, P2, P3) with accurate
implementation status based on what's actually built:

Implemented (DB tables + UI exist):
- PLAT-05 (API/webhook via edge functions)
- CIVV-06 (industrial protocol adapters — Modbus/MQTT in sensor configs)
- CIVV-07 (telemetry validation — dvm_data_rules + dvm_rule_results)
- A6-07 (monitoring report — DMRV calculator exists)
- REG-03 (credit-unit lifecycle — dvm_credit_inventory + carbon_credits)
- REG-09 (CBAM workflow — cbam_cn_codes + declarant_reports)
- COM-01 (project supply pipeline — projects + forecasting)

In progress (partial implementation):
- CIVV-04 (edge offline — gateway buffering exists in code)
- CIVV-08 (fleet health — equipment status tracked)
- A6-06 (PDD drafting — project wizard exists)
- A6-08 (evidence matrix — partial in methodology data)
- A6-09 (CAR/CL — verifications table exists)
- VVB-01 (verifier console — auditor dashboard exists)
- VVB-02 (CAR/CL workflow — verification status tracked)
- REG-02 (integration tiers — registry proxies exist)
- REG-04 (reconciliation — partial)

Planned (not yet started):
- All remaining P2/P3 items
*/

INSERT INTO feature_truth_ledger (feature_id, feature_name, backlog_area, priority, status, approved_wording) VALUES
-- P1 items
('PLAT-05', 'Public/internal API and webhook standard', 'Platform', 'P1', 'in_progress', 'Versioned REST edge functions handle API calls with CORS and error handling.'),
('PLAT-06', 'Developer portal, sandbox and SDK', 'Platform', 'P1', 'planned', 'A developer portal with sandbox access is planned.'),
('PLAT-07', 'Data export, portability and migration', 'Platform', 'P1', 'planned', 'Data export to machine-readable formats is planned.'),
('PLAT-08', 'Configurable customer/project OS', 'Platform', 'P2', 'planned', 'A configurable project operating system is planned.'),
('CIVV-04', 'Edge offline storage and clock control', 'CIVV Hardware', 'P1', 'in_progress', 'Gateway buffering with sequence IDs is being implemented.'),
('CIVV-05', 'Signed firmware/OTA/device lifecycle', 'CIVV Hardware', 'P1', 'planned', 'Signed firmware updates with rollback are planned.'),
('CIVV-06', 'Industrial protocol adapters', 'CIVV Hardware', 'P1', 'in_progress', 'Modbus and MQTT protocol adapters map readings to canonical units.'),
('CIVV-07', 'Telemetry validation and anomaly flags', 'CIVV Hardware', 'P1', 'in_progress', 'A rule engine detects range errors and flags anomalous readings.'),
('CIVV-08', 'Fleet health and edge diagnostics', 'CIVV Hardware', 'P1', 'in_progress', 'Device connectivity and calibration status are monitored.'),
('CIVV-09', 'Evidence capture mobile app', 'CIVV Hardware', 'P1', 'planned', 'An offline evidence capture mobile app is planned.'),
('CIVV-10', 'Geospatial field validation', 'CIVV Hardware', 'P2', 'planned', 'Polygon overlap and boundary validation is planned.'),
('CIVV-11', 'Lab result and sample chain of custody', 'CIVV Hardware', 'P2', 'planned', 'Sample chain of custody tracking is planned.'),
('CIVV-12', 'Sensor portfolio qualification programme', 'CIVV Hardware', 'P2', 'planned', 'A sensor qualification programme is planned.'),
('A6-04', 'Applicability and methodology recommendation assistant', 'A6 Navigator', 'P1', 'planned', 'An AI methodology recommendation assistant is planned.'),
('A6-05', 'Baseline/additionality/leakage/permanence toolkit', 'A6 Navigator', 'P1', 'planned', 'A baseline and additionality toolkit is planned.'),
('A6-06', 'PDD / project description drafting', 'A6 Navigator', 'P1', 'in_progress', 'A project wizard generates structured project descriptions.'),
('A6-07', 'Monitoring report generation', 'A6 Navigator', 'P1', 'in_progress', 'A DMRV calculator generates monitoring reports from sensor data.'),
('A6-08', 'Document/evidence requirement matrix', 'A6 Navigator', 'P1', 'in_progress', 'Methodology records include required evidence lists.'),
('A6-09', 'CAR/CL and reviewer response copilot', 'A6 Navigator', 'P1', 'in_progress', 'Verification status and reviewer notes are tracked.'),
('A6-10', 'AI guardrails and evaluations', 'A6 Navigator', 'P1', 'planned', 'AI guardrails with human approval gates are planned.'),
('A6-11', 'Multi-agent workflow orchestration', 'A6 Navigator', 'P2', 'planned', 'Multi-agent workflow orchestration is planned.'),
('A6-12', 'Forecasting and scenario analysis', 'A6 Navigator', 'P2', 'planned', 'Carbon yield forecasting with sensitivity analysis is planned.'),
('A6-13', 'Methodology update watch and migration', 'A6 Navigator', 'P2', 'planned', 'Methodology change monitoring is planned.'),
('A6-14', 'Form-filling automation', 'A6 Navigator', 'P2', 'planned', 'Registry form-filling automation is planned.'),
('PATH-01', 'Biochar CDR pack', 'Pathway Packs', 'P1', 'in_progress', 'A biochar CDR pack with batch genealogy and pyrolysis parameters is being built.'),
('PATH-02', 'Waste-to-energy / plastic / tyre pyrolysis pack', 'Pathway Packs', 'P1', 'planned', 'A waste-to-energy pack with feedstock classification is planned.'),
('PATH-03', 'Industrial emissions / CBAM data pack', 'Pathway Packs', 'P2', 'in_progress', 'An industrial CBAM data pack with CN codes and production routes is implemented.'),
('PATH-04', 'Renewable energy + BESS attributes', 'Pathway Packs', 'P2', 'in_progress', 'Renewable energy metering with REC registry navigation is partially implemented.'),
('PATH-05', 'ARR/REDD+/mangrove/blue-carbon pack', 'Pathway Packs', 'P2', 'in_progress', 'A mangrove-compatible dMRV data model with events, datapoints, and models is implemented.'),
('PATH-06', 'Rice methane/agriculture/soil-carbon pack', 'Pathway Packs', 'P2', 'planned', 'A rice methane agriculture pack is planned.'),
('PATH-07', 'DAC/BECCS/mineralization/CCUS pack', 'Pathway Packs', 'P2', 'planned', 'A DAC/BECCS/CCUS pack is planned.'),
('PATH-08', 'Cookstoves/community intervention pack', 'Pathway Packs', 'P3', 'planned', 'A cookstoves community intervention pack is planned.'),
('PATH-09', 'SDG/co-benefits/safeguards register', 'Pathway Packs', 'P2', 'planned', 'An SDG co-benefits register is planned.'),
('PATH-10', 'EBC/IBI/laboratory standard tracking', 'Pathway Packs', 'P2', 'planned', 'EBC/IBI laboratory standard tracking is planned.'),
('GEO-01', 'Geospatial project model', 'Geospatial', 'P1', 'in_progress', 'Sites table stores boundary GeoJSON with latitude/longitude.'),
('GEO-02', 'Satellite/remote-sensing adapter', 'Geospatial', 'P1', 'planned', 'A satellite remote-sensing adapter is planned.'),
('GEO-03', 'LiDAR/drone/biomass-model adapter', 'Geospatial', 'P2', 'planned', 'A LiDAR drone biomass model adapter is planned.'),
('GEO-04', 'Natural-risk monitoring', 'Geospatial', 'P2', 'planned', 'Natural risk monitoring alerts are planned.'),
('GEO-05', 'Model register and performance monitoring', 'Geospatial', 'P2', 'in_progress', 'DVM models register tracks model versions and activity status.'),
('VVB-01', 'Secure verifier console', 'Verifier', 'P1', 'in_progress', 'An auditor dashboard provides read-only project access for verification.'),
('VVB-02', 'CAR/CL workflow and sign-off', 'Verifier', 'P1', 'in_progress', 'Verification status tracking with reviewer assignment is partially implemented.'),
('REG-02', 'Integration tier and evidence labels', 'Registry', 'P1', 'in_progress', 'Registry proxy edge functions exist for Verra and Gold Standard.'),
('REG-03', 'Credit-unit lifecycle model', 'Registry', 'P1', 'in_progress', 'Credit inventory tracks issuance, serial numbers, and retirement status.'),
('REG-04', 'Reconciliation and duplicate detection', 'Registry', 'P1', 'planned', 'Reconciliation and duplicate detection is planned.'),
('REG-05', 'Article 6.2 authorization/ITMO workflow', 'Registry', 'P2', 'in_progress', 'Mizan CIVV tables track Article 6.2 ITMO eligibility fields.'),
('REG-06', 'Article 6.4/PACM status workflow', 'Registry', 'P2', 'planned', 'Article 6.4 PACM status tracking is planned.'),
('REG-07', 'I-REC/I-Track / energy attribute adapter', 'Registry', 'P2', 'in_progress', 'A REC registry navigator is partially implemented.'),
('REG-08', 'Sovereign registry deployment kit', 'Registry', 'P2', 'planned', 'A sovereign registry deployment kit is planned.'),
('REG-09', 'CBAM embedded-emissions workflow', 'Registry', 'P2', 'in_progress', 'CBAM declarant reports with CN codes, SEE, SEFA, and chargeable emissions are implemented.'),
('REG-10', 'Additional registry/program adapters', 'Registry', 'P3', 'planned', 'Additional registry adapters will be added based on customer demand.'),
('COM-01', 'Project supply pipeline and credit forecasting', 'Commercialisation', 'P1', 'in_progress', 'Projects with status tracking and credit inventory are implemented.'),
('COM-02', 'Credit inventory, offers and contracts', 'Commercialisation', 'P2', 'in_progress', 'Credit inventory with reserved/delivered/retired status is tracked.'),
('COM-03', 'Buyer portfolio dashboard', 'Commercialisation', 'P2', 'in_progress', 'A buyer dashboard shows purchased credits and transaction history.'),
('COM-04', 'Retirement and claims package', 'Commercialisation', 'P2', 'planned', 'A retirement and claims package is planned.'),
('COM-05', 'Marketplace/broker/CRM integration', 'Commercialisation', 'P2', 'planned', 'Marketplace and broker integration is planned.'),
('S3-01', 'Scope 3 impact-unit and allocation service', 'Scope 3', 'P2', 'planned', 'A Scope 3 impact-unit allocation service is planned.'),
('S3-02', 'Claims-right and double-claim controls', 'Scope 3', 'P2', 'planned', 'Claims-right and double-claim controls are planned.'),
('FIN-01', 'Benefit-sharing and community-payment ledger', 'Commercialisation', 'P2', 'planned', 'A benefit-sharing community payment ledger is planned.'),
('EPR-01', 'EPR/plastic traceability workflow', 'Pathway Packs', 'P3', 'planned', 'An EPR plastic traceability workflow is planned.'),
('SEC-03', 'Backup, recovery and service SLOs', 'Security', 'P1', 'planned', 'Backup and recovery procedures are being documented.'),
('SEC-04', 'Data privacy and tenancy controls', 'Security', 'P1', 'in_progress', 'RLS policies enforce tenant isolation across all tables.'),
('SEC-05', 'Independent security and product assurance', 'Security', 'P1', 'planned', 'An independent penetration test is planned.'),
('OPS-01', 'Platform observability', 'Operations', 'P1', 'in_progress', 'Audit trail and workflow events provide end-to-end traceability.'),
('OPS-02', 'Customer support and deployment runbooks', 'Operations', 'P1', 'planned', 'Deployment runbooks are being documented.'),
('OPS-03', 'Tenant onboarding and billing controls', 'Operations', 'P2', 'planned', 'Tenant onboarding with billing controls is planned.')
ON CONFLICT (feature_id) DO NOTHING;
