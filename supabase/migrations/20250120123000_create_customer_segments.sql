-- Enable multi-segment support for customers by introducing segment tables and updating the CRM view

-- Segments metadata table
CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Join table linking customers to segments
CREATE TABLE IF NOT EXISTS customer_segment_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE(customer_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_segment_links_customer ON customer_segment_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_links_segment ON customer_segment_links(segment_id);

-- Seed default segments
INSERT INTO segments (slug, name, color)
VALUES
  ('vip', 'VIP', '#A855F7'),
  ('regular', 'Regular', '#2563EB'),
  ('new', 'New', '#22C55E'),
  ('inactive', 'Inactive', '#6B7280')
ON CONFLICT (slug) DO NOTHING;

-- Populate customer links based on existing single-segment logic
INSERT INTO customer_segment_links (customer_id, segment_id, assigned_at)
SELECT DISTINCT
  cp.id,
  s.id,
  now()
FROM customer_profiles cp
LEFT JOIN customer_engagement_metrics cem ON cem.customer_id = cp.id
JOIN segments s ON s.slug = (
  CASE
    WHEN cp.lead_score >= 20 THEN 'vip'
    WHEN cp.lead_score >= 15 THEN 'regular'
    WHEN cem.lifetime_orders = 1 THEN 'new'
    WHEN cem.last_order_at < NOW() - INTERVAL '180 days' THEN 'inactive'
    ELSE 'regular'
  END
)
ON CONFLICT (customer_id, segment_id) DO NOTHING;

-- Recreate customers_crm_v with segment array
CREATE OR REPLACE VIEW customers_crm_v AS
SELECT
  cp.id,
  COALESCE(
    (SELECT email FROM customer_emails WHERE customer_id = cp.id AND is_primary = true LIMIT 1),
    (SELECT email FROM customer_emails WHERE customer_id = cp.id ORDER BY first_seen_at LIMIT 1)
  ) AS email,
  cp.first_name,
  cp.last_name,
  cp.canonical_full_name,
  (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS mobile,
  (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id AND is_primary = false LIMIT 1) AS landline,
  (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id ORDER BY is_primary DESC, first_seen_at ASC LIMIT 1) AS phone,
  (SELECT line_1 FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS address_line1,
  (SELECT line_2 FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS address_line2,
  (SELECT CONCAT_WS(' ', line_1, line_2) FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS address,
  (SELECT suburb FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS suburb,
  (SELECT city FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS city,
  (SELECT state FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS state,
  (SELECT postcode FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS postcode,
  (SELECT country FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) AS country,
  CASE
    WHEN EXISTS (SELECT 1 FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true) THEN
      (SELECT CONCAT_WS(', ', NULLIF(suburb, ''), NULLIF(state, ''), NULLIF(country, ''))
       FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1)
    ELSE NULL
  END AS location,
  NULL AS company,
  NULL::text AS age_band,
  cp.date_of_birth,
  cp.marketing_opt_in,
  cem.lifetime_orders AS total_orders,
  cem.lifetime_net AS total_spent,
  cem.last_order_at AS last_order_date,
  cem.most_recent_event_id AS last_event_id,
  cem.most_recent_event_name AS last_event_name,
  COALESCE(seg_data.primary_segment,
    CASE
      WHEN cp.lead_score >= 20 THEN 'vip'
      WHEN cp.lead_score >= 15 THEN 'regular'
      WHEN cem.lifetime_orders = 1 THEN 'new'
      WHEN cem.last_order_at < NOW() - INTERVAL '180 days' THEN 'inactive'
      ELSE 'regular'
    END
  ) AS customer_segment,
  cem.preferred_venue,
  (
    SELECT source
    FROM customer_orders_v
    WHERE LOWER(TRIM(email)) IN (
      SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
    )
    ORDER BY ordered_at ASC
    LIMIT 1
  ) AS source,
  NULL AS brevo_contact_id,
  NULL AS brevo_sync_status,
  NULL::timestamptz AS brevo_last_sync,
  cp.lead_score,
  cp.rfm_recency,
  cp.rfm_frequency,
  cp.rfm_monetary,
  cp.last_scored_at,
  cp.created_at,
  cp.updated_at,
  COALESCE(
    (
      SELECT MIN(ordered_at)
      FROM customer_orders_v
      WHERE LOWER(TRIM(email)) IN (
        SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
      )
    ),
    cp.created_at
  ) AS customer_since,
  seg_data.customer_segments
FROM customer_profiles cp
LEFT JOIN customer_engagement_metrics cem ON cem.customer_id = cp.id
LEFT JOIN LATERAL (
  SELECT
    COALESCE(array_agg(DISTINCT s.slug ORDER BY s.slug), ARRAY[]::text[]) AS customer_segments,
    (array_agg(DISTINCT s.slug ORDER BY s.slug))[1] AS primary_segment
  FROM customer_segment_links l
  JOIN segments s ON s.id = l.segment_id
  WHERE l.customer_id = cp.id
) seg_data ON TRUE
WHERE cp.do_not_contact = false OR cp.do_not_contact IS NULL;

COMMENT ON VIEW customers_crm_v IS 'CRM-compatible view that bridges customer_profiles with the schema expected by React UI hooks. Aggregates data from customer_profiles, customer_emails, customer_phones, customer_addresses, customer_engagement_metrics, customer_orders_v, and customer segments.';

GRANT SELECT ON customers_crm_v TO authenticated;
GRANT SELECT ON customers_crm_v TO service_role;

-- Segment counts view for quick analytics
CREATE OR REPLACE VIEW customer_segment_counts_v AS
SELECT
  s.slug,
  s.name,
  s.color,
  COUNT(l.customer_id) AS count
FROM segments s
LEFT JOIN customer_segment_links l ON l.segment_id = s.id
GROUP BY s.id
ORDER BY s.name;

GRANT SELECT ON customer_segment_counts_v TO authenticated;
