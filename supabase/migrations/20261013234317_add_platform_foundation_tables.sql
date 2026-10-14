/*
# Platform Foundation: Canonical Data Model, Workflow Engine, Audit Trail
Implements PLAT-01, PLAT-03, PLAT-04 from the product backlog.

## New Tables
1. organizations — tenant entity
2. organization_members — user-org roles
3. sites — physical locations
4. equipment — device registry (CIVV-01)
5. equipment_calibration — sensor calibration (CIVV-03)
6. workflow_stages — configurable lifecycle stages (seeded)
7. workflow_events — insert-only state transition log
8. audit_trail — append-only correction semantics

## Security
- RLS on all tables, scoped through organization_members
- workflow_events and audit_trail are insert-only (no UPDATE/DELETE policies)
*/

-- ============================================================
-- 1. organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_type text NOT NULL CHECK (org_type IN ('developer','operator','vvb','buyer','registry','admin')),
  country text,
  jurisdiction text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. organization_members
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','manager','operator','viewer')) DEFAULT 'viewer',
  invited_by uuid REFERENCES user_profiles(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS org_members_org_idx ON organization_members (organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_idx ON organization_members (user_id);

-- ============================================================
-- 3. sites
-- ============================================================
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  site_type text CHECK (site_type IN ('industrial','agricultural','forest','energy','coastal','other')),
  boundary_geojson jsonb,
  country text,
  address text,
  latitude numeric,
  longitude numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sites_org_idx ON sites (organization_id);

-- ============================================================
-- 4. equipment (CIVV-01)
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('gateway','sensor','meter','analyser','weighbridge','weather_station','other')),
  model text NOT NULL,
  manufacturer text,
  serial_number text,
  part_number text,
  firmware_version text,
  interface_type text,
  commissioning_date date,
  decommissioning_date date,
  custodian text,
  status text NOT NULL DEFAULT 'commissioned' CHECK (status IN ('commissioned','active','maintenance','decommissioned','faulty')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_org_idx ON equipment (organization_id);
CREATE INDEX IF NOT EXISTS equipment_site_idx ON equipment (site_id);

-- ============================================================
-- 5. equipment_calibration (CIVV-03)
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_calibration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  serial_number text,
  range_min numeric,
  range_max numeric,
  accuracy text,
  calibration_certificate text,
  calibrated_at timestamptz,
  next_calibration_due timestamptz,
  drift_check_value numeric,
  last_drift_check timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS calib_equipment_idx ON equipment_calibration (equipment_id);
CREATE INDEX IF NOT EXISTS calib_due_idx ON equipment_calibration (next_calibration_due);

-- ============================================================
-- 6. workflow_stages (seeded)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  stage_order int NOT NULL,
  is_terminal boolean DEFAULT false,
  allowed_transitions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

INSERT INTO workflow_stages (name, display_name, stage_order, is_terminal, allowed_transitions) VALUES
('draft', 'Draft', 0, false, ARRAY['registered']),
('registered', 'Registered', 1, false, ARRAY['data_streaming','validated','rejected']),
('data_streaming', 'Data Streaming', 2, false, ARRAY['validated','monitoring']),
('monitoring', 'Monitoring', 3, false, ARRAY['verified','data_streaming']),
('validated', 'Validated', 4, false, ARRAY['verified','rejected']),
('verified', 'Verified', 5, false, ARRAY['issued','rejected']),
('issued', 'Credits Issued', 6, false, ARRAY['retired','listed']),
('listed', 'Listed on Exchange', 7, false, ARRAY['sold','retired']),
('sold', 'Sold', 8, false, ARRAY['retired']),
('retired', 'Retired', 9, true, ARRAY[]::text[]),
('rejected', 'Rejected', 10, true, ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 7. workflow_events (insert-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  actor_id uuid REFERENCES user_profiles(id),
  reason text,
  evidence_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_events_project_idx ON workflow_events (project_id, created_at);
CREATE INDEX IF NOT EXISTS workflow_events_org_idx ON workflow_events (organization_id);

-- ============================================================
-- 8. audit_trail (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create','update','delete','correct')),
  actor_id uuid REFERENCES user_profiles(id),
  previous_state jsonb,
  new_state jsonb,
  reason text,
  authority text,
  superseded_by uuid REFERENCES audit_trail(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_trail (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_trail (actor_id);
CREATE INDEX IF NOT EXISTS audit_superseded_idx ON audit_trail (superseded_by);

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
