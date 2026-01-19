-- Migration: Fix event_date timezone data
-- Date: 2026-01-03
-- Description: Fix events where local time was incorrectly stored as UTC.
--              The start_time field contains the correct local time.
--              We reconstruct event_date by combining the date with start_time
--              and properly converting from Sydney timezone to UTC.

-- ============================================================================
-- STEP 1: Preview affected events (for verification)
-- ============================================================================

-- First, let's see what will be updated
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM events
  WHERE start_time IS NOT NULL
    AND event_date >= '2024-01-01'
    AND EXTRACT(HOUR FROM event_date AT TIME ZONE 'Australia/Sydney') != EXTRACT(HOUR FROM start_time);

  RAISE NOTICE 'Found % events with mismatched event_date/start_time hours', affected_count;
END $$;

-- ============================================================================
-- STEP 2: Fix event_date by reconstructing from date + start_time
-- ============================================================================

-- The issue: event_date was stored as "2024-01-03 19:30:00+00" when it should have been
-- "2024-01-03 08:30:00+00" (19:30 Sydney = 08:30 UTC during daylight saving).
--
-- The fix: Take the DATE portion of event_date, combine with start_time,
-- interpret as Sydney time, then convert to UTC.
--
-- Example:
--   event_date = 2024-01-03 19:30:00+00 (wrong - local time stored as UTC)
--   start_time = 19:30:00 (correct local time)
--   date part = 2024-01-03
--   combined = 2024-01-03 19:30:00 (as Sydney time)
--   result = 2024-01-03 08:30:00+00 (proper UTC)

UPDATE events
SET event_date = (
  -- Combine the date portion with the start_time
  (event_date::date || ' ' || start_time)::timestamp
  -- Interpret as Sydney time and convert to UTC
  AT TIME ZONE 'Australia/Sydney'
)
WHERE start_time IS NOT NULL
  AND event_date >= '2024-01-01'
  -- Only fix events where the hour doesn't match
  AND EXTRACT(HOUR FROM event_date AT TIME ZONE 'Australia/Sydney') != EXTRACT(HOUR FROM start_time);

-- ============================================================================
-- STEP 3: Verify the fix
-- ============================================================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM events
  WHERE start_time IS NOT NULL
    AND event_date >= '2024-01-01'
    AND EXTRACT(HOUR FROM event_date AT TIME ZONE 'Australia/Sydney') != EXTRACT(HOUR FROM start_time);

  IF remaining_count > 0 THEN
    RAISE WARNING 'Still have % events with mismatched hours - may need manual review', remaining_count;
  ELSE
    RAISE NOTICE 'All event_date values now match their start_time hours!';
  END IF;
END $$;

-- ============================================================================
-- Migration complete
-- ============================================================================
