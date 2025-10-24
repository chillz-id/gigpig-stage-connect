-- Fix circular RLS dependency between organization_profiles and organization_team_members
-- Problem: Each table's RLS policies query the other, causing infinite recursion
-- Solution: Use SECURITY DEFINER functions to bypass RLS when checking membership

-- Drop existing functions first if they exist
DROP FUNCTION IF EXISTS public.is_organization_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_organization_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_organization_admin(uuid, uuid);

-- Create helper function to check if user is organization owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_profiles op
    WHERE op.id = is_organization_owner.org_id
      AND op.owner_id = is_organization_owner.user_id
  );
END;
$$;

-- Create helper function to check if user is organization member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_team_members otm
    WHERE otm.organization_id = is_organization_member.org_id
      AND otm.user_id = is_organization_member.user_id
  );
END;
$$;

-- Create helper function to check if user is organization admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_team_members otm
    WHERE otm.organization_id = is_organization_admin.org_id
      AND otm.user_id = is_organization_admin.user_id
      AND otm.role IN ('admin', 'owner')
  );
END;
$$;

-- Now recreate organization_profiles policies using the helper functions

DROP POLICY IF EXISTS "Users can view organizations they own or are members of" ON public.organization_profiles;
CREATE POLICY "Users can view organizations they own or are members of"
ON public.organization_profiles
FOR SELECT
TO public
USING (
  is_active = true  -- Anyone can view active orgs
  OR auth.uid() = owner_id  -- Owners can view their orgs
  OR is_organization_member(id, auth.uid())  -- Members can view their orgs (uses SECURITY DEFINER)
);

DROP POLICY IF EXISTS "Admins can update organizations" ON public.organization_profiles;
CREATE POLICY "Admins can update organizations"
ON public.organization_profiles
FOR UPDATE
TO public
USING (
  auth.uid() = owner_id  -- Owners can update
  OR is_organization_admin(id, auth.uid())  -- Admins can update (uses SECURITY DEFINER)
);

-- Recreate organization_team_members policies using helper functions

DROP POLICY IF EXISTS "View organization team" ON public.organization_team_members;
CREATE POLICY "View organization team"
ON public.organization_team_members
FOR SELECT
TO public
USING (
  auth.uid() = user_id  -- Can view own membership
  OR is_organization_owner(organization_id, auth.uid())  -- Owners can view team (uses SECURITY DEFINER)
);

DROP POLICY IF EXISTS "Owners can add team members" ON public.organization_team_members;
CREATE POLICY "Owners can add team members"
ON public.organization_team_members
FOR INSERT
TO public
WITH CHECK (
  is_organization_owner(organization_id, auth.uid())  -- Uses SECURITY DEFINER
);

DROP POLICY IF EXISTS "Owners can update team members" ON public.organization_team_members;
CREATE POLICY "Owners can update team members"
ON public.organization_team_members
FOR UPDATE
TO public
USING (
  is_organization_owner(organization_id, auth.uid())  -- Uses SECURITY DEFINER
);

DROP POLICY IF EXISTS "Owners can remove team members" ON public.organization_team_members;
CREATE POLICY "Owners can remove team members"
ON public.organization_team_members
FOR DELETE
TO public
USING (
  is_organization_owner(organization_id, auth.uid())  -- Uses SECURITY DEFINER
);

-- Add comments
COMMENT ON FUNCTION public.is_organization_owner IS 'SECURITY DEFINER function to check organization ownership without triggering RLS recursion';
COMMENT ON FUNCTION public.is_organization_member IS 'SECURITY DEFINER function to check organization membership without triggering RLS recursion';
COMMENT ON FUNCTION public.is_organization_admin IS 'SECURITY DEFINER function to check organization admin status without triggering RLS recursion';
