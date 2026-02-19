-- ============================================================================
-- Migration: Finalize organizations consolidation
-- Created: 2026-02-19
-- Purpose: Drop legacy 'organizations' table after code has been updated
--
-- IMPORTANT: Only run this migration AFTER all application code has been
-- updated to use organization_profiles instead of organizations!
-- ============================================================================

-- ============================================================================
-- Phase 1: Verify all records have been migrated
-- ============================================================================

DO $$
DECLARE
  unmigrated_join_requests INTEGER;
  unmigrated_managers INTEGER;
  has_errors BOOLEAN := false;
BEGIN
  -- Check organization_join_requests
  SELECT COUNT(*) INTO unmigrated_join_requests
  FROM organization_join_requests
  WHERE org_profile_id IS NULL AND organization_id IS NOT NULL;

  IF unmigrated_join_requests > 0 THEN
    RAISE WARNING 'BLOCKING: % organization_join_requests still have NULL org_profile_id', unmigrated_join_requests;
    has_errors := true;
  END IF;

  -- Check organization_managers
  SELECT COUNT(*) INTO unmigrated_managers
  FROM organization_managers
  WHERE org_profile_id IS NULL AND organization_id IS NOT NULL;

  IF unmigrated_managers > 0 THEN
    RAISE WARNING 'BLOCKING: % organization_managers still have NULL org_profile_id', unmigrated_managers;
    has_errors := true;
  END IF;

  IF has_errors THEN
    RAISE EXCEPTION 'Cannot finalize migration: unmigrated records exist. See warnings above.';
  END IF;

  RAISE NOTICE 'Pre-flight check passed. All records migrated.';
END $$;

-- ============================================================================
-- Phase 2: Update organization_join_requests
-- ============================================================================

-- Drop the old FK constraint
ALTER TABLE organization_join_requests
DROP CONSTRAINT IF EXISTS organization_join_requests_organization_id_fkey;

-- Drop the old index
DROP INDEX IF EXISTS idx_org_join_requests_organization;

-- Drop old column
ALTER TABLE organization_join_requests
DROP COLUMN IF EXISTS organization_id;

-- Rename new column
ALTER TABLE organization_join_requests
RENAME COLUMN org_profile_id TO organization_id;

-- Make NOT NULL
ALTER TABLE organization_join_requests
ALTER COLUMN organization_id SET NOT NULL;

-- Update unique constraint to use new column
ALTER TABLE organization_join_requests
DROP CONSTRAINT IF EXISTS organization_join_requests_organization_id_requester_id_stat_key;

ALTER TABLE organization_join_requests
ADD CONSTRAINT organization_join_requests_org_requester_status_key
UNIQUE (organization_id, requester_id, status);

-- ============================================================================
-- Phase 3: Update organization_managers
-- ============================================================================

-- Drop the old FK constraint
ALTER TABLE organization_managers
DROP CONSTRAINT IF EXISTS organization_managers_organization_id_fkey;

-- Drop the old index
DROP INDEX IF EXISTS idx_org_managers_organization;

-- Drop old column
ALTER TABLE organization_managers
DROP COLUMN IF EXISTS organization_id;

-- Rename new column
ALTER TABLE organization_managers
RENAME COLUMN org_profile_id TO organization_id;

-- Make NOT NULL
ALTER TABLE organization_managers
ALTER COLUMN organization_id SET NOT NULL;

-- Update unique constraint to use new column
ALTER TABLE organization_managers
DROP CONSTRAINT IF EXISTS organization_managers_organization_id_manager_id_key;

ALTER TABLE organization_managers
ADD CONSTRAINT organization_managers_org_manager_key
UNIQUE (organization_id, manager_id);

-- ============================================================================
-- Phase 4: Drop compatibility view
-- ============================================================================

DROP VIEW IF EXISTS organizations_compat;

-- ============================================================================
-- Phase 5: Drop legacy organizations table
-- ============================================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;

-- Drop any remaining indexes
DROP INDEX IF EXISTS idx_organizations_promoter_id;
DROP INDEX IF EXISTS idx_organizations_name;
DROP INDEX IF EXISTS idx_organizations_url_slug;

-- Drop RLS policies
DROP POLICY IF EXISTS "Promoters can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Promoters can manage their own organizations" ON organizations;

-- Finally drop the table
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- Phase 6: Update RLS policies for updated FK tables
-- ============================================================================

-- Recreate policy for organization_join_requests to use organization_profiles
DROP POLICY IF EXISTS "Org admins can view requests to their org" ON organization_join_requests;

CREATE POLICY "Org admins can view requests to their org"
ON organization_join_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_team_members otm
    WHERE otm.organization_id = organization_join_requests.organization_id
      AND otm.user_id = auth.uid()
      AND otm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM organization_profiles op
    WHERE op.id = organization_join_requests.organization_id
      AND op.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Org admins can update requests to their org" ON organization_join_requests;

CREATE POLICY "Org admins can update requests to their org"
ON organization_join_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_team_members otm
    WHERE otm.organization_id = organization_join_requests.organization_id
      AND otm.user_id = auth.uid()
      AND otm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM organization_profiles op
    WHERE op.id = organization_join_requests.organization_id
      AND op.owner_id = auth.uid()
  )
);

-- Recreate policy for organization_managers
DROP POLICY IF EXISTS "Org members can view their org managers" ON organization_managers;

CREATE POLICY "Org members can view their org managers"
ON organization_managers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_team_members otm
    WHERE otm.organization_id = organization_managers.organization_id
      AND otm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM organization_profiles op
    WHERE op.id = organization_managers.organization_id
      AND op.owner_id = auth.uid()
  )
);

-- ============================================================================
-- Phase 7: Final documentation
-- ============================================================================

COMMENT ON TABLE organization_profiles IS
  'Primary organization entity table. Consolidates the former organizations (legacy)
   and organization_profiles tables as of migration 20260219000002.

   Key relationships:
   - id references profiles(id) - each org has a base profile
   - owner_id references profiles(id) - the user who owns this org
   - organization_team_members.organization_id references this table
   - organization_join_requests.organization_id references this table
   - organization_managers.organization_id references this table
   - organization_highlights.organization_id references this table';

-- Add migration record
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    INSERT INTO schema_migrations (version, description)
    VALUES (
      '20260219000002',
      'Consolidate organizations - Phase 2: Drop legacy table and finalize FKs'
    )
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- Migration complete!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Organizations consolidation complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'The legacy "organizations" table has been dropped.';
  RAISE NOTICE 'All organization data is now in "organization_profiles".';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated tables:';
  RAISE NOTICE '  - organization_join_requests.organization_id -> organization_profiles';
  RAISE NOTICE '  - organization_managers.organization_id -> organization_profiles';
  RAISE NOTICE '===========================================';
END $$;
