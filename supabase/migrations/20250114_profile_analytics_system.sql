-- Create profile_views table for tracking profile visits
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_engagement table for tracking detailed engagement
CREATE TABLE IF NOT EXISTS profile_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'media_view', 'link_click', 'booking_request', 'share', etc.
    action_details JSONB DEFAULT '{}',
    time_spent_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_analytics_daily table for aggregated daily stats
CREATE TABLE IF NOT EXISTS profile_analytics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    authenticated_views INTEGER DEFAULT 0,
    anonymous_views INTEGER DEFAULT 0,
    booking_requests INTEGER DEFAULT 0,
    media_interactions INTEGER DEFAULT 0,
    link_clicks INTEGER DEFAULT 0,
    avg_time_spent_seconds INTEGER DEFAULT 0,
    top_referrers JSONB DEFAULT '[]',
    top_countries JSONB DEFAULT '[]',
    device_breakdown JSONB DEFAULT '{}',
    browser_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX idx_profile_views_created_at ON profile_views(created_at);
CREATE INDEX idx_profile_views_session ON profile_views(session_id);
CREATE INDEX idx_profile_engagement_profile_id ON profile_engagement(profile_id);
CREATE INDEX idx_profile_engagement_action_type ON profile_engagement(action_type);
CREATE INDEX idx_profile_engagement_created_at ON profile_engagement(created_at);
CREATE INDEX idx_profile_analytics_daily_profile_date ON profile_analytics_daily(profile_id, date);

-- Create function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_profile_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Loop through all profiles with views on the target date
    FOR profile_record IN 
        SELECT DISTINCT profile_id 
        FROM profile_views 
        WHERE DATE(created_at) = target_date
    LOOP
        INSERT INTO profile_analytics_daily (
            profile_id,
            date,
            total_views,
            unique_visitors,
            authenticated_views,
            anonymous_views,
            booking_requests,
            media_interactions,
            link_clicks,
            avg_time_spent_seconds,
            top_referrers,
            top_countries,
            device_breakdown,
            browser_breakdown
        )
        SELECT
            profile_record.profile_id,
            target_date,
            COUNT(*) as total_views,
            COUNT(DISTINCT COALESCE(viewer_id::text, ip_address::text)) as unique_visitors,
            COUNT(CASE WHEN viewer_id IS NOT NULL THEN 1 END) as authenticated_views,
            COUNT(CASE WHEN viewer_id IS NULL THEN 1 END) as anonymous_views,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM profile_engagement 
                 WHERE profile_id = profile_record.profile_id 
                 AND DATE(created_at) = target_date 
                 AND action_type = 'booking_request'), 
                0
            ) as booking_requests,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM profile_engagement 
                 WHERE profile_id = profile_record.profile_id 
                 AND DATE(created_at) = target_date 
                 AND action_type = 'media_view'), 
                0
            ) as media_interactions,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM profile_engagement 
                 WHERE profile_id = profile_record.profile_id 
                 AND DATE(created_at) = target_date 
                 AND action_type = 'link_click'), 
                0
            ) as link_clicks,
            COALESCE(
                (SELECT AVG(time_spent_seconds)::INTEGER 
                 FROM profile_engagement 
                 WHERE profile_id = profile_record.profile_id 
                 AND DATE(created_at) = target_date 
                 AND time_spent_seconds IS NOT NULL), 
                0
            ) as avg_time_spent_seconds,
            COALESCE(
                (SELECT jsonb_agg(referrer_data ORDER BY count DESC) 
                 FROM (
                     SELECT jsonb_build_object('referrer', referrer, 'count', COUNT(*)) as referrer_data, COUNT(*) as count
                     FROM profile_views 
                     WHERE profile_id = profile_record.profile_id 
                     AND DATE(created_at) = target_date 
                     AND referrer IS NOT NULL
                     GROUP BY referrer 
                     ORDER BY COUNT(*) DESC 
                     LIMIT 10
                 ) t), 
                '[]'::jsonb
            ) as top_referrers,
            COALESCE(
                (SELECT jsonb_agg(country_data ORDER BY count DESC) 
                 FROM (
                     SELECT jsonb_build_object('country', country, 'count', COUNT(*)) as country_data, COUNT(*) as count
                     FROM profile_views 
                     WHERE profile_id = profile_record.profile_id 
                     AND DATE(created_at) = target_date 
                     AND country IS NOT NULL
                     GROUP BY country 
                     ORDER BY COUNT(*) DESC 
                     LIMIT 10
                 ) t), 
                '[]'::jsonb
            ) as top_countries,
            COALESCE(
                (SELECT jsonb_object_agg(device_type, count) 
                 FROM (
                     SELECT device_type, COUNT(*) as count
                     FROM profile_views 
                     WHERE profile_id = profile_record.profile_id 
                     AND DATE(created_at) = target_date 
                     AND device_type IS NOT NULL
                     GROUP BY device_type
                 ) t), 
                '{}'::jsonb
            ) as device_breakdown,
            COALESCE(
                (SELECT jsonb_object_agg(browser, count) 
                 FROM (
                     SELECT browser, COUNT(*) as count
                     FROM profile_views 
                     WHERE profile_id = profile_record.profile_id 
                     AND DATE(created_at) = target_date 
                     AND browser IS NOT NULL
                     GROUP BY browser
                 ) t), 
                '{}'::jsonb
            ) as browser_breakdown
        FROM profile_views
        WHERE profile_id = profile_record.profile_id AND DATE(created_at) = target_date
        GROUP BY profile_id
        ON CONFLICT (profile_id, date) 
        DO UPDATE SET
            total_views = EXCLUDED.total_views,
            unique_visitors = EXCLUDED.unique_visitors,
            authenticated_views = EXCLUDED.authenticated_views,
            anonymous_views = EXCLUDED.anonymous_views,
            booking_requests = EXCLUDED.booking_requests,
            media_interactions = EXCLUDED.media_interactions,
            link_clicks = EXCLUDED.link_clicks,
            avg_time_spent_seconds = EXCLUDED.avg_time_spent_seconds,
            top_referrers = EXCLUDED.top_referrers,
            top_countries = EXCLUDED.top_countries,
            device_breakdown = EXCLUDED.device_breakdown,
            browser_breakdown = EXCLUDED.browser_breakdown,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Profile owners can view their own analytics
CREATE POLICY "Profile owners can view their analytics"
    ON profile_views FOR SELECT
    USING (profile_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Profile owners can view their engagement"
    ON profile_engagement FOR SELECT
    USING (profile_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Profile owners can view their daily analytics"
    ON profile_analytics_daily FOR SELECT
    USING (profile_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

-- Allow insert for tracking (handled by edge function for security)
CREATE POLICY "Allow analytics tracking"
    ON profile_views FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow engagement tracking"
    ON profile_engagement FOR INSERT
    WITH CHECK (true);

-- Create function to clean up old analytics data (retain 90 days of raw data)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    -- Delete raw views older than 90 days
    DELETE FROM profile_views WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM profile_engagement WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Keep aggregated daily data for 1 year
    DELETE FROM profile_analytics_daily WHERE date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;