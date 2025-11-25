-- Add url_slug to existing organizations that don't have one
-- Generate slug from organization_name using simple slugification

UPDATE organizations
SET url_slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(organization_name, '[^\w\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE url_slug IS NULL OR url_slug = '';

-- Show the results
SELECT id, organization_name, url_slug FROM organizations;
