-- Migration to split name into first_name and last_name columns

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing data (split current name field)
UPDATE public.profiles
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE ''
  END
WHERE name IS NOT NULL;

-- Create full_name as a generated column (virtual)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name VARCHAR(510) GENERATED ALWAYS AS (
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND last_name != '' 
    THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL 
    THEN first_name
    ELSE ''
  END
) STORED;

-- Drop the old name column (after verifying data is migrated)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS name;

-- Update RLS policies if needed
-- Existing policies should work fine as they don't reference the name column directly

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- Update any views that might reference the old name column
-- (Add view updates here if needed)

COMMENT ON COLUMN public.profiles.first_name IS 'User''s first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User''s last name';
COMMENT ON COLUMN public.profiles.full_name IS 'Computed full name (first + last)';