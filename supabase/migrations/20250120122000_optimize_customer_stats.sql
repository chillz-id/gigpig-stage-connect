-- Optimize customer stats refresh to use customer_profiles instead of heavy CRM view

CREATE OR REPLACE FUNCTION refresh_customer_stats()
RETURNS customer_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats customer_stats;
  v_new_count bigint;
  v_new_max timestamptz;
BEGIN
  SELECT * INTO v_stats
  FROM customer_stats
  WHERE id = 1
  FOR UPDATE;

  IF v_stats.total_count = 0 THEN
    SELECT
      COUNT(*)::bigint,
      MAX(created_at)
    INTO v_new_count, v_new_max
    FROM customer_profiles;
  ELSE
    SELECT
      COUNT(*)::bigint,
      MAX(created_at)
    INTO v_new_count, v_new_max
    FROM customer_profiles
    WHERE created_at > v_stats.last_customer_since;
  END IF;

  UPDATE customer_stats
  SET
    total_count = total_count + COALESCE(v_new_count, 0),
    last_customer_since = COALESCE(v_new_max, last_customer_since)
  WHERE id = 1
  RETURNING * INTO v_stats;

  RETURN v_stats;
END;
$$;
