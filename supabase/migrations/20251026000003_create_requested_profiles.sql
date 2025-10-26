CREATE TABLE IF NOT EXISTS requested_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL,
  slug_attempted TEXT NOT NULL,
  instagram_handle TEXT,
  request_count INTEGER DEFAULT 1,
  requested_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_requested_profile UNIQUE (profile_type, slug_attempted),
  CONSTRAINT valid_profile_type CHECK (
    profile_type IN ('comedian', 'manager', 'organization', 'venue')
  )
);

-- Indexes
CREATE INDEX idx_requested_profiles_type ON requested_profiles(profile_type);
CREATE INDEX idx_requested_profiles_count ON requested_profiles(request_count DESC);

-- Enable RLS
ALTER TABLE requested_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Requested profiles are viewable by everyone"
  ON requested_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can record profile requests"
  ON requested_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update request counts"
  ON requested_profiles FOR UPDATE
  USING (true);

-- Updated_at trigger
CREATE TRIGGER set_requested_profiles_updated_at
  BEFORE UPDATE ON requested_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to record or increment profile requests
CREATE OR REPLACE FUNCTION record_profile_request(
  p_profile_type TEXT,
  p_slug TEXT,
  p_instagram_handle TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO requested_profiles (profile_type, slug_attempted, instagram_handle, requested_by)
  VALUES (p_profile_type, p_slug, p_instagram_handle, ARRAY[p_user_id])
  ON CONFLICT (profile_type, slug_attempted)
  DO UPDATE SET
    request_count = requested_profiles.request_count + 1,
    requested_by = array_append(requested_profiles.requested_by, p_user_id),
    instagram_handle = COALESCE(EXCLUDED.instagram_handle, requested_profiles.instagram_handle),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
