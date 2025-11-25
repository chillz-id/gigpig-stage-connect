-- Add profile_tagline field to profiles table
-- This is a short, catchy tagline (max 200 chars) to display in profile headers
-- The bio field remains for the full biography shown in the bio section

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_tagline TEXT;

-- Add a comment to describe the field
COMMENT ON COLUMN profiles.profile_tagline IS 'Short tagline (max 200 chars) displayed in profile header. Different from bio which is the full biography.';
