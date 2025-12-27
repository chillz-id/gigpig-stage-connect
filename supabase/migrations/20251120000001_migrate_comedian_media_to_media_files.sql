-- Migrate comedian_media records to media_files table
-- This consolidates the old EPK media system into the unified Media Library

DO $$
DECLARE
  v_record RECORD;
  v_folder_id UUID;
  v_file_type TEXT;
  v_storage_path TEXT;
BEGIN
  -- Loop through all comedian_media records
  FOR v_record IN
    SELECT * FROM comedian_media
    ORDER BY user_id, created_at
  LOOP
    -- Determine file type
    v_file_type := CASE
      WHEN v_record.media_type = 'photo' THEN 'image'
      WHEN v_record.media_type = 'video' THEN 'video'
      ELSE v_record.media_type
    END;

    -- Find or create appropriate folder for this user
    -- If it's a photo with 'headshot' in tags, use Headshots folder
    -- If it's a video or has 'performance' in tags, use Performances folder
    -- Otherwise use EPK folder
    IF v_file_type = 'image' AND 'headshot' = ANY(COALESCE(v_record.tags, ARRAY[]::TEXT[])) THEN
      -- Find Headshots folder
      SELECT id INTO v_folder_id
      FROM media_folders
      WHERE user_id = v_record.user_id
        AND name = 'Headshots'
        AND is_default = true
      LIMIT 1;
    ELSIF v_file_type = 'video' OR 'performance' = ANY(COALESCE(v_record.tags, ARRAY[]::TEXT[])) THEN
      -- Find Performances folder
      SELECT id INTO v_folder_id
      FROM media_folders
      WHERE user_id = v_record.user_id
        AND name = 'Performances'
        AND is_default = true
      LIMIT 1;
    ELSE
      -- Find or create EPK folder
      SELECT id INTO v_folder_id
      FROM media_folders
      WHERE user_id = v_record.user_id
        AND name = 'EPK'
      LIMIT 1;

      -- Create EPK folder if it doesn't exist
      IF v_folder_id IS NULL THEN
        INSERT INTO media_folders (user_id, name, description, is_default, is_system_folder)
        VALUES (
          v_record.user_id,
          'EPK',
          'Media featured in Electronic Press Kit',
          false,
          false
        )
        RETURNING id INTO v_folder_id;
      END IF;
    END IF;

    -- Determine storage path
    IF v_record.external_url IS NOT NULL THEN
      v_storage_path := 'external';
    ELSIF v_record.file_url IS NOT NULL THEN
      -- Extract path from comedian-media bucket URL
      v_storage_path := regexp_replace(v_record.file_url, '^.*/comedian-media/', '');
    ELSE
      v_storage_path := 'unknown';
    END IF;

    -- Insert into media_files (skip if already exists based on public_url match)
    -- Only reference columns that actually exist in comedian_media
    INSERT INTO media_files (
      user_id,
      folder_id,
      file_name,
      file_type,
      file_size,
      storage_path,
      public_url,
      external_url,
      external_type,
      external_id,
      tags,
      is_featured_in_epk,
      created_at,
      updated_at
    )
    SELECT
      v_record.user_id,
      v_folder_id,
      COALESCE(v_record.title, 'Untitled'),
      v_file_type,
      COALESCE(v_record.file_size, 0), -- Default to 0 for external videos with no file size
      v_storage_path,
      COALESCE(v_record.file_url, v_record.url, v_record.external_url),
      v_record.external_url,
      v_record.external_type,
      v_record.external_id,
      COALESCE(v_record.tags, ARRAY[]::TEXT[]), -- Handle null tags
      false, -- Default to not featured in EPK (can be updated later)
      v_record.created_at,
      v_record.created_at -- Use created_at for updated_at since no updated_at column exists
    WHERE NOT EXISTS (
      -- Skip if this exact file already exists in media_files
      SELECT 1 FROM media_files
      WHERE user_id = v_record.user_id
        AND public_url = COALESCE(v_record.file_url, v_record.url, v_record.external_url)
    );

  END LOOP;

  -- Log migration stats
  RAISE NOTICE 'Migrated % records from comedian_media to media_files',
    (SELECT COUNT(*) FROM comedian_media);

  RAISE NOTICE 'Total media_files records after migration: %',
    (SELECT COUNT(*) FROM media_files);

END $$;

-- Add comment to comedian_media table noting it's deprecated
COMMENT ON TABLE comedian_media IS 'DEPRECATED: Media has been migrated to media_files table. This table is kept for backwards compatibility only.';
