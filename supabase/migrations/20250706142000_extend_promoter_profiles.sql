-- Extend profiles and create promoter-specific tables
-- Based on existing comedian profile architecture but for promoters

-- Add promoter-specific fields to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promoter_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS venue_partnerships JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_license TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS insurance_info JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_areas TEXT[] DEFAULT '{}'; -- Geographic areas they serve

-- Create promoter statistics table
CREATE TABLE public.promoter_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    total_events_hosted INTEGER DEFAULT 0,
    total_comedians_booked INTEGER DEFAULT 0,
    average_event_rating DECIMAL(3,2) DEFAULT 0.00,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    average_attendance INTEGER DEFAULT 0,
    repeat_bookings_rate DECIMAL(5,2) DEFAULT 0.00,
    success_rate DECIMAL(5,2) DEFAULT 100.00, -- Percentage of successful events
    response_time_hours INTEGER DEFAULT 24, -- Average response time to bookings
    cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
    last_calculated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(promoter_id)
);

-- Create promoter social links table for better organization
CREATE TABLE public.promoter_social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL, -- 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'
    url TEXT NOT NULL,
    username TEXT,
    follower_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    primary_platform BOOLEAN DEFAULT FALSE, -- Mark main social media presence
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(promoter_id, platform)
);

-- Create promoter venues table for venue partnerships
CREATE TABLE public.promoter_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    venue_city TEXT,
    venue_capacity INTEGER,
    venue_type TEXT, -- 'comedy_club', 'theater', 'bar', 'restaurant', 'outdoor', 'private'
    partnership_type TEXT DEFAULT 'regular', -- 'exclusive', 'preferred', 'regular', 'occasional'
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    booking_terms JSONB DEFAULT '{}', -- Contract terms, revenue split, etc.
    technical_specs JSONB DEFAULT '{}', -- Sound, lighting, stage specs
    amenities TEXT[], -- 'parking', 'bar', 'food', 'accessibility', 'green_room'
    is_active BOOLEAN DEFAULT TRUE,
    last_event_date TIMESTAMPTZ,
    total_events_hosted INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promoter team members table
CREATE TABLE public.promoter_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- If they're also a platform user
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'co_promoter', 'assistant', 'marketing', 'technical', 'venue_coordinator'
    email TEXT,
    phone TEXT,
    permissions TEXT[] DEFAULT '{}', -- 'book_comedians', 'manage_events', 'handle_payments', 'venue_coordination'
    is_primary_contact BOOLEAN DEFAULT FALSE,
    bio TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promoter reviews/testimonials table
CREATE TABLE public.promoter_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Comedian who left review
    reviewer_name TEXT NOT NULL, -- In case reviewer_id is null
    reviewer_type TEXT DEFAULT 'comedian', -- 'comedian', 'venue', 'audience_member', 'vendor'
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title TEXT,
    review_text TEXT NOT NULL,
    review_categories JSONB DEFAULT '{}', -- Ratings for communication, professionalism, payment, etc.
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified that they actually worked with this promoter
    response_text TEXT, -- Promoter's response to the review
    response_date TIMESTAMPTZ,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promoter portfolio/media table
CREATE TABLE public.promoter_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_type TEXT NOT NULL, -- 'photo', 'video', 'audio', 'document'
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER, -- in bytes
    duration_seconds INTEGER, -- for video/audio
    media_category TEXT, -- 'event_photos', 'venue_photos', 'promotional_material', 'testimonials'
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    upload_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promoter achievements/milestones table
CREATE TABLE public.promoter_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL, -- 'milestone', 'award', 'certification', 'partnership'
    title TEXT NOT NULL,
    description TEXT,
    date_achieved DATE,
    issuing_organization TEXT,
    verification_url TEXT,
    icon_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create promoter booking preferences table
CREATE TABLE public.promoter_booking_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    preferred_comedian_experience TEXT[], -- 'new', 'intermediate', 'experienced', 'headliner'
    preferred_comedy_styles TEXT[], -- 'observational', 'storytelling', 'political', 'clean', 'adult'
    booking_lead_time_days INTEGER DEFAULT 14, -- Minimum lead time for bookings
    payment_terms TEXT DEFAULT 'net_30', -- 'immediate', 'net_7', 'net_30', 'on_performance'
    cancellation_policy TEXT,
    technical_requirements JSONB DEFAULT '{}',
    special_requirements TEXT,
    budget_range JSONB DEFAULT '{}', -- min/max budget per comedian
    availability_schedule JSONB DEFAULT '{}', -- Days/times available for events
    auto_approve_criteria JSONB DEFAULT '{}', -- Criteria for auto-approving comedian applications
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(promoter_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.promoter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_booking_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promoter_stats
CREATE POLICY "Public can view promoter stats" ON public.promoter_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Promoters can update own stats" ON public.promoter_stats FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);
CREATE POLICY "System can insert/update promoter stats" ON public.promoter_stats FOR ALL 
WITH CHECK (true);

-- RLS Policies for promoter_social_links
CREATE POLICY "Public can view social links" ON public.promoter_social_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Promoters can manage own social links" ON public.promoter_social_links FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);

-- RLS Policies for promoter_venues
CREATE POLICY "Public can view active venues" ON public.promoter_venues FOR SELECT TO authenticated 
USING (is_active = true);
CREATE POLICY "Promoters can manage own venues" ON public.promoter_venues FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);

-- RLS Policies for promoter_team_members
CREATE POLICY "Public can view active team members" ON public.promoter_team_members FOR SELECT TO authenticated 
USING (is_active = true);
CREATE POLICY "Promoters can manage own team" ON public.promoter_team_members FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);
CREATE POLICY "Team members can view their own record" ON public.promoter_team_members FOR SELECT TO authenticated 
USING (member_user_id = auth.uid());

-- RLS Policies for promoter_reviews
CREATE POLICY "Public can view verified reviews" ON public.promoter_reviews FOR SELECT TO authenticated 
USING (is_verified = true);
CREATE POLICY "Users can create reviews" ON public.promoter_reviews FOR INSERT TO authenticated 
WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Reviewers can update own reviews" ON public.promoter_reviews FOR UPDATE TO authenticated 
USING (reviewer_id = auth.uid());
CREATE POLICY "Promoters can respond to reviews" ON public.promoter_reviews FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);

-- RLS Policies for promoter_media
CREATE POLICY "Public can view public media" ON public.promoter_media FOR SELECT TO authenticated 
USING (is_public = true);
CREATE POLICY "Promoters can manage own media" ON public.promoter_media FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);

-- RLS Policies for promoter_achievements
CREATE POLICY "Public can view achievements" ON public.promoter_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Promoters can manage own achievements" ON public.promoter_achievements FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);

-- RLS Policies for promoter_booking_preferences
CREATE POLICY "Public can view booking preferences" ON public.promoter_booking_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Promoters can manage own booking preferences" ON public.promoter_booking_preferences FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = promoter_id AND p.id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_promoter_stats_promoter_id ON public.promoter_stats(promoter_id);
CREATE INDEX idx_promoter_social_links_promoter_id ON public.promoter_social_links(promoter_id);
CREATE INDEX idx_promoter_social_links_platform ON public.promoter_social_links(platform);
CREATE INDEX idx_promoter_venues_promoter_id ON public.promoter_venues(promoter_id);
CREATE INDEX idx_promoter_venues_city ON public.promoter_venues(venue_city);
CREATE INDEX idx_promoter_venues_type ON public.promoter_venues(venue_type);
CREATE INDEX idx_promoter_venues_active ON public.promoter_venues(is_active) WHERE is_active = true;
CREATE INDEX idx_promoter_team_members_promoter_id ON public.promoter_team_members(promoter_id);
CREATE INDEX idx_promoter_team_members_active ON public.promoter_team_members(is_active) WHERE is_active = true;
CREATE INDEX idx_promoter_reviews_promoter_id ON public.promoter_reviews(promoter_id);
CREATE INDEX idx_promoter_reviews_rating ON public.promoter_reviews(rating);
CREATE INDEX idx_promoter_reviews_verified ON public.promoter_reviews(is_verified) WHERE is_verified = true;
CREATE INDEX idx_promoter_media_promoter_id ON public.promoter_media(promoter_id);
CREATE INDEX idx_promoter_media_type ON public.promoter_media(media_type);
CREATE INDEX idx_promoter_media_category ON public.promoter_media(media_category);
CREATE INDEX idx_promoter_media_public ON public.promoter_media(is_public) WHERE is_public = true;
CREATE INDEX idx_promoter_achievements_promoter_id ON public.promoter_achievements(promoter_id);
CREATE INDEX idx_promoter_booking_preferences_promoter_id ON public.promoter_booking_preferences(promoter_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_promoter_stats_updated_at 
    BEFORE UPDATE ON public.promoter_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_social_links_updated_at 
    BEFORE UPDATE ON public.promoter_social_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_venues_updated_at 
    BEFORE UPDATE ON public.promoter_venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_team_members_updated_at 
    BEFORE UPDATE ON public.promoter_team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_reviews_updated_at 
    BEFORE UPDATE ON public.promoter_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_media_updated_at 
    BEFORE UPDATE ON public.promoter_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_booking_preferences_updated_at 
    BEFORE UPDATE ON public.promoter_booking_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create promoter stats record
CREATE OR REPLACE FUNCTION create_promoter_stats_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create stats if user has promoter role
    IF EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = NEW.id AND ur.role = 'promoter'
    ) THEN
        INSERT INTO public.promoter_stats (promoter_id)
        VALUES (NEW.id)
        ON CONFLICT (promoter_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create promoter stats when user gets promoter role
CREATE OR REPLACE FUNCTION handle_promoter_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'promoter' THEN
        INSERT INTO public.promoter_stats (promoter_id)
        VALUES (NEW.user_id)
        ON CONFLICT (promoter_id) DO NOTHING;
        
        INSERT INTO public.promoter_booking_preferences (promoter_id)
        VALUES (NEW.user_id)
        ON CONFLICT (promoter_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER promoter_role_assignment_trigger 
    AFTER INSERT ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION handle_promoter_role_assignment();

-- Function to update promoter stats when events are created/updated
CREATE OR REPLACE FUNCTION update_promoter_stats_on_event_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for the promoter
    WITH event_stats AS (
        SELECT 
            e.promoter_id,
            COUNT(*) as total_events,
            COUNT(DISTINCT a.comedian_id) as unique_comedians,
            AVG(CASE WHEN e.status = 'completed' THEN 4.0 ELSE NULL END) as avg_rating,
            COUNT(*) FILTER (WHERE e.status = 'completed') as completed_events,
            COUNT(*) FILTER (WHERE e.status = 'cancelled') as cancelled_events
        FROM public.events e
        LEFT JOIN public.applications a ON e.id = a.event_id AND a.status = 'accepted'
        WHERE e.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
        GROUP BY e.promoter_id
    )
    UPDATE public.promoter_stats ps
    SET 
        total_events_hosted = COALESCE(es.total_events, 0),
        total_comedians_booked = COALESCE(es.unique_comedians, 0),
        average_event_rating = COALESCE(es.avg_rating, 0),
        success_rate = CASE 
            WHEN es.total_events > 0 
            THEN ((es.completed_events::decimal / es.total_events) * 100)
            ELSE 100 
        END,
        cancellation_rate = CASE 
            WHEN es.total_events > 0 
            THEN ((es.cancelled_events::decimal / es.total_events) * 100)
            ELSE 0 
        END,
        last_calculated = now(),
        updated_at = now()
    FROM event_stats es
    WHERE ps.promoter_id = es.promoter_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promoter_stats_on_event_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_promoter_stats_on_event_change();

-- Function to get promoter profile with all related data
CREATE OR REPLACE FUNCTION get_promoter_profile(_promoter_id UUID)
RETURNS TABLE(
    profile_data JSONB,
    stats_data JSONB,
    venues_data JSONB,
    team_data JSONB,
    reviews_data JSONB,
    media_data JSONB,
    achievements_data JSONB,
    social_links_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(p.*) as profile_data,
        to_jsonb(ps.*) as stats_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pv.*)) 
             FROM public.promoter_venues pv 
             WHERE pv.promoter_id = _promoter_id AND pv.is_active = true),
            '[]'::jsonb
        ) as venues_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(ptm.*)) 
             FROM public.promoter_team_members ptm 
             WHERE ptm.promoter_id = _promoter_id AND ptm.is_active = true),
            '[]'::jsonb
        ) as team_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pr.*)) 
             FROM public.promoter_reviews pr 
             WHERE pr.promoter_id = _promoter_id AND pr.is_verified = true
             ORDER BY pr.created_at DESC LIMIT 20),
            '[]'::jsonb
        ) as reviews_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pm.*)) 
             FROM public.promoter_media pm 
             WHERE pm.promoter_id = _promoter_id AND pm.is_public = true
             ORDER BY pm.is_featured DESC, pm.created_at DESC),
            '[]'::jsonb
        ) as media_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pa.*)) 
             FROM public.promoter_achievements pa 
             WHERE pa.promoter_id = _promoter_id
             ORDER BY pa.is_featured DESC, pa.date_achieved DESC),
            '[]'::jsonb
        ) as achievements_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(psl.*)) 
             FROM public.promoter_social_links psl 
             WHERE psl.promoter_id = _promoter_id
             ORDER BY psl.primary_platform DESC, psl.follower_count DESC),
            '[]'::jsonb
        ) as social_links_data
    FROM public.profiles p
    LEFT JOIN public.promoter_stats ps ON p.id = ps.promoter_id
    WHERE p.id = _promoter_id;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT ALL ON public.promoter_stats TO authenticated;
GRANT ALL ON public.promoter_social_links TO authenticated;
GRANT ALL ON public.promoter_venues TO authenticated;
GRANT ALL ON public.promoter_team_members TO authenticated;
GRANT ALL ON public.promoter_reviews TO authenticated;
GRANT ALL ON public.promoter_media TO authenticated;
GRANT ALL ON public.promoter_achievements TO authenticated;
GRANT ALL ON public.promoter_booking_preferences TO authenticated;

-- Insert some sample data for existing promoters
INSERT INTO public.promoter_stats (promoter_id)
SELECT p.id
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'promoter'
ON CONFLICT (promoter_id) DO NOTHING;

INSERT INTO public.promoter_booking_preferences (promoter_id)
SELECT p.id
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'promoter'
ON CONFLICT (promoter_id) DO NOTHING;