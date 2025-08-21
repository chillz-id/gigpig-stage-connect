-- Fix infinite recursion in agency RLS policies
-- Drop existing policies and recreate them without circular dependencies

-- Drop all existing policies for agencies table
DROP POLICY IF EXISTS "Agency owners can view their own agencies" ON public.agencies;
DROP POLICY IF EXISTS "Agency owners can insert their own agencies" ON public.agencies;
DROP POLICY IF EXISTS "Agency owners and managers can update their agencies" ON public.agencies;
DROP POLICY IF EXISTS "Agency owners can delete their own agencies" ON public.agencies;

-- Recreate agencies policies without circular dependencies
CREATE POLICY "Users can view agencies they own" ON public.agencies
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create agencies" ON public.agencies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Agency owners can update their agencies" ON public.agencies
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Agency owners can delete their agencies" ON public.agencies
  FOR DELETE USING (owner_id = auth.uid());

-- Drop and recreate manager_profiles policies to avoid recursion
DROP POLICY IF EXISTS "Managers can view profiles in their agencies" ON public.manager_profiles;
DROP POLICY IF EXISTS "Agency owners can insert manager profiles" ON public.manager_profiles;
DROP POLICY IF EXISTS "Agency owners and managers can update manager profiles" ON public.manager_profiles;
DROP POLICY IF EXISTS "Agency owners can delete manager profiles" ON public.manager_profiles;

-- Recreate manager_profiles policies
CREATE POLICY "Users can view their own manager profile" ON public.manager_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Agency owners can view all manager profiles in their agencies" ON public.manager_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners can insert manager profiles" ON public.manager_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own manager profile" ON public.manager_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Agency owners can update manager profiles in their agencies" ON public.manager_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners can delete manager profiles" ON public.manager_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- Now add a separate policy for managers to view agencies (after both tables have basic policies)
CREATE POLICY "Managers can view agencies they work for" ON public.agencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

-- Add policy for managers to update agencies they manage
CREATE POLICY "Primary managers can update their agencies" ON public.agencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );