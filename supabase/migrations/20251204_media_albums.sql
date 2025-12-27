-- Media Albums System
-- Allows users to organize photos into albums with cover photos

-- Albums table
CREATE TABLE IF NOT EXISTS media_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  directory_profile_id UUID REFERENCES directory_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_media_id UUID REFERENCES directory_media(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Exactly one owner must be set
  CONSTRAINT album_owner_check CHECK (
    (user_id IS NOT NULL)::int +
    (directory_profile_id IS NOT NULL)::int +
    (organization_id IS NOT NULL)::int = 1
  )
);

-- Album items junction table
CREATE TABLE IF NOT EXISTS media_album_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES media_albums(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES directory_media(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(album_id, media_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_albums_user_id ON media_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_media_albums_directory_profile_id ON media_albums(directory_profile_id);
CREATE INDEX IF NOT EXISTS idx_media_albums_organization_id ON media_albums(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_album_items_album_id ON media_album_items(album_id);
CREATE INDEX IF NOT EXISTS idx_media_album_items_media_id ON media_album_items(media_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_media_albums_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_media_albums_updated_at ON media_albums;
CREATE TRIGGER trigger_media_albums_updated_at
  BEFORE UPDATE ON media_albums
  FOR EACH ROW
  EXECUTE FUNCTION update_media_albums_updated_at();

-- Enable RLS
ALTER TABLE media_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_album_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_albums

-- Users can view albums they own (via user_id)
CREATE POLICY "Users can view own albums via user_id"
  ON media_albums FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view albums for their directory profiles
CREATE POLICY "Users can view albums for their directory profiles"
  ON media_albums FOR SELECT
  USING (
    directory_profile_id IN (
      SELECT id FROM directory_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can view public albums
CREATE POLICY "Anyone can view public albums"
  ON media_albums FOR SELECT
  USING (is_public = true);

-- Users can create albums for themselves or their profiles
CREATE POLICY "Users can create own albums"
  ON media_albums FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR directory_profile_id IN (
      SELECT id FROM directory_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update albums they own
CREATE POLICY "Users can update own albums via user_id"
  ON media_albums FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update albums for their directory profiles"
  ON media_albums FOR UPDATE
  USING (
    directory_profile_id IN (
      SELECT id FROM directory_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can delete albums they own
CREATE POLICY "Users can delete own albums via user_id"
  ON media_albums FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete albums for their directory profiles"
  ON media_albums FOR DELETE
  USING (
    directory_profile_id IN (
      SELECT id FROM directory_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for media_album_items

-- Users can view items in albums they can view
CREATE POLICY "Users can view items in viewable albums"
  ON media_album_items FOR SELECT
  USING (
    album_id IN (
      SELECT id FROM media_albums
      WHERE auth.uid() = user_id
        OR is_public = true
        OR directory_profile_id IN (
          SELECT id FROM directory_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Users can add items to albums they own
CREATE POLICY "Users can add items to own albums"
  ON media_album_items FOR INSERT
  WITH CHECK (
    album_id IN (
      SELECT id FROM media_albums
      WHERE auth.uid() = user_id
        OR directory_profile_id IN (
          SELECT id FROM directory_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Users can update items in albums they own
CREATE POLICY "Users can update items in own albums"
  ON media_album_items FOR UPDATE
  USING (
    album_id IN (
      SELECT id FROM media_albums
      WHERE auth.uid() = user_id
        OR directory_profile_id IN (
          SELECT id FROM directory_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Users can delete items from albums they own
CREATE POLICY "Users can delete items from own albums"
  ON media_album_items FOR DELETE
  USING (
    album_id IN (
      SELECT id FROM media_albums
      WHERE auth.uid() = user_id
        OR directory_profile_id IN (
          SELECT id FROM directory_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Grant permissions
GRANT ALL ON media_albums TO authenticated;
GRANT ALL ON media_album_items TO authenticated;
GRANT SELECT ON media_albums TO anon;
GRANT SELECT ON media_album_items TO anon;
