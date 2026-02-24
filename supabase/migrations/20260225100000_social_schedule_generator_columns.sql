-- Social Schedule Generator — Schema Additions
-- Adds event_id + window_label to drafts for deduplication,
-- and event_id to media assets for event-folder linking.

-- ─── Drafts: Add event linkage and window label ────────────────────────────────
ALTER TABLE social_content_drafts
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS window_label text;

CREATE INDEX IF NOT EXISTS idx_scd_event ON social_content_drafts(event_id);
CREATE INDEX IF NOT EXISTS idx_scd_event_window ON social_content_drafts(event_id, window_label);

COMMENT ON COLUMN social_content_drafts.event_id IS 'Links draft to a specific event for dedup';
COMMENT ON COLUMN social_content_drafts.window_label IS 'Posting window label (e.g. Initial Announcement) for dedup';

-- ─── Media Assets: Add event linkage ───────────────────────────────────────────
-- social_media_assets may not have event_id yet — add it if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_media_assets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'social_media_assets' AND column_name = 'event_id'
    ) THEN
      ALTER TABLE social_media_assets ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE SET NULL;
      CREATE INDEX idx_sma_event ON social_media_assets(event_id);
      COMMENT ON COLUMN social_media_assets.event_id IS 'Links Drive media to specific event (from event folder name)';
    END IF;
  END IF;
END $$;
