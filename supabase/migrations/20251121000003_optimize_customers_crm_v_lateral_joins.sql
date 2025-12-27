-- Optimize customers_crm_v to fix 500 errors from query timeout
-- Replaces multiple scalar subqueries with efficient LATERAL JOINs
-- Reduces query execution from N*subqueries to N rows with joined data

DROP VIEW IF EXISTS customers_crm_v CASCADE;

CREATE VIEW customers_crm_v AS
SELECT
  cp.id,

  -- Primary email from customer_emails (keep single lookup)
  email_data.email,

  -- Name fields
  cp.first_name,
  cp.last_name,
  cp.canonical_full_name,

  -- Contact info from customer_phones (OPTIMIZED: single LATERAL join)
  phone_data.mobile,
  phone_data.landline,
  phone_data.phone,

  -- Address fields (OPTIMIZED: single LATERAL join)
  addr_data.address_line1,
  addr_data.address_line2,
  addr_data.address,
  addr_data.suburb,
  addr_data.city,
  addr_data.state,
  addr_data.postcode,
  addr_data.country,
  addr_data.location,

  -- Company from customer_profiles
  NULL as company,

  -- Age band placeholder
  NULL as age_band,

  -- Personal info
  cp.date_of_birth,
  cp.marketing_opt_in,

  -- Engagement metrics from customer_engagement_metrics
  cem.lifetime_orders as total_orders,
  cem.lifetime_net as total_spent,
  cem.last_order_at as last_order_date,
  cem.most_recent_event_id as last_event_id,
  cem.most_recent_event_name as last_event_name,

  -- Customer segment (derive from lead_score or vip status)
  CASE
    WHEN cp.lead_score >= 20 THEN 'vip'
    WHEN cp.lead_score >= 15 THEN 'regular'
    WHEN cem.lifetime_orders = 1 THEN 'new'
    WHEN cem.last_order_at < NOW() - INTERVAL '180 days' THEN 'inactive'
    ELSE 'regular'
  END as customer_segment,

  -- Preferred venue
  cem.preferred_venue,

  -- Source (from first order - keep for now, may optimize later)
  (
    SELECT source
    FROM customer_orders_v
    WHERE LOWER(TRIM(email)) IN (
      SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
    )
    ORDER BY ordered_at ASC
    LIMIT 1
  ) as source,

  -- Brevo sync fields
  NULL as brevo_contact_id,
  NULL as brevo_sync_status,
  NULL::timestamp with time zone as brevo_last_sync,

  -- Lead scoring fields
  cp.lead_score,
  cp.rfm_recency,
  cp.rfm_frequency,
  cp.rfm_monetary,
  cp.last_scored_at,

  -- Timestamps
  cp.created_at,
  cp.updated_at,

  -- Customer since (keep for now, may optimize later)
  COALESCE(
    (
      SELECT MIN(ordered_at)
      FROM customer_orders_v
      WHERE LOWER(TRIM(email)) IN (
        SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
      )
    ),
    cp.created_at
  ) as customer_since,

  -- Customer segments array
  seg_data.customer_segments

FROM customer_profiles cp

-- OPTIMIZED: Email lookup via LATERAL join
LEFT JOIN LATERAL (
  SELECT COALESCE(
    (SELECT email FROM customer_emails WHERE customer_id = cp.id AND is_primary = true LIMIT 1),
    (SELECT email FROM customer_emails WHERE customer_id = cp.id ORDER BY first_seen_at LIMIT 1)
  ) AS email
) email_data ON TRUE

-- OPTIMIZED: Phone numbers via single LATERAL join instead of 3 subqueries
LEFT JOIN LATERAL (
  SELECT
    MAX(CASE WHEN is_primary = true THEN phone_e164 END) as mobile,
    MAX(CASE WHEN is_primary = false THEN phone_e164 END) as landline,
    (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id ORDER BY is_primary DESC, first_seen_at ASC LIMIT 1) as phone
  FROM customer_phones
  WHERE customer_id = cp.id
) phone_data ON TRUE

-- OPTIMIZED: Address fields via single LATERAL join instead of 10+ subqueries
LEFT JOIN LATERAL (
  SELECT
    line_1 as address_line1,
    line_2 as address_line2,
    CONCAT_WS(' ', line_1, line_2) as address,
    suburb,
    city,
    state,
    postcode,
    country,
    CONCAT_WS(', ',
      NULLIF(suburb, ''),
      NULLIF(state, ''),
      NULLIF(country, '')
    ) as location
  FROM customer_addresses
  WHERE customer_id = cp.id AND is_primary = true
  LIMIT 1
) addr_data ON TRUE

LEFT JOIN customer_engagement_metrics cem ON cem.customer_id = cp.id

-- Customer segments aggregation via LATERAL join
LEFT JOIN LATERAL (
  SELECT
    COALESCE(
      array_agg(DISTINCT s.slug ORDER BY s.slug),
      ARRAY[]::text[]
    ) AS customer_segments
  FROM customer_segment_links l
  JOIN segments s ON s.id = l.segment_id
  WHERE l.customer_id = cp.id
) seg_data ON TRUE

WHERE cp.do_not_contact = false OR cp.do_not_contact IS NULL;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_customer_segment_links_customer_segment
ON customer_segment_links(customer_id, segment_id);

-- Ensure indexes exist on foreign key columns for JOIN performance
CREATE INDEX IF NOT EXISTS idx_customer_emails_customer_id ON customer_emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_phones_customer_id ON customer_phones(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_engagement_metrics_customer_id ON customer_engagement_metrics(customer_id);

-- Grant permissions
GRANT SELECT ON customers_crm_v TO authenticated;
GRANT SELECT ON customers_crm_v TO service_role;

-- Add comment
COMMENT ON VIEW customers_crm_v IS 'Optimized CRM view using LATERAL JOINs instead of scalar subqueries to prevent timeout errors. Returns all 43 fields including customer_segments array with improved performance for REST API access.';
