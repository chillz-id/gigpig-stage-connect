-- Content Scout: comedian_content_library
-- Tracks discovered and downloaded content (reels, images) for comedians.
-- Used by the /content-scout skill and N8N Content Scout Monitor workflow.

CREATE TABLE IF NOT EXISTS comedian_content_library (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comedian_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_platform   text NOT NULL,          -- 'instagram' | 'tiktok'
  source_url        text NOT NULL UNIQUE,   -- original reel/post URL (dedup key)
  content_type      text NOT NULL,          -- 'reel' | 'image' | 'headshot'
  published_at      timestamptz,            -- when originally posted on platform
  view_count        bigint,
  like_count        bigint,
  thumbnail_url     text,
  duration_seconds  integer,
  width             integer,
  height            integer,
  status            text NOT NULL DEFAULT 'discovered',
                    -- 'discovered' | 'downloading' | 'available' | 'failed' | 'archived'
  drive_file_id     text,                   -- Google Drive file ID once downloaded
  asset_id          uuid REFERENCES social_media_assets(id) ON DELETE SET NULL,
  event_id          uuid REFERENCES events(id) ON DELETE SET NULL,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_ccl_comedian ON comedian_content_library(comedian_id);
CREATE INDEX idx_ccl_status ON comedian_content_library(status);
CREATE INDEX idx_ccl_platform ON comedian_content_library(source_platform);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ccl_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ccl_updated_at
  BEFORE UPDATE ON comedian_content_library
  FOR EACH ROW EXECUTE FUNCTION update_ccl_updated_at();

-- Threshold check RPC: returns content counts and whether a comedian needs more
CREATE OR REPLACE FUNCTION check_comedian_content_needs(p_comedian_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'comedian_id', p_comedian_id,
    'reels', (SELECT count(*) FROM comedian_content_library
              WHERE comedian_id = p_comedian_id
              AND content_type = 'reel' AND status = 'available'),
    'images', (SELECT count(*) FROM comedian_content_library
               WHERE comedian_id = p_comedian_id
               AND content_type IN ('image', 'headshot') AND status = 'available'),
    'needs_reels', (SELECT count(*) < 3 FROM comedian_content_library
                    WHERE comedian_id = p_comedian_id
                    AND content_type = 'reel' AND status = 'available'),
    'needs_images', (SELECT count(*) < 2 FROM comedian_content_library
                     WHERE comedian_id = p_comedian_id
                     AND content_type IN ('image', 'headshot') AND status = 'available')
  );
$$;

-- RLS: Allow authenticated users to read, service_role for writes
ALTER TABLE comedian_content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content library"
  ON comedian_content_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage content library"
  ON comedian_content_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
