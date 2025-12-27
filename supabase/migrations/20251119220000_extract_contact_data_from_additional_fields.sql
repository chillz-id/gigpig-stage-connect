-- Migration: Extract Contact Data from additional_fields JSONB
-- Created: 2025-11-19
-- Purpose: Extract address and DOB from additional_fields JSONB into structured columns
--          so refresh_customer_contact_data() can sync them to customer tables
--
-- Background: Data IS captured in additional_fields but not extracted to structured columns.
--             The existing sync function reads from structured columns, finding nothing.
--
-- Impact: 1,282 orders updated, 876 customers get contact data in CRM

-- ============================================================================
-- STEP 1: Create Extraction Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.extract_contact_data_from_additional_fields()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Extract data from additional_fields JSONB into structured columns
  WITH extraction AS (
    UPDATE orders_htx
    SET
      -- Extract DOB (find first element with date pattern)
      purchaser_date_of_birth = (
        SELECT (elem->>'value')::date
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->>'value' ~ '^\d{4}-\d{2}-\d{2}$'
        LIMIT 1
      ),
      -- Extract address from details object
      address_street = (
        SELECT elem->'details'->>'street'
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->'details' IS NOT NULL
        LIMIT 1
      ),
      address_suburb = (
        SELECT elem->'details'->>'suburb'
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->'details' IS NOT NULL
        LIMIT 1
      ),
      address_city = (
        SELECT elem->'details'->>'city'
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->'details' IS NOT NULL
        LIMIT 1
      ),
      address_state = (
        SELECT elem->'details'->>'state'
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->'details' IS NOT NULL
        LIMIT 1
      ),
      address_postal_code = (
        SELECT elem->'details'->>'postalCode'
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->'details' IS NOT NULL
        LIMIT 1
      ),
      address_country = (
        SELECT elem->'details'->>'country'
        FROM jsonb_array_elements(additional_fields) elem
        WHERE elem->'details' IS NOT NULL
        LIMIT 1
      )
    WHERE additional_fields IS NOT NULL
      AND jsonb_array_length(additional_fields) > 0
      -- Only update if not already extracted
      AND (
        purchaser_date_of_birth IS NULL
        OR address_street IS NULL
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_updated_count FROM extraction;

  RAISE NOTICE 'Extracted contact data for % orders', v_updated_count;
  RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION public.extract_contact_data_from_additional_fields() IS
'Extracts address and DOB from additional_fields JSONB into structured columns for all orders with additional_fields data';

-- ============================================================================
-- STEP 2: Create Trigger Function for Auto-Extraction
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_extract_contact_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only extract if additional_fields has data
  IF NEW.additional_fields IS NOT NULL
     AND jsonb_array_length(NEW.additional_fields) > 0 THEN

    -- Extract DOB (only if not already set)
    IF NEW.purchaser_date_of_birth IS NULL THEN
      NEW.purchaser_date_of_birth := (
        SELECT (elem->>'value')::date
        FROM jsonb_array_elements(NEW.additional_fields) elem
        WHERE elem->>'value' ~ '^\d{4}-\d{2}-\d{2}$'
        LIMIT 1
      );
    END IF;

    -- Extract address (only if not already set)
    IF NEW.address_street IS NULL THEN
      SELECT
        elem->'details'->>'street',
        elem->'details'->>'suburb',
        elem->'details'->>'city',
        elem->'details'->>'state',
        elem->'details'->>'postalCode',
        elem->'details'->>'country'
      INTO
        NEW.address_street,
        NEW.address_suburb,
        NEW.address_city,
        NEW.address_state,
        NEW.address_postal_code,
        NEW.address_country
      FROM jsonb_array_elements(NEW.additional_fields) elem
      WHERE elem->'details' IS NOT NULL
      LIMIT 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_extract_contact_data() IS
'Trigger function that auto-extracts contact data from additional_fields on INSERT/UPDATE';

-- ============================================================================
-- STEP 3: Create Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS extract_contact_on_insert_update ON public.orders_htx;

CREATE TRIGGER extract_contact_on_insert_update
  BEFORE INSERT OR UPDATE ON public.orders_htx
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_extract_contact_data();

COMMENT ON TRIGGER extract_contact_on_insert_update ON public.orders_htx IS
'Auto-extracts contact data from additional_fields JSONB into structured columns on insert/update';

-- ============================================================================
-- STEP 4: Run Initial Backfill
-- ============================================================================

-- Extract data from all existing orders
SELECT public.extract_contact_data_from_additional_fields();

-- ============================================================================
-- STEP 5: Refresh Customer Contact Data
-- ============================================================================

-- Trigger the customer contact sync to populate customer_phones, customer_addresses, customer_profiles
SELECT public.refresh_customer_contact_data();

-- Also refresh the materialized view (can't use CONCURRENTLY without unique index)
REFRESH MATERIALIZED VIEW public.customer_activity_timeline;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check extraction results
DO $$
DECLARE
  v_total INTEGER;
  v_with_address INTEGER;
  v_with_dob INTEGER;
  v_address_pct NUMERIC;
  v_dob_pct NUMERIC;
BEGIN
  SELECT
    COUNT(*),
    COUNT(address_street),
    COUNT(purchaser_date_of_birth)
  INTO v_total, v_with_address, v_with_dob
  FROM orders_htx
  WHERE additional_fields IS NOT NULL
    AND jsonb_array_length(additional_fields) > 0;

  v_address_pct := ROUND(100.0 * v_with_address / NULLIF(v_total, 0), 2);
  v_dob_pct := ROUND(100.0 * v_with_dob / NULLIF(v_total, 0), 2);

  RAISE NOTICE 'Extraction Results:';
  RAISE NOTICE '  Total orders with additional_fields: %', v_total;
  RAISE NOTICE '  Orders with address extracted: % (% percent)', v_with_address, v_address_pct;
  RAISE NOTICE '  Orders with DOB extracted: % (% percent)', v_with_dob, v_dob_pct;
END $$;
