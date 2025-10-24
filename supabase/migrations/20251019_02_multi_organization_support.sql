-- Migration: Multi-Organization Support with Display Names
-- Date: 2025-10-19
-- Description: Transforms organizations from profile-based to team-based entities.
--             Adds display name preferences for both profiles and organizations.
--             Allows users to own/join multiple organizations.

-- Step 1: Add display name fields to profiles table (for Promoter custom names)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN profiles.display_name IS 'Custom display name for Promoter profiles (alternative to stage name/real name)';

-- Step 2: Add display name fields to organization_profiles table
ALTER TABLE organization_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name_preference TEXT CHECK (display_name_preference IN ('display', 'legal')) DEFAULT 'display';

COMMENT ON COLUMN organization_profiles.display_name IS 'Public-facing organization name (e.g., "iD Comedy")';
COMMENT ON COLUMN organization_profiles.legal_name IS 'Legal business name for invoices (e.g., "iD Comedy Pty Ltd")';
COMMENT ON COLUMN organization_profiles.display_name_preference IS 'Which name to show in UI: display (casual) or legal (formal)';

-- Step 3: Backfill display_name and legal_name for existing organizations
UPDATE organization_profiles
SET
  display_name = COALESCE(display_name, organization_name),
  legal_name = COALESCE(legal_name, organization_name)
WHERE display_name IS NULL OR legal_name IS NULL;

-- Step 4: Make display_name required after backfill
ALTER TABLE organization_profiles
  ALTER COLUMN display_name SET NOT NULL;

-- Step 5: Update organization_profiles to support team-based model
-- Remove the constraint that id must be user's profile id
-- (Already correct in current schema - id is independent UUID, owner_id is the creator)

-- Step 6: Create helper function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  org_id UUID,
  org_display_name TEXT,
  org_legal_name TEXT,
  org_type TEXT,
  is_owner BOOLEAN,
  member_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    op.id,
    op.display_name,
    op.legal_name,
    op.organization_type,
    (op.owner_id = p_user_id) as is_owner,
    COALESCE(otm.role, 'owner') as member_role
  FROM organization_profiles op
  LEFT JOIN organization_team_members otm ON otm.organization_id = op.id AND otm.user_id = p_user_id
  WHERE op.owner_id = p_user_id OR otm.user_id = p_user_id
  ORDER BY op.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_organizations IS 'Returns all organizations a user owns or is a member of';

-- Step 7: Update RLS policies for team member access
-- Team members should be able to view organizations they're part of
DROP POLICY IF EXISTS "Owners can view own organizations" ON organization_profiles;

CREATE POLICY "Users can view organizations they own or are members of" ON organization_profiles
  FOR SELECT USING (
    auth.uid() = owner_id
    OR auth.uid() IN (
      SELECT user_id FROM organization_team_members WHERE organization_id = id
    )
    OR is_active = true  -- Public can still see active orgs
  );

-- Step 8: Create index for organization lookups by owner
CREATE INDEX IF NOT EXISTS idx_organization_profiles_display_name
  ON organization_profiles(display_name);

-- Step 9: Add RLS policy for team members to act on behalf of organization
-- Team members with admin role can update organization
CREATE POLICY "Admins can update organizations" ON organization_profiles
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR auth.uid() IN (
      SELECT user_id FROM organization_team_members
      WHERE organization_id = id AND role IN ('admin', 'owner')
    )
  );

-- Step 10: Add helper function to check if user can act as organization
CREATE OR REPLACE FUNCTION can_act_as_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_profiles op
    LEFT JOIN organization_team_members otm ON otm.organization_id = op.id
    WHERE op.id = org_id
    AND (
      op.owner_id = user_id
      OR (otm.user_id = user_id AND otm.role IN ('admin', 'owner', 'manager'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_act_as_organization IS 'Check if user has permission to act on behalf of an organization';

-- Step 11: Add created_by tracking to events for organizations
-- (Will be used to track which organization/profile created the event)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'created_by_organization_id'
  ) THEN
    ALTER TABLE events ADD COLUMN created_by_organization_id UUID REFERENCES organization_profiles(id) ON DELETE SET NULL;
    CREATE INDEX idx_events_created_by_organization ON events(created_by_organization_id);
    COMMENT ON COLUMN events.created_by_organization_id IS 'If event was created by an organization, stores the org ID';
  END IF;
END $$;
