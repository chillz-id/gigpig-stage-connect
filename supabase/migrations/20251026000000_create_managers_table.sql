-- Create managers table
CREATE TABLE IF NOT EXISTS managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  manager_type TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT managers_url_slug_unique UNIQUE (url_slug),
  CONSTRAINT valid_manager_type CHECK (
    manager_type IN (
      'social_media', 'tour', 'booking', 'comedian',
      'content', 'financial', 'general', 'venue'
    )
  )
);

-- Create indexes
CREATE INDEX idx_managers_user_id ON managers(user_id);
CREATE INDEX idx_managers_url_slug ON managers(url_slug);
CREATE INDEX idx_managers_organization_id ON managers(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_managers_venue_id ON managers(venue_id) WHERE venue_id IS NOT NULL;

-- Enable RLS
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Managers are viewable by everyone"
  ON managers FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own manager profiles"
  ON managers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manager profiles"
  ON managers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manager profiles"
  ON managers FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_managers_updated_at
  BEFORE UPDATE ON managers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
