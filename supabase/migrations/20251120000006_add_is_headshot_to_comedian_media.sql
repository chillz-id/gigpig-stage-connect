-- Add is_headshot column to comedian_media table
-- This allows automatic marking of headshot uploads from EPK

ALTER TABLE comedian_media
ADD COLUMN IF NOT EXISTS is_headshot BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN comedian_media.is_headshot IS 'Indicates if this media item is designated as a headshot. Auto-set when uploaded via EPK headshot section.';

-- Add index for efficient querying of headshots
CREATE INDEX IF NOT EXISTS idx_comedian_media_is_headshot
ON comedian_media(user_id, is_headshot)
WHERE is_headshot = TRUE;
