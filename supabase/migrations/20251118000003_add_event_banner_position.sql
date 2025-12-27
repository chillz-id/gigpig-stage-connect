-- Add banner_position field to events table
-- This stores the crop position metadata (x, y, scale) for event banners
-- Matches the banner_position field in the profiles table

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS banner_position JSONB
  DEFAULT '{"x": 0, "y": 0, "scale": 1}';

COMMENT ON COLUMN events.banner_position IS 'Banner crop position metadata: {x: number, y: number, scale: number}';
