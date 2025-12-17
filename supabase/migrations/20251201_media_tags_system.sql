-- Media Library Tagging System
-- Adds user-specific tag vocabulary for autocomplete and automation support

-- =============================================================================
-- PHASE 1: User Tags Table
-- =============================================================================

-- Create table to track each user's tag vocabulary for autocomplete
CREATE TABLE IF NOT EXISTS user_media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  usage_count INT DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tag)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_media_tags_user ON user_media_tags(user_id);

-- Index for autocomplete (most used first)
CREATE INDEX IF NOT EXISTS idx_user_media_tags_usage ON user_media_tags(user_id, usage_count DESC);

-- Index for tag search
CREATE INDEX IF NOT EXISTS idx_user_media_tags_search ON user_media_tags(user_id, tag text_pattern_ops);

-- RLS: Users can only access their own tags
ALTER TABLE user_media_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users manage own tags" ON user_media_tags;

-- Create RLS policy
CREATE POLICY "Users manage own tags" ON user_media_tags
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- PHASE 2: Database Functions
-- =============================================================================

-- Upsert tag and increment usage count
CREATE OR REPLACE FUNCTION upsert_user_tag(p_user_id UUID, p_tag TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_media_tags (user_id, tag, usage_count, last_used_at)
  VALUES (p_user_id, lower(trim(p_tag)), 1, now())
  ON CONFLICT (user_id, tag) DO UPDATE SET
    usage_count = user_media_tags.usage_count + 1,
    last_used_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update media file tags and sync user_media_tags
CREATE OR REPLACE FUNCTION update_media_tags(
  p_file_id UUID,
  p_tags TEXT[]
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_tag TEXT;
  v_normalized_tags TEXT[];
BEGIN
  -- Get the user_id from the media file
  SELECT user_id INTO v_user_id FROM media_files WHERE id = p_file_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Media file not found: %', p_file_id;
  END IF;

  -- Normalize tags (lowercase, trimmed)
  SELECT array_agg(lower(trim(t))) INTO v_normalized_tags
  FROM unnest(p_tags) AS t
  WHERE trim(t) != '';

  -- Update media_files tags
  UPDATE media_files SET tags = v_normalized_tags WHERE id = p_file_id;

  -- Upsert each tag to user's vocabulary
  IF v_normalized_tags IS NOT NULL THEN
    FOREACH v_tag IN ARRAY v_normalized_tags LOOP
      PERFORM upsert_user_tag(v_user_id, v_tag);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's tags for autocomplete (ordered by usage)
CREATE OR REPLACE FUNCTION get_user_tags(p_user_id UUID, p_search TEXT DEFAULT NULL)
RETURNS TABLE(tag TEXT, usage_count INT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.tag, t.usage_count::INT
  FROM user_media_tags t
  WHERE t.user_id = p_user_id
    AND (p_search IS NULL OR t.tag ILIKE '%' || p_search || '%')
  ORDER BY t.usage_count DESC, t.tag
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get media by tags (for automation/n8n)
CREATE OR REPLACE FUNCTION get_media_by_tags(
  p_user_id UUID,
  p_tags TEXT[],
  p_match_all BOOLEAN DEFAULT true,
  p_media_type TEXT DEFAULT NULL
) RETURNS SETOF media_files AS $$
DECLARE
  v_normalized_tags TEXT[];
BEGIN
  -- Normalize search tags
  SELECT array_agg(lower(trim(t))) INTO v_normalized_tags
  FROM unnest(p_tags) AS t
  WHERE trim(t) != '';

  RETURN QUERY
  SELECT * FROM media_files
  WHERE user_id = p_user_id
    AND (p_media_type IS NULL OR file_type ILIKE p_media_type || '%')
    AND CASE
      WHEN p_match_all THEN tags @> v_normalized_tags  -- Contains all tags
      ELSE tags && v_normalized_tags                    -- Contains any tag
    END
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add tags to a media file (append, not replace)
CREATE OR REPLACE FUNCTION add_media_tags(
  p_file_id UUID,
  p_tags TEXT[]
) RETURNS void AS $$
DECLARE
  v_existing_tags TEXT[];
  v_merged_tags TEXT[];
BEGIN
  -- Get existing tags
  SELECT COALESCE(tags, '{}') INTO v_existing_tags
  FROM media_files WHERE id = p_file_id;

  -- Merge with new tags (deduplicated)
  SELECT array_agg(DISTINCT t) INTO v_merged_tags
  FROM (
    SELECT unnest(v_existing_tags) AS t
    UNION
    SELECT lower(trim(unnest(p_tags))) AS t
  ) AS combined
  WHERE t IS NOT NULL AND t != '';

  -- Use update_media_tags to handle the update and vocabulary sync
  PERFORM update_media_tags(p_file_id, v_merged_tags);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove tags from a media file
CREATE OR REPLACE FUNCTION remove_media_tags(
  p_file_id UUID,
  p_tags TEXT[]
) RETURNS void AS $$
DECLARE
  v_existing_tags TEXT[];
  v_remaining_tags TEXT[];
  v_tags_to_remove TEXT[];
BEGIN
  -- Normalize tags to remove
  SELECT array_agg(lower(trim(t))) INTO v_tags_to_remove
  FROM unnest(p_tags) AS t;

  -- Get existing tags
  SELECT COALESCE(tags, '{}') INTO v_existing_tags
  FROM media_files WHERE id = p_file_id;

  -- Remove specified tags
  SELECT array_agg(t) INTO v_remaining_tags
  FROM unnest(v_existing_tags) AS t
  WHERE NOT (t = ANY(v_tags_to_remove));

  -- Update (don't use update_media_tags as we don't want to increment usage for removed tags)
  UPDATE media_files SET tags = COALESCE(v_remaining_tags, '{}') WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk update tags for multiple files
CREATE OR REPLACE FUNCTION bulk_update_media_tags(
  p_file_ids UUID[],
  p_tags TEXT[]
) RETURNS void AS $$
DECLARE
  v_file_id UUID;
BEGIN
  FOREACH v_file_id IN ARRAY p_file_ids LOOP
    PERFORM update_media_tags(v_file_id, p_tags);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk add tags to multiple files
CREATE OR REPLACE FUNCTION bulk_add_media_tags(
  p_file_ids UUID[],
  p_tags TEXT[]
) RETURNS void AS $$
DECLARE
  v_file_id UUID;
BEGIN
  FOREACH v_file_id IN ARRAY p_file_ids LOOP
    PERFORM add_media_tags(v_file_id, p_tags);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_user_tag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_media_tags(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tags(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_media_by_tags(UUID, TEXT[], BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_media_tags(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_media_tags(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_media_tags(UUID[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_add_media_tags(UUID[], TEXT[]) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_media_tags IS 'Stores each user''s tag vocabulary for autocomplete suggestions in the media library';
COMMENT ON COLUMN user_media_tags.usage_count IS 'Number of times this tag has been applied to media files';
COMMENT ON COLUMN user_media_tags.last_used_at IS 'Last time this tag was applied to a media file';

COMMENT ON FUNCTION upsert_user_tag IS 'Creates or updates a tag in user''s vocabulary, incrementing usage count';
COMMENT ON FUNCTION update_media_tags IS 'Sets tags on a media file and syncs with user vocabulary';
COMMENT ON FUNCTION get_user_tags IS 'Returns user''s tags for autocomplete, optionally filtered by search term';
COMMENT ON FUNCTION get_media_by_tags IS 'Returns media files matching specified tags - for automation/n8n workflows';
COMMENT ON FUNCTION add_media_tags IS 'Appends tags to a media file without removing existing ones';
COMMENT ON FUNCTION remove_media_tags IS 'Removes specific tags from a media file';
COMMENT ON FUNCTION bulk_update_media_tags IS 'Sets tags on multiple media files at once';
COMMENT ON FUNCTION bulk_add_media_tags IS 'Appends tags to multiple media files at once';
