-- Update feature_requests table to use simplified 4-status workflow
-- Old statuses: requested, under_review, planned, in_progress, completed
-- New statuses: requested, planned, in_progress, completed

-- First, migrate any features in 'under_review' status to 'requested'
UPDATE feature_requests
SET status = 'requested'
WHERE status = 'under_review';

-- Drop the old constraint
ALTER TABLE feature_requests
DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with only 4 statuses
ALTER TABLE feature_requests
ADD CONSTRAINT valid_status CHECK (status IN ('requested', 'planned', 'in_progress', 'completed'));

-- Update the comment to reflect new statuses
COMMENT ON TABLE feature_requests IS 'User-submitted feature requests and roadmap items - Statuses: requested, planned, in_progress, completed';
