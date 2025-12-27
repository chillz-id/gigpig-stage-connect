-- Create photographer_profiles table
-- This table stores photographer-specific profile data
-- Links to profiles table via id foreign key

CREATE TABLE IF NOT EXISTS photographer_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- URL slug for public profile pages
  url_slug text UNIQUE,
  url_slug_last_changed timestamptz,

  -- Photographer-specific fields
  bio text,
  portfolio_url text,
  instagram_portfolio text,
  specialties text[] DEFAULT '{}',

  -- Pricing
  rate_per_hour numeric(10,2),
  rate_per_event numeric(10,2),

  -- Availability and services
  services_offered text[] DEFAULT '{}',
  travel_radius_km integer DEFAULT 50,
  turnaround_time_days integer DEFAULT 7,
  available_for_events boolean DEFAULT true,

  -- Experience
  experience_years integer DEFAULT 0,

  -- Media
  video_reel_url text,
  youtube_channel text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on url_slug for fast lookups
CREATE INDEX IF NOT EXISTS photographer_profiles_url_slug_idx
ON photographer_profiles(url_slug)
WHERE url_slug IS NOT NULL;

-- Add trigger for slug history tracking (if record_slug_change function exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'record_slug_change'
  ) THEN
    CREATE TRIGGER track_slug_changes_photographers
      AFTER UPDATE OF url_slug ON photographer_profiles
      FOR EACH ROW
      WHEN (OLD.url_slug IS DISTINCT FROM NEW.url_slug)
      EXECUTE FUNCTION record_slug_change();
  END IF;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photographer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photographer_profiles_updated_at
  BEFORE UPDATE ON photographer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_photographer_profiles_updated_at();

-- Enable RLS
ALTER TABLE photographer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to read photographer profiles
CREATE POLICY "Public can view photographer profiles"
  ON photographer_profiles
  FOR SELECT
  USING (true);

-- Allow photographers to update their own profiles
CREATE POLICY "Photographers can update own profile"
  ON photographer_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow photographers to insert their own profiles
CREATE POLICY "Photographers can create own profile"
  ON photographer_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow photographers to delete their own profiles
CREATE POLICY "Photographers can delete own profile"
  ON photographer_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT ON photographer_profiles TO anon, authenticated;
GRANT ALL ON photographer_profiles TO authenticated;

COMMENT ON TABLE photographer_profiles IS 'Photographer-specific profile data with url_slug for public profile pages';
COMMENT ON COLUMN photographer_profiles.url_slug IS 'URL-friendly slug for public profile pages (e.g., /photographer/john-smith)';
COMMENT ON COLUMN photographer_profiles.url_slug_last_changed IS 'Timestamp of last slug change (enforces 30-day cooldown)';
