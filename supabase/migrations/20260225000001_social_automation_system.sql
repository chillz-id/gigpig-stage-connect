-- Social Media Automation System
-- Adds content queue, AI-generated drafts, performance tracking, and automation rules.

-- ─── Content Queue ──────────────────────────────────────────────────────────────
-- Events/triggers that need social content generated.
CREATE TABLE social_content_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organization_profiles(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,               -- 'event_created', 'lineup_changed', 'ticket_milestone', 'manual'
  trigger_entity_id uuid,                   -- FK to events.id, or null for manual
  trigger_data jsonb DEFAULT '{}',          -- Snapshot of event/lineup data at trigger time
  status text DEFAULT 'pending'             -- 'pending', 'generating', 'review', 'completed', 'failed'
    CHECK (status IN ('pending', 'generating', 'review', 'completed', 'failed')),
  priority int DEFAULT 5                    -- 1=urgent, 10=low
    CHECK (priority BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

-- ─── Content Drafts ─────────────────────────────────────────────────────────────
-- AI-generated content awaiting human review.
CREATE TABLE social_content_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id uuid REFERENCES social_content_queue(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organization_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,                   -- 'instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'linkedin', 'threads', 'bluesky'
  post_type text NOT NULL DEFAULT 'post',   -- 'post', 'reel', 'story', 'short', 'thread'
    CHECK (post_type IN ('post', 'reel', 'story', 'short', 'thread')),
  caption text NOT NULL,
  media_urls text[],                        -- Selected media from library
  media_file_ids uuid[],                    -- References to media_files.id
  media_type text,                          -- 'image', 'video', 'carousel'
  hashtags text[],
  scheduled_for timestamptz,                -- Proposed publish time (from best-times)
  metricool_post_id int,                    -- After scheduling on Metricool
  status text DEFAULT 'draft'               -- 'draft', 'approved', 'rejected', 'scheduled', 'published', 'failed'
    CHECK (status IN ('draft', 'approved', 'rejected', 'scheduled', 'published', 'failed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  ai_model text,                            -- Which AI model generated this
  ai_prompt_used text,                      -- For reproducibility
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── Content Performance ────────────────────────────────────────────────────────
-- Analytics pulled from Metricool for optimization feedback loop.
CREATE TABLE social_content_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id uuid REFERENCES social_content_drafts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  impressions int DEFAULT 0,
  reach int DEFAULT 0,
  engagement int DEFAULT 0,                 -- likes + comments + shares
  likes int DEFAULT 0,
  comments int DEFAULT 0,
  shares int DEFAULT 0,
  clicks int DEFAULT 0,
  saves int DEFAULT 0,
  engagement_rate numeric(7,4),
  collected_at timestamptz DEFAULT now(),
  raw_data jsonb                            -- Full Metricool analytics response
);

-- ─── Automation Rules ───────────────────────────────────────────────────────────
-- Configurable rules for when/how to auto-generate content.
CREATE TABLE social_automation_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organization_profiles(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,               -- 'event_created', 'lineup_changed', 'ticket_milestone'
  platforms text[] NOT NULL,                -- Which platforms to post to
  post_types text[] DEFAULT '{post}',       -- Which post types
  is_active boolean DEFAULT true,
  template_prompt text,                     -- AI prompt template for this trigger type
  scheduling_strategy text DEFAULT 'best_time'
    CHECK (scheduling_strategy IN ('best_time', 'immediate', 'custom')),
  custom_schedule jsonb,                    -- For 'custom' strategy
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX idx_scq_status ON social_content_queue(status);
CREATE INDEX idx_scq_org ON social_content_queue(organization_id);
CREATE INDEX idx_scq_trigger ON social_content_queue(trigger_type);

CREATE INDEX idx_scd_status ON social_content_drafts(status);
CREATE INDEX idx_scd_queue ON social_content_drafts(queue_id);
CREATE INDEX idx_scd_org ON social_content_drafts(organization_id);
CREATE INDEX idx_scd_platform ON social_content_drafts(platform);
CREATE INDEX idx_scd_scheduled ON social_content_drafts(scheduled_for);

CREATE INDEX idx_scp_draft ON social_content_performance(draft_id);

CREATE INDEX idx_sar_org ON social_automation_rules(organization_id);
CREATE INDEX idx_sar_active ON social_automation_rules(is_active) WHERE is_active = true;

-- ─── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE social_content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_automation_rules ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is owner or team member of an organization
-- (owner via organization_profiles.owner_id, member via organization_team_members)
CREATE OR REPLACE FUNCTION user_has_org_access(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_profiles WHERE id = org_id AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM organization_team_members WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$;

-- Queue: org owners and members can manage queue entries
CREATE POLICY "org_members_manage_content_queue"
  ON social_content_queue
  FOR ALL
  USING (user_has_org_access(organization_id))
  WITH CHECK (user_has_org_access(organization_id));

-- Drafts: org owners and members can manage drafts
CREATE POLICY "org_members_manage_content_drafts"
  ON social_content_drafts
  FOR ALL
  USING (user_has_org_access(organization_id))
  WITH CHECK (user_has_org_access(organization_id));

-- Performance: readable by org owners and members
CREATE POLICY "org_members_read_performance"
  ON social_content_performance
  FOR SELECT
  USING (
    draft_id IN (
      SELECT d.id FROM social_content_drafts d
      WHERE user_has_org_access(d.organization_id)
    )
  );

-- Service role can insert performance data (from analytics sync cron)
CREATE POLICY "service_insert_performance"
  ON social_content_performance
  FOR INSERT
  WITH CHECK (true);

-- Automation rules: org owners and members can manage rules
CREATE POLICY "org_members_manage_automation_rules"
  ON social_automation_rules
  FOR ALL
  USING (user_has_org_access(organization_id))
  WITH CHECK (user_has_org_access(organization_id));

-- ─── Updated-at Triggers ────────────────────────────────────────────────────────

CREATE TRIGGER update_social_content_drafts_updated_at
  BEFORE UPDATE ON social_content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_automation_rules_updated_at
  BEFORE UPDATE ON social_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();
