-- Fix duplicate phone error in refresh_customer_contact_data()
-- Issue: Multiple customers can have the same phone number, causing ON CONFLICT to fail
-- Solution: Deduplicate by phone_e164 in addition to customer_id

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
  -- STEP 1: Sync Phone Numbers from orders_htx ONLY
  -- ============================================================================
  -- Note: Eventbrite doesn't capture phone numbers, only Humanitix does

  WITH customer_phones_from_orders AS (
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oh.mobile as phone_e164,
      oh.ordered_at as last_seen_at
    FROM orders_htx oh
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oh.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oh.mobile IS NOT NULL
      AND TRIM(oh.mobile) != ''
    ORDER BY ce.customer_id, oh.ordered_at DESC
  )
  -- Additional deduplication: if same phone used by multiple customers, keep most recent
  , unique_phones AS (
    SELECT DISTINCT ON (phone_e164)
      customer_id,
      phone_e164,
      last_seen_at
    FROM customer_phones_from_orders
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
  -- STEP 3: Sync Date of Birth from orders_htx ONLY
  -- ============================================================================
  -- Note: Eventbrite doesn't capture DOB, only Humanitix does

  WITH customer_dob_from_orders AS (
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oh.purchaser_date_of_birth as date_of_birth
    FROM orders_htx oh
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oh.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oh.purchaser_date_of_birth IS NOT NULL
    ORDER BY ce.customer_id, oh.ordered_at DESC
  )
  UPDATE customer_profiles cp
  SET
    date_of_birth = dob.date_of_birth,
    updated_at = v_now
  FROM customer_dob_from_orders dob
  WHERE cp.id = dob.customer_id
    AND (cp.date_of_birth IS NULL OR cp.date_of_birth IS DISTINCT FROM dob.date_of_birth);

  PERFORM set_config('app.change_context', '', true);
END;
$$;

COMMENT ON FUNCTION public.refresh_customer_contact_data() IS
'Syncs customer contact data (phone, address, DOB) from BOTH orders_htx AND orders_eventbrite. Handles duplicate phones by keeping most recent. Run periodically via cron.';

-- Run the sync function to complete the backfill
SELECT public.refresh_customer_contact_data();
