-- Update refresh_customer_contact_data() to include Eventbrite orders
-- This extends the sync function to process both orders_htx and orders_eventbrite
-- Ensures Jessica Houch's address (and all Eventbrite customers) syncs to customer_addresses

CREATE OR REPLACE FUNCTION public.refresh_customer_contact_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  -- Set context for audit logging
  PERFORM set_config('app.change_context', 'cron', true);

  -- ============================================================================
  -- STEP 1: Sync Phone Numbers from orders_htx ONLY
  -- ============================================================================
  -- Note: Eventbrite doesn't capture phone numbers, only Humanitix does

  -- Get most recent non-null phone for each customer from orders
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
    true, -- is_primary
    'orders_sync',
    v_now,
    last_seen_at
  FROM customer_phones_from_orders
  ON CONFLICT (phone_e164, source) DO UPDATE
  SET
    last_seen_at = GREATEST(customer_phones.last_seen_at, EXCLUDED.last_seen_at),
    customer_id = EXCLUDED.customer_id; -- Update customer linkage if phone moved

  -- ============================================================================
  -- STEP 2: Sync Addresses from BOTH orders_htx AND orders_eventbrite
  -- ============================================================================

  -- Get most recent complete address for each customer from both order sources
  WITH customer_addresses_from_orders AS (
    -- Humanitix orders
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oh.address_street as line_1,
      NULL::text as line_2, -- orders_htx doesn't have line_2
      oh.address_suburb as suburb,
      oh.address_city as city,
      oh.address_state as state,
      oh.address_postal_code as postcode,
      oh.address_country as country,
      oh.ordered_at as last_seen_at,
      'humanitix_orders' as order_source
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
      oe.address_suburb as line_2, -- Eventbrite uses address_2 for suburb
      oe.address_suburb as suburb,
      oe.address_city as city,
      oe.address_state as state,
      oe.address_postal_code as postcode,
      oe.address_country as country,
      oe.ordered_at as last_seen_at,
      'eventbrite_orders' as order_source
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
  -- Deduplicate by customer_id to get most recent address across both sources
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
  -- First, update existing addresses from orders_sync
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
  -- Then insert new addresses for customers who don't have one from orders_sync yet
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
    true, -- is_primary
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

  -- Update customer_profiles with most recent non-null DOB from both order sources
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

    -- Eventbrite orders (uses 'dob' column, not 'purchaser_date_of_birth')
    SELECT DISTINCT ON (ce.customer_id)
      ce.customer_id,
      oe.dob as date_of_birth,
      oe.ordered_at as last_seen_at
    FROM orders_eventbrite oe
    JOIN customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(oe.purchaser_email))
      AND ce.source = 'orders_sync'
    WHERE oe.dob IS NOT NULL

    ORDER BY customer_id, last_seen_at DESC
  )
  -- Deduplicate by customer_id to get most recent DOB across both sources
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

  -- Reset context
  PERFORM set_config('app.change_context', '', true);
END;
$$;

COMMENT ON FUNCTION public.refresh_customer_contact_data() IS
'Syncs customer contact data (phone, address, DOB) from BOTH orders_htx AND orders_eventbrite to normalized customer tables. Run periodically to keep CRM data up to date.';

-- Run the sync function to backfill Eventbrite customer data
SELECT public.refresh_customer_contact_data();
