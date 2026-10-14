/*
# Feature Truth Ledger (GOV-01)

## Overview
Every public claim has a status from the taxonomy, evidence link, product owner,
last test date, limitations and approved wording.

## New Table: feature_truth_ledger
- feature_id: unique identifier (e.g., GOV-01, CIVV-02, A6-01)
- feature_name: human-readable name
- status: implemented / in_progress / planned / not_started / deprecated
- evidence_link: URL or reference to proof
- product_owner: responsible person
- last_test_date: when it was last verified
- limitations: known gaps
- approved_wording: the official language that can be used publicly
- backlog_area: which section of the backlog this belongs to
- priority: P0/P1/P2/P3

## Security
- Readable by all authenticated users.
- Inserts/updates by any authenticated user (admin-managed).
*/

CREATE TABLE IF NOT EXISTS feature_truth_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id text NOT NULL UNIQUE,
  feature_name text NOT NULL,
  backlog_area text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('P0','P1','P2','P3')),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('implemented','in_progress','planned','not_started','deprecated')),
  evidence_link text,
  product_owner text,
  last_test_date date,
  limitations text,
  approved_wording text,
  dependencies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE feature_truth_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_ftl_all" ON feature_truth_ledger;
CREATE POLICY "select_ftl_all" ON feature_truth_ledger FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_ftl_all" ON feature_truth_ledger;
CREATE POLICY "insert_ftl_all" ON feature_truth_ledger FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_ftl_all" ON feature_truth_ledger;
CREATE POLICY "update_ftl_all" ON feature_truth_ledger FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_ftl_all" ON feature_truth_ledger;
CREATE POLICY "delete_ftl_all" ON feature_truth_ledger FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS ftl_status_idx ON feature_truth_ledger (status);
CREATE INDEX IF NOT EXISTS ftl_area_idx ON feature_truth_ledger (backlog_area);

-- Seed the P0 items
INSERT INTO feature_truth_ledger (feature_id, feature_name, backlog_area, priority, status, approved_wording) VALUES
('GOV-01', 'Feature and integration truth ledger', 'Governance', 'P0', 'implemented', 'A truth ledger tracks the status of every feature claim.'),
('GOV-02', 'Partner and registry proof dossier', 'Governance', 'P0', 'planned', 'Partner scopes and API docs are being compiled.'),
('GOV-03', 'Current-state technical audit', 'Governance', 'P0', 'in_progress', 'An audit of deployed systems is underway.'),
('PLAT-01', 'Canonical org/project/site/asset model', 'Platform', 'P0', 'implemented', 'A canonical data model links organizations, projects, sites, and equipment.'),
('PLAT-02', 'Tenant identity and role/attribute access', 'Platform', 'P0', 'implemented', 'Role-based access control with tenant isolation is in place.'),
('PLAT-03', 'Workflow and event engine', 'Platform', 'P0', 'implemented', 'Projects move through configurable stages with event logging.'),
('PLAT-04', 'Append-only audit trail and correction semantics', 'Platform', 'P0', 'implemented', 'An append-only audit trail preserves original records with correction tracking.'),
('CIVV-01', 'Device identity and registry', 'CIVV Hardware', 'P0', 'implemented', 'Every device has unique identity, model, firmware, and commissioning history.'),
('CIVV-02', 'Secure-element signing and verifier proof', 'CIVV Hardware', 'P0', 'in_progress', 'Secure-element signing is being verified for end-to-end proof.'),
('CIVV-03', 'Sensor quality and calibration registry', 'CIVV Hardware', 'P0', 'implemented', 'Calibration records with due dates and drift checks are tracked.'),
('A6-01', 'Methodology catalogue with version/effective dates', 'A6 Navigator', 'P0', 'implemented', 'A methodology catalogue with versions and effective dates is maintained.'),
('A6-02', 'Rules-as-code / calculation engine', 'A6 Navigator', 'P0', 'in_progress', 'A rules-as-code calculation engine is being hardened.'),
('A6-03', 'Parameter Register and change impact', 'A6 Navigator', 'P0', 'implemented', 'A parameter register tracks changes with impact reports.'),
('SEC-01', 'Threat model and secure SDLC', 'Security', 'P0', 'planned', 'A threat model and secure SDLC process are being scoped.'),
('SEC-02', 'Key lifecycle and cryptographic controls', 'Security', 'P0', 'planned', 'Key lifecycle management is being documented.'),
('REG-01', 'Registry adapter framework', 'Registry', 'P0', 'in_progress', 'A registry adapter framework is being built.')
ON CONFLICT (feature_id) DO NOTHING;
