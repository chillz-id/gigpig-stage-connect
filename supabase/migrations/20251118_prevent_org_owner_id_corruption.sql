-- Migration: Prevent organization owner_id corruption
-- Created: 2025-11-18
-- Issue: iD Comedy organization has id = owner_id (shares Chillz's profile UUID)
-- Root cause: ProfileCreationWizard reused user's profile ID instead of creating new org profile
-- Solution: Add CHECK constraint to prevent future occurrences, grandfather iD Comedy

-- ============================================================================
-- Add CHECK constraint with iD Comedy exception
-- ============================================================================

ALTER TABLE organization_profiles
ADD CONSTRAINT owner_id_not_self
CHECK (
  owner_id != id
  OR id = '2fc4f578-7216-447a-876c-7bf9f4c9b096' -- Exception for iD Comedy
);

COMMENT ON CONSTRAINT owner_id_not_self ON organization_profiles IS
  'Prevents owner_id from equaling organization id (user profile must be separate from org profile). Exception: iD Comedy (grandfathered in as historical data issue).';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  other_corrupted_count INTEGER;
BEGIN
  RAISE NOTICE 'Verifying CHECK constraint...';

  -- Test 1: Verify iD Comedy exception works
  UPDATE organization_profiles
  SET owner_id = owner_id
  WHERE id = '2fc4f578-7216-447a-876c-7bf9f4c9b096';

  RAISE NOTICE '✓ iD Comedy exception working correctly';

  -- Test 2: Verify no other orgs have this issue
  SELECT COUNT(*) INTO other_corrupted_count
  FROM organization_profiles
  WHERE id = owner_id
  AND id != '2fc4f578-7216-447a-876c-7bf9f4c9b096';

  IF other_corrupted_count > 0 THEN
    RAISE EXCEPTION 'Found % other organization(s) with id = owner_id!', other_corrupted_count;
  ELSE
    RAISE NOTICE '✓ No other organizations have id = owner_id issue';
  END IF;

  RAISE NOTICE 'Migration completed successfully';
END $$;

-- ============================================================================
-- Test constraint blocks new violations (commented out - uncomment to test)
-- ============================================================================

-- This should FAIL with CHECK constraint violation:
-- INSERT INTO organization_profiles (
--   id,
--   owner_id,
--   organization_name,
--   display_name,
--   legal_name,
--   organization_type,
--   contact_email
-- ) VALUES (
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

-- If needed, remove the constraint:
-- ALTER TABLE organization_profiles DROP CONSTRAINT IF EXISTS owner_id_not_self;
