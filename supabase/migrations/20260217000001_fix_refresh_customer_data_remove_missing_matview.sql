-- Fix refresh_customer_data() function failing due to missing customer_activity_timeline matview
-- The function was trying to refresh a materialized view that doesn't exist,
-- causing the cron job to fail every 15 minutes and roll back all customer data syncs

CREATE OR REPLACE FUNCTION public.refresh_customer_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- STEP 1: Create customer profiles from new orders
  PERFORM public.sync_orders_to_customers();

  -- STEP 2: Refresh engagement metrics (lifetime orders, spend, etc.)
  PERFORM public.refresh_customer_engagement_metrics();

  -- STEP 3: Refresh marketing export data
  PERFORM public.refresh_customer_marketing_export();

  -- STEP 4: Refresh comedians seen data
  PERFORM public.refresh_customer_comedians_seen();

  -- STEP 5: Refresh contact data (phone, address, DOB from orders)
  PERFORM public.refresh_customer_contact_data();

  -- Note: Removed STEP 6 (customer_activity_timeline matview refresh)
  -- The matview was dropped but the function still referenced it
END;
$$;

COMMENT ON FUNCTION public.refresh_customer_data() IS
'Master function to refresh all customer data. Called by pg_cron every 15 minutes. Syncs orders to customers, calculates engagement metrics, exports marketing data, tracks comedians seen, and syncs contact data (phone, address, DOB).';
