-- Add url_slug_last_changed column to comedians table
-- This tracks when the URL slug was last modified to enforce 30-day change cooldown

-- Add the column (nullable initially)
ALTER TABLE comedians
ADD COLUMN IF NOT EXISTS url_slug_last_changed TIMESTAMPTZ;

-- Backfill existing records with their created_at timestamp
-- This ensures existing users can change their slug (since it's been at least some time since creation)
UPDATE comedians
SET url_slug_last_changed = created_at
WHERE url_slug_last_changed IS NULL;

-- Add index for performance when querying by user_id
CREATE INDEX IF NOT EXISTS idx_comedians_url_slug_last_changed
ON comedians(url_slug_last_changed);

-- Add comment for documentation
COMMENT ON COLUMN comedians.url_slug_last_changed IS
'Timestamp of the last URL slug change. Used to enforce 30-day cooldown between changes.';
