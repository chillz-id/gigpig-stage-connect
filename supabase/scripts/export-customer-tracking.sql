-- Export non-sensitive fields required for analytics and QA
COPY (
  SELECT
    customer_id,
    email,
    first_name,
    last_name,
    status,
    last_seen_at,
    notes
  FROM public.customer_tracking
  ORDER BY last_seen_at DESC NULLS LAST
) TO STDOUT WITH CSV HEADER;
