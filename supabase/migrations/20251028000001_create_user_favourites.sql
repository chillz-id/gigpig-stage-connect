-- Migration: Create user_favourites table
-- Description: Store user-level comedian favourites (across all events)

CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comedian_id)
);

-- Index for fast user lookups
CREATE INDEX idx_user_favourites_user ON user_favourites(user_id);

-- Index for checking if comedian is favourited
CREATE INDEX idx_user_favourites_comedian ON user_favourites(comedian_id);

-- RLS policies
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favourites
CREATE POLICY "Users can view own favourites"
  ON user_favourites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their favourites
CREATE POLICY "Users can add favourites"
  ON user_favourites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their favourites
CREATE POLICY "Users can remove favourites"
  ON user_favourites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON user_favourites TO authenticated;
