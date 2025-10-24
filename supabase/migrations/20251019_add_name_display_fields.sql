-- Migration: Add first_name, last_name, name_display_preference to profiles table
-- Date: 2025-10-19
-- Description: Adds missing name fields to support name display preferences
--             This fixes the issue where stage name preference doesn't work
--             and profile information doesn't save properly.

-- Add first_name column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add last_name column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add name_display_preference column with check constraint
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS name_display_preference TEXT DEFAULT 'real';

-- Add check constraint for name_display_preference
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_name_display_preference_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_name_display_preference_check
      CHECK (name_display_preference IN ('real', 'stage', 'both'));
  END IF;
END $$;

-- Backfill first_name and last_name from existing name field
-- This splits the name on first space: "John Doe" -> first_name="John", last_name="Doe"
UPDATE profiles
SET
  first_name = CASE
    WHEN name IS NOT NULL AND position(' ' in name) > 0
    THEN split_part(name, ' ', 1)
    WHEN name IS NOT NULL
    THEN name
    ELSE NULL
  END,
  last_name = CASE
    WHEN name IS NOT NULL AND position(' ' in name) > 0
    THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL
  AND last_name IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN profiles.first_name IS 'User''s first name (legal/real name)';
COMMENT ON COLUMN profiles.last_name IS 'User''s last name (legal/real name)';
COMMENT ON COLUMN profiles.name_display_preference IS 'How the user''s name should be displayed: real (first + last), stage (stage_name), or both (stage_name + real name)';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_name_display
  ON profiles(name_display_preference);
