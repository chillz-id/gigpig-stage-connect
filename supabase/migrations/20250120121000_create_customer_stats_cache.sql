-- Customer stats cache for fast total count retrieval and rolling updates

CREATE TABLE IF NOT EXISTS customer_stats (
  id integer PRIMARY KEY DEFAULT 1,
  total_count bigint NOT NULL DEFAULT 0,
  last_customer_since timestamptz NOT NULL DEFAULT '1970-01-01T00:00:00Z'
);

INSERT INTO customer_stats (id, total_count, last_customer_since)
VALUES (1, 0, '1970-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION get_customer_stats()
RETURNS customer_stats
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM customer_stats WHERE id = 1;
$$;

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
      MAX(COALESCE(customer_since, v_stats.last_customer_since))
    INTO v_new_count, v_new_max
    FROM customers_crm_v;
  ELSE
    SELECT
      COUNT(*)::bigint,
      MAX(COALESCE(customer_since, v_stats.last_customer_since))
    INTO v_new_count, v_new_max
    FROM customers_crm_v
    WHERE COALESCE(customer_since, v_stats.last_customer_since) > v_stats.last_customer_since;
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

GRANT SELECT, UPDATE ON customer_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_customer_stats() TO authenticated;
