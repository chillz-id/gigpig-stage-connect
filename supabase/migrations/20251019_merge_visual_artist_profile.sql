-- Migration: Create Visual Artist Profile (replaces Photographer + Videographer)
-- Date: 2025-10-19
-- Description: Creates unified "Visual Artist" profile type for photographers
--             and videographers, combining both roles into one streamlined profile.

-- Step 1: Add visual_artist to user_role enum
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'visual_artist'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'visual_artist';
  END IF;
END $$;

-- Step 2: Create visual_artist_profiles table (combined photo + video)
CREATE TABLE IF NOT EXISTS public.visual_artist_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Common fields
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  rate_per_hour DECIMAL(10,2),
  rate_per_event DECIMAL(10,2),

  -- Photography-specific fields
  portfolio_url TEXT,
  instagram_portfolio TEXT,

  -- Videography-specific fields
  is_videographer BOOLEAN DEFAULT false,
  video_reel_url TEXT,
  youtube_channel TEXT,

  -- Shared settings
  travel_radius_km INTEGER DEFAULT 50,
  services_offered TEXT[] DEFAULT '{}',
  turnaround_time_days INTEGER,
  available_for_events BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create visual_artist_availability table
CREATE TABLE IF NOT EXISTS public.visual_artist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_artist_id UUID NOT NULL REFERENCES visual_artist_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visual_artist_id, date)
);

-- Step 4: Create visual_artist_portfolio table
CREATE TABLE IF NOT EXISTS public.visual_artist_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_artist_id UUID NOT NULL REFERENCES visual_artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  event_type TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create event_visual_artists table
CREATE TABLE IF NOT EXISTS public.event_visual_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  visual_artist_id UUID NOT NULL REFERENCES visual_artist_profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('photographer', 'videographer', 'both')) DEFAULT 'photographer',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  rate_agreed DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, visual_artist_id)
);

-- Step 6: Create visual_artist_reviews table
CREATE TABLE IF NOT EXISTS public.visual_artist_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_artist_id UUID NOT NULL REFERENCES visual_artist_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visual_artist_id, reviewer_id, event_id)
);

-- Step 7: Create indexes for performance

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_visual_artist_profiles_available
  ON visual_artist_profiles(available_for_events);
CREATE INDEX IF NOT EXISTS idx_visual_artist_availability_date
  ON visual_artist_availability(date);
CREATE INDEX IF NOT EXISTS idx_visual_artist_portfolio_artist
  ON visual_artist_portfolio(visual_artist_id);
CREATE INDEX IF NOT EXISTS idx_event_visual_artists_event
  ON event_visual_artists(event_id);
CREATE INDEX IF NOT EXISTS idx_event_visual_artists_artist
  ON event_visual_artists(visual_artist_id);
CREATE INDEX IF NOT EXISTS idx_visual_artist_reviews_artist
  ON visual_artist_reviews(visual_artist_id);
CREATE INDEX IF NOT EXISTS idx_visual_artist_is_videographer
  ON visual_artist_profiles(is_videographer);

-- Step 8: Enable RLS on all tables
ALTER TABLE visual_artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_artist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_artist_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_visual_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_artist_reviews ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- visual_artist_profiles policies

CREATE POLICY "Public can view visual artist profiles" ON visual_artist_profiles
  FOR SELECT USING (true);

CREATE POLICY "Visual artists can update own profile" ON visual_artist_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Visual artists can insert own profile" ON visual_artist_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- visual_artist_availability policies

CREATE POLICY "Public can view visual artist availability" ON visual_artist_availability
  FOR SELECT USING (true);

CREATE POLICY "Visual artists can manage own availability" ON visual_artist_availability
  FOR ALL USING (auth.uid() = visual_artist_id);

-- visual_artist_portfolio policies

CREATE POLICY "Public can view portfolio items" ON visual_artist_portfolio
  FOR SELECT USING (true);

CREATE POLICY "Visual artists can manage own portfolio" ON visual_artist_portfolio
  FOR ALL USING (auth.uid() = visual_artist_id);

-- event_visual_artists policies

CREATE POLICY "View event visual artists" ON event_visual_artists
  FOR SELECT USING (
    auth.uid() = visual_artist_id OR
    auth.uid() IN (SELECT promoter_id FROM events WHERE id = event_id)
  );

CREATE POLICY "Event creators can add visual artists" ON event_visual_artists
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT promoter_id FROM events WHERE id = event_id)
  );

CREATE POLICY "Update event visual artists" ON event_visual_artists
  FOR UPDATE USING (
    auth.uid() = visual_artist_id OR
    auth.uid() IN (SELECT promoter_id FROM events WHERE id = event_id)
  );

-- visual_artist_reviews policies

CREATE POLICY "Public can view visual artist reviews" ON visual_artist_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON visual_artist_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews" ON visual_artist_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Step 10: Create helper functions

CREATE OR REPLACE FUNCTION has_visual_artist_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM visual_artist_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create triggers for updated_at

CREATE TRIGGER update_visual_artist_profiles_updated_at
  BEFORE UPDATE ON visual_artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visual_artist_portfolio_updated_at
  BEFORE UPDATE ON visual_artist_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_visual_artists_updated_at
  BEFORE UPDATE ON event_visual_artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visual_artist_reviews_updated_at
  BEFORE UPDATE ON visual_artist_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Add comments
COMMENT ON TABLE visual_artist_profiles IS 'Profiles for visual artists (photographers and videographers)';
COMMENT ON COLUMN visual_artist_profiles.is_videographer IS 'Indicates if the artist offers videography services';
COMMENT ON COLUMN visual_artist_profiles.video_reel_url IS 'URL to video reel or demo video (for videographers)';
COMMENT ON COLUMN visual_artist_profiles.youtube_channel IS 'YouTube channel handle or URL (for videographers)';
