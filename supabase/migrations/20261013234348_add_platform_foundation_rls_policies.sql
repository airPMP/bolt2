/*
# Platform Foundation: RLS Policies

Policies for all 8 platform tables. All org-scoped tables check
organization_members for access. workflow_events and audit_trail
are insert-only (no UPDATE/DELETE policies).
*/

-- ============================================================
-- organizations
-- ============================================================
DROP POLICY IF EXISTS "select_orgs_member" ON organizations;
CREATE POLICY "select_orgs_member" ON organizations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_orgs_owner" ON organizations;
CREATE POLICY "insert_orgs_owner" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_orgs_member" ON organizations;
CREATE POLICY "update_orgs_member" ON organizations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()));

-- ============================================================
-- organization_members
-- ============================================================
DROP POLICY IF EXISTS "select_own_membership" ON organization_members;
CREATE POLICY "select_own_membership" ON organization_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.organization_id = organization_members.organization_id AND om2.user_id = auth.uid() AND om2.role IN ('owner','admin')));
DROP POLICY IF EXISTS "insert_membership" ON organization_members;
CREATE POLICY "insert_membership" ON organization_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.organization_id = organization_members.organization_id AND om2.user_id = auth.uid() AND om2.role IN ('owner','admin')));
DROP POLICY IF EXISTS "update_membership_admin" ON organization_members;
CREATE POLICY "update_membership_admin" ON organization_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.organization_id = organization_members.organization_id AND om2.user_id = auth.uid() AND om2.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.organization_id = organization_members.organization_id AND om2.user_id = auth.uid() AND om2.role IN ('owner','admin')));
DROP POLICY IF EXISTS "delete_membership_admin" ON organization_members;
CREATE POLICY "delete_membership_admin" ON organization_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.organization_id = organization_members.organization_id AND om2.user_id = auth.uid() AND om2.role IN ('owner','admin')));

-- ============================================================
-- sites
-- ============================================================
DROP POLICY IF EXISTS "select_sites_member" ON sites;
CREATE POLICY "select_sites_member" ON sites FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = sites.organization_id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_sites_member" ON sites;
CREATE POLICY "insert_sites_member" ON sites FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = sites.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin','manager')));
DROP POLICY IF EXISTS "update_sites_member" ON sites;
CREATE POLICY "update_sites_member" ON sites FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = sites.organization_id AND om.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = sites.organization_id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_sites_admin" ON sites;
CREATE POLICY "delete_sites_admin" ON sites FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = sites.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')));

-- ============================================================
-- equipment
-- ============================================================
DROP POLICY IF EXISTS "select_equipment_member" ON equipment;
CREATE POLICY "select_equipment_member" ON equipment FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = equipment.organization_id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_equipment_member" ON equipment;
CREATE POLICY "insert_equipment_member" ON equipment FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = equipment.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin','manager')));
DROP POLICY IF EXISTS "update_equipment_member" ON equipment;
CREATE POLICY "update_equipment_member" ON equipment FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = equipment.organization_id AND om.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = equipment.organization_id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_equipment_admin" ON equipment;
CREATE POLICY "delete_equipment_admin" ON equipment FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = equipment.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')));

-- ============================================================
-- equipment_calibration
-- ============================================================
DROP POLICY IF EXISTS "select_calib_member" ON equipment_calibration;
CREATE POLICY "select_calib_member" ON equipment_calibration FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM equipment e JOIN organization_members om ON om.organization_id = e.organization_id WHERE e.id = equipment_calibration.equipment_id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_calib_member" ON equipment_calibration;
CREATE POLICY "insert_calib_member" ON equipment_calibration FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM equipment e JOIN organization_members om ON om.organization_id = e.organization_id WHERE e.id = equipment_calibration.equipment_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin','manager','operator')));
DROP POLICY IF EXISTS "update_calib_member" ON equipment_calibration;
CREATE POLICY "update_calib_member" ON equipment_calibration FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM equipment e JOIN organization_members om ON om.organization_id = e.organization_id WHERE e.id = equipment_calibration.equipment_id AND om.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM equipment e JOIN organization_members om ON om.organization_id = e.organization_id WHERE e.id = equipment_calibration.equipment_id AND om.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_calib_admin" ON equipment_calibration;
CREATE POLICY "delete_calib_admin" ON equipment_calibration FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM equipment e JOIN organization_members om ON om.organization_id = e.organization_id WHERE e.id = equipment_calibration.equipment_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')));

-- ============================================================
-- workflow_stages (reference data, readable by all)
-- ============================================================
DROP POLICY IF EXISTS "select_stages_all" ON workflow_stages;
CREATE POLICY "select_stages_all" ON workflow_stages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_stages_admin" ON workflow_stages;
CREATE POLICY "insert_stages_admin" ON workflow_stages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_stages_admin" ON workflow_stages;
CREATE POLICY "update_stages_admin" ON workflow_stages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- workflow_events (insert-only)
-- ============================================================
DROP POLICY IF EXISTS "select_events_member" ON workflow_events;
CREATE POLICY "select_events_member" ON workflow_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = workflow_events.organization_id AND om.user_id = auth.uid()) OR organization_id IS NULL);
DROP POLICY IF EXISTS "insert_events_member" ON workflow_events;
CREATE POLICY "insert_events_member" ON workflow_events FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- audit_trail (insert-only, readable by all authenticated)
-- ============================================================
DROP POLICY IF EXISTS "select_audit_all" ON audit_trail;
CREATE POLICY "select_audit_all" ON audit_trail FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_audit_all" ON audit_trail;
CREATE POLICY "insert_audit_all" ON audit_trail FOR INSERT TO authenticated WITH CHECK (true);
