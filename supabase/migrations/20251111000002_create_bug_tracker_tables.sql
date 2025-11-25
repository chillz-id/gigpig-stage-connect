-- Bug reports table with simplified 4-status workflow
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 1000),
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  -- Statuses: requested, planned, in_progress, completed
  severity TEXT NOT NULL DEFAULT 'medium',
  -- Severity: low, medium, high, critical
  category TEXT,
  -- Categories: ui, functionality, performance, security, data
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_bug_status CHECK (status IN ('requested', 'planned', 'in_progress', 'completed')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_category CHECK (category IS NULL OR category IN ('ui', 'functionality', 'performance', 'security', 'data'))
);

-- Bug comments table
CREATE TABLE IF NOT EXISTS bug_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX idx_bug_reports_reported_by ON bug_reports(reported_by);
CREATE INDEX idx_bug_reports_assigned_to ON bug_reports(assigned_to);
CREATE INDEX idx_bug_comments_bug_id ON bug_comments(bug_id);
CREATE INDEX idx_bug_comments_user_id ON bug_comments(user_id);

-- RLS Policies

-- Everyone can read bug reports
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bug reports"
  ON bug_reports FOR SELECT
  USING (true);

-- Authenticated users can create bug reports
CREATE POLICY "Authenticated users can create bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Only admins can update/delete bug reports (status changes, assignments, etc.)
CREATE POLICY "Admins can update bug reports"
  ON bug_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can delete bug reports"
  ON bug_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::user_role
    )
  );

-- Bug comments policies
ALTER TABLE bug_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bug comments"
  ON bug_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON bug_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON bug_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON bug_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_comments_updated_at
  BEFORE UPDATE ON bug_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_bug_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bug_completed_timestamp
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_bug_completed_at();

-- Comments
COMMENT ON TABLE bug_reports IS 'User-reported bugs with simplified 4-status workflow: requested, planned, in_progress, completed';
COMMENT ON TABLE bug_comments IS 'Discussion threads on bug reports';
