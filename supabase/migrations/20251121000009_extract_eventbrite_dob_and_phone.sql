-- Extract DOB and Phone from Eventbrite raw JSONB
-- Eventbrite captures both birth_date and cell_phone in raw->attendees[0]->profile
-- This migration adds the missing fields to match orders_htx schema

-- ============================================================================
-- STEP 1: Add DOB and Phone columns
-- ============================================================================

ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS purchaser_date_of_birth date,
  ADD COLUMN IF NOT EXISTS purchaser_mobile text;

-- ============================================================================
-- STEP 2: Update extraction trigger to include DOB and phone
-- ============================================================================

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

    -- Extract birth_date (new)
    NEW.purchaser_date_of_birth := (NEW.raw->'attendees'->0->'profile'->>'birth_date')::date;

    -- Extract cell_phone (new)
    NEW.purchaser_mobile := NEW.raw->'attendees'->0->'profile'->>'cell_phone';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Backfill existing records
-- ============================================================================

UPDATE orders_eventbrite
SET
  purchaser_date_of_birth = (raw->'attendees'->0->'profile'->>'birth_date')::date,
  purchaser_mobile = raw->'attendees'->0->'profile'->>'cell_phone'
WHERE raw IS NOT NULL
  AND raw->'attendees' IS NOT NULL
  AND jsonb_array_length(raw->'attendees') > 0
  AND raw->'attendees'->0->'profile' IS NOT NULL;

-- ============================================================================
-- STEP 4: Update sync function to include Eventbrite DOB and phone
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_customer_contact_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  PERFORM set_config('app.change_context', 'cron', true);

  -- ============================================================================
  -- STEP 1: Sync Phone Numbers from BOTH orders_htx AND orders_eventbrite
  -- ============================================================================

  WITH customer_phones_from_orders AS (
    -- Humanitix orders
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oh.mobile as phone_e164,
      oh.ordered_at as last_seen_at
    FROM orders_htx oh
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oh.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oh.mobile IS NOT NULL
      AND TRIM(oh.mobile) != ''

    UNION ALL

    -- Eventbrite orders (NEW: now includes phone)
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oe.purchaser_mobile as phone_e164,
      oe.ordered_at as last_seen_at
    FROM orders_eventbrite oe
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oe.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oe.purchaser_mobile IS NOT NULL
      AND TRIM(oe.purchaser_mobile) != ''

    ORDER BY customer_id, last_seen_at DESC
  )
  -- Deduplicate: keep most recent phone per customer, then most recent customer per phone
  , latest_phone_per_customer AS (
    SELECT DISTINCT ON (customer_id)
      customer_id,
      phone_e164,
      last_seen_at
    FROM customer_phones_from_orders
    ORDER BY customer_id, last_seen_at DESC
  )
  , unique_phones AS (
    SELECT DISTINCT ON (phone_e164)
      customer_id,
      phone_e164,
      last_seen_at
    FROM latest_phone_per_customer
    ORDER BY phone_e164, last_seen_at DESC
  )
  INSERT INTO customer_phones (
    customer_id,
    phone_e164,
    is_primary,
    source,
    first_seen_at,
    last_seen_at
  )
  SELECT
    customer_id,
    phone_e164,
    true,
    'orders_sync',
    v_now,
    last_seen_at
  FROM unique_phones
  ON CONFLICT (phone_e164, source) DO UPDATE
  SET
    last_seen_at = GREATEST(customer_phones.last_seen_at, EXCLUDED.last_seen_at),
    customer_id = EXCLUDED.customer_id;

  -- ============================================================================
  -- STEP 2: Sync Addresses from BOTH orders_htx AND orders_eventbrite
  -- ============================================================================

  WITH customer_addresses_from_orders AS (
    -- Humanitix orders
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oh.address_street as line_1,
      NULL::text as line_2,
      oh.address_suburb as suburb,
      oh.address_city as city,
      oh.address_state as state,
      oh.address_postal_code as postcode,
      oh.address_country as country,
      oh.ordered_at as last_seen_at
    FROM orders_htx oh
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oh.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE (
      oh.address_street IS NOT NULL
      OR oh.address_suburb IS NOT NULL
      OR oh.address_city IS NOT NULL
      OR oh.address_state IS NOT NULL
      OR oh.address_postal_code IS NOT NULL
      OR oh.address_country IS NOT NULL
    )

    UNION ALL

    -- Eventbrite orders
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oe.address_street as line_1,
      oe.address_suburb as line_2,
      oe.address_suburb as suburb,
      oe.address_city as city,
      oe.address_state as state,
      oe.address_postal_code as postcode,
      oe.address_country as country,
      oe.ordered_at as last_seen_at
    FROM orders_eventbrite oe
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oe.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE (
      oe.address_street IS NOT NULL
      OR oe.address_suburb IS NOT NULL
      OR oe.address_city IS NOT NULL
      OR oe.address_state IS NOT NULL
      OR oe.address_postal_code IS NOT NULL
      OR oe.address_country IS NOT NULL
    )

    ORDER BY customer_id, last_seen_at DESC
  )
  , latest_addresses AS (
    SELECT DISTINCT ON (customer_id)
      customer_id,
      line_1,
      line_2,
      suburb,
      city,
      state,
      postcode,
      country,
      last_seen_at
    FROM customer_addresses_from_orders
    ORDER BY customer_id, last_seen_at DESC
  )
  , updated_addresses AS (
    UPDATE customer_addresses ca
    SET
      line_1 = NULLIF(TRIM(new_addr.line_1), ''),
      line_2 = NULLIF(TRIM(new_addr.line_2), ''),
      suburb = NULLIF(TRIM(new_addr.suburb), ''),
      city = NULLIF(TRIM(new_addr.city), ''),
      state = NULLIF(TRIM(new_addr.state), ''),
      postcode = NULLIF(TRIM(new_addr.postcode), ''),
      country = NULLIF(TRIM(new_addr.country), ''),
      last_seen_at = new_addr.last_seen_at
    FROM latest_addresses new_addr
    WHERE ca.customer_id = new_addr.customer_id
      AND ca.source = 'orders_sync'
      AND ca.is_primary = true
    RETURNING ca.customer_id
  )
  INSERT INTO customer_addresses (
    customer_id,
    label,
    line_1,
    line_2,
    suburb,
    city,
    state,
    postcode,
    country,
    is_primary,
    source,
    first_seen_at,
    last_seen_at
  )
  SELECT
    new_addr.customer_id,
    'Primary',
    NULLIF(TRIM(new_addr.line_1), ''),
    NULLIF(TRIM(new_addr.line_2), ''),
    NULLIF(TRIM(new_addr.suburb), ''),
    NULLIF(TRIM(new_addr.city), ''),
    NULLIF(TRIM(new_addr.state), ''),
    NULLIF(TRIM(new_addr.postcode), ''),
    NULLIF(TRIM(new_addr.country), ''),
    true,
    'orders_sync',
    v_now,
    new_addr.last_seen_at
  FROM latest_addresses new_addr
  WHERE NOT EXISTS (
    SELECT 1 FROM customer_addresses
    WHERE customer_id = new_addr.customer_id
      AND source = 'orders_sync'
      AND is_primary = true
  )
  AND new_addr.customer_id NOT IN (SELECT customer_id FROM updated_addresses);

  -- ============================================================================
  -- STEP 3: Sync Date of Birth from BOTH orders_htx AND orders_eventbrite
  -- ============================================================================

  WITH customer_dob_from_orders AS (
    -- Humanitix orders
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oh.purchaser_date_of_birth as date_of_birth,
      oh.ordered_at as last_seen_at
    FROM orders_htx oh
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oh.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oh.purchaser_date_of_birth IS NOT NULL

    UNION ALL

    -- Eventbrite orders (NEW: now includes DOB)
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oe.purchaser_date_of_birth as date_of_birth,
      oe.ordered_at as last_seen_at
    FROM orders_eventbrite oe
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oe.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oe.purchaser_date_of_birth IS NOT NULL

    ORDER BY customer_id, last_seen_at DESC
  )
  , latest_dob AS (
    SELECT DISTINCT ON (customer_id)
      customer_id,
      date_of_birth
    FROM customer_dob_from_orders
    ORDER BY customer_id, last_seen_at DESC
  )
  UPDATE customer_profiles cp
  SET
    date_of_birth = dob.date_of_birth,
    updated_at = v_now
  FROM latest_dob dob
  WHERE cp.id = dob.customer_id
    AND (cp.date_of_birth IS NULL OR cp.date_of_birth IS DISTINCT FROM dob.date_of_birth);

  PERFORM set_config('app.change_context', '', true);
END;
$$;

COMMENT ON FUNCTION public.refresh_customer_contact_data() IS
'Syncs customer contact data (phone, address, DOB) from BOTH orders_htx AND orders_eventbrite. Handles duplicate phones by keeping most recent. Run periodically via cron.';

-- ============================================================================
-- STEP 5: Run sync to populate customer tables
-- ============================================================================

SELECT public.refresh_customer_contact_data();

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON COLUMN orders_eventbrite.purchaser_date_of_birth IS 'Extracted from raw->attendees[0]->profile->birth_date';
COMMENT ON COLUMN orders_eventbrite.purchaser_mobile IS 'Extracted from raw->attendees[0]->profile->cell_phone';
