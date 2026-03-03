-- Add directory_profile_id to social_content_drafts
-- Allows spotlight drafts to reference directory profiles (performers not on the platform)
ALTER TABLE social_content_drafts
  ADD COLUMN IF NOT EXISTS directory_profile_id uuid REFERENCES directory_profiles(id);

-- Index for efficient lookups when checking for duplicate drafts
CREATE INDEX IF NOT EXISTS idx_social_content_drafts_directory_profile
  ON social_content_drafts(directory_profile_id)
  WHERE directory_profile_id IS NOT NULL;
