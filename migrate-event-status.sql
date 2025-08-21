-- ============================================
-- EVENT STATUS MIGRATION
-- ============================================
-- Migrate events to use: draft, open, closed, cancelled, completed

-- 1. First, let's check current status values
SELECT DISTINCT status, COUNT(*) as count 
FROM events 
GROUP BY status;

-- 2. Update the CHECK constraint to allow new values
-- Note: We need to drop and recreate the constraint
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'open', 'closed', 'cancelled', 'completed'));

-- 3. Current events are all 'open' which is perfect - no migration needed

-- 4. Create trigger to auto-update to 'completed' for past events
CREATE OR REPLACE FUNCTION update_event_status_to_completed()
RETURNS trigger AS $$
BEGIN
    -- Only update if the event is not already cancelled or completed
    IF OLD.status NOT IN ('cancelled', 'completed') AND 
       (OLD.event_date < CURRENT_DATE OR 
        (OLD.event_date = CURRENT_DATE AND OLD.end_time::time < CURRENT_TIME)) THEN
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs on updates
DROP TRIGGER IF EXISTS auto_complete_past_events ON events;
CREATE TRIGGER auto_complete_past_events
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_status_to_completed();

-- 5. Create a function to check and update past events (can be called periodically)
CREATE OR REPLACE FUNCTION mark_past_events_completed()
RETURNS void AS $$
BEGIN
    UPDATE events
    SET status = 'completed',
        updated_at = NOW()
    WHERE status NOT IN ('cancelled', 'completed')
    AND (event_date < CURRENT_DATE OR 
         (event_date = CURRENT_DATE AND end_time::time < CURRENT_TIME));
END;
$$ LANGUAGE plpgsql;

-- Run it once to mark any current past events as completed
SELECT mark_past_events_completed();

-- 6. Create waitlist table for closed events
CREATE TABLE IF NOT EXISTS event_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate entries for same email on same event
    UNIQUE(event_id, email)
);

-- Add RLS policies for waitlist
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to join a waitlist
CREATE POLICY "Anyone can join event waitlist" 
ON event_waitlist FOR INSERT 
TO public 
WITH CHECK (true);

-- Event owners and admins can view waitlist
CREATE POLICY "Event owners can view waitlist" 
ON event_waitlist FOR SELECT 
TO authenticated 
USING (
    event_id IN (
        SELECT id FROM events 
        WHERE promoter_id = auth.uid()
        OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
    )
);

-- Event owners and admins can manage waitlist
CREATE POLICY "Event owners can manage waitlist" 
ON event_waitlist FOR ALL 
TO authenticated 
USING (
    event_id IN (
        SELECT id FROM events 
        WHERE promoter_id = auth.uid()
        OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
    )
);

-- Grant permissions
GRANT ALL ON event_waitlist TO authenticated;
GRANT INSERT ON event_waitlist TO anon;

-- Create indexes for performance
CREATE INDEX idx_event_waitlist_event_id ON event_waitlist(event_id);
CREATE INDEX idx_event_waitlist_email ON event_waitlist(email);

-- Add updated_at trigger
CREATE TRIGGER update_event_waitlist_updated_at 
BEFORE UPDATE ON event_waitlist 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Verification
SELECT '✅ Event status migration complete!' as message;
SELECT '✅ Waitlist table created!' as message;

-- Check the new constraint
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'events'::regclass 
AND conname = 'events_status_check';