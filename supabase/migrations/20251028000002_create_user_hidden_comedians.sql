-- Migration: Create user_hidden_comedians table
-- Description: Store hidden comedian preferences (event-specific or global)

CREATE TABLE IF NOT EXISTS user_hidden_comedians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('event', 'global')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comedian_id, scope, event_id),
  CHECK (
    (scope = 'event' AND event_id IS NOT NULL) OR
    (scope = 'global' AND event_id IS NULL)
  )
);

-- Index for user lookups
CREATE INDEX idx_user_hidden_user ON user_hidden_comedians(user_id);

-- Index for event-specific hiding
CREATE INDEX idx_user_hidden_event ON user_hidden_comedians(event_id)
  WHERE scope = 'event';

-- Index for comedian lookups
CREATE INDEX idx_user_hidden_comedian ON user_hidden_comedians(comedian_id);

-- RLS policies
ALTER TABLE user_hidden_comedians ENABLE ROW LEVEL SECURITY;

-- Users can view their own hidden list
CREATE POLICY "Users can view own hidden comedians"
  ON user_hidden_comedians
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to hidden list
CREATE POLICY "Users can add hidden comedians"
  ON user_hidden_comedians
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from hidden list
CREATE POLICY "Users can remove hidden comedians"
  ON user_hidden_comedians
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON user_hidden_comedians TO authenticated;
