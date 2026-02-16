-- Migration: Add directory_profile_id to event_spots
-- Purpose: Allow assigning unclaimed directory profiles to lineup spots for testing
-- Date: 2025-02-13

-- Add directory_profile_id column to event_spots
ALTER TABLE event_spots
ADD COLUMN IF NOT EXISTS directory_profile_id UUID REFERENCES directory_profiles(id);

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_event_spots_directory_profile_id
ON event_spots(directory_profile_id)
WHERE directory_profile_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN event_spots.directory_profile_id IS
'Links to an unclaimed directory profile. Used for pre-launch lineup building before comedians claim their profiles. Mutually exclusive with comedian_id - only one should be set.';

-- Create a check constraint to ensure only one of comedian_id or directory_profile_id is set
-- (but both can be null for empty spots)
ALTER TABLE event_spots
ADD CONSTRAINT chk_spot_comedian_or_directory
CHECK (
  NOT (comedian_id IS NOT NULL AND directory_profile_id IS NOT NULL)
);
