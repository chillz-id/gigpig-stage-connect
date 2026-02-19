-- Add bank details columns to profiles table for individual users (comedians)
-- These fields already exist in organization_profiles table

-- Add account_name (account holder name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_name text;
  END IF;
END $$;

-- Add BSB number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bsb'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bsb text;
  END IF;
END $$;

-- Add account number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_number text;
  END IF;
END $$;

COMMENT ON COLUMN profiles.account_name IS 'Bank account holder name for invoice payments';
COMMENT ON COLUMN profiles.bsb IS 'BSB number for invoice payments';
COMMENT ON COLUMN profiles.account_number IS 'Bank account number for invoice payments';
