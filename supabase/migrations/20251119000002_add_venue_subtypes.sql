-- Add Venue Subtypes Migration
-- Created: 2025-11-19
-- Purpose: Add venue_subtypes column to support venue categorization

-- ============================================================================
-- 1. Add venue_subtypes column as text array
-- ============================================================================

ALTER TABLE organization_profiles
  ADD COLUMN venue_subtypes text[] DEFAULT ARRAY[]::text[];

-- Add comment explaining the column
COMMENT ON COLUMN organization_profiles.venue_subtypes IS 'Venue subtypes (comedy_club, pub, theatre, bar, hotel, etc.) - only applicable when organization_type includes "venue"';

-- ============================================================================
-- 2. Add check constraint for valid venue subtypes
-- ============================================================================

ALTER TABLE organization_profiles
  ADD CONSTRAINT valid_venue_subtypes
  CHECK (
    venue_subtypes <@ ARRAY['comedy_club', 'pub', 'theatre', 'bar', 'hotel', 'cafe', 'restaurant', 'function_centre', 'arts_centre', 'other']::text[]
  );

-- ============================================================================
-- 3. Create index for venue subtype queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organization_venue_subtypes
  ON organization_profiles USING GIN (venue_subtypes);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration record
INSERT INTO schema_migrations (version, description)
VALUES (
  '20251119000002',
  'Add venue_subtypes column for venue categorization'
)
ON CONFLICT (version) DO NOTHING;
