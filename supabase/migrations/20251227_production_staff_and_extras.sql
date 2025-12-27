-- Migration: Production Staff & Extra Spots Feature
-- Adds support for booking non-comedian staff to events

-- =====================================================
-- 1. Create production_staff_profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS production_staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL CHECK (specialty IN ('door_staff', 'audio_tech', 'lighting_tech', 'stage_manager', 'other')),
  specialty_other TEXT, -- for 'other' specialty
  hourly_rate NUMERIC(10,2),
  flat_rate NUMERIC(10,2),
  experience_years INTEGER,
  bio TEXT,
  availability_notes TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for production_staff_profiles
ALTER TABLE production_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all production staff profiles (for search/assignment)
CREATE POLICY "Anyone can view production staff profiles"
  ON production_staff_profiles
  FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own production staff profile"
  ON production_staff_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own production staff profile"
  ON production_staff_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own production staff profile"
  ON production_staff_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for user_id lookups
CREATE INDEX idx_production_staff_profiles_user_id ON production_staff_profiles(user_id);
CREATE INDEX idx_production_staff_profiles_specialty ON production_staff_profiles(specialty);

-- =====================================================
-- 2. Add new columns to event_spots for extra staff
-- =====================================================

-- spot_type: 'act' (comedian/performer) or 'extra' (production staff)
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS spot_type TEXT DEFAULT 'act' CHECK (spot_type IN ('act', 'extra'));

-- staff_id: references production_staff_profiles or visual_artist_profiles for extras
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS staff_id UUID;

-- extra_type: type of production staff
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS extra_type TEXT CHECK (extra_type IS NULL OR extra_type IN ('photographer', 'videographer', 'door_staff', 'audio_tech', 'lighting_tech'));

-- rate_type: hourly or flat rate for extras
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS rate_type TEXT CHECK (rate_type IS NULL OR rate_type IN ('hourly', 'flat'));

-- hours: duration in hours for hourly rate calculation (e.g., 2.5 hours)
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS hours NUMERIC(4,2);

-- staff_name: denormalized name for display (like comedian_name would be)
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- staff_avatar: denormalized avatar URL for display
ALTER TABLE event_spots
  ADD COLUMN IF NOT EXISTS staff_avatar TEXT;

-- Add comment for documentation
COMMENT ON COLUMN event_spots.spot_type IS 'act = comedian/performer spot, extra = production staff spot';
COMMENT ON COLUMN event_spots.staff_id IS 'References production_staff_profiles or visual_artist_profiles depending on extra_type';
COMMENT ON COLUMN event_spots.extra_type IS 'Type of production staff: photographer, videographer, door_staff, audio_tech, lighting_tech';
COMMENT ON COLUMN event_spots.rate_type IS 'Payment rate type: hourly or flat';
COMMENT ON COLUMN event_spots.hours IS 'Duration in hours for hourly rate calculation';

-- Add indexes for extra staff queries
CREATE INDEX IF NOT EXISTS idx_event_spots_spot_type ON event_spots(spot_type);
CREATE INDEX IF NOT EXISTS idx_event_spots_extra_type ON event_spots(extra_type);
CREATE INDEX IF NOT EXISTS idx_event_spots_staff_id ON event_spots(staff_id);

-- =====================================================
-- 3. Update trigger for updated_at on production_staff_profiles
-- =====================================================
CREATE OR REPLACE FUNCTION update_production_staff_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS production_staff_profiles_updated_at ON production_staff_profiles;
CREATE TRIGGER production_staff_profiles_updated_at
  BEFORE UPDATE ON production_staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_production_staff_profiles_updated_at();
