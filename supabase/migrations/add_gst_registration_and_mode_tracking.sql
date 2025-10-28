-- Add GST registration to profiles
ALTER TABLE profiles ADD COLUMN gst_registered BOOLEAN DEFAULT false NOT NULL;
COMMENT ON COLUMN profiles.gst_registered IS 'Whether this profile is registered for GST/tax collection';

-- Add GST mode to deal_participants (per-participant GST treatment)
ALTER TABLE deal_participants ADD COLUMN gst_mode TEXT DEFAULT 'none' NOT NULL
  CHECK (gst_mode IN ('inclusive', 'exclusive', 'none'));
COMMENT ON COLUMN deal_participants.gst_mode IS 'GST treatment: inclusive (GST in amount), exclusive (GST added), or none';

-- Add GST mode to event_spots (for spot payments)
ALTER TABLE event_spots ADD COLUMN gst_mode TEXT DEFAULT 'none' NOT NULL
  CHECK (gst_mode IN ('inclusive', 'exclusive', 'none'));
COMMENT ON COLUMN event_spots.gst_mode IS 'GST treatment for spot payment';

-- Create index for GST queries
CREATE INDEX idx_profiles_gst_registered ON profiles(gst_registered);
