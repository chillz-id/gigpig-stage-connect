-- Task Management System
-- Creates universal task system for all user roles
-- Author: Claude Code
-- Date: 2025-10-20

-- =============================================
-- 1. TASKS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- =============================================
-- 2. TASK LINKS TABLE (Polymorphic Relationships)
-- =============================================

CREATE TABLE IF NOT EXISTS task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  linked_type TEXT NOT NULL CHECK (linked_type IN (
    'event',
    'gig',
    'message',
    'notification',
    'customer',
    'organization',
    'booking',
    'invoice',
    'media'
  )),
  linked_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate links
  UNIQUE(task_id, linked_type, linked_id)
);

-- Add indexes for task link queries
CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_linked_type ON task_links(linked_type);
CREATE INDEX IF NOT EXISTS idx_task_links_linked_id ON task_links(linked_id);
CREATE INDEX IF NOT EXISTS idx_task_links_type_id ON task_links(linked_type, linked_id);

-- =============================================
-- 3. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set completed_at when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  END IF;

  -- Clear completed_at when status changes from completed
  IF NEW.status != 'completed' AND (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON tasks;

CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- =============================================
-- 4. RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- Tasks: Users can only see/manage their own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Task Links: Users can only manage links for their own tasks
CREATE POLICY "Users can view links for their tasks"
  ON task_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_links.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links for their tasks"
  ON task_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_links.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links for their tasks"
  ON task_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_links.task_id
        AND tasks.user_id = auth.uid()
    )
  );

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Get task count by status for a user
CREATE OR REPLACE FUNCTION get_task_counts(p_user_id UUID)
RETURNS TABLE (
  pending_count BIGINT,
  in_progress_count BIGINT,
  completed_count BIGINT,
  overdue_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status != 'completed' AND due_date < NOW()) as overdue_count
  FROM tasks
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tasks linked to a specific entity
CREATE OR REPLACE FUNCTION get_linked_tasks(
  p_linked_type TEXT,
  p_linked_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.created_at,
    t.updated_at
  FROM tasks t
  INNER JOIN task_links tl ON tl.task_id = t.id
  WHERE t.user_id = p_user_id
    AND tl.linked_type = p_linked_type
    AND tl.linked_id = p_linked_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. COMMENTS
-- =============================================

COMMENT ON TABLE tasks IS 'Universal task management system for all user roles';
COMMENT ON TABLE task_links IS 'Polymorphic links between tasks and other entities (events, gigs, etc)';
COMMENT ON COLUMN tasks.status IS 'Task status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN task_links.linked_type IS 'Type of linked entity: event, gig, message, notification, customer, organization, booking, invoice, media';
COMMENT ON COLUMN task_links.metadata IS 'Additional metadata about the link (e.g., event title, customer name for display)';
