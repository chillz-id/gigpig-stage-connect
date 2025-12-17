-- Unified Cross-Entity Media Linking System
-- Allows photos to be linked to multiple entities (events, photographers, venues, orgs, comedians)
-- Photos appear in the media library of ALL linked entities

-- ============================================================================
-- PART 1: Create media_entity_links junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source media (exactly one must be set)
  media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
  organization_media_id UUID REFERENCES organization_media(id) ON DELETE CASCADE,
  directory_media_id UUID REFERENCES directory_media(id) ON DELETE CASCADE,

  -- Target entity (at least one must be set)
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES directory_profiles(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES directory_profiles(id) ON DELETE CASCADE,

  -- Link metadata
  role TEXT CHECK (role IN ('featured', 'photographer', 'venue', 'organizer', 'performer', 'host', 'audience')),
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure exactly one source media
  CONSTRAINT single_source CHECK (
    (CASE WHEN media_file_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN organization_media_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN directory_media_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),

  -- Ensure at least one target entity
  CONSTRAINT has_target CHECK (
    event_id IS NOT NULL OR
    session_id IS NOT NULL OR
    venue_id IS NOT NULL OR
    organization_id IS NOT NULL OR
    photographer_id IS NOT NULL OR
    comedian_id IS NOT NULL
  )
);

-- Indexes for efficient lookups
CREATE INDEX idx_media_entity_links_media_file ON media_entity_links(media_file_id) WHERE media_file_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_org_media ON media_entity_links(organization_media_id) WHERE organization_media_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_dir_media ON media_entity_links(directory_media_id) WHERE directory_media_id IS NOT NULL;

CREATE INDEX idx_media_entity_links_event ON media_entity_links(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_session ON media_entity_links(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_venue ON media_entity_links(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_org ON media_entity_links(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_photographer ON media_entity_links(photographer_id) WHERE photographer_id IS NOT NULL;
CREATE INDEX idx_media_entity_links_comedian ON media_entity_links(comedian_id) WHERE comedian_id IS NOT NULL;

-- ============================================================================
-- PART 2: Extend media_folders for organizations
-- ============================================================================

-- Make user_id nullable (was NOT NULL)
ALTER TABLE media_folders ALTER COLUMN user_id DROP NOT NULL;

-- Add organization_id column
ALTER TABLE media_folders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

-- Add constraint: folder belongs to user OR organization (not both, not neither)
ALTER TABLE media_folders DROP CONSTRAINT IF EXISTS folder_owner_check;
ALTER TABLE media_folders ADD CONSTRAINT folder_owner_check CHECK (
  (user_id IS NOT NULL AND organization_id IS NULL) OR
  (user_id IS NULL AND organization_id IS NOT NULL)
);

-- Index for organization folders
CREATE INDEX IF NOT EXISTS idx_media_folders_org ON media_folders(organization_id) WHERE organization_id IS NOT NULL;

-- ============================================================================
-- PART 3: RLS Policies for media_entity_links
-- ============================================================================

ALTER TABLE media_entity_links ENABLE ROW LEVEL SECURITY;

-- Public can read links (photos are public)
CREATE POLICY "Anyone can view media links"
  ON media_entity_links FOR SELECT
  USING (true);

-- Authenticated users can create links for their own media
CREATE POLICY "Users can create links for their media"
  ON media_entity_links FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User owns the media file
    (media_file_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM media_files WHERE id = media_file_id AND user_id = auth.uid()
    ))
    OR
    -- User is member of org that owns the media
    (organization_media_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_media om
      JOIN organization_members mem ON mem.organization_id = om.organization_id
      WHERE om.id = organization_media_id AND mem.user_id = auth.uid()
    ))
    OR
    -- User owns the directory profile that owns the media
    (directory_media_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM directory_media dm
      JOIN directory_profiles dp ON dp.id = dm.directory_profile_id
      WHERE dm.id = directory_media_id AND dp.claimed_by = auth.uid()
    ))
    OR
    -- Admin can create any links
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can delete their own links
CREATE POLICY "Users can delete their own links"
  ON media_entity_links FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PART 4: Updated RLS for media_folders (support orgs)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can create their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON media_folders;

-- New policies supporting both users and organizations
CREATE POLICY "Users can view their own or org folders"
  ON media_folders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = media_folders.organization_id AND user_id = auth.uid()
    ))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create folders for self or org"
  ON media_folders FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = media_folders.organization_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own or org folders"
  ON media_folders FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = media_folders.organization_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete their own or org folders"
  ON media_folders FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid() AND NOT is_system_folder)
    OR (organization_id IS NOT NULL AND NOT is_system_folder AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = media_folders.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

-- ============================================================================
-- PART 5: Helper functions
-- ============================================================================

-- Get all media for an entity (returns unified result from all media tables)
CREATE OR REPLACE FUNCTION get_media_for_entity(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  storage_path TEXT,
  file_url TEXT,
  title TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ,
  link_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Media files
  SELECT
    mf.id,
    'media_file'::TEXT as source_type,
    mf.id as source_id,
    mf.storage_path,
    mf.storage_path as file_url,
    mf.original_name as title,
    mf.file_type,
    mf.created_at,
    mel.role as link_role
  FROM media_files mf
  JOIN media_entity_links mel ON mel.media_file_id = mf.id
  WHERE
    (p_entity_type = 'event' AND mel.event_id = p_entity_id) OR
    (p_entity_type = 'session' AND mel.session_id = p_entity_id) OR
    (p_entity_type = 'venue' AND mel.venue_id = p_entity_id) OR
    (p_entity_type = 'organization' AND mel.organization_id = p_entity_id) OR
    (p_entity_type = 'photographer' AND mel.photographer_id = p_entity_id) OR
    (p_entity_type = 'comedian' AND mel.comedian_id = p_entity_id)

  UNION ALL

  -- Organization media
  SELECT
    om.id,
    'organization_media'::TEXT as source_type,
    om.id as source_id,
    NULL as storage_path,
    om.file_url,
    om.title,
    om.file_type,
    om.created_at,
    mel.role as link_role
  FROM organization_media om
  JOIN media_entity_links mel ON mel.organization_media_id = om.id
  WHERE
    (p_entity_type = 'event' AND mel.event_id = p_entity_id) OR
    (p_entity_type = 'session' AND mel.session_id = p_entity_id) OR
    (p_entity_type = 'venue' AND mel.venue_id = p_entity_id) OR
    (p_entity_type = 'organization' AND mel.organization_id = p_entity_id) OR
    (p_entity_type = 'photographer' AND mel.photographer_id = p_entity_id) OR
    (p_entity_type = 'comedian' AND mel.comedian_id = p_entity_id)

  UNION ALL

  -- Directory media
  SELECT
    dm.id,
    'directory_media'::TEXT as source_type,
    dm.id as source_id,
    dm.storage_path,
    dm.storage_path as file_url,
    dm.storage_path as title,
    'image'::TEXT as file_type,
    dm.created_at,
    mel.role as link_role
  FROM directory_media dm
  JOIN media_entity_links mel ON mel.directory_media_id = dm.id
  WHERE
    (p_entity_type = 'event' AND mel.event_id = p_entity_id) OR
    (p_entity_type = 'session' AND mel.session_id = p_entity_id) OR
    (p_entity_type = 'venue' AND mel.venue_id = p_entity_id) OR
    (p_entity_type = 'organization' AND mel.organization_id = p_entity_id) OR
    (p_entity_type = 'photographer' AND mel.photographer_id = p_entity_id) OR
    (p_entity_type = 'comedian' AND mel.comedian_id = p_entity_id)

  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link media to an entity
CREATE OR REPLACE FUNCTION link_media_to_entity(
  p_source_type TEXT,
  p_source_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_role TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  INSERT INTO media_entity_links (
    media_file_id,
    organization_media_id,
    directory_media_id,
    event_id,
    session_id,
    venue_id,
    organization_id,
    photographer_id,
    comedian_id,
    role,
    created_by
  ) VALUES (
    CASE WHEN p_source_type = 'media_file' THEN p_source_id ELSE NULL END,
    CASE WHEN p_source_type = 'organization_media' THEN p_source_id ELSE NULL END,
    CASE WHEN p_source_type = 'directory_media' THEN p_source_id ELSE NULL END,
    CASE WHEN p_entity_type = 'event' THEN p_entity_id ELSE NULL END,
    CASE WHEN p_entity_type = 'session' THEN p_entity_id ELSE NULL END,
    CASE WHEN p_entity_type = 'venue' THEN p_entity_id ELSE NULL END,
    CASE WHEN p_entity_type = 'organization' THEN p_entity_id ELSE NULL END,
    CASE WHEN p_entity_type = 'photographer' THEN p_entity_id ELSE NULL END,
    CASE WHEN p_entity_type = 'comedian' THEN p_entity_id ELSE NULL END,
    p_role,
    auth.uid()
  )
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE media_entity_links IS 'Junction table linking media from any source to any entity. Enables cross-entity photo sharing.';
COMMENT ON FUNCTION get_media_for_entity IS 'Get all media linked to an entity from all media sources';
COMMENT ON FUNCTION link_media_to_entity IS 'Create a link between media and an entity';
