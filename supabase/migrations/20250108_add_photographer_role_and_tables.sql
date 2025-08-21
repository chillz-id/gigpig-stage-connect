-- Add photographer and videographer roles to the existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'photographer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'videographer';

-- Create photographer_profiles table for photographer-specific data
CREATE TABLE IF NOT EXISTS public.photographer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  equipment TEXT,
  portfolio_url TEXT,
  rate_per_hour DECIMAL(10,2),
  rate_per_event DECIMAL(10,2),
  travel_radius_km INTEGER DEFAULT 50,
  services_offered TEXT[] DEFAULT '{}', -- e.g., ['event_photography', 'headshots', 'video_recording', 'live_streaming']
  turnaround_time_days INTEGER,
  instagram_portfolio TEXT,
  available_for_events BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create photographer_availability table
CREATE TABLE IF NOT EXISTS public.photographer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photographer_id, date)
);

-- Create photographer_portfolio table for portfolio items
CREATE TABLE IF NOT EXISTS public.photographer_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  event_type TEXT, -- 'comedy_show', 'headshot', 'promotional', etc.
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_photographers table to link photographers to events
CREATE TABLE IF NOT EXISTS public.event_photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('photographer', 'videographer', 'both')) DEFAULT 'photographer',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  rate_agreed DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, photographer_id)
);

-- Create photographer_reviews table
CREATE TABLE IF NOT EXISTS public.photographer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photographer_id, reviewer_id, event_id)
);

-- Add RLS policies for photographer_profiles
ALTER TABLE photographer_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view photographer profiles
CREATE POLICY "Public can view photographer profiles" ON photographer_profiles
  FOR SELECT USING (true);

-- Photographers can update their own profile
CREATE POLICY "Photographers can update own profile" ON photographer_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Photographers can insert their own profile
CREATE POLICY "Photographers can insert own profile" ON photographer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add RLS policies for photographer_availability
ALTER TABLE photographer_availability ENABLE ROW LEVEL SECURITY;

-- Public can view availability
CREATE POLICY "Public can view photographer availability" ON photographer_availability
  FOR SELECT USING (true);

-- Photographers can manage their own availability
CREATE POLICY "Photographers can manage own availability" ON photographer_availability
  FOR ALL USING (auth.uid() = photographer_id);

-- Add RLS policies for photographer_portfolio
ALTER TABLE photographer_portfolio ENABLE ROW LEVEL SECURITY;

-- Public can view portfolio items
CREATE POLICY "Public can view portfolio items" ON photographer_portfolio
  FOR SELECT USING (true);

-- Photographers can manage their own portfolio
CREATE POLICY "Photographers can manage own portfolio" ON photographer_portfolio
  FOR ALL USING (auth.uid() = photographer_id);

-- Add RLS policies for event_photographers
ALTER TABLE event_photographers ENABLE ROW LEVEL SECURITY;

-- Event creators and photographers can view event photographers
CREATE POLICY "View event photographers" ON event_photographers
  FOR SELECT USING (
    auth.uid() = photographer_id OR
    auth.uid() IN (SELECT created_by FROM events WHERE id = event_id)
  );

-- Event creators can add photographers
CREATE POLICY "Event creators can add photographers" ON event_photographers
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT created_by FROM events WHERE id = event_id)
  );

-- Event creators and photographers can update
CREATE POLICY "Update event photographers" ON event_photographers
  FOR UPDATE USING (
    auth.uid() = photographer_id OR
    auth.uid() IN (SELECT created_by FROM events WHERE id = event_id)
  );

-- Add RLS policies for photographer_reviews
ALTER TABLE photographer_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view reviews
CREATE POLICY "Public can view photographer reviews" ON photographer_reviews
  FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON photographer_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews" ON photographer_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Create indexes for performance
CREATE INDEX idx_photographer_profiles_available ON photographer_profiles(available_for_events);
CREATE INDEX idx_photographer_availability_date ON photographer_availability(date);
CREATE INDEX idx_photographer_portfolio_photographer ON photographer_portfolio(photographer_id);
CREATE INDEX idx_event_photographers_event ON event_photographers(event_id);
CREATE INDEX idx_event_photographers_photographer ON event_photographers(photographer_id);
CREATE INDEX idx_photographer_reviews_photographer ON photographer_reviews(photographer_id);

-- Create function to check if user has photographer profile
CREATE OR REPLACE FUNCTION has_photographer_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM photographer_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Update the has_role function to work with multiple roles
CREATE OR REPLACE FUNCTION has_any_role(user_id UUID, roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = has_any_role.user_id 
    AND role::text = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_photographer_profiles_updated_at
  BEFORE UPDATE ON photographer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photographer_portfolio_updated_at
  BEFORE UPDATE ON photographer_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_photographers_updated_at
  BEFORE UPDATE ON event_photographers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();