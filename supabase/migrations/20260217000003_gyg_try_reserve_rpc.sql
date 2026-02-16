-- RPC function to handle GYG reserve in a single DB round trip
-- Replaces 5 sequential HTTP calls: product lookup, category validation,
-- event resolution, availability check, and reservation insert
CREATE OR REPLACE FUNCTION public.gyg_try_reserve(
  p_product_id TEXT,
  p_target_date TEXT,
  p_date_time TEXT,
  p_booking_items JSONB,
  p_gyg_booking_reference TEXT,
  p_reservation_reference TEXT,
  p_expires_at TIMESTAMPTZ,
  p_total_tickets INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_event RECORD;
  v_sold BIGINT;
  v_reserved BIGINT;
  v_capacity INTEGER;
  v_vacancies INTEGER;
  v_bad_cat TEXT;
BEGIN
  -- 1. Fetch active product
  SELECT * INTO v_product
  FROM gyg_products
  WHERE gyg_product_id = p_product_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'INVALID_PRODUCT',
      'message', format('Product %s not found', p_product_id)
    );
  END IF;

  -- 2. Validate booking item categories against product pricing_categories
  SELECT item->>'category' INTO v_bad_cat
  FROM jsonb_array_elements(p_booking_items) AS item
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_product.pricing_categories) AS cat
    WHERE cat->>'category' = item->>'category'
  )
  LIMIT 1;

  IF v_bad_cat IS NOT NULL THEN
    RETURN jsonb_build_object(
      'error', 'INVALID_TICKET_CATEGORY',
      'message', format('Ticket category ''%s'' is not supported for this product', v_bad_cat),
      'ticketCategory', v_bad_cat
    );
  END IF;

  -- 3. Resolve event by date
  IF v_product.event_name_match IS NOT NULL THEN
    SELECT id, capacity, event_date INTO v_event
    FROM events
    WHERE name = v_product.event_name_match
      AND event_date::date = p_target_date::date
    ORDER BY event_date
    LIMIT 1;
  ELSIF v_product.event_id IS NOT NULL THEN
    SELECT id, capacity, event_date INTO v_event
    FROM events
    WHERE id = v_product.event_id;
  END IF;

  IF v_event IS NULL OR v_event.id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'NO_AVAILABILITY',
      'message', 'No event found for the requested date'
    );
  END IF;

  -- 4. Cutoff check (event must be far enough in the future)
  IF v_event.event_date < (now() + make_interval(secs => COALESCE(v_product.cutoff_seconds, 3600))) THEN
    RETURN jsonb_build_object(
      'error', 'NO_AVAILABILITY',
      'message', 'Booking cutoff has passed'
    );
  END IF;

  -- 5. Check availability (capacity - sold across all platforms - active reservations)
  v_capacity := COALESCE(v_product.capacity_per_slot, v_event.capacity, 0);

  SELECT COALESCE(SUM(tickets_sold), 0) INTO v_sold
  FROM ticket_platforms
  WHERE event_id = v_event.id;

  SELECT COALESCE(SUM(total_tickets), 0) INTO v_reserved
  FROM gyg_reservations
  WHERE gyg_product_id = p_product_id
    AND status = 'active'
    AND expires_at > now();

  v_vacancies := GREATEST(0, v_capacity - v_sold - v_reserved);

  IF v_vacancies < p_total_tickets THEN
    RETURN jsonb_build_object(
      'error', 'NO_AVAILABILITY',
      'message', 'Not enough tickets available'
    );
  END IF;

  -- 6. Insert reservation
  INSERT INTO gyg_reservations (
    gyg_product_id, reservation_reference, gyg_booking_reference,
    date_time, booking_items, total_tickets, expires_at, status
  ) VALUES (
    p_product_id, p_reservation_reference, p_gyg_booking_reference,
    p_date_time::timestamptz, p_booking_items, p_total_tickets, p_expires_at, 'active'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;
