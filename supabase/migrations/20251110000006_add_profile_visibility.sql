-- Add profile_visible column to profiles table
-- Controls if profile appears in public browse/search
-- Promoters can still add to lineups via direct access

ALTER TABLE profiles
ADD COLUMN profile_visible BOOLEAN DEFAULT true;

-- Index for filtering in browse queries
CREATE INDEX idx_profiles_profile_visible ON profiles(profile_visible);

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_visible IS 'Controls if profile appears in public browse/search. Promoters can still add to lineups.';
