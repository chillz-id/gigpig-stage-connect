-- Organization Team Permissions System
-- Adds manager types and custom permissions to organization_team_members
-- Adds user preference for blended personal/org view

-- Add manager_type column to organization_team_members
ALTER TABLE organization_team_members
  ADD COLUMN IF NOT EXISTS manager_type TEXT CHECK (manager_type IS NULL OR manager_type IN (
    'general',
    'comedian_manager',
    'social_media',
    'tour_manager',
    'booking_manager',
    'content_manager',
    'financial_manager'
  ));

-- Add custom_permissions JSONB column with default structure
ALTER TABLE organization_team_members
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT NULL;

-- Add comment explaining the permissions structure
COMMENT ON COLUMN organization_team_members.custom_permissions IS
'Custom permissions override. Structure: { "financial": {"view": bool, "edit": bool, "delete": bool}, "team": {...}, "events": {...}, "media": {...}, "social": {...}, "tasks": {...}, "messages": {...}, "bookings": {...}, "analytics": {...} }. NULL means use default template for manager_type.';

-- Add user preference for blended view
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_org_in_personal_view BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.show_org_in_personal_view IS
'User preference: if true, show organization data in personal dashboard/profile. If false, keep org data separate (must switch to org profile to see it).';

-- Create function to get default permissions based on manager type
CREATE OR REPLACE FUNCTION get_default_permissions(p_manager_type TEXT, p_role TEXT)
RETURNS JSONB AS $$
DECLARE
  base_permissions JSONB;
  view_only JSONB := '{"view": true, "edit": false, "delete": false}'::jsonb;
  view_edit JSONB := '{"view": true, "edit": true, "delete": false}'::jsonb;
  full_access JSONB := '{"view": true, "edit": true, "delete": true}'::jsonb;
  no_access JSONB := '{"view": false, "edit": false, "delete": false}'::jsonb;
BEGIN
  -- Owner has full access to everything
  IF p_role = 'owner' THEN
    RETURN jsonb_build_object(
      'financial', full_access,
      'team', full_access,
      'events', full_access,
      'media', full_access,
      'social', full_access,
      'tasks', full_access,
      'messages', full_access,
      'bookings', full_access,
      'analytics', full_access
    );
  END IF;

  -- Admin has full access except financial delete
  IF p_role = 'admin' THEN
    RETURN jsonb_build_object(
      'financial', view_edit,
      'team', full_access,
      'events', full_access,
      'media', full_access,
      'social', full_access,
      'tasks', full_access,
      'messages', full_access,
      'bookings', full_access,
      'analytics', full_access
    );
  END IF;

  -- Manager types with specialized permissions
  CASE p_manager_type
    WHEN 'general' THEN
      -- General manager: view most, edit some
      base_permissions := jsonb_build_object(
        'financial', view_only,
        'team', view_edit,
        'events', view_edit,
        'media', view_edit,
        'social', view_edit,
        'tasks', full_access,
        'messages', full_access,
        'bookings', view_edit,
        'analytics', view_only
      );

    WHEN 'comedian_manager' THEN
      -- Manages comedians: bookings, events, messages
      base_permissions := jsonb_build_object(
        'financial', view_only,
        'team', view_only,
        'events', view_edit,
        'media', view_edit,
        'social', view_only,
        'tasks', view_edit,
        'messages', full_access,
        'bookings', full_access,
        'analytics', view_only
      );

    WHEN 'social_media' THEN
      -- Social media manager: media, social, analytics
      base_permissions := jsonb_build_object(
        'financial', no_access,
        'team', view_only,
        'events', view_only,
        'media', full_access,
        'social', full_access,
        'tasks', view_edit,
        'messages', view_edit,
        'bookings', view_only,
        'analytics', view_edit
      );

    WHEN 'tour_manager' THEN
      -- Tour manager: events, bookings, tasks
      base_permissions := jsonb_build_object(
        'financial', view_only,
        'team', view_only,
        'events', full_access,
        'media', view_edit,
        'social', view_only,
        'tasks', full_access,
        'messages', view_edit,
        'bookings', full_access,
        'analytics', view_only
      );

    WHEN 'booking_manager' THEN
      -- Booking manager: bookings, events, messages
      base_permissions := jsonb_build_object(
        'financial', view_only,
        'team', view_only,
        'events', view_edit,
        'media', view_only,
        'social', no_access,
        'tasks', view_edit,
        'messages', full_access,
        'bookings', full_access,
        'analytics', view_only
      );

    WHEN 'content_manager' THEN
      -- Content manager: media, social, events
      base_permissions := jsonb_build_object(
        'financial', no_access,
        'team', view_only,
        'events', view_edit,
        'media', full_access,
        'social', full_access,
        'tasks', view_edit,
        'messages', view_only,
        'bookings', view_only,
        'analytics', view_edit
      );

    WHEN 'financial_manager' THEN
      -- Financial manager: full financial access
      base_permissions := jsonb_build_object(
        'financial', full_access,
        'team', view_only,
        'events', view_only,
        'media', no_access,
        'social', no_access,
        'tasks', view_edit,
        'messages', view_only,
        'bookings', view_only,
        'analytics', full_access
      );

    ELSE
      -- Regular manager without type: view most, edit tasks
      base_permissions := jsonb_build_object(
        'financial', no_access,
        'team', view_only,
        'events', view_only,
        'media', view_only,
        'social', view_only,
        'tasks', view_edit,
        'messages', view_only,
        'bookings', view_only,
        'analytics', view_only
      );
  END CASE;

  -- Member (non-manager) gets minimal permissions
  IF p_role = 'member' THEN
    RETURN jsonb_build_object(
      'financial', no_access,
      'team', view_only,
      'events', view_only,
      'media', view_only,
      'social', no_access,
      'tasks', view_only,
      'messages', view_only,
      'bookings', no_access,
      'analytics', no_access
    );
  END IF;

  RETURN base_permissions;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create helper function to get effective permissions (custom overrides default)
CREATE OR REPLACE FUNCTION get_effective_permissions(
  p_organization_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  member_record RECORD;
  default_perms JSONB;
  effective_perms JSONB;
BEGIN
  -- Get team member record
  SELECT role, manager_type, custom_permissions
  INTO member_record
  FROM organization_team_members
  WHERE organization_id = p_organization_id
    AND user_id = p_user_id;

  -- Not a member
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get default permissions for role/type
  default_perms := get_default_permissions(
    member_record.manager_type,
    member_record.role
  );

  -- If custom permissions exist, merge them (custom overrides default)
  IF member_record.custom_permissions IS NOT NULL THEN
    effective_perms := default_perms || member_record.custom_permissions;
  ELSE
    effective_perms := default_perms;
  END IF;

  RETURN effective_perms;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_organization_team_members_permissions
  ON organization_team_members(organization_id, user_id)
  WHERE custom_permissions IS NOT NULL;

-- Add RLS policy for permission checking
-- Users can view their own permissions
CREATE POLICY "Users can view their own team member permissions"
  ON organization_team_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and owners can view all team permissions
CREATE POLICY "Admins can view all team permissions"
  ON organization_team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_team_members otm
      WHERE otm.organization_id = organization_team_members.organization_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_profiles op
      WHERE op.id = organization_team_members.organization_id
        AND op.owner_id = auth.uid()
    )
  );

-- Only admins and owners can update permissions
CREATE POLICY "Only admins can update team permissions"
  ON organization_team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_team_members otm
      WHERE otm.organization_id = organization_team_members.organization_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_profiles op
      WHERE op.id = organization_team_members.organization_id
        AND op.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_team_members otm
      WHERE otm.organization_id = organization_team_members.organization_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_profiles op
      WHERE op.id = organization_team_members.organization_id
        AND op.owner_id = auth.uid()
    )
  );
