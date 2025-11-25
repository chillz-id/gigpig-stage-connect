-- Migration: Fix corrupted organization ID and prevent future corruption
-- Created: 2025-11-18
-- Issue: iD Comedy organization ID is the same as owner's user ID
-- Root cause: Organization was created with user ID instead of generating new UUID
-- Solution: Generate new org ID, update all references, add CHECK constraint

-- ============================================================================
-- Step 1: Generate new organization ID and update references
-- ============================================================================

DO $$
DECLARE
  old_org_id UUID := '2fc4f578-7216-447a-876c-7bf9f4c9b096';
  owner_profile_id UUID := '2fc4f578-7216-447a-876c-7bf9f4c9b096';
  new_org_id UUID;
  org_email TEXT;
  affected_rows INTEGER;
BEGIN
  -- Generate new UUID for organization
  new_org_id := gen_random_uuid();

  RAISE NOTICE 'Starting organization ID migration...';
  RAISE NOTICE 'Old org ID (Chillz user ID): %', old_org_id;
  RAISE NOTICE 'New org ID: %', new_org_id;
  RAISE NOTICE 'Owner ID (Chillz): %', owner_profile_id;

  -- Get organization email
  SELECT contact_email INTO org_email
  FROM organization_profiles
  WHERE id = old_org_id;

  -- Step 1a: Create a NEW profile record for the organization
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    new_org_id,
    'iD Comedy',  -- Organization name as first_name
    NULL,          -- No last_name for organizations
    org_email,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created new profile record for organization';

  -- Step 1b: Drop foreign key constraint temporarily
  ALTER TABLE organization_team_members
  DROP CONSTRAINT IF EXISTS organization_team_members_organization_id_fkey;

  RAISE NOTICE 'Dropped team members foreign key constraint';

  -- Step 1c: Update the organization profile ID
  UPDATE organization_profiles
  SET id = new_org_id
  WHERE id = old_org_id;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % organization profile record', affected_rows;

  -- Step 1d: Update organization_team_members to reference new ID
  UPDATE organization_team_members
  SET organization_id = new_org_id
  WHERE organization_id = old_org_id;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % team member records', affected_rows;

  -- Step 1e: Re-add the foreign key constraint
  ALTER TABLE organization_team_members
  ADD CONSTRAINT organization_team_members_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organization_profiles(id) ON DELETE CASCADE;

  RAISE NOTICE 'Re-added foreign key constraint with CASCADE';

  -- Step 1f: Verify the fix worked
  IF EXISTS (SELECT 1 FROM organization_profiles WHERE id = owner_id) THEN
    RAISE EXCEPTION 'Migration failed: Still have corrupted records where id = owner_id';
  END IF;

  RAISE NOTICE 'Migration successful! Organization now has unique profile and ID separate from owner';
END $$;

-- ============================================================================
-- Step 2: Add constraint to prevent future corruption
-- ============================================================================

-- Prevent owner_id from being the same as the organization id
-- owner_id must reference a user profile, never the org's own id
ALTER TABLE organization_profiles
ADD CONSTRAINT owner_id_not_self
CHECK (owner_id != id);

-- Add helpful comment
COMMENT ON CONSTRAINT owner_id_not_self ON organization_profiles IS
  'Prevents owner_id from being the same as the organization id - owner_id must reference a user profile';

-- ============================================================================
-- Step 3: Verification
-- ============================================================================

-- Verify no corrupted records remain
DO $$
DECLARE
  corrupted_count INTEGER;
  org_record RECORD;
BEGIN
  SELECT COUNT(*) INTO corrupted_count
  FROM organization_profiles
  WHERE id = owner_id;

  IF corrupted_count > 0 THEN
    RAISE WARNING 'Still have % corrupted record(s):', corrupted_count;

    FOR org_record IN
      SELECT id, organization_name, owner_id
      FROM organization_profiles
      WHERE id = owner_id
    LOOP
      RAISE WARNING '  - Organization: % (id: %, owner_id: %)',
        org_record.organization_name, org_record.id, org_record.owner_id;
    END LOOP;

    RAISE EXCEPTION 'Migration failed: Corrupted records still exist';
  ELSE
    RAISE NOTICE 'Verification passed: No corrupted owner_id records found';
  END IF;
END $$;

-- Verify constraint works (should fail if uncommented)
-- INSERT INTO organization_profiles (id, owner_id, organization_name, display_name, legal_name, organization_type, contact_email)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000001', -- Same as id - should fail!
--   'Test Org',
--   'Test Org Display',
--   'Test Org Legal',
--   'other',
--   'test@example.com'
-- );
-- Expected: ERROR: new row violates check constraint "owner_id_not_self"

-- ============================================================================
-- Rollback Instructions
-- ============================================================================

-- WARNING: Rollback is complex because we changed the primary key
-- If this migration causes critical issues:
--
-- 1. Remove the constraint first:
--    ALTER TABLE organization_profiles DROP CONSTRAINT IF EXISTS owner_id_not_self;
--
-- 2. You would need to:
--    a) Note the new org_id that was generated (check organization_profiles table)
--    b) Update organization_team_members back to old ID
--    c) Update organization_profiles back to old ID
--
-- 3. Better approach: Use Supabase PITR (Point-in-Time Recovery) to restore
--    to just before this migration ran
--
-- 4. Or accept the new ID and update any external references if they exist
