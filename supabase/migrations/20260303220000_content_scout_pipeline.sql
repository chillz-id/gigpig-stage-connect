-- Content Scout Pipeline — Add columns for automated comedian content → Metricool drafts
--
-- Adds:
--   comedian_content_library.last_posted_at — when content was last posted by @idcomedyclub
--   comedian_content_library.post_count — how many times this content has been posted
--   social_content_drafts.comedian_id — which comedian a spotlight draft is for
--   check_content_recently_posted() — RPC to check if a URL was posted in last N days

-- Track when content was last posted by @idcomedyclub
ALTER TABLE comedian_content_library
  ADD COLUMN IF NOT EXISTS last_posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS post_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ccl_last_posted
  ON comedian_content_library(last_posted_at) WHERE last_posted_at IS NOT NULL;

-- Track which comedian a spotlight draft is for
ALTER TABLE social_content_drafts
  ADD COLUMN IF NOT EXISTS comedian_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scd_comedian
  ON social_content_drafts(comedian_id) WHERE comedian_id IS NOT NULL;

-- RPC: Check if content was posted in last N days
CREATE OR REPLACE FUNCTION check_content_recently_posted(
  p_source_url text,
  p_lookback_days integer DEFAULT 90
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM comedian_content_library
    WHERE source_url = p_source_url
      AND last_posted_at > (now() - (p_lookback_days || ' days')::interval)
  );
$$;
