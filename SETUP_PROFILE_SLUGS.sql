-- Create a function to generate profile slugs
CREATE OR REPLACE FUNCTION generate_profile_slug(user_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Create base slug from name
  base_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := REPLACE(base_slug, ' ', '-');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- If base_slug is empty, use a default
  IF base_slug = '' THEN
    base_slug := 'comedian';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM profiles 
      WHERE profile_slug = final_slug
    ) INTO slug_exists;
    
    IF NOT slug_exists THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update profile slug
CREATE OR REPLACE FUNCTION update_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not already set and name exists
  IF NEW.profile_slug IS NULL AND NEW.name IS NOT NULL THEN
    NEW.profile_slug := generate_profile_slug(NEW.name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate profile slugs
DROP TRIGGER IF EXISTS tr_generate_profile_slug ON profiles;
CREATE TRIGGER tr_generate_profile_slug
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_slug();

-- Update existing profiles that don't have slugs
UPDATE profiles 
SET profile_slug = generate_profile_slug(name)
WHERE profile_slug IS NULL AND name IS NOT NULL;

-- Add index for profile_slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_profile_slug ON profiles(profile_slug);

-- Add helpful comments
COMMENT ON COLUMN profiles.profile_slug IS 'URL-friendly slug for public profile pages (auto-generated from name)';
COMMENT ON FUNCTION generate_profile_slug(TEXT) IS 'Generates a unique URL-friendly slug from a user name';
COMMENT ON FUNCTION update_profile_slug() IS 'Trigger function to automatically generate profile slugs';