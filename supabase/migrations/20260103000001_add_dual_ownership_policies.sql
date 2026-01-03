-- Migration: Add Dual Ownership RLS Policies for Events
-- Date: 2026-01-03
-- Description: Refactor event RLS policies to support dual ownership model
--              promoter_id = who created it (audit trail)
--              organization_id = on whose behalf (NULL for personal, UUID for org)
--              Both can be set simultaneously for org events created by members

-- ============================================================================
-- STEP 1: Drop conflicting policies
-- ============================================================================

-- Drop the broad "Promoters can manage own events" policy (FOR ALL)
-- We'll replace it with specific policies for each operation
DROP POLICY IF EXISTS "Promoters can manage own events" ON events;

-- ============================================================================
-- STEP 2: Personal Event Policies (promoter_id set, organization_id NULL)
-- ============================================================================

-- Users can view their personal events
CREATE POLICY "users_view_personal_events" ON events
  FOR SELECT USING (
    promoter_id = auth.uid()
    AND organization_id IS NULL
  );

-- Users can create personal events
-- Note: "Authenticated users can create events" policy already exists and will remain
-- It checks auth.uid() = promoter_id which is still valid

-- Users can update their personal events
CREATE POLICY "users_update_personal_events" ON events
  FOR UPDATE USING (
    promoter_id = auth.uid()
    AND organization_id IS NULL
  );

-- Users can delete their personal events
CREATE POLICY "users_delete_personal_events" ON events
  FOR DELETE USING (
    promoter_id = auth.uid()
    AND organization_id IS NULL
  );

-- ============================================================================
-- STEP 3: Update Organization Event Policies for Dual Ownership
-- ============================================================================

-- Drop existing org policies so we can recreate them with dual ownership
DROP POLICY IF EXISTS "Organization members can view org events" ON events;
DROP POLICY IF EXISTS "Organization members can create org events" ON events;
DROP POLICY IF EXISTS "Organization admins can update org events" ON events;
DROP POLICY IF EXISTS "Organization admins can delete org events" ON events;

-- Org members AND promoters can view org events
CREATE POLICY "org_members_view_org_events" ON events
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND (
      -- Organization member/owner can view
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_member(organization_id, auth.uid())
      -- OR the person who created it can view (even if no longer member)
      OR promoter_id = auth.uid()
    )
  );

-- Org admins/owners can create org events
-- Note: When creating, promoter_id should be set to auth.uid()
CREATE POLICY "org_members_create_org_events" ON events
  FOR INSERT WITH CHECK (
    organization_id IS NOT NULL
    AND promoter_id = auth.uid()
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_admin(organization_id, auth.uid())
    )
  );

-- Org admins/owners AND promoters can update org events
CREATE POLICY "org_members_update_org_events" ON events
  FOR UPDATE USING (
    organization_id IS NOT NULL
    AND (
      -- Organization admins/owners can update
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_admin(organization_id, auth.uid())
      -- OR the person who created it can update
      OR promoter_id = auth.uid()
    )
  );

-- Org admins/owners can delete org events (not promoters - org data protection)
CREATE POLICY "org_admins_delete_org_events" ON events
  FOR DELETE USING (
    organization_id IS NOT NULL
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_admin(organization_id, auth.uid())
    )
  );

-- ============================================================================
-- STEP 4: Partner Event Policies (via event_partners table)
-- ============================================================================

-- Partners can view events they're added to
CREATE POLICY "partners_view_partner_events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_partners
      WHERE event_id = events.id
      AND partner_profile_id = auth.uid()
      AND status = 'active'
    )
  );

-- Partners can update their partner details (but not delete the event)
-- Note: This allows partners to update their set times, notes, etc.
CREATE POLICY "partners_update_partner_events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM event_partners
      WHERE event_id = events.id
      AND partner_profile_id = auth.uid()
      AND status = 'active'
    )
  );

-- ============================================================================
-- STEP 5: Add helpful comments
-- ============================================================================

COMMENT ON POLICY "users_view_personal_events" ON events IS
  'Users can view events they created personally (promoter_id set, organization_id NULL)';

COMMENT ON POLICY "users_update_personal_events" ON events IS
  'Users can update their personal events';

COMMENT ON POLICY "users_delete_personal_events" ON events IS
  'Users can delete their personal events';

COMMENT ON POLICY "org_members_view_org_events" ON events IS
  'Organization members and event creators can view org events (dual ownership)';

COMMENT ON POLICY "org_members_create_org_events" ON events IS
  'Organization admins/owners can create events on behalf of the org';

COMMENT ON POLICY "org_members_update_org_events" ON events IS
  'Organization admins/owners and event creators can update org events (dual ownership)';

COMMENT ON POLICY "org_admins_delete_org_events" ON events IS
  'Only organization admins/owners can delete org events (not individual promoters)';

COMMENT ON POLICY "partners_view_partner_events" ON events IS
  'Users added as partners (via event_partners) can view the event';

COMMENT ON POLICY "partners_update_partner_events" ON events IS
  'Partners can update event details (e.g., set times, their notes)';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Summary of event visibility:
-- 1. Personal events (org_id NULL): Only visible to promoter
-- 2. Org events (org_id set): Visible to org members, promoter, and partners
-- 3. Partner events: Visible to partners via event_partners table
-- 4. Public events: Handled by existing "Public can view all events" policy

-- Summary of event management:
-- 1. Personal events: Only promoter can manage
-- 2. Org events: Org admins/owners + promoter can manage (delete restricted to admins/owners)
-- 3. Partner events: Partners can update but not delete
