-- Social Media Scheduling System
-- Hybrid Postiz Integration - Custom UI with NodeJS SDK
-- Author: Claude Code
-- Date: 2025-10-20

-- =============================================
-- 1. SOCIAL CHANNELS TABLE
-- =============================================
-- Tracks connected social media platforms (Instagram, Twitter, etc.)

CREATE TABLE IF NOT EXISTS social_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN (
    'instagram',
    'twitter',
    'facebook',
    'linkedin',
    'tiktok',
    'youtube',
    'threads',
    'bluesky',
    'pinterest',
    'reddit'
  )),
  channel_name TEXT NOT NULL,
  channel_handle TEXT, -- @username or handle
  postiz_integration_id TEXT NOT NULL UNIQUE, -- Postiz's channel/integration ID
  is_active BOOLEAN DEFAULT true,
  oauth_data JSONB, -- Encrypted OAuth tokens and metadata
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate active channels per user
  UNIQUE(user_id, platform, channel_handle)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_channels_user_id ON social_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_social_channels_platform ON social_channels(platform);
CREATE INDEX IF NOT EXISTS idx_social_channels_is_active ON social_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_social_channels_postiz_id ON social_channels(postiz_integration_id);

-- =============================================
-- 2. SOCIAL POSTS TABLE
-- =============================================
-- Tracks scheduled and posted social media content

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES social_channels(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  media_urls TEXT[], -- URLs from media library or external
  media_file_ids UUID[], -- References to media_files.id
  hashtags TEXT[],

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,

  -- Postiz Integration
  postiz_post_id TEXT UNIQUE, -- Postiz's post ID

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',      -- Saved but not scheduled
    'scheduled',  -- Scheduled via Postiz
    'posting',    -- Currently being posted
    'posted',     -- Successfully posted
    'failed',     -- Failed to post
    'cancelled'   -- User cancelled
  )),

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Link to event if auto-generated
  is_auto_generated BOOLEAN DEFAULT false, -- Created by automation

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_channel_id ON social_posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_event_id ON social_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_postiz_id ON social_posts(postiz_post_id);

-- =============================================
-- 3. POST TEMPLATES TABLE
-- =============================================
-- Reusable templates for common post types

CREATE TABLE IF NOT EXISTS social_post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Template Content
  content_template TEXT NOT NULL, -- Can include {{variables}}
  default_hashtags TEXT[],
  suggested_platforms TEXT[], -- Which platforms this works best on

  -- Template Type
  template_type TEXT CHECK (template_type IN (
    'event_announcement',
    'lineup_reveal',
    'ticket_reminder',
    'gig_promo',
    'custom'
  )),

  is_default BOOLEAN DEFAULT false, -- System-provided templates
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_post_templates_user_id ON social_post_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_post_templates_type ON social_post_templates(template_type);

-- =============================================
-- 4. ANALYTICS TABLE
-- =============================================
-- Track post performance metrics

CREATE TABLE IF NOT EXISTS social_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,

  -- Engagement Metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Platform-Specific
  platform_metrics JSONB, -- Platform-specific metrics (e.g., retweets for Twitter)

  -- Tracking
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(post_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON social_post_analytics(post_id);

-- =============================================
-- 5. UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS social_channels_updated_at_trigger ON social_channels;
DROP TRIGGER IF EXISTS social_posts_updated_at_trigger ON social_posts;
DROP TRIGGER IF EXISTS social_post_templates_updated_at_trigger ON social_post_templates;

CREATE TRIGGER social_channels_updated_at_trigger
  BEFORE UPDATE ON social_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER social_posts_updated_at_trigger
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER social_post_templates_updated_at_trigger
  BEFORE UPDATE ON social_post_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

-- =============================================
-- 6. RLS POLICIES
-- =============================================

ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_analytics ENABLE ROW LEVEL SECURITY;

-- Social Channels Policies
CREATE POLICY "Users can view their own channels"
  ON social_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channels"
  ON social_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON social_channels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
  ON social_channels FOR DELETE
  USING (auth.uid() = user_id);

-- Social Posts Policies
CREATE POLICY "Users can view their own posts"
  ON social_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
  ON social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON social_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Templates Policies
CREATE POLICY "Users can view their own templates"
  ON social_post_templates FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create their own templates"
  ON social_post_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON social_post_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON social_post_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Analytics Policies (read-only for users)
CREATE POLICY "Users can view analytics for their posts"
  ON social_post_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_post_analytics.post_id
      AND social_posts.user_id = auth.uid()
    )
  );

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Get user's active channels
CREATE OR REPLACE FUNCTION get_user_active_channels(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  platform TEXT,
  channel_name TEXT,
  channel_handle TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.platform,
    sc.channel_name,
    sc.channel_handle,
    sc.is_active
  FROM social_channels sc
  WHERE sc.user_id = p_user_id
  AND sc.is_active = true
  ORDER BY sc.platform, sc.channel_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming scheduled posts
CREATE OR REPLACE FUNCTION get_upcoming_posts(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  content TEXT,
  scheduled_at TIMESTAMPTZ,
  platform TEXT,
  channel_name TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.content,
    sp.scheduled_at,
    sc.platform,
    sc.channel_name,
    sp.status
  FROM social_posts sp
  JOIN social_channels sc ON sc.id = sp.channel_id
  WHERE sp.user_id = p_user_id
  AND sp.status IN ('draft', 'scheduled')
  AND sp.scheduled_at > NOW()
  ORDER BY sp.scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get post analytics summary for user
CREATE OR REPLACE FUNCTION get_user_social_analytics(p_user_id UUID)
RETURNS TABLE (
  total_posts BIGINT,
  total_views BIGINT,
  total_likes BIGINT,
  total_comments BIGINT,
  total_shares BIGINT,
  avg_engagement NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(sp.id) as total_posts,
    COALESCE(SUM(spa.views), 0) as total_views,
    COALESCE(SUM(spa.likes), 0) as total_likes,
    COALESCE(SUM(spa.comments), 0) as total_comments,
    COALESCE(SUM(spa.shares), 0) as total_shares,
    CASE
      WHEN COUNT(sp.id) > 0 THEN
        ROUND(
          (COALESCE(SUM(spa.likes), 0) + COALESCE(SUM(spa.comments), 0) + COALESCE(SUM(spa.shares), 0))::NUMERIC /
          COUNT(sp.id)::NUMERIC,
          2
        )
      ELSE 0
    END as avg_engagement
  FROM social_posts sp
  LEFT JOIN social_post_analytics spa ON spa.post_id = sp.id
  WHERE sp.user_id = p_user_id
  AND sp.status = 'posted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. DEFAULT TEMPLATES (Auto-created for new users)
-- =============================================

-- Function to create default templates for a user
CREATE OR REPLACE FUNCTION create_default_social_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Event Announcement Template
  INSERT INTO social_post_templates (user_id, name, description, content_template, default_hashtags, suggested_platforms, template_type, is_default)
  VALUES (
    NEW.id,
    'Event Announcement',
    'Announce an upcoming comedy show',
    '🎤 {{event_name}} 🎤

📅 {{event_date}}
📍 {{venue_name}}
🎟️ Tickets: {{ticket_link}}

{{lineup_preview}}

See you there! 😂',
    ARRAY['comedy', 'standup', 'livecomedy', 'sydney'],
    ARRAY['instagram', 'facebook', 'twitter', 'threads'],
    'event_announcement',
    true
  )
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Lineup Reveal Template
  INSERT INTO social_post_templates (user_id, name, description, content_template, default_hashtags, suggested_platforms, template_type, is_default)
  VALUES (
    NEW.id,
    'Lineup Reveal',
    'Reveal the comedy lineup for an event',
    '✨ LINEUP REVEAL ✨

Tonight''s amazing comedians:
{{lineup_list}}

Don''t miss out! 🎭
{{ticket_link}}',
    ARRAY['comedy', 'standup', 'comedians'],
    ARRAY['instagram', 'twitter', 'threads'],
    'lineup_reveal',
    true
  )
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Ticket Reminder Template
  INSERT INTO social_post_templates (user_id, name, description, content_template, default_hashtags, suggested_platforms, template_type, is_default)
  VALUES (
    NEW.id,
    'Ticket Reminder',
    'Remind followers about show tickets',
    '⏰ LAST CHANCE! ⏰

Tickets selling fast for {{event_name}}

📅 {{event_date}}
🎟️ Get yours: {{ticket_link}}

#DontMissOut',
    ARRAY['comedy', 'tickets', 'liveshow'],
    ARRAY['instagram', 'facebook', 'twitter'],
    'ticket_reminder',
    true
  )
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create templates when a user signs up
DROP TRIGGER IF EXISTS create_social_templates_trigger ON auth.users;

CREATE TRIGGER create_social_templates_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_social_templates();

-- =============================================
-- 9. COMMENTS
-- =============================================

COMMENT ON TABLE social_channels IS 'Connected social media platforms for users';
COMMENT ON TABLE social_posts IS 'Scheduled and posted social media content';
COMMENT ON TABLE social_post_templates IS 'Reusable post templates with variable substitution';
COMMENT ON TABLE social_post_analytics IS 'Engagement metrics for posted content';

COMMENT ON COLUMN social_channels.postiz_integration_id IS 'Postiz API integration/channel ID';
COMMENT ON COLUMN social_posts.postiz_post_id IS 'Postiz API post ID for status tracking';
COMMENT ON COLUMN social_posts.is_auto_generated IS 'Created by automation (lineup confirmation, etc.)';
COMMENT ON COLUMN social_post_templates.content_template IS 'Template with {{variable}} placeholders';
