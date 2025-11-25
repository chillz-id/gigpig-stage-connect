-- Fix customers_crm_v to include customer_segments array
-- This resolves the CRM customer visibility issue where the frontend expects
-- customer_segments but the view doesn't provide it

-- Drop existing view
DROP VIEW IF EXISTS customers_crm_v CASCADE;

-- Recreate view with customer_segments aggregation
CREATE OR REPLACE VIEW customers_crm_v AS
SELECT
  cp.id AS customer_id,
  ce.email AS primary_email,
  cp.first_name,
  cp.last_name,
  cp.canonical_full_name,
  cp.date_of_birth,
  cp.marketing_opt_in,
  cp.vip,
  cp.do_not_contact,
  cem.lifetime_orders,
  cem.lifetime_tickets,
  cem.lifetime_gross,
  cem.lifetime_net,
  cem.last_order_at,
  cem.most_recent_event_id,
  cem.most_recent_event_name,
  cem.preferred_venue,
  cem.first_seen_at,
  cem.last_seen_at,
  cp.created_at,
  cp.updated_at,
  -- Aggregate customer segments into an array
  -- Returns empty array for customers without segment assignments
  COALESCE(
    ARRAY_AGG(DISTINCT s.slug) FILTER (WHERE s.slug IS NOT NULL),
    ARRAY[]::text[]
  ) AS customer_segments
FROM customer_profiles cp
LEFT JOIN LATERAL (
  SELECT ce_1.email
  FROM customer_emails ce_1
  WHERE ce_1.customer_id = cp.id
  ORDER BY ce_1.is_primary DESC, ce_1.first_seen_at
  LIMIT 1
) ce ON true
LEFT JOIN customer_engagement_metrics cem ON cem.customer_id = cp.id
-- Join to segments through the many-to-many link table
LEFT JOIN customer_segment_links csl ON csl.customer_id = cp.id
LEFT JOIN segments s ON s.id = csl.segment_id
GROUP BY
  cp.id,
  ce.email,
  cp.first_name,
  cp.last_name,
  cp.canonical_full_name,
  cp.date_of_birth,
  cp.marketing_opt_in,
  cp.vip,
  cp.do_not_contact,
  cem.lifetime_orders,
  cem.lifetime_tickets,
  cem.lifetime_gross,
  cem.lifetime_net,
  cem.last_order_at,
  cem.most_recent_event_id,
  cem.most_recent_event_name,
  cem.preferred_venue,
  cem.first_seen_at,
  cem.last_seen_at,
  cp.created_at,
  cp.updated_at;

-- Add index on customer_segment_links for better performance
-- This speeds up the JOIN when aggregating segments
CREATE INDEX IF NOT EXISTS idx_customer_segment_links_customer_segment
ON customer_segment_links(customer_id, segment_id);

-- Grant appropriate permissions
GRANT SELECT ON customers_crm_v TO authenticated;
GRANT SELECT ON customers_crm_v TO service_role;

-- Add comment explaining the view
COMMENT ON VIEW customers_crm_v IS
'CRM customer view with aggregated segments. Returns all customers from customer_profiles with their primary email, engagement metrics, and array of segment slugs. Customers without segment assignments have an empty array for customer_segments.';
