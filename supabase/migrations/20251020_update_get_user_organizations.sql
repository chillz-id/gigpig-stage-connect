-- Update get_user_organizations function to include permission fields
-- This fixes the organization profile page not loading

CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  org_id UUID,
  org_display_name TEXT,
  org_legal_name TEXT,
  org_type TEXT,
  is_owner BOOLEAN,
  member_role TEXT,
  manager_type TEXT,
  custom_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    op.id,
    op.display_name,
    op.legal_name,
    op.organization_type,
    (op.owner_id = p_user_id) as is_owner,
    COALESCE(otm.role, 'owner') as member_role,
    otm.manager_type,
    otm.custom_permissions
  FROM organization_profiles op
  LEFT JOIN organization_team_members otm ON otm.organization_id = op.id AND otm.user_id = p_user_id
  WHERE op.owner_id = p_user_id OR otm.user_id = p_user_id
  ORDER BY op.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_organizations IS 'Returns all organizations a user owns or is a member of, including permission fields';
