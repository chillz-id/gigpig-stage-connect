-- ============================================================================
-- Migration: Consolidate organizations into organization_profiles
-- Created: 2026-02-19
-- Purpose: Merge legacy 'organizations' table into 'organization_profiles'
-- ============================================================================

-- ============================================================================
-- Phase 1: Add missing columns to organization_profiles
-- ============================================================================

-- Add url_slug (exists in organizations, needed in organization_profiles)
ALTER TABLE organization_profiles
ADD COLUMN IF NOT EXISTS url_slug TEXT;

-- Add unique constraint on url_slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_profiles_url_slug
ON organization_profiles(url_slug) WHERE url_slug IS NOT NULL;

-- Add google_review_url (exists in organizations)
ALTER TABLE organization_profiles
ADD COLUMN IF NOT EXISTS google_review_url TEXT;

-- Add display_name as alias for organization_name (for compatibility with code expecting 'name')
-- Using a generated column for seamless compatibility
ALTER TABLE organization_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT GENERATED ALWAYS AS (organization_name) STORED;

-- ============================================================================
-- Phase 2: Migrate url_slug data from organizations to organization_profiles
-- ============================================================================

-- Copy url_slug values where organization names match
UPDATE organization_profiles op
SET url_slug = o.url_slug
FROM organizations o
WHERE LOWER(op.organization_name) = LOWER(o.name)
  AND o.url_slug IS NOT NULL
  AND op.url_slug IS NULL;

-- Copy google_review_url values where organization names match
UPDATE organization_profiles op
SET google_review_url = o.google_review_url
FROM organizations o
WHERE LOWER(op.organization_name) = LOWER(o.name)
  AND o.google_review_url IS NOT NULL
  AND op.google_review_url IS NULL;

-- ============================================================================
-- Phase 3: Update FK tables to reference organization_profiles
-- ============================================================================

-- 3a. organization_join_requests - add new FK column
ALTER TABLE organization_join_requests
ADD COLUMN IF NOT EXISTS org_profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

-- Create index for the new FK
CREATE INDEX IF NOT EXISTS idx_org_join_requests_org_profile
ON organization_join_requests(org_profile_id);

-- Populate from organizations -> organization_profiles mapping (match by name)
UPDATE organization_join_requests ojr
SET org_profile_id = op.id
FROM organizations o
JOIN organization_profiles op ON LOWER(op.organization_name) = LOWER(o.name)
WHERE ojr.organization_id = o.id
  AND ojr.org_profile_id IS NULL;

-- 3b. organization_managers - add new FK column
ALTER TABLE organization_managers
ADD COLUMN IF NOT EXISTS org_profile_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

-- Create index for the new FK
CREATE INDEX IF NOT EXISTS idx_org_managers_org_profile
ON organization_managers(org_profile_id);

-- Populate from organizations -> organization_profiles mapping (match by name)
UPDATE organization_managers om
SET org_profile_id = op.id
FROM organizations o
JOIN organization_profiles op ON LOWER(op.organization_name) = LOWER(o.name)
WHERE om.organization_id = o.id
  AND om.org_profile_id IS NULL;

-- ============================================================================
-- Phase 4: Report migration status
-- ============================================================================

DO $$
DECLARE
  total_orgs INTEGER;
  matched_orgs INTEGER;
  orphan_orgs INTEGER;
  unmigrated_join_requests INTEGER;
  unmigrated_managers INTEGER;
BEGIN
  -- Count total organizations
  SELECT COUNT(*) INTO total_orgs FROM organizations;

  -- Count organizations with matching organization_profiles
  SELECT COUNT(*) INTO matched_orgs
  FROM organizations o
  JOIN organization_profiles op ON LOWER(op.organization_name) = LOWER(o.name);

  orphan_orgs := total_orgs - matched_orgs;

  RAISE NOTICE '=== Organizations Migration Status ===';
  RAISE NOTICE 'Total organizations: %', total_orgs;
  RAISE NOTICE 'Matched to organization_profiles: %', matched_orgs;

  IF orphan_orgs > 0 THEN
    RAISE WARNING 'Orphaned organizations (no matching profile): %', orphan_orgs;
    RAISE WARNING 'Run this query to see orphans: SELECT * FROM organizations o LEFT JOIN organization_profiles op ON LOWER(op.organization_name) = LOWER(o.name) WHERE op.id IS NULL;';
  ELSE
    RAISE NOTICE 'All organizations have matching profiles!';
  END IF;

  -- Count unmigrated join requests
  SELECT COUNT(*) INTO unmigrated_join_requests
  FROM organization_join_requests
  WHERE org_profile_id IS NULL AND organization_id IS NOT NULL;

  IF unmigrated_join_requests > 0 THEN
    RAISE WARNING 'Unmigrated organization_join_requests: %', unmigrated_join_requests;
  ELSE
    RAISE NOTICE 'All organization_join_requests migrated.';
  END IF;

  -- Count unmigrated managers
  SELECT COUNT(*) INTO unmigrated_managers
  FROM organization_managers
  WHERE org_profile_id IS NULL AND organization_id IS NOT NULL;

  IF unmigrated_managers > 0 THEN
    RAISE WARNING 'Unmigrated organization_managers: %', unmigrated_managers;
  ELSE
    RAISE NOTICE 'All organization_managers migrated.';
  END IF;

  RAISE NOTICE '======================================';
END $$;

-- ============================================================================
-- Phase 5: Create compatibility view for gradual code migration
-- ============================================================================

-- This view allows code still using 'organizations' table to work during transition
CREATE OR REPLACE VIEW organizations_compat AS
SELECT
  op.id,
  op.owner_id as promoter_id,
  op.organization_name as name,
  op.bio as description,
  op.logo_url,
  op.contact_email,
  op.contact_phone,
  op.address,
  op.city,
  op.state,
  op.country,
  op.website_url,
  op.is_active,
  op.created_at,
  op.updated_at,
  op.url_slug,
  op.google_review_url
FROM organization_profiles op
WHERE op.is_active = true;

COMMENT ON VIEW organizations_compat IS
  'Compatibility view mapping organization_profiles to legacy organizations schema.
   Use during migration period only. Remove after all code updated to use organization_profiles directly.';

-- Grant access to the view
GRANT SELECT ON organizations_compat TO authenticated;
GRANT SELECT ON organizations_compat TO anon;

-- ============================================================================
-- Phase 6: Document the migration
-- ============================================================================

COMMENT ON COLUMN organization_profiles.url_slug IS 'URL-friendly slug for organization profile URLs. Migrated from organizations table.';
COMMENT ON COLUMN organization_profiles.google_review_url IS 'Google Reviews URL for the organization. Migrated from organizations table.';
COMMENT ON COLUMN organization_profiles.display_name IS 'Generated column, alias for organization_name for compatibility.';

-- Add migration record if schema_migrations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    INSERT INTO schema_migrations (version, description)
    VALUES (
      '20260219000001',
      'Consolidate organizations into organization_profiles - Phase 1: Schema changes and data migration'
    )
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
