-- Helper function to slugify text
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

-- Generate unique slug with counter if needed
CREATE OR REPLACE FUNCTION generate_unique_slug(
  base_slug TEXT,
  profile_table TEXT,
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
    EXECUTE format(
      'SELECT EXISTS(SELECT 1 FROM %I WHERE url_slug = $1 AND ($2 IS NULL OR id != $2))',
      profile_table
    ) INTO slug_exists USING test_slug, excluded_id;

    EXIT WHEN NOT slug_exists;

    test_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN test_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate slugs for existing comedians
UPDATE comedians
SET url_slug = generate_unique_slug(slugify(name), 'comedians', id)
WHERE url_slug IS NULL;

-- Auto-generate slugs for existing organizations
UPDATE organizations
SET url_slug = generate_unique_slug(slugify(name), 'organizations', id)
WHERE url_slug IS NULL;

-- Auto-generate slugs for existing venues
UPDATE venues
SET url_slug = generate_unique_slug(slugify(name), 'venues', id)
WHERE url_slug IS NULL;

-- Auto-generate slugs for existing photographers if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photographers') THEN
    EXECUTE 'UPDATE photographers
             SET url_slug = generate_unique_slug(slugify(name), ''photographers'', id)
             WHERE url_slug IS NULL';
  END IF;
END $$;

-- Make url_slug NOT NULL now that all existing records have values
ALTER TABLE comedians ALTER COLUMN url_slug SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN url_slug SET NOT NULL;
ALTER TABLE venues ALTER COLUMN url_slug SET NOT NULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photographers') THEN
    ALTER TABLE photographers ALTER COLUMN url_slug SET NOT NULL;
  END IF;
END $$;
