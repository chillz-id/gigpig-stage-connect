-- Add structured address columns to orders_eventbrite table
-- This enables address sync from Eventbrite orders (matching orders_htx schema)

-- Add address columns (matching orders_htx structure)
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_suburb text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_postal_code text,
  ADD COLUMN IF NOT EXISTS address_country text;

-- Create function to extract address from Eventbrite JSONB
-- Eventbrite stores addresses in: raw->attendees[0]->profile->addresses->home
CREATE OR REPLACE FUNCTION extract_eventbrite_address()
RETURNS trigger AS $$
BEGIN
  -- Extract address from JSONB if it exists
  IF NEW.raw IS NOT NULL AND
     NEW.raw->'attendees' IS NOT NULL AND
     jsonb_array_length(NEW.raw->'attendees') > 0 THEN

    -- Get first attendee's home address
    NEW.address_street := NEW.raw->'attendees'->0->'profile'->'addresses'->'home'->>'address_1';
    NEW.address_suburb := NEW.raw->'attendees'->0->'profile'->'addresses'->'home'->>'address_2';
    NEW.address_city := NEW.raw->'attendees'->0->'profile'->'addresses'->'home'->>'city';
    NEW.address_state := NEW.raw->'attendees'->0->'profile'->'addresses'->'home'->>'region';
    NEW.address_postal_code := NEW.raw->'attendees'->0->'profile'->'addresses'->'home'->>'postal_code';
    NEW.address_country := NEW.raw->'attendees'->0->'profile'->'addresses'->'home'->>'country';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-extract on insert/update
DROP TRIGGER IF EXISTS extract_eventbrite_address_trigger ON orders_eventbrite;
CREATE TRIGGER extract_eventbrite_address_trigger
  BEFORE INSERT OR UPDATE ON orders_eventbrite
  FOR EACH ROW
  EXECUTE FUNCTION extract_eventbrite_address();

-- Backfill existing records
UPDATE orders_eventbrite
SET address_street = raw->'attendees'->0->'profile'->'addresses'->'home'->>'address_1',
    address_suburb = raw->'attendees'->0->'profile'->'addresses'->'home'->>'address_2',
    address_city = raw->'attendees'->0->'profile'->'addresses'->'home'->>'city',
    address_state = raw->'attendees'->0->'profile'->'addresses'->'home'->>'region',
    address_postal_code = raw->'attendees'->0->'profile'->'addresses'->'home'->>'postal_code',
    address_country = raw->'attendees'->0->'profile'->'addresses'->'home'->>'country'
WHERE raw IS NOT NULL
  AND raw->'attendees' IS NOT NULL
  AND jsonb_array_length(raw->'attendees') > 0
  AND raw->'attendees'->0->'profile'->'addresses'->'home' IS NOT NULL;

-- Add comment
COMMENT ON COLUMN orders_eventbrite.address_street IS 'Extracted from raw->attendees[0]->profile->addresses->home->address_1';
COMMENT ON COLUMN orders_eventbrite.address_suburb IS 'Extracted from raw->attendees[0]->profile->addresses->home->address_2 (Eventbrite uses address_2 for suburb)';
COMMENT ON COLUMN orders_eventbrite.address_city IS 'Extracted from raw->attendees[0]->profile->addresses->home->city';
COMMENT ON COLUMN orders_eventbrite.address_state IS 'Extracted from raw->attendees[0]->profile->addresses->home->region';
COMMENT ON COLUMN orders_eventbrite.address_postal_code IS 'Extracted from raw->attendees[0]->profile->addresses->home->postal_code';
COMMENT ON COLUMN orders_eventbrite.address_country IS 'Extracted from raw->attendees[0]->profile->addresses->home->country (ISO 2-letter code)';
