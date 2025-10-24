-- Helper function to update customer profile and related contact records atomically

CREATE OR REPLACE FUNCTION update_customer_profile(
  p_customer_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_mobile text,
  p_landline text,
  p_address_line1 text,
  p_address_line2 text,
  p_suburb text,
  p_city text,
  p_state text,
  p_postcode text,
  p_country text,
  p_marketing_opt_in boolean,
  p_segments text[] DEFAULT NULL
)
RETURNS customers_crm_v
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_first text := NULLIF(trim(p_first_name), '');
  v_last text := NULLIF(trim(p_last_name), '');
  v_email text := NULLIF(trim(p_email), '');
  v_mobile text := NULLIF(trim(p_mobile), '');
  v_landline text := NULLIF(trim(p_landline), '');
  v_address_line1 text := NULLIF(trim(p_address_line1), '');
  v_address_line2 text := NULLIF(trim(p_address_line2), '');
  v_suburb text := NULLIF(trim(p_suburb), '');
  v_city text := NULLIF(trim(p_city), '');
  v_state text := NULLIF(trim(p_state), '');
  v_postcode text := NULLIF(trim(p_postcode), '');
  v_country text := NULLIF(trim(p_country), '');
  v_canonical text := NULLIF(trim(concat_ws(' ', v_first, v_last)), '');
  v_email_id uuid;
  v_mobile_id uuid;
  v_landline_id uuid;
  v_address_id uuid;
  v_result customers_crm_v%ROWTYPE;
  v_segments text[] := CASE
    WHEN p_segments IS NULL THEN NULL
    ELSE ARRAY(
      SELECT DISTINCT NULLIF(trim(value), '')
      FROM unnest(p_segments) AS value
      WHERE NULLIF(trim(value), '') IS NOT NULL
      ORDER BY NULLIF(trim(value), '')
    )
  END;
BEGIN
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Email cannot be empty';
  END IF;

  UPDATE customer_profiles
  SET
    first_name = v_first,
    last_name = v_last,
    canonical_full_name = v_canonical,
    marketing_opt_in = p_marketing_opt_in,
    updated_at = v_now
  WHERE id = p_customer_id;

  SELECT id INTO v_email_id
  FROM customer_emails
  WHERE customer_id = p_customer_id AND is_primary = true
  LIMIT 1;

  IF v_email_id IS NULL THEN
    INSERT INTO customer_emails (customer_id, email, is_primary, source, first_seen_at, last_seen_at)
    VALUES (p_customer_id, v_email, true, 'crm_manual', v_now, v_now);
  ELSE
    UPDATE customer_emails
    SET email = v_email,
        last_seen_at = v_now
    WHERE id = v_email_id;
  END IF;

  SELECT id INTO v_mobile_id
  FROM customer_phones
  WHERE customer_id = p_customer_id AND is_primary = true
  LIMIT 1;

  IF v_mobile IS NULL THEN
    IF v_mobile_id IS NOT NULL THEN
      DELETE FROM customer_phones WHERE id = v_mobile_id;
    END IF;
  ELSE
    IF v_mobile_id IS NULL THEN
      INSERT INTO customer_phones (customer_id, phone_e164, is_primary, source, first_seen_at, last_seen_at)
      VALUES (p_customer_id, v_mobile, true, 'crm_manual', v_now, v_now);
    ELSE
      UPDATE customer_phones
      SET phone_e164 = v_mobile,
          last_seen_at = v_now
      WHERE id = v_mobile_id;
    END IF;
  END IF;

  SELECT id INTO v_landline_id
  FROM customer_phones
  WHERE customer_id = p_customer_id AND is_primary = false
  ORDER BY first_seen_at ASC
  LIMIT 1;

  IF v_landline IS NULL THEN
    IF v_landline_id IS NOT NULL THEN
      DELETE FROM customer_phones WHERE id = v_landline_id;
    END IF;
  ELSE
    IF v_landline_id IS NULL THEN
      INSERT INTO customer_phones (customer_id, phone_e164, is_primary, source, first_seen_at, last_seen_at)
      VALUES (p_customer_id, v_landline, false, 'crm_manual', v_now, v_now);
    ELSE
      UPDATE customer_phones
      SET phone_e164 = v_landline,
          last_seen_at = v_now
      WHERE id = v_landline_id;
    END IF;
  END IF;

  SELECT id INTO v_address_id
  FROM customer_addresses
  WHERE customer_id = p_customer_id AND is_primary = true
  LIMIT 1;

  IF v_address_line1 IS NULL
     AND v_address_line2 IS NULL
     AND v_suburb IS NULL
     AND v_city IS NULL
     AND v_state IS NULL
     AND v_postcode IS NULL
     AND v_country IS NULL THEN

    IF v_address_id IS NOT NULL THEN
      DELETE FROM customer_addresses WHERE id = v_address_id;
    END IF;
  ELSE
    IF v_address_id IS NULL THEN
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
      ) VALUES (
        p_customer_id,
        'Primary',
        v_address_line1,
        v_address_line2,
        v_suburb,
        v_city,
        v_state,
        v_postcode,
        v_country,
        true,
        'crm_manual',
        v_now,
        v_now
      );
    ELSE
      UPDATE customer_addresses
      SET line_1 = v_address_line1,
          line_2 = v_address_line2,
          suburb = v_suburb,
          city = v_city,
          state = v_state,
          postcode = v_postcode,
          country = v_country,
          last_seen_at = v_now
      WHERE id = v_address_id;
    END IF;
  END IF;

  IF p_segments IS NOT NULL THEN
    IF v_segments IS NULL OR array_length(v_segments, 1) IS NULL THEN
      DELETE FROM customer_segment_links
      WHERE customer_id = p_customer_id;
    ELSE
      DELETE FROM customer_segment_links l
      WHERE l.customer_id = p_customer_id
        AND NOT EXISTS (
          SELECT 1
          FROM segments s
          WHERE s.id = l.segment_id
            AND s.slug = ANY (v_segments)
        );

      INSERT INTO customer_segment_links (customer_id, segment_id, assigned_at)
      SELECT
        p_customer_id,
        s.id,
        v_now
      FROM segments s
      WHERE s.slug = ANY (v_segments)
      ON CONFLICT (customer_id, segment_id)
      DO UPDATE SET assigned_at = LEAST(customer_segment_links.assigned_at, v_now);
    END IF;
  END IF;

  SELECT * INTO v_result
  FROM customers_crm_v
  WHERE id = p_customer_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION update_customer_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  text[]
) IS 'Updates a customer profile plus primary email, phone(s), address, and segment assignments in a single transactional call and returns the refreshed CRM view row.';

GRANT EXECUTE ON FUNCTION update_customer_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  text[]
) TO authenticated;
