-- Add Event Time Fields Migration
-- Date: September 11, 2025
-- Purpose: Add missing time fields that frontend already expects

-- Add the time fields that the frontend is already trying to save
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS doors_time TIME;

-- Migrate existing data from event_date
-- Extract time component from existing event_date timestamps
UPDATE events 
SET start_time = event_date::time
WHERE start_time IS NULL 
  AND event_date IS NOT NULL;

-- Add helpful comments to columns
COMMENT ON COLUMN events.start_time IS 'Time when the event/show starts (HH:MM format)';
COMMENT ON COLUMN events.end_time IS 'Time when the event/show ends (HH:MM format) - optional';
COMMENT ON COLUMN events.doors_time IS 'Time when doors open for the event (HH:MM format) - optional';

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_doors_time ON events(doors_time) WHERE doors_time IS NOT NULL;

-- Update any existing events that have duration_minutes but no end_time
-- This gives a rough end time for existing events
UPDATE events 
SET end_time = (
  CASE 
    WHEN start_time IS NOT NULL AND duration_minutes IS NOT NULL THEN
      (start_time::interval + (duration_minutes || ' minutes')::interval)::time
    ELSE NULL
  END
)
WHERE end_time IS NULL 
  AND start_time IS NOT NULL 
  AND duration_minutes IS NOT NULL;

-- Validation: Ensure end_time is after start_time when both are present
ALTER TABLE events 
ADD CONSTRAINT check_end_time_after_start_time 
CHECK (
  end_time IS NULL OR 
  start_time IS NULL OR 
  end_time > start_time
);

-- Validation: Ensure doors_time is before start_time when both are present
ALTER TABLE events 
ADD CONSTRAINT check_doors_time_before_start_time 
CHECK (
  doors_time IS NULL OR 
  start_time IS NULL OR 
  doors_time <= start_time
);