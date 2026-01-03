-- Migration: Link Magic Mic Comedy Events to iD Comedy Organization
-- Date: 2026-01-03
-- Description: Set organization_id on existing Magic Mic Comedy events
--              to link them to the iD Comedy organization while preserving
--              the original promoter_id (audit trail)

-- ============================================================================
-- Update Magic Mic Comedy events to be owned by iD Comedy organization
-- ============================================================================

-- First, verify the iD Comedy organization exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM organization_profiles
    WHERE id = '91d76aad-b45d-4387-912c-bb43a05c3576'
  ) THEN
    RAISE EXCEPTION 'iD Comedy organization not found (ID: 91d76aad-b45d-4387-912c-bb43a05c3576)';
  END IF;
END $$;

-- Update events with "Magic Mic" in the title
-- Sets organization_id while preserving promoter_id for audit trail
UPDATE events
SET organization_id = '91d76aad-b45d-4387-912c-bb43a05c3576'
WHERE (
    title ILIKE '%Magic Mic%'
    OR title ILIKE '%magic mic%'
  )
  AND promoter_id = '2fc4f578-7216-447a-876c-7bf9f4c9b096' -- chillz-skinner
  AND organization_id IS NULL -- Only update events not already assigned to an org
  AND event_date >= '2024-01-01'; -- Only update recent/future events

-- Add a comment explaining the migration
COMMENT ON COLUMN events.organization_id IS 'Organization that owns this event (NULL for personal events). Set via migration for Magic Mic Comedy events owned by iD Comedy.';

-- ============================================================================
-- Summary Query (for verification)
-- ============================================================================

-- Display summary of updated events
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM events
  WHERE organization_id = '91d76aad-b45d-4387-912c-bb43a05c3576'
    AND promoter_id = '2fc4f578-7216-447a-876c-7bf9f4c9b096';

  RAISE NOTICE 'Migration complete: % Magic Mic events linked to iD Comedy organization', updated_count;
END $$;

-- ============================================================================
-- Migration complete
-- ============================================================================
