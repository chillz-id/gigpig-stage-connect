-- Backfill directory_profiles.profile_type
-- Sets all null profile_type values to 'comedian_lite' (the default for bulk imports)
UPDATE directory_profiles
SET profile_type = 'comedian_lite'
WHERE profile_type IS NULL;
