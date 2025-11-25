-- Feature requests table
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  -- Statuses: requested, under_review, planned, in_progress, completed
  category TEXT,
  -- Categories: ui_ux, performance, integration, new_feature, bug_fix
  priority INTEGER DEFAULT 0,
  -- Priority: 0-4 (higher = more important, set by admins only)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('requested', 'under_review', 'planned', 'in_progress', 'completed'))
);

-- Feature votes table (upvoting system)
CREATE TABLE IF NOT EXISTS feature_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, user_id) -- One vote per user per feature
);

-- Feature comments table
CREATE TABLE IF NOT EXISTS feature_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_created_by ON feature_requests(created_by);
CREATE INDEX idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX idx_feature_votes_user_id ON feature_votes(user_id);
CREATE INDEX idx_feature_comments_feature_id ON feature_comments(feature_id);

-- RLS Policies

-- Everyone can read feature requests
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feature requests"
  ON feature_requests FOR SELECT
  USING (true);

-- Authenticated users can create feature requests
CREATE POLICY "Authenticated users can create feature requests"
  ON feature_requests FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only admins can update/delete feature requests
CREATE POLICY "Admins can update feature requests"
  ON feature_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Feature votes policies
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view votes"
  ON feature_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON feature_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feature_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Feature comments policies
ALTER TABLE feature_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments"
  ON feature_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON feature_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON feature_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON feature_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_comments_updated_at
  BEFORE UPDATE ON feature_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE feature_requests IS 'User-submitted feature requests and roadmap items';
COMMENT ON TABLE feature_votes IS 'Upvotes on feature requests (one per user per feature)';
COMMENT ON TABLE feature_comments IS 'Discussion threads on feature requests';
