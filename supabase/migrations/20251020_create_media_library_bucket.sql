-- Media Library Bucket & Folder System
-- Creates storage bucket and folder management for media files
-- Author: Claude Code
-- Date: 2025-10-20

-- =============================================
-- 1. CREATE MEDIA-LIBRARY STORAGE BUCKET
-- =============================================

-- Insert the bucket (this will be done via Supabase dashboard or API)
-- Note: Storage buckets are managed separately from regular tables
-- This SQL is for documentation - actual bucket creation uses storage.buckets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-library',
  'media-library',
  true,  -- Public access for easy sharing
  104857600,  -- 100MB limit (generous for videos)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/mpeg',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 2. MEDIA FOLDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT,
  is_default BOOLEAN DEFAULT false,  -- For auto-created folders like "Headshots"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate folder names per user
  UNIQUE(user_id, name)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_media_folders_user_id ON media_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_name ON media_folders(name);
CREATE INDEX IF NOT EXISTS idx_media_folders_is_default ON media_folders(is_default);

-- =============================================
-- 3. MEDIA FILES TABLE (Track uploaded files)
-- =============================================

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,  -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- MIME type
  file_size INTEGER NOT NULL,  -- Bytes
  public_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_tags ON media_files USING GIN(tags);

-- =============================================
-- 4. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS media_folders_updated_at_trigger ON media_folders;
DROP TRIGGER IF EXISTS media_files_updated_at_trigger ON media_files;

CREATE TRIGGER media_folders_updated_at_trigger
  BEFORE UPDATE ON media_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER media_files_updated_at_trigger
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

-- =============================================
-- 5. RLS POLICIES
-- =============================================

ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Media Folders: Users can only manage their own folders
CREATE POLICY "Users can view their own folders"
  ON media_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON media_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON media_folders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON media_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Media Files: Users can only manage their own files
CREATE POLICY "Users can view their own media files"
  ON media_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own media files"
  ON media_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media files"
  ON media_files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media files"
  ON media_files FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 6. STORAGE POLICIES
-- =============================================

-- Allow authenticated users to upload to their own folder in media-library bucket
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media-library' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media-library' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media-library' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access (bucket is public)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media-library');

-- =============================================
-- 7. AUTO-CREATE HEADSHOTS FOLDER FOR COMEDIANS
-- =============================================

CREATE OR REPLACE FUNCTION create_default_media_folders()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has comedian role
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = NEW.id
    AND role = 'comedian'
  ) THEN
    -- Create Headshots folder
    INSERT INTO media_folders (user_id, name, description, is_default)
    VALUES (
      NEW.id,
      'Headshots',
      'Professional headshots for promotional use',
      true
    )
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Create Performances folder
    INSERT INTO media_folders (user_id, name, description, is_default)
    VALUES (
      NEW.id,
      'Performances',
      'Videos and images from live performances',
      true
    )
    ON CONFLICT (user_id, name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create folders when a comedian profile is created
DROP TRIGGER IF EXISTS create_comedian_folders_trigger ON auth.users;

CREATE TRIGGER create_comedian_folders_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_media_folders();

-- =============================================
-- 8. HELPER FUNCTIONS
-- =============================================

-- Get folder statistics for a user
CREATE OR REPLACE FUNCTION get_folder_stats(p_user_id UUID)
RETURNS TABLE (
  folder_id UUID,
  folder_name TEXT,
  file_count BIGINT,
  total_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id as folder_id,
    mf.name as folder_name,
    COUNT(m.id) as file_count,
    COALESCE(SUM(m.file_size), 0) as total_size
  FROM media_folders mf
  LEFT JOIN media_files m ON m.folder_id = mf.id
  WHERE mf.user_id = p_user_id
  GROUP BY mf.id, mf.name
  ORDER BY mf.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's total storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(file_size), 0)
    FROM media_files
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 9. COMMENTS
-- =============================================

COMMENT ON TABLE media_folders IS 'Organizes media files into folders for each user';
COMMENT ON TABLE media_files IS 'Tracks uploaded media files in Supabase Storage';
COMMENT ON COLUMN media_folders.is_default IS 'Auto-created folders like Headshots for comedians';
COMMENT ON COLUMN media_files.storage_path IS 'Full path in Supabase Storage bucket';
COMMENT ON COLUMN media_files.tags IS 'User-defined tags for search and organization';
