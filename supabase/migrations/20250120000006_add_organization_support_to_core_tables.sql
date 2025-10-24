-- Migration: Add Organization Support to Core Tables
-- Date: 2025-01-20
-- Description: Adds organization_id column to core tables (events, invoices, messages, tasks, media)
--              to enable organizations to have their own separate data from user profiles

-- ============================================================================
-- STEP 1: Add organization_id to events table
-- ============================================================================

-- Add organization_id column (nullable - NULL means user-created event)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);

-- Add RLS policy for organization members to view org events
CREATE POLICY "Organization members can view org events" ON events
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_member(organization_id, auth.uid())
    )
  );

-- Add RLS policy for organization members to create org events
CREATE POLICY "Organization members can create org events" ON events
  FOR INSERT WITH CHECK (
    organization_id IS NOT NULL
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_admin(organization_id, auth.uid())
    )
  );

-- Add RLS policy for organization admins to update org events
CREATE POLICY "Organization admins can update org events" ON events
  FOR UPDATE USING (
    organization_id IS NOT NULL
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_admin(organization_id, auth.uid())
    )
  );

-- Add RLS policy for organization admins to delete org events
CREATE POLICY "Organization admins can delete org events" ON events
  FOR DELETE USING (
    organization_id IS NOT NULL
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_admin(organization_id, auth.uid())
    )
  );

-- Add comment
COMMENT ON COLUMN events.organization_id IS 'If set, this event is owned by an organization. If NULL, it''s a user-created event.';

-- ============================================================================
-- STEP 2: Add organization_id to invoices table (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    -- Add organization_id column
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);

    -- Add RLS policies
    EXECUTE 'CREATE POLICY "Organization members can view org invoices" ON invoices
      FOR SELECT USING (
        organization_id IS NOT NULL
        AND (
          is_organization_owner(organization_id, auth.uid())
          OR is_organization_member(organization_id, auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Organization admins can create org invoices" ON invoices
      FOR INSERT WITH CHECK (
        organization_id IS NOT NULL
        AND (
          is_organization_owner(organization_id, auth.uid())
          OR is_organization_admin(organization_id, auth.uid())
        )
      )';

    -- Add comment
    COMMENT ON COLUMN invoices.organization_id IS 'If set, this invoice belongs to an organization. If NULL, it''s a user invoice.';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add organization_id to messages table (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- Add organization_id column
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_messages_organization ON messages(organization_id);

    -- Add RLS policy
    EXECUTE 'CREATE POLICY "Organization members can view org messages" ON messages
      FOR SELECT USING (
        organization_id IS NOT NULL
        AND (
          is_organization_owner(organization_id, auth.uid())
          OR is_organization_member(organization_id, auth.uid())
        )
      )';

    -- Add comment
    COMMENT ON COLUMN messages.organization_id IS 'If set, this message is in organization context. If NULL, it''s a personal user message.';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create organization_tasks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',

  -- Assignment
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_invoice_id UUID,  -- Will add FK if invoices table exists

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_tasks_org ON organization_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_tasks_assigned ON organization_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_organization_tasks_created_by ON organization_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_tasks_status ON organization_tasks(status);
CREATE INDEX IF NOT EXISTS idx_organization_tasks_due_date ON organization_tasks(due_date);

-- Enable RLS
ALTER TABLE organization_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Organization members can view org tasks" ON organization_tasks
  FOR SELECT USING (
    is_organization_owner(organization_id, auth.uid())
    OR is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Organization members can create org tasks" ON organization_tasks
  FOR INSERT WITH CHECK (
    is_organization_owner(organization_id, auth.uid())
    OR is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Task assignees and org admins can update tasks" ON organization_tasks
  FOR UPDATE USING (
    auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR is_organization_owner(organization_id, auth.uid())
    OR is_organization_admin(organization_id, auth.uid())
  );

CREATE POLICY "Task creators and org admins can delete tasks" ON organization_tasks
  FOR DELETE USING (
    auth.uid() = created_by
    OR is_organization_owner(organization_id, auth.uid())
    OR is_organization_admin(organization_id, auth.uid())
  );

-- Add trigger for updated_at
CREATE TRIGGER update_organization_tasks_updated_at
  BEFORE UPDATE ON organization_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE organization_tasks IS 'Tasks created within organization context, assignable to team members';
COMMENT ON COLUMN organization_tasks.assigned_to IS 'Team member assigned to this task (must be org member)';
COMMENT ON COLUMN organization_tasks.related_event_id IS 'Optional link to an event this task relates to';

-- ============================================================================
-- STEP 5: Create organization_media table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,

  -- Media info
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('image', 'video')) NOT NULL,
  file_size INTEGER, -- bytes
  mime_type TEXT,

  -- Metadata
  title TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Organization
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  upload_date TIMESTAMPTZ DEFAULT NOW(),

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_media_org ON organization_media(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_media_uploaded_by ON organization_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_organization_media_type ON organization_media(file_type);
CREATE INDEX IF NOT EXISTS idx_organization_media_display_order ON organization_media(organization_id, display_order);

-- Enable RLS
ALTER TABLE organization_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view organization media" ON organization_media
  FOR SELECT USING (true);

CREATE POLICY "Organization members can upload media" ON organization_media
  FOR INSERT WITH CHECK (
    is_organization_owner(organization_id, auth.uid())
    OR is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Uploaders and org admins can update media" ON organization_media
  FOR UPDATE USING (
    auth.uid() = uploaded_by
    OR is_organization_owner(organization_id, auth.uid())
    OR is_organization_admin(organization_id, auth.uid())
  );

CREATE POLICY "Uploaders and org admins can delete media" ON organization_media
  FOR DELETE USING (
    auth.uid() = uploaded_by
    OR is_organization_owner(organization_id, auth.uid())
    OR is_organization_admin(organization_id, auth.uid())
  );

-- Add trigger
CREATE TRIGGER update_organization_media_updated_at
  BEFORE UPDATE ON organization_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE organization_media IS 'Media library for organizations - photos, videos, promotional materials';
COMMENT ON COLUMN organization_media.display_order IS 'Order for displaying media in galleries (lower = first)';

-- ============================================================================
-- STEP 6: Create organization_vouches table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vouch from/to
  from_organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  comment TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT vouch_has_source CHECK (
    (from_organization_id IS NOT NULL AND from_user_id IS NULL)
    OR (from_organization_id IS NULL AND from_user_id IS NOT NULL)
  ),
  CONSTRAINT vouch_has_target CHECK (
    (to_organization_id IS NOT NULL AND to_user_id IS NULL)
    OR (to_organization_id IS NULL AND to_user_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_vouches_from_org ON organization_vouches(from_organization_id);
CREATE INDEX IF NOT EXISTS idx_org_vouches_to_org ON organization_vouches(to_organization_id);
CREATE INDEX IF NOT EXISTS idx_org_vouches_from_user ON organization_vouches(from_user_id);
CREATE INDEX IF NOT EXISTS idx_org_vouches_to_user ON organization_vouches(to_user_id);

-- Enable RLS
ALTER TABLE organization_vouches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view vouches" ON organization_vouches
  FOR SELECT USING (true);

CREATE POLICY "Users and org admins can create vouches" ON organization_vouches
  FOR INSERT WITH CHECK (
    -- User creating vouch from themselves
    (from_user_id = auth.uid() AND from_organization_id IS NULL)
    -- Or org admin creating vouch from org
    OR (from_organization_id IS NOT NULL AND (
      is_organization_owner(from_organization_id, auth.uid())
      OR is_organization_admin(from_organization_id, auth.uid())
    ))
  );

-- Add trigger
CREATE TRIGGER update_organization_vouches_updated_at
  BEFORE UPDATE ON organization_vouches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE organization_vouches IS 'Vouches given by or to organizations (crown system)';
COMMENT ON COLUMN organization_vouches.from_organization_id IS 'Organization giving the vouch (mutually exclusive with from_user_id)';
COMMENT ON COLUMN organization_vouches.to_organization_id IS 'Organization receiving the vouch (mutually exclusive with to_user_id)';

-- ============================================================================
-- STEP 7: Create helper views for organization data
-- ============================================================================

-- View: Organization events with full details
CREATE OR REPLACE VIEW organization_events_view AS
SELECT
  e.*,
  op.organization_name,
  op.logo_url as organization_logo,
  op.organization_type
FROM events e
INNER JOIN organization_profiles op ON e.organization_id = op.id
WHERE e.organization_id IS NOT NULL;

COMMENT ON VIEW organization_events_view IS 'Events owned by organizations with organization details';

-- ============================================================================
-- STEP 8: Add summary statistics functions
-- ============================================================================

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_events', (SELECT COUNT(*) FROM events WHERE organization_id = org_id),
    'upcoming_events', (SELECT COUNT(*) FROM events WHERE organization_id = org_id AND event_date > NOW()),
    'total_tasks', (SELECT COUNT(*) FROM organization_tasks WHERE organization_id = org_id),
    'pending_tasks', (SELECT COUNT(*) FROM organization_tasks WHERE organization_id = org_id AND status IN ('todo', 'in_progress')),
    'team_members', (SELECT COUNT(*) FROM organization_team_members WHERE organization_id = org_id),
    'total_media', (SELECT COUNT(*) FROM organization_media WHERE organization_id = org_id),
    'vouches_received', (SELECT COUNT(*) FROM organization_vouches WHERE to_organization_id = org_id)
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_organization_stats IS 'Get summary statistics for an organization dashboard';

-- ============================================================================
-- Migration complete
-- ============================================================================
