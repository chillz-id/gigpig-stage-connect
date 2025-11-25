-- Add standardized columns to comedians table to match profile switcher expectations
-- This ensures consistency across all profile types (comedian, manager, photographer, etc.)

-- Add name column (mirrors stage_name for consistency with other profile tables)
ALTER TABLE public.comedians
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add avatar_url column (mirrors headshot_url for consistency)
ALTER TABLE public.comedians
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add logo_url column for organization/brand logos
ALTER TABLE public.comedians
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Update existing records: copy stage_name to name and headshot_url to avatar_url
UPDATE public.comedians
SET
  name = stage_name,
  avatar_url = headshot_url
WHERE name IS NULL OR avatar_url IS NULL;

-- Create trigger to keep name and avatar_url in sync with stage_name and headshot_url
CREATE OR REPLACE FUNCTION sync_comedian_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync name with stage_name
  IF NEW.stage_name IS DISTINCT FROM OLD.stage_name THEN
    NEW.name = NEW.stage_name;
  END IF;

  -- Sync avatar_url with headshot_url
  IF NEW.headshot_url IS DISTINCT FROM OLD.headshot_url THEN
    NEW.avatar_url = NEW.headshot_url;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_comedian_profile_fields_trigger
BEFORE UPDATE ON public.comedians
FOR EACH ROW
EXECUTE FUNCTION sync_comedian_profile_fields();

-- Also sync on insert
CREATE OR REPLACE FUNCTION sync_comedian_profile_fields_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = COALESCE(NEW.name, NEW.stage_name);
  NEW.avatar_url = COALESCE(NEW.avatar_url, NEW.headshot_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_comedian_profile_fields_insert_trigger
BEFORE INSERT ON public.comedians
FOR EACH ROW
EXECUTE FUNCTION sync_comedian_profile_fields_on_insert();

-- Add comments to clarify column usage
COMMENT ON COLUMN public.comedians.name IS 'Standardized name field (synced with stage_name) for profile switcher consistency';
COMMENT ON COLUMN public.comedians.avatar_url IS 'Standardized avatar field (synced with headshot_url) for profile switcher consistency';
COMMENT ON COLUMN public.comedians.logo_url IS 'Optional logo/brand image for comedian profiles';
