-- Create videographer_profiles table for videographer-specific data
-- Similar to photographer_profiles but with video-specific features

CREATE TABLE IF NOT EXISTS public.videographer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialties TEXT[] DEFAULT '{}', -- e.g., ['event_videography', 'live_streaming', 'editing', 'multi_camera']
  experience_years INTEGER,
  equipment TEXT,
  video_reel_url TEXT,
  rate_per_hour DECIMAL(10,2),
  rate_per_event DECIMAL(10,2),
  travel_radius_km INTEGER DEFAULT 50,
  services_offered TEXT[] DEFAULT '{}', -- e.g., ['event_videography', 'live_streaming', 'editing', 'highlight_reels', 'social_media_content']
  turnaround_time_days INTEGER,
  editing_style TEXT, -- e.g., 'cinematic', 'documentary', 'fast_paced', 'minimalist'
  delivery_formats TEXT[] DEFAULT '{}', -- e.g., ['mp4', 'mov', 'social_media_optimized']
  youtube_channel TEXT,
  instagram_portfolio TEXT,
  vimeo_portfolio TEXT,
  available_for_events BOOLEAN DEFAULT true,
  offers_live_streaming BOOLEAN DEFAULT false,
  max_event_duration_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create videographer_availability table
CREATE TABLE IF NOT EXISTS public.videographer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  videographer_id UUID NOT NULL REFERENCES videographer_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(videographer_id, date)
);

-- Create videographer_portfolio table for video portfolio items
CREATE TABLE IF NOT EXISTS public.videographer_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  videographer_id UUID NOT NULL REFERENCES videographer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  event_type TEXT, -- 'comedy_show', 'promotional', 'highlight_reel', 'live_stream', etc.
  platform TEXT, -- 'youtube', 'vimeo', 'self_hosted'
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_videographers table to link videographers to events
CREATE TABLE IF NOT EXISTS public.event_videographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  videographer_id UUID NOT NULL REFERENCES videographer_profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('videographer', 'live_streamer', 'editor', 'both')) DEFAULT 'videographer',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  rate_agreed DECIMAL(10,2),
  services_requested TEXT[] DEFAULT '{}', -- e.g., ['recording', 'live_streaming', 'editing', 'highlight_reel']
  deliverables TEXT[] DEFAULT '{}', -- e.g., ['full_event_video', 'highlight_reel', 'social_clips']
  delivery_deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, videographer_id)
);

-- Create videographer_reviews table
CREATE TABLE IF NOT EXISTS public.videographer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  videographer_id UUID NOT NULL REFERENCES videographer_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(videographer_id, reviewer_id, event_id)
);

-- Create videographer_equipment table for detailed equipment tracking
CREATE TABLE IF NOT EXISTS public.videographer_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  videographer_id UUID NOT NULL REFERENCES videographer_profiles(id) ON DELETE CASCADE,
  equipment_type TEXT CHECK (equipment_type IN ('camera', 'lens', 'audio', 'lighting', 'stabilizer', 'drone', 'streaming_gear', 'other')) NOT NULL,
  brand TEXT,
  model TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for videographer_profiles
ALTER TABLE videographer_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view videographer profiles
CREATE POLICY "Public can view videographer profiles" ON videographer_profiles
  FOR SELECT USING (true);

-- Videographers can update their own profile
CREATE POLICY "Videographers can update own profile" ON videographer_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Videographers can insert their own profile
CREATE POLICY "Videographers can insert own profile" ON videographer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS for videographer_availability
ALTER TABLE videographer_availability ENABLE ROW LEVEL SECURITY;

-- Public can view availability
CREATE POLICY "Public can view videographer availability" ON videographer_availability
  FOR SELECT USING (true);

-- Videographers can manage their own availability
CREATE POLICY "Videographers can manage own availability" ON videographer_availability
  FOR ALL USING (auth.uid() = videographer_id);

-- Enable RLS for videographer_portfolio
ALTER TABLE videographer_portfolio ENABLE ROW LEVEL SECURITY;

-- Public can view portfolio items
CREATE POLICY "Public can view video portfolio items" ON videographer_portfolio
  FOR SELECT USING (true);

-- Videographers can manage their own portfolio
CREATE POLICY "Videographers can manage own portfolio" ON videographer_portfolio
  FOR ALL USING (auth.uid() = videographer_id);

-- Enable RLS for event_videographers
ALTER TABLE event_videographers ENABLE ROW LEVEL SECURITY;

-- Event creators and videographers can view event videographers
CREATE POLICY "View event videographers" ON event_videographers
  FOR SELECT USING (
    auth.uid() = videographer_id OR
    auth.uid() IN (SELECT created_by FROM events WHERE id = event_id)
  );

-- Event creators can add videographers
CREATE POLICY "Event creators can add videographers" ON event_videographers
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT created_by FROM events WHERE id = event_id)
  );

-- Event creators and videographers can update
CREATE POLICY "Update event videographers" ON event_videographers
  FOR UPDATE USING (
    auth.uid() = videographer_id OR
    auth.uid() IN (SELECT created_by FROM events WHERE id = event_id)
  );

-- Enable RLS for videographer_reviews
ALTER TABLE videographer_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view reviews
CREATE POLICY "Public can view videographer reviews" ON videographer_reviews
  FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON videographer_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews" ON videographer_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Enable RLS for videographer_equipment
ALTER TABLE videographer_equipment ENABLE ROW LEVEL SECURITY;

-- Public can view equipment (for transparency)
CREATE POLICY "Public can view videographer equipment" ON videographer_equipment
  FOR SELECT USING (true);

-- Videographers can manage their own equipment
CREATE POLICY "Videographers can manage own equipment" ON videographer_equipment
  FOR ALL USING (auth.uid() = videographer_id);

-- Create indexes for performance
CREATE INDEX idx_videographer_profiles_available ON videographer_profiles(available_for_events);
CREATE INDEX idx_videographer_profiles_live_streaming ON videographer_profiles(offers_live_streaming);
CREATE INDEX idx_videographer_availability_date ON videographer_availability(date);
CREATE INDEX idx_videographer_portfolio_videographer ON videographer_portfolio(videographer_id);
CREATE INDEX idx_videographer_portfolio_featured ON videographer_portfolio(is_featured);
CREATE INDEX idx_event_videographers_event ON event_videographers(event_id);
CREATE INDEX idx_event_videographers_videographer ON event_videographers(videographer_id);
CREATE INDEX idx_videographer_reviews_videographer ON videographer_reviews(videographer_id);
CREATE INDEX idx_videographer_equipment_videographer ON videographer_equipment(videographer_id);

-- Create function to check if user has videographer profile
CREATE OR REPLACE FUNCTION has_videographer_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM videographer_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_videographer_profiles_updated_at
  BEFORE UPDATE ON videographer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videographer_portfolio_updated_at
  BEFORE UPDATE ON videographer_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_videographers_updated_at
  BEFORE UPDATE ON event_videographers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videographer_reviews_updated_at
  BEFORE UPDATE ON videographer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videographer_equipment_updated_at
  BEFORE UPDATE ON videographer_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE videographer_profiles IS 'Stores videographer-specific profile data including video reel, equipment, and service offerings';
COMMENT ON TABLE videographer_availability IS 'Tracks videographer availability by date for event booking';
COMMENT ON TABLE videographer_portfolio IS 'Video portfolio items showcasing videographer work (YouTube, Vimeo, self-hosted)';
COMMENT ON TABLE event_videographers IS 'Links videographers to events with booking status and deliverables';
COMMENT ON TABLE videographer_reviews IS 'Reviews and ratings for videographers with detailed quality metrics';
COMMENT ON TABLE videographer_equipment IS 'Detailed equipment inventory for videographers';
