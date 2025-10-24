-- Fix RLS infinite recursion in organization_profiles policies
-- Bug: Policies were comparing organization_team_members.organization_id = organization_team_members.id
-- Fix: Should compare organization_team_members.organization_id = organization_profiles.id

-- Drop and recreate the problematic policies with correct references

-- Fix "Users can view organizations they own or are members of" policy
DROP POLICY IF EXISTS "Users can view organizations they own or are members of" ON public.organization_profiles;

CREATE POLICY "Users can view organizations they own or are members of"
ON public.organization_profiles
FOR SELECT
TO public
USING (
  auth.uid() = owner_id
  OR auth.uid() IN (
    SELECT user_id
    FROM organization_team_members
    WHERE organization_team_members.organization_id = organization_profiles.id  -- FIXED: was organization_team_members.id
  )
  OR is_active = true
);

-- Fix "Admins can update organizations" policy
DROP POLICY IF EXISTS "Admins can update organizations" ON public.organization_profiles;

CREATE POLICY "Admins can update organizations"
ON public.organization_profiles
FOR UPDATE
TO public
USING (
  auth.uid() = owner_id
  OR auth.uid() IN (
    SELECT user_id
    FROM organization_team_members
    WHERE organization_team_members.organization_id = organization_profiles.id  -- FIXED: was organization_team_members.id
      AND role IN ('admin', 'owner')
  )
);

-- Add comment documenting the fix
COMMENT ON POLICY "Users can view organizations they own or are members of" ON public.organization_profiles IS
'Fixed infinite recursion: subquery now correctly joins organization_team_members.organization_id to organization_profiles.id';

COMMENT ON POLICY "Admins can update organizations" ON public.organization_profiles IS
'Fixed infinite recursion: subquery now correctly joins organization_team_members.organization_id to organization_profiles.id';
