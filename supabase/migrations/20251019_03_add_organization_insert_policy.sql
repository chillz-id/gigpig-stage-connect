-- Migration: Add INSERT policy for organization_profiles
-- Date: 2025-10-19
-- Description: Allow authenticated users to create organizations

-- Add INSERT policy for organization_profiles
CREATE POLICY "Users can create organizations" ON organization_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

COMMENT ON POLICY "Users can create organizations" ON organization_profiles IS
  'Authenticated users can create organizations where they are the owner';
