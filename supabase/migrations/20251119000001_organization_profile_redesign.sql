-- Organization Profile Redesign Migration
-- Created: 2025-11-19
-- Purpose: Enable multi-type organizations, feature toggles, and company highlights

-- ============================================================================
-- 1. Change organization_type to array for multi-type support
-- ============================================================================

-- First, create the new column as array type
ALTER TABLE organization_profiles
  ADD COLUMN organization_types text[] DEFAULT ARRAY[]::text[];

-- Copy existing single values to array
UPDATE organization_profiles
SET organization_types = ARRAY[organization_type]::text[]
WHERE organization_type IS NOT NULL;

-- ALLOW_DROP: Safe to drop after migrating data to organization_types array column
-- Drop the old single-value column
ALTER TABLE organization_profiles
  DROP COLUMN organization_type;

-- Rename new column to organization_type (keeping same name for compatibility)
ALTER TABLE organization_profiles
  RENAME COLUMN organization_types TO organization_type;

-- Add check constraint for valid organization types
ALTER TABLE organization_profiles
  ADD CONSTRAINT valid_organization_types
  CHECK (
    organization_type <@ ARRAY['event_promoter', 'artist_agency', 'venue']::text[]
  );

-- ============================================================================
-- 2. Add enabled_features column for feature toggles
-- ============================================================================

ALTER TABLE organization_profiles
  ADD COLUMN enabled_features JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN organization_profiles.enabled_features IS 'Feature flags for organization capabilities (events, roster, bookings, analytics, etc.)';

-- ============================================================================
-- 3. Create organization_highlights table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  category text CHECK (category IN ('event', 'partnership', 'award', 'milestone')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comment
COMMENT ON TABLE organization_highlights IS 'Company achievements, milestones, awards, and major events for organizations';

-- ============================================================================
-- 4. Add indexes for performance
-- ============================================================================

-- Index on organization_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_org_highlights_org_id
  ON organization_highlights(organization_id);

-- Index on date for sorting (most recent first)
CREATE INDEX IF NOT EXISTS idx_org_highlights_date
  ON organization_highlights(date DESC NULLS LAST);

-- Index on category for filtering
CREATE INDEX IF NOT EXISTS idx_org_highlights_category
  ON organization_highlights(category);

-- Composite index for organization + date queries
CREATE INDEX IF NOT EXISTS idx_org_highlights_org_date
  ON organization_highlights(organization_id, date DESC NULLS LAST);

-- ============================================================================
-- 5. Enable RLS on organization_highlights
-- ============================================================================

ALTER TABLE organization_highlights ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view highlights for organizations they are members of
CREATE POLICY "Organization members can view highlights"
  ON organization_highlights
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Public can view highlights (for public profiles)
CREATE POLICY "Public can view highlights"
  ON organization_highlights
  FOR SELECT
  USING (true);

-- Policy: Organization admins and owners can insert highlights
CREATE POLICY "Organization admins can create highlights"
  ON organization_highlights
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Organization admins and owners can update their highlights
CREATE POLICY "Organization admins can update highlights"
  ON organization_highlights
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Organization admins and owners can delete highlights
CREATE POLICY "Organization admins can delete highlights"
  ON organization_highlights
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 6. Create trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_organization_highlights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_highlights_updated_at
  BEFORE UPDATE ON organization_highlights
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_highlights_updated_at();

-- ============================================================================
-- 7. Update existing organizations with default enabled_features
-- ============================================================================

-- Event Promoter organizations get default features
UPDATE organization_profiles
SET enabled_features = jsonb_build_object(
  'events', true,
  'analytics', true,
  'media', true,
  'invoices', true,
  'ticketing', true
)
WHERE 'event_promoter' = ANY(organization_type);

-- Artist Agency organizations get default features
UPDATE organization_profiles
SET enabled_features = jsonb_build_object(
  'roster', true,
  'bookings', true,
  'deals', true,
  'invoices', true,
  'analytics', true
)
WHERE 'artist_agency' = ANY(organization_type);

-- Venue organizations get default features
UPDATE organization_profiles
SET enabled_features = jsonb_build_object(
  'events', true,
  'bookings', true,
  'media', true,
  'calendar', true
)
WHERE 'venue' = ANY(organization_type);

-- ============================================================================
-- 8. Migrate specific organization: iD Comedy to Event Promoter
-- ============================================================================

UPDATE organization_profiles
SET organization_type = ARRAY['event_promoter']::text[]
WHERE organization_name = 'iD Comedy';

-- ============================================================================
-- 9. Add financial details columns (if not already exist)
-- ============================================================================

-- ABN (Australian Business Number) - 11 digits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'abn'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN abn text;
  END IF;
END $$;

-- ACN (Australian Company Number) - 9 digits, optional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'acn'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN acn text;
  END IF;
END $$;

-- Business structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'business_structure'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN business_structure text;
  END IF;
END $$;

-- Banking information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'bsb'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN bsb text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'account_number'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN account_number text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'account_name'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN account_name text;
  END IF;
END $$;

-- Tax settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'gst_registered'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN gst_registered boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'tfn'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN tfn text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_profiles' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE organization_profiles ADD COLUMN payment_terms text DEFAULT '30';
  END IF;
END $$;

-- Add constraints for ABN and ACN validation (must be done after columns exist)
DO $$
BEGIN
  -- ABN constraint: 11 digits (with optional spaces)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'valid_abn_format'
  ) THEN
    ALTER TABLE organization_profiles
      ADD CONSTRAINT valid_abn_format
      CHECK (abn IS NULL OR abn ~ '^\d{11}$' OR abn ~ '^\d{2} \d{3} \d{3} \d{3}$');
  END IF;
END $$;

DO $$
BEGIN
  -- ACN constraint: 9 digits (with optional spaces)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'valid_acn_format'
  ) THEN
    ALTER TABLE organization_profiles
      ADD CONSTRAINT valid_acn_format
      CHECK (acn IS NULL OR acn ~ '^\d{9}$' OR acn ~ '^\d{3} \d{3} \d{3}$');
  END IF;
END $$;

-- ============================================================================
-- 10. Grant permissions
-- ============================================================================

-- Grant access to authenticated users for reading highlights
GRANT SELECT ON organization_highlights TO authenticated;
GRANT SELECT ON organization_highlights TO anon;

-- Grant all operations to authenticated users (RLS will control actual access)
GRANT INSERT, UPDATE, DELETE ON organization_highlights TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration record
INSERT INTO schema_migrations (version, description)
VALUES (
  '20251119000001',
  'Organization Profile Redesign: Multi-type support, feature toggles, and company highlights'
)
ON CONFLICT (version) DO NOTHING;
