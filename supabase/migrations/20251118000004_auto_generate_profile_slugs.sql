-- Auto-generate profile slugs for existing users who don't have one
-- This ensures all users can navigate to their EPK via /comedian/:slug

-- Create slugify function if it doesn't exist
CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(text_input), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a helper function specifically for profile_slug generation
CREATE OR REPLACE FUNCTION generate_unique_profile_slug(
  base_slug TEXT,
  excluded_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  test_slug TEXT;
  counter INTEGER := 1;
  slug_exists BOOLEAN;
BEGIN
  test_slug := base_slug;

  LOOP
    SELECT EXISTS(
      SELECT 1 FROM profiles
      WHERE profile_slug = test_slug
      AND (excluded_id IS NULL OR id != excluded_id)
    ) INTO slug_exists;

    EXIT WHEN NOT slug_exists;

    test_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN test_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate profile slugs for all profiles that don't have one
-- Priority: stage_name > name > first_name last_name > email
UPDATE profiles
SET profile_slug = generate_unique_profile_slug(
  slugify(
    COALESCE(
      stage_name,
      name,
      NULLIF(trim(first_name || ' ' || last_name), ''),
      split_part(email, '@', 1)
    )
  ),
  id
)
WHERE profile_slug IS NULL;

COMMENT ON FUNCTION generate_unique_profile_slug IS 'Generates unique profile_slug values for profiles table';
