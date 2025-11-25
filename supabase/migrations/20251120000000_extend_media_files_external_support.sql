-- Extend media_files table to support external URLs and EPK/Profile features
-- This unifies the media storage system by consolidating comedian_media and profile videos into media_files

-- Add external URL support columns
ALTER TABLE media_files
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS external_type TEXT CHECK (external_type IN ('youtube', 'vimeo', 'google_drive', 'dropbox')),
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS is_featured_in_epk BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_profile_video BOOLEAN DEFAULT false;

-- Add constraint: Only one profile video per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_profile_video_per_user
ON media_files(user_id) WHERE is_profile_video = true;

-- Add comment explaining the schema
COMMENT ON COLUMN media_files.external_url IS 'Full URL for externally hosted media (YouTube, Vimeo, Google Drive, Dropbox)';
COMMENT ON COLUMN media_files.external_type IS 'Type of external hosting service';
COMMENT ON COLUMN media_files.external_id IS 'External service ID for embedding (e.g., YouTube video ID)';
COMMENT ON COLUMN media_files.is_featured_in_epk IS 'Whether this media should be displayed in the EPK (Electronic Press Kit)';
COMMENT ON COLUMN media_files.is_profile_video IS 'Whether this is the main profile video (only one per user)';

-- Helper function to add external video by URL
CREATE OR REPLACE FUNCTION add_external_video(
  p_user_id UUID,
  p_url TEXT,
  p_title TEXT,
  p_folder_id UUID DEFAULT NULL,
  p_is_featured_in_epk BOOLEAN DEFAULT false,
  p_is_profile_video BOOLEAN DEFAULT false
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_external_type TEXT;
  v_external_id TEXT;
  v_file_id UUID;
BEGIN
  -- Parse URL to determine type and extract ID
  IF p_url LIKE '%youtube.com/watch?v=%' OR p_url LIKE '%youtu.be/%' THEN
    v_external_type := 'youtube';
    -- Extract YouTube video ID
    IF p_url LIKE '%youtube.com/watch?v=%' THEN
      v_external_id := substring(p_url from 'v=([a-zA-Z0-9_-]+)');
    ELSE
      v_external_id := substring(p_url from 'youtu.be/([a-zA-Z0-9_-]+)');
    END IF;
  ELSIF p_url LIKE '%vimeo.com/%' THEN
    v_external_type := 'vimeo';
    v_external_id := substring(p_url from 'vimeo.com/([0-9]+)');
  ELSIF p_url LIKE '%drive.google.com/%' THEN
    v_external_type := 'google_drive';
    v_external_id := substring(p_url from 'd/([a-zA-Z0-9_-]+)');
  ELSIF p_url LIKE '%dropbox.com/%' THEN
    v_external_type := 'dropbox';
    v_external_id := NULL; -- Dropbox doesn't have simple ID extraction
  ELSE
    RAISE EXCEPTION 'Unsupported URL format. Supported: YouTube, Vimeo, Google Drive, Dropbox';
  END IF;

  -- If setting as profile video, unset any existing profile video
  IF p_is_profile_video THEN
    UPDATE media_files
    SET is_profile_video = false
    WHERE user_id = p_user_id AND is_profile_video = true;
  END IF;

  -- Insert the external video record
  INSERT INTO media_files (
    user_id,
    folder_id,
    file_name,
    file_type,
    external_url,
    external_type,
    external_id,
    is_featured_in_epk,
    is_profile_video,
    storage_path,
    public_url
  ) VALUES (
    p_user_id,
    p_folder_id,
    p_title,
    'video',
    p_url,
    v_external_type,
    v_external_id,
    p_is_featured_in_epk,
    p_is_profile_video,
    'external', -- Not stored in our bucket
    p_url -- Public URL is the external URL
  )
  RETURNING id INTO v_file_id;

  RETURN v_file_id;
END;
$$;

-- Helper function to set profile video
CREATE OR REPLACE FUNCTION set_profile_video(
  p_user_id UUID,
  p_file_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the file belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM media_files
    WHERE id = p_file_id AND user_id = p_user_id AND file_type = 'video'
  ) THEN
    RAISE EXCEPTION 'Video not found or does not belong to user';
  END IF;

  -- Unset any existing profile video
  UPDATE media_files
  SET is_profile_video = false
  WHERE user_id = p_user_id AND is_profile_video = true;

  -- Set the new profile video
  UPDATE media_files
  SET is_profile_video = true
  WHERE id = p_file_id AND user_id = p_user_id;

  RETURN true;
END;
$$;

-- Helper function to toggle EPK featured status
CREATE OR REPLACE FUNCTION toggle_epk_featured(
  p_user_id UUID,
  p_file_id UUID,
  p_is_featured BOOLEAN
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the file belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM media_files
    WHERE id = p_file_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'File not found or does not belong to user';
  END IF;

  -- Update EPK featured status
  UPDATE media_files
  SET is_featured_in_epk = p_is_featured
  WHERE id = p_file_id AND user_id = p_user_id;

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_external_video TO authenticated;
GRANT EXECUTE ON FUNCTION set_profile_video TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_epk_featured TO authenticated;
