-- Atomic increment for social_media_assets.used_count
-- Avoids select-then-update race conditions when multiple drafts
-- reference the same asset in a single schedule generation run.

CREATE OR REPLACE FUNCTION increment_asset_used_count(asset_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE social_media_assets
  SET used_count = COALESCE(used_count, 0) + 1,
      last_used_at = now(),
      status = 'scheduled'
  WHERE id = asset_id;
$$;

-- Add unique constraint on drive_file_id for upsert support
-- (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'social_media_assets_drive_file_id_key'
  ) THEN
    ALTER TABLE social_media_assets
    ADD CONSTRAINT social_media_assets_drive_file_id_key UNIQUE (drive_file_id);
  END IF;
END $$;
