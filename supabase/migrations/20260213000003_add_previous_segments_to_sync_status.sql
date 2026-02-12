-- Add previous_segments column to mautic_sync_status for optimized segment sync
-- This allows tracking which segments a contact was previously in,
-- so we only make API calls for segments that actually changed

ALTER TABLE mautic_sync_status
ADD COLUMN IF NOT EXISTS previous_segments TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_mautic_sync_status_previous_segments
ON mautic_sync_status USING GIN (previous_segments);

COMMENT ON COLUMN mautic_sync_status.previous_segments IS
'Array of segment slugs the contact was in during the last successful sync. Used to compute segment changes and avoid unnecessary API calls.';
