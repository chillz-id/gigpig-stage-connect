-- Migrate promoter events to organizations
-- The organization_id column already exists on events table
-- This migration:
-- 1. Adds index for performance
-- 2. Attempts to link promoter events to their organizations
-- 3. Documents that events without organizations will be handled via migration UI

-- Create index for organization lookups (if not exists)
CREATE INDEX IF NOT EXISTS events_organization_id_idx
ON events(organization_id);

-- Migrate promoter events to their organizations
-- Only updates events where:
-- 1. organization_id is currently NULL
-- 2. User has promoter role
-- 3. User has created an organization
UPDATE events e
SET organization_id = (
  SELECT o.id
  FROM organization_profiles o
  WHERE o.owner_id = e.promoter_id
  LIMIT 1
)
WHERE e.organization_id IS NULL
AND e.promoter_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = e.promoter_id
  AND ur.role = 'promoter'
)
AND EXISTS (
  SELECT 1 FROM organization_profiles o
  WHERE o.owner_id = e.promoter_id
);

-- Note: Events where promoter hasn't created an organization yet
-- will remain with organization_id = NULL
-- These will be handled via the PromoterMigrationBanner UI (Phase 6)
-- which prompts promoters to create organizations

-- Log migration results
DO $$
DECLARE
  migrated_count integer;
  remaining_count integer;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM events
  WHERE organization_id IS NOT NULL;

  SELECT COUNT(*) INTO remaining_count
  FROM events
  WHERE organization_id IS NULL AND promoter_id IS NOT NULL;

  RAISE NOTICE 'Events migrated to organizations: %', migrated_count;
  RAISE NOTICE 'Promoter events awaiting organization creation: %', remaining_count;
END $$;
