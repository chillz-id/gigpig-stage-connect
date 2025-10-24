-- Create CRM-compatible view for customer data
-- This view bridges customer_profiles with the schema expected by the React UI

CREATE OR REPLACE VIEW customers_crm_v AS
SELECT
  cp.id,

  -- Primary email from customer_emails (prioritize primary email)
  COALESCE(
    (SELECT email FROM customer_emails WHERE customer_id = cp.id AND is_primary = true LIMIT 1),
    (SELECT email FROM customer_emails WHERE customer_id = cp.id ORDER BY first_seen_at LIMIT 1)
  ) as email,

  -- Name fields
  cp.first_name,
  cp.last_name,
  cp.canonical_full_name,

  -- Contact info from customer_phones (phone_e164 field, prioritize primary)
  (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as mobile,
  (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id AND is_primary = false LIMIT 1) as phone,

  -- Address fields from customer_addresses (using line_1 as street_address)
  (SELECT line_1 FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as address,
  (SELECT suburb FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as suburb,
  (SELECT city FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as city,
  (SELECT state FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as state,
  (SELECT postcode FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as postcode,
  (SELECT country FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1) as country,

  -- Concatenated location (for backwards compatibility)
  CASE
    WHEN EXISTS (SELECT 1 FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true) THEN
      (SELECT CONCAT_WS(', ',
        NULLIF(suburb, ''),
        NULLIF(state, ''),
        NULLIF(country, '')
      ) FROM customer_addresses WHERE customer_id = cp.id AND is_primary = true LIMIT 1)
    ELSE NULL
  END as location,

  -- Company from customer_profiles
  NULL as company, -- Not in customer_profiles schema, set to NULL

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

  -- Preferred venue (from customer_engagement_metrics)
  cem.preferred_venue,

  -- Source (from first order)
  (
    SELECT source
    FROM customer_orders_v
    WHERE LOWER(TRIM(email)) IN (
      SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
    )
    ORDER BY ordered_at ASC
    LIMIT 1
  ) as source,

  -- Brevo sync fields (not currently implemented, set to NULL)
  NULL as brevo_contact_id,
  NULL as brevo_sync_status,
  NULL::timestamp with time zone as brevo_last_sync,

  -- Lead scoring fields (from customer_profiles)
  cp.lead_score,
  cp.rfm_recency,
  cp.rfm_frequency,
  cp.rfm_monetary,
  cp.last_scored_at,

  -- Timestamps
  cp.created_at,
  cp.updated_at

FROM customer_profiles cp
LEFT JOIN customer_engagement_metrics cem ON cem.customer_id = cp.id
WHERE cp.do_not_contact = false OR cp.do_not_contact IS NULL;

-- Add comment explaining the view
COMMENT ON VIEW customers_crm_v IS 'CRM-compatible view that bridges customer_profiles with the schema expected by React UI hooks. Aggregates data from customer_profiles, customer_emails, customer_phones, customer_addresses, customer_engagement_metrics, and customer_orders_v.';

-- Grant access to authenticated users (same as customer_profiles)
GRANT SELECT ON customers_crm_v TO authenticated;
GRANT SELECT ON customers_crm_v TO service_role;
