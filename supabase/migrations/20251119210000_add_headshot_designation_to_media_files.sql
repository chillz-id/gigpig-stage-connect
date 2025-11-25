-- Add Headshot Designation & Image Metadata to Media Files
-- Enables marking photos as headshots for automation (Canva integration, etc.)
-- Author: Claude Code
-- Date: 2025-11-19

-- =============================================
-- 1. ADD HEADSHOT DESIGNATION COLUMNS
-- =============================================

ALTER TABLE media_files
ADD COLUMN IF NOT EXISTS is_headshot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_primary_headshot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_width INTEGER,
ADD COLUMN IF NOT EXISTS image_height INTEGER;

-- Add computed aspect ratio for layout decisions
ALTER TABLE media_files
ADD COLUMN IF NOT EXISTS aspect_ratio NUMERIC GENERATED ALWAYS AS (
  CASE
    WHEN image_height > 0
    THEN image_width::NUMERIC / image_height::NUMERIC
    ELSE NULL
  END
) STORED;

-- =============================================
-- 2. ADD INDEXES FOR PERFORMANCE
-- =============================================

-- Fast lookup of all headshots for a user
CREATE INDEX IF NOT EXISTS idx_media_files_user_headshot
ON media_files(user_id, is_headshot)
WHERE is_headshot = true;

-- Fast lookup of primary headshot
CREATE INDEX IF NOT EXISTS idx_media_files_primary_headshot
ON media_files(user_id, is_primary_headshot)
WHERE is_primary_headshot = true;

-- Index for aspect ratio filtering (portrait vs landscape)
CREATE INDEX IF NOT EXISTS idx_media_files_aspect_ratio
ON media_files(aspect_ratio)
WHERE aspect_ratio IS NOT NULL;

-- =============================================
-- 3. UNIQUE CONSTRAINT: ONE PRIMARY HEADSHOT PER USER
-- =============================================

-- Ensure only one primary headshot per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_headshot_per_user
ON media_files(user_id)
WHERE is_primary_headshot = true;

-- =============================================
-- 4. HELPER FUNCTIONS FOR HEADSHOT MANAGEMENT
-- =============================================

-- Get all headshots for a comedian (for automation)
CREATE OR REPLACE FUNCTION get_comedian_headshots(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  public_url TEXT,
  is_primary BOOLEAN,
  image_width INTEGER,
  image_height INTEGER,
  aspect_ratio NUMERIC,
  file_size INTEGER,
  folder_name TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id,
    mf.file_name,
    mf.public_url,
    mf.is_primary_headshot as is_primary,
    mf.image_width,
    mf.image_height,
    mf.aspect_ratio,
    mf.file_size,
    fo.name as folder_name,
    mf.tags,
    mf.created_at,
    mf.updated_at
  FROM media_files mf
  LEFT JOIN media_folders fo ON fo.id = mf.folder_id
  WHERE mf.user_id = p_user_id
    AND mf.is_headshot = true
  ORDER BY mf.is_primary_headshot DESC, mf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get primary headshot for a comedian
CREATE OR REPLACE FUNCTION get_primary_headshot(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  public_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  aspect_ratio NUMERIC,
  file_size INTEGER,
  folder_name TEXT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id,
    mf.file_name,
    mf.public_url,
    mf.image_width,
    mf.image_height,
    mf.aspect_ratio,
    mf.file_size,
    fo.name as folder_name,
    mf.tags
  FROM media_files mf
  LEFT JOIN media_folders fo ON fo.id = mf.folder_id
  WHERE mf.user_id = p_user_id
    AND mf.is_primary_headshot = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk fetch headshots for multiple comedians (event lineup automation)
CREATE OR REPLACE FUNCTION get_headshots_for_comedians(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  comedian_name TEXT,
  id UUID,
  file_name TEXT,
  public_url TEXT,
  is_primary BOOLEAN,
  image_width INTEGER,
  image_height INTEGER,
  aspect_ratio NUMERIC,
  file_size INTEGER,
  folder_name TEXT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.user_id,
    COALESCE(c.stage_name, c.name, p.full_name) as comedian_name,
    mf.id,
    mf.file_name,
    mf.public_url,
    mf.is_primary_headshot as is_primary,
    mf.image_width,
    mf.image_height,
    mf.aspect_ratio,
    mf.file_size,
    fo.name as folder_name,
    mf.tags
  FROM media_files mf
  LEFT JOIN media_folders fo ON fo.id = mf.folder_id
  LEFT JOIN comedians c ON c.user_id = mf.user_id
  LEFT JOIN profiles p ON p.user_id = mf.user_id
  WHERE mf.user_id = ANY(p_user_ids)
    AND mf.is_headshot = true
  ORDER BY mf.user_id, mf.is_primary_headshot DESC, mf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. TRIGGER: AUTO-UNSET PRIMARY WHEN NEW PRIMARY SET
-- =============================================

-- When setting a new primary headshot, automatically unset the old one
CREATE OR REPLACE FUNCTION manage_primary_headshot()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this as primary headshot
  IF NEW.is_primary_headshot = true AND (OLD.is_primary_headshot IS NULL OR OLD.is_primary_headshot = false) THEN
    -- Unset any existing primary headshot for this user
    UPDATE media_files
    SET is_primary_headshot = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary_headshot = true;
  END IF;

  -- If marking as primary, also mark as headshot
  IF NEW.is_primary_headshot = true THEN
    NEW.is_headshot = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manage_primary_headshot_trigger ON media_files;

CREATE TRIGGER manage_primary_headshot_trigger
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  WHEN (NEW.is_primary_headshot IS DISTINCT FROM OLD.is_primary_headshot)
  EXECUTE FUNCTION manage_primary_headshot();

-- =============================================
-- 6. COMMENTS
-- =============================================

COMMENT ON COLUMN media_files.is_headshot IS 'Marks photo as approved headshot for automation/promotional use';
COMMENT ON COLUMN media_files.is_primary_headshot IS 'Designates the primary headshot (only one allowed per user)';
COMMENT ON COLUMN media_files.image_width IS 'Image width in pixels for layout calculations';
COMMENT ON COLUMN media_files.image_height IS 'Image height in pixels for layout calculations';
COMMENT ON COLUMN media_files.aspect_ratio IS 'Computed aspect ratio (width/height) for responsive layouts';

-- =============================================
-- 7. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- =============================================

GRANT EXECUTE ON FUNCTION get_comedian_headshots(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_primary_headshot(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_headshots_for_comedians(UUID[]) TO authenticated;
