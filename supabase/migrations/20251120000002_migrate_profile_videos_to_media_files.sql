-- Migrate profiles.youtube_url to media_files table
-- This consolidates profile videos into the unified Media Library

DO $$
DECLARE
  v_profile RECORD;
  v_folder_id UUID;
  v_file_id UUID;
BEGIN
  -- Loop through all profiles with youtube_url
  FOR v_profile IN
    SELECT id, youtube_url
    FROM profiles
    WHERE youtube_url IS NOT NULL
      AND youtube_url != ''
      AND youtube_url LIKE '%youtube%' OR youtube_url LIKE '%youtu.be%'
  LOOP
    -- Find Performances folder for this user
    SELECT id INTO v_folder_id
    FROM media_folders
    WHERE user_id = v_profile.id
      AND name = 'Performances'
      AND is_default = true
    LIMIT 1;

    -- Skip if this URL already exists in media_files
    IF EXISTS (
      SELECT 1 FROM media_files
      WHERE user_id = v_profile.id
        AND external_url = v_profile.youtube_url
    ) THEN
      CONTINUE;
    END IF;

    -- Add the profile video using the helper function
    BEGIN
      v_file_id := add_external_video(
        p_user_id := v_profile.id,
        p_url := v_profile.youtube_url,
        p_title := 'Profile Video',
        p_folder_id := v_folder_id,
        p_is_featured_in_epk := true, -- Profile videos typically shown in EPK
        p_is_profile_video := true
      );

      RAISE NOTICE 'Migrated profile video for user %: %', v_profile.id, v_file_id;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other profiles
      RAISE NOTICE 'Failed to migrate profile video for user %: %', v_profile.id, SQLERRM;
    END;

  END LOOP;

  -- Log migration stats
  RAISE NOTICE 'Migrated % profile videos to media_files',
    (SELECT COUNT(*) FROM profiles WHERE youtube_url IS NOT NULL AND youtube_url != '');

  RAISE NOTICE 'Total profile videos in media_files: %',
    (SELECT COUNT(*) FROM media_files WHERE is_profile_video = true);

END $$;

-- Add comment to profiles.youtube_url column noting it's deprecated
COMMENT ON COLUMN profiles.youtube_url IS 'DEPRECATED: Profile videos should now be managed through media_files table with is_profile_video flag. This column is kept for backwards compatibility only.';
