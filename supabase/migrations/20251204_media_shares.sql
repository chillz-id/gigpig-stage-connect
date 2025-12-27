-- Media Shares Table
-- Allows sharing albums or individual media items with other users/profiles/organizations

-- Create enum types for sharing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_resource_type') THEN
    CREATE TYPE share_resource_type AS ENUM ('album', 'media');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_target_type') THEN
    CREATE TYPE share_target_type AS ENUM ('user', 'profile', 'organization');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_status') THEN
    CREATE TYPE share_status AS ENUM ('pending', 'accepted', 'declined', 'revoked');
  END IF;
END$$;

-- Main shares table
CREATE TABLE IF NOT EXISTS media_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What is being shared (album or single media)
  resource_type share_resource_type NOT NULL,
  album_id UUID REFERENCES media_albums(id) ON DELETE CASCADE,
  media_id UUID REFERENCES directory_media(id) ON DELETE CASCADE,

  -- Who is sharing
  shared_by UUID NOT NULL REFERENCES auth.users(id),

  -- Who is receiving the share (one of these will be set)
  shared_with_type share_target_type NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_with_profile_id UUID REFERENCES directory_profiles(id),
  shared_with_org_id UUID REFERENCES organizations(id),

  -- Share details
  status share_status DEFAULT 'pending',
  can_copy BOOLEAN DEFAULT true,
  message TEXT,

  -- Timestamps
  shared_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT resource_check CHECK (
    (album_id IS NOT NULL)::int + (media_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT target_check CHECK (
    (shared_with_user_id IS NOT NULL)::int +
    (shared_with_profile_id IS NOT NULL)::int +
    (shared_with_org_id IS NOT NULL)::int = 1
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON media_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with_user ON media_shares(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shares_shared_with_profile ON media_shares(shared_with_profile_id) WHERE shared_with_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shares_shared_with_org ON media_shares(shared_with_org_id) WHERE shared_with_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shares_status ON media_shares(status);
CREATE INDEX IF NOT EXISTS idx_shares_album ON media_shares(album_id) WHERE album_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shares_media ON media_shares(media_id) WHERE media_id IS NOT NULL;

-- RLS Policies
ALTER TABLE media_shares ENABLE ROW LEVEL SECURITY;

-- Users can view shares they created
CREATE POLICY "Users can view their own shares"
  ON media_shares FOR SELECT
  USING (shared_by = auth.uid());

-- Users can view shares sent to them
CREATE POLICY "Users can view shares sent to them"
  ON media_shares FOR SELECT
  USING (shared_with_user_id = auth.uid());

-- Users can view shares sent to their profiles
CREATE POLICY "Users can view shares sent to their profiles"
  ON media_shares FOR SELECT
  USING (
    shared_with_profile_id IN (
      SELECT id FROM directory_profiles WHERE claimed_by = auth.uid()
    )
  );

-- Users can view shares sent to their organizations
CREATE POLICY "Users can view shares sent to their organizations"
  ON media_shares FOR SELECT
  USING (
    shared_with_org_id IN (
      SELECT organization_id FROM organization_team_members WHERE user_id = auth.uid()
    )
  );

-- Users can create shares for their own content
CREATE POLICY "Users can create shares"
  ON media_shares FOR INSERT
  WITH CHECK (shared_by = auth.uid());

-- Users can update shares they created (e.g., revoke)
CREATE POLICY "Users can update their own shares"
  ON media_shares FOR UPDATE
  USING (shared_by = auth.uid());

-- Recipients can update shares (e.g., accept/decline)
CREATE POLICY "Recipients can update share status"
  ON media_shares FOR UPDATE
  USING (
    shared_with_user_id = auth.uid() OR
    shared_with_profile_id IN (
      SELECT id FROM directory_profiles WHERE claimed_by = auth.uid()
    ) OR
    shared_with_org_id IN (
      SELECT organization_id FROM organization_team_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete shares they created
CREATE POLICY "Users can delete their own shares"
  ON media_shares FOR DELETE
  USING (shared_by = auth.uid());

-- Add trigger for updated_at (if needed)
CREATE OR REPLACE FUNCTION update_media_shares_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'declined') THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shares_responded_at ON media_shares;
CREATE TRIGGER trigger_update_shares_responded_at
  BEFORE UPDATE ON media_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_media_shares_responded_at();

-- Comment for documentation
COMMENT ON TABLE media_shares IS 'Tracks shared albums and media items between users/profiles/organizations';
