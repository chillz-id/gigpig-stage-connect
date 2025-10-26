CREATE TABLE IF NOT EXISTS slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL,
  profile_id UUID NOT NULL,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_profile_type CHECK (
    profile_type IN ('comedian', 'manager', 'organization', 'venue')
  )
);

-- Indexes
CREATE INDEX idx_slug_history_old_slug ON slug_history(profile_type, old_slug);
CREATE INDEX idx_slug_history_profile ON slug_history(profile_type, profile_id);

-- Enable RLS
ALTER TABLE slug_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: viewable by everyone (for redirects)
CREATE POLICY "Slug history is viewable by everyone"
  ON slug_history FOR SELECT
  USING (true);
