-- Add url_slug to comedians
ALTER TABLE comedians ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS comedians_url_slug_unique ON comedians(url_slug) WHERE url_slug IS NOT NULL;

-- Add url_slug to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_url_slug_unique ON organizations(url_slug) WHERE url_slug IS NOT NULL;

-- Add url_slug to venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS venues_url_slug_unique ON venues(url_slug) WHERE url_slug IS NOT NULL;

-- Add url_slug to photographers (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photographers') THEN
    ALTER TABLE photographers ADD COLUMN IF NOT EXISTS url_slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS photographers_url_slug_unique ON photographers(url_slug) WHERE url_slug IS NOT NULL;
  END IF;
END $$;
