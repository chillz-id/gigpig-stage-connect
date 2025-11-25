-- =====================================================
-- Fix Timezone Comparison for Auto-Merge
-- =====================================================
-- Some Eventbrite events have local time stored as UTC (e.g., 19:00:00+00 instead of 08:00:00+00 for 7PM Sydney).
-- This migration adds a fallback comparison that handles this inconsistency by also comparing:
-- - Humanitix local time (correctly converted from UTC)
-- - Eventbrite stored time (treated as if already local)

-- Drop the views in cascade order
DROP VIEW IF EXISTS session_complete CASCADE;
DROP VIEW IF EXISTS session_financials CASCADE;

-- Recreate session_financials with improved timezone handling
CREATE VIEW session_financials AS
WITH humanitix_session_data AS (
  -- Humanitix sessions from sessions_htx (unchanged)
  SELECT
    s.source,
    s.source_id,
    s.event_source_id,
    COALESCE(s.start_date, e.start_date) AS start_date,
    COALESCE(s.timezone, e.timezone) AS timezone,
    COALESCE(NULLIF(TRIM(s.name), ''), e.name, s.source_id) AS resolved_name,
    regexp_replace(lower(COALESCE(NULLIF(TRIM(s.name), ''), e.name, '')), '[^a-z0-9]', '', 'g') AS normalized_name,
    regexp_replace(regexp_replace(lower(COALESCE(NULLIF(TRIM(s.name), ''), e.name, '')), '[^a-z0-9]', '', 'g'), 's$', '') AS normalized_name_singular,
    s.tags
  FROM sessions_htx s
  LEFT JOIN events_htx e ON e.source = s.source AND e.source_id = s.event_source_id
  WHERE COALESCE((s.raw->>'deleted')::boolean, false) = false
    AND COALESCE((s.raw->>'disabled')::boolean, false) = false
),
eventbrite_session_data AS (
  -- Eventbrite sessions derived from orders_eventbrite
  SELECT DISTINCT ON (COALESCE(o.session_source_id, o.event_source_id))
    'eventbrite' AS source,
    COALESCE(o.session_source_id, o.event_source_id) AS source_id,
    o.event_source_id,
    o.event_start_date AS start_date,
    o.event_timezone AS timezone,
    COALESCE(o.event_name, COALESCE(o.session_source_id, o.event_source_id)) AS resolved_name,
    regexp_replace(lower(COALESCE(o.event_name, '')), '[^a-z0-9]', '', 'g') AS normalized_name,
    regexp_replace(regexp_replace(lower(COALESCE(o.event_name, '')), '[^a-z0-9]', '', 'g'), 's$', '') AS normalized_name_singular
  FROM orders_eventbrite o
  WHERE COALESCE(o.session_source_id, o.event_source_id) IS NOT NULL
    AND o.event_start_date IS NOT NULL
  ORDER BY COALESCE(o.session_source_id, o.event_source_id), o.ordered_at DESC
),
humanitix_sessions AS (
  SELECT
    source, source_id, event_source_id, start_date, timezone,
    resolved_name, normalized_name, normalized_name_singular,
    tags
  FROM humanitix_session_data
  WHERE source = 'humanitix'
),
eventbrite_sessions AS (
  SELECT source, source_id, event_source_id, start_date, timezone,
    resolved_name, normalized_name, normalized_name_singular
  FROM eventbrite_session_data
),
manual_session_sources AS (
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM session_sources
),
manual_linked_session_sources AS (
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM manual_session_sources
  WHERE NOT (canonical_source = source AND canonical_session_source_id = source_session_id)
),
manual_self_session_sources AS (
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM manual_session_sources
  WHERE canonical_source = source AND canonical_session_source_id = source_session_id
),
auto_session_links AS (
  -- Auto-merge Eventbrite sessions with Humanitix sessions based on:
  -- 1. Same timezone
  -- 2. Start time within 30 minutes (handles both correct UTC and local-stored-as-UTC)
  -- 3. Fuzzy name matching
  SELECT DISTINCT ON (eb.source_id)
    'humanitix' AS canonical_source,
    h.source_id AS canonical_session_source_id,
    'eventbrite' AS source,
    eb.source_id AS source_session_id,
    COALESCE(eb.event_source_id, eb.source_id) AS source_event_id
  FROM eventbrite_sessions eb
  JOIN humanitix_sessions h ON
    h.start_date IS NOT NULL AND eb.start_date IS NOT NULL
    AND h.timezone IS NOT NULL AND eb.timezone IS NOT NULL
    AND h.timezone = eb.timezone
    -- Time comparison with fallback for incorrectly stored timezone data
    AND (
      -- Standard comparison: both timestamps correctly stored in UTC
      ABS(EXTRACT(EPOCH FROM (h.start_date - eb.start_date))) <= 1800
      OR
      -- Fallback: Eventbrite time stored as local-in-UTC
      -- Compare Humanitix local time with Eventbrite stored value (treating it as local)
      ABS(EXTRACT(EPOCH FROM (
        (h.start_date AT TIME ZONE h.timezone) - (eb.start_date)::timestamp
      ))) <= 1800
    )
    -- Fuzzy name matching
    AND (
      (eb.normalized_name <> '' AND eb.normalized_name = h.normalized_name) OR
      (eb.normalized_name <> '' AND eb.normalized_name = h.normalized_name_singular) OR
      (h.normalized_name <> '' AND h.normalized_name = eb.normalized_name_singular) OR
      (eb.normalized_name <> '' AND h.normalized_name <> '' AND
        (eb.normalized_name LIKE h.normalized_name || '%' OR h.normalized_name LIKE eb.normalized_name || '%'))
    )
  ORDER BY eb.source_id,
    -- Prefer exact time match, then fallback match
    CASE
      WHEN ABS(EXTRACT(EPOCH FROM (h.start_date - eb.start_date))) <= 1800 THEN 0
      ELSE 1
    END,
    ABS(EXTRACT(EPOCH FROM (h.start_date - eb.start_date))),
    h.source_id
),
unmatched_eventbrite AS (
  SELECT
    'eventbrite' AS canonical_source,
    es.source_id AS canonical_session_source_id,
    'eventbrite' AS source,
    es.source_id AS source_session_id,
    COALESCE(es.event_source_id, es.source_id) AS source_event_id
  FROM eventbrite_sessions es
  WHERE NOT EXISTS (
    SELECT 1 FROM manual_session_sources ms
    WHERE ms.source = 'eventbrite' AND ms.source_session_id = es.source_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM auto_session_links al
    WHERE al.source_session_id = es.source_id
  )
),
effective_session_sources AS (
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM manual_linked_session_sources
  UNION ALL
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM auto_session_links
  WHERE NOT EXISTS (
    SELECT 1 FROM manual_linked_session_sources ms
    WHERE ms.source = auto_session_links.source AND ms.source_session_id = auto_session_links.source_session_id
  )
  UNION ALL
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM manual_self_session_sources
  WHERE NOT EXISTS (
    SELECT 1 FROM auto_session_links al
    WHERE al.source = manual_self_session_sources.source AND al.source_session_id = manual_self_session_sources.source_session_id
  )
  UNION ALL
  SELECT canonical_source, canonical_session_source_id, source, source_session_id, source_event_id
  FROM unmatched_eventbrite
),
session_source_list AS (
  SELECT
    canonical_source,
    canonical_session_source_id,
    array_agg(DISTINCT source ORDER BY source) AS sources
  FROM effective_session_sources
  GROUP BY canonical_source, canonical_session_source_id
),
canonical_sessions AS (
  SELECT 'humanitix' AS canonical_source, s.source_id AS canonical_session_source_id
  FROM sessions_htx s
  WHERE s.source = 'humanitix'
    AND COALESCE((s.raw->>'deleted')::boolean, false) = false
    AND COALESCE((s.raw->>'disabled')::boolean, false) = false
  UNION
  SELECT DISTINCT canonical_source, canonical_session_source_id
  FROM effective_session_sources
  UNION
  SELECT 'humanitix', e.source_id
  FROM events_htx e
  WHERE e.source = 'humanitix'
    AND NOT EXISTS (
      SELECT 1 FROM sessions_htx s
      WHERE s.source = 'humanitix' AND s.event_source_id = e.source_id
    )
),
humanitix_orders AS (
  SELECT
    'humanitix' AS canonical_source,
    prepared_orders.session_key AS canonical_session_source_id,
    COUNT(*) AS order_count,
    SUM(prepared_orders.paid_amount_cents) AS gross_cents,
    SUM(prepared_orders.ticket_revenue_cents) AS ticket_revenue_cents,
    SUM(prepared_orders.fee_component_cents) AS fees_cents,
    SUM(prepared_orders.tax_component_cents) AS tax_cents,
    MAX(prepared_orders.ordered_at) AS last_order_at
  FROM (
    SELECT
      COALESCE(raw_orders.session_source_id, raw_orders.event_source_id) AS session_key,
      raw_orders.ordered_at,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.amount_cents ELSE 0 END AS paid_amount_cents,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.fee_component_cents ELSE 0 END AS fee_component_cents,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.tax_component_cents ELSE 0 END AS tax_component_cents,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.subtotal_cents ELSE 0 END AS ticket_revenue_cents
    FROM (
      SELECT
        session_source_id,
        event_source_id,
        ordered_at,
        COALESCE(total_cents, gross_sales_cents, net_sales_cents, 0) AS amount_cents,
        COALESCE(subtotal_cents, 0) AS subtotal_cents,
        COALESCE(fees_cents, GREATEST(COALESCE(booking_fee_cents, 0), COALESCE(humanitix_fee_cents, 0), COALESCE(passed_on_fee_cents, 0)), 0) AS fee_component_cents,
        COALESCE(taxes_cents, tax_cents, 0) AS tax_component_cents
      FROM orders_htx
    ) raw_orders
  ) prepared_orders
  WHERE prepared_orders.session_key IS NOT NULL
  GROUP BY prepared_orders.session_key
),
humanitix_tickets AS (
  SELECT
    'humanitix' AS canonical_source,
    COALESCE(session_source_id, event_source_id) AS canonical_session_source_id,
    COUNT(*) AS ticket_count
  FROM tickets_htx
  WHERE COALESCE(session_source_id, event_source_id) IS NOT NULL
  GROUP BY COALESCE(session_source_id, event_source_id)
),
eventbrite_orders AS (
  SELECT
    ss.canonical_source,
    ss.canonical_session_source_id,
    COUNT(*) AS order_count,
    SUM(prepared_orders.paid_amount_cents) AS gross_cents,
    SUM(prepared_orders.ticket_revenue_cents) AS ticket_revenue_cents,
    SUM(prepared_orders.fee_component_cents) AS fees_cents,
    SUM(prepared_orders.tax_component_cents) AS tax_cents,
    MAX(prepared_orders.ordered_at) AS last_order_at
  FROM (
    SELECT
      COALESCE(raw_orders.session_source_id, raw_orders.event_source_id) AS session_key,
      raw_orders.ordered_at,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.amount_cents ELSE 0 END AS paid_amount_cents,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.fee_component_cents ELSE 0 END AS fee_component_cents,
      CASE WHEN raw_orders.amount_cents > 0 THEN raw_orders.tax_component_cents ELSE 0 END AS tax_component_cents,
      CASE WHEN raw_orders.amount_cents > 0 THEN GREATEST(raw_orders.amount_cents - raw_orders.fee_component_cents - raw_orders.tax_component_cents, 0) ELSE 0 END AS ticket_revenue_cents
    FROM (
      SELECT
        session_source_id,
        event_source_id,
        ordered_at,
        COALESCE(total_cents, gross_sales_cents, net_sales_cents, 0) AS amount_cents,
        COALESCE(fees_cents, 0) AS fee_component_cents,
        COALESCE(taxes_cents, 0) AS tax_component_cents
      FROM orders_eventbrite
    ) raw_orders
  ) prepared_orders
  JOIN effective_session_sources ss ON
    ss.source = 'eventbrite' AND ss.source_session_id = prepared_orders.session_key
  GROUP BY ss.canonical_source, ss.canonical_session_source_id
),
eventbrite_tickets AS (
  SELECT
    ss.canonical_source,
    ss.canonical_session_source_id,
    COUNT(*) AS ticket_count
  FROM tickets_eventbrite te
  JOIN effective_session_sources ss ON
    ss.source = 'eventbrite' AND ss.source_session_id = COALESCE(te.session_source_id, te.event_source_id)
  GROUP BY ss.canonical_source, ss.canonical_session_source_id
)
SELECT
  cs.canonical_source,
  cs.canonical_session_source_id,
  COALESCE(s.name, e.name, cs.canonical_session_source_id) AS session_name,
  e.name AS event_name,
  COALESCE(s.event_source_id, e.source_id) AS event_source_id,
  COALESCE(s.start_date, e.start_date) AS session_start,
  COALESCE(s.timezone, e.timezone) AS timezone,
  CASE
    WHEN COALESCE(s.start_date, e.start_date) IS NULL THEN NULL
    WHEN COALESCE(s.timezone, e.timezone) IS NULL THEN COALESCE(s.start_date, e.start_date)
    ELSE TIMEZONE(COALESCE(s.timezone, e.timezone), COALESCE(s.start_date, e.start_date))
  END AS session_start_local,
  COALESCE(ho.order_count, 0) AS humanitix_order_count,
  COALESCE(ht.ticket_count, 0) AS humanitix_ticket_count,
  ROUND(COALESCE(ho.gross_cents, 0) / 100.0, 2) AS humanitix_gross_dollars,
  ROUND(COALESCE(ho.ticket_revenue_cents, 0) / 100.0, 2) AS humanitix_net_dollars,
  ROUND(COALESCE(ho.fees_cents, 0) / 100.0, 2) AS humanitix_fees_dollars,
  ROUND(COALESCE(ho.tax_cents, 0) / 100.0, 2) AS humanitix_tax_dollars,
  ho.last_order_at AS humanitix_last_order_at,
  COALESCE(eo.order_count, 0) AS eventbrite_order_count,
  COALESCE(et.ticket_count, 0) AS eventbrite_ticket_count,
  ROUND(COALESCE(eo.gross_cents, 0) / 100.0, 2) AS eventbrite_gross_dollars,
  ROUND(COALESCE(eo.ticket_revenue_cents, 0) / 100.0, 2) AS eventbrite_net_dollars,
  ROUND(COALESCE(eo.fees_cents, 0) / 100.0, 2) AS eventbrite_fees_dollars,
  ROUND(COALESCE(eo.tax_cents, 0) / 100.0, 2) AS eventbrite_tax_dollars,
  eo.last_order_at AS eventbrite_last_order_at,
  COALESCE(sl.sources, ARRAY[]::text[]) AS merged_sources,
  COALESCE(ho.order_count, 0) + COALESCE(eo.order_count, 0) AS total_order_count,
  COALESCE(ht.ticket_count, 0) + COALESCE(et.ticket_count, 0) AS total_ticket_count,
  ROUND((COALESCE(ho.gross_cents, 0) + COALESCE(eo.gross_cents, 0)) / 100.0, 2) AS total_gross_dollars,
  ROUND((COALESCE(ho.ticket_revenue_cents, 0) + COALESCE(eo.ticket_revenue_cents, 0)) / 100.0, 2) AS total_net_dollars,
  ROUND((COALESCE(ho.fees_cents, 0) + COALESCE(eo.fees_cents, 0)) / 100.0, 2) AS total_fees_dollars,
  ROUND((COALESCE(ho.tax_cents, 0) + COALESCE(eo.tax_cents, 0)) / 100.0, 2) AS total_tax_dollars,
  GREATEST(COALESCE(ho.last_order_at, '1970-01-01'::timestamptz), COALESCE(eo.last_order_at, '1970-01-01'::timestamptz)) AS last_order_at,
  s.tags
FROM canonical_sessions cs
LEFT JOIN sessions_htx s ON
  s.source = cs.canonical_source
  AND s.source_id = cs.canonical_session_source_id
  AND COALESCE((s.raw->>'deleted')::boolean, false) = false
  AND COALESCE((s.raw->>'disabled')::boolean, false) = false
LEFT JOIN events_htx e ON
  e.source = cs.canonical_source
  AND e.source_id = COALESCE(s.event_source_id, cs.canonical_session_source_id)
LEFT JOIN humanitix_orders ho ON
  ho.canonical_source = cs.canonical_source
  AND ho.canonical_session_source_id = cs.canonical_session_source_id
LEFT JOIN humanitix_tickets ht ON
  ht.canonical_source = cs.canonical_source
  AND ht.canonical_session_source_id = cs.canonical_session_source_id
LEFT JOIN eventbrite_orders eo ON
  eo.canonical_source = cs.canonical_source
  AND eo.canonical_session_source_id = cs.canonical_session_source_id
LEFT JOIN eventbrite_tickets et ON
  et.canonical_source = cs.canonical_source
  AND et.canonical_session_source_id = cs.canonical_session_source_id
LEFT JOIN session_source_list sl ON
  sl.canonical_source = cs.canonical_source
  AND sl.canonical_session_source_id = cs.canonical_session_source_id;

COMMENT ON VIEW session_financials IS
  'Aggregates Humanitix and Eventbrite session financials with auto-merge based on timezone, time (30 min window with local-time fallback), and fuzzy name matching';

-- Recreate session_complete view
CREATE VIEW session_complete AS
SELECT
  sf.canonical_source,
  sf.canonical_session_source_id,
  sf.event_source_id,
  sf.session_name,
  sf.event_name,
  sf.session_start,
  sf.timezone,
  sf.session_start_local,
  sf.humanitix_order_count,
  sf.humanitix_ticket_count,
  sf.humanitix_gross_dollars,
  sf.humanitix_net_dollars,
  sf.humanitix_fees_dollars,
  sf.humanitix_tax_dollars,
  sf.humanitix_last_order_at,
  sf.eventbrite_order_count,
  sf.eventbrite_ticket_count,
  sf.eventbrite_gross_dollars,
  sf.eventbrite_net_dollars,
  sf.eventbrite_fees_dollars,
  sf.eventbrite_tax_dollars,
  sf.eventbrite_last_order_at,
  sf.merged_sources,
  sf.total_order_count,
  sf.total_ticket_count,
  sf.total_gross_dollars,
  sf.total_net_dollars,
  sf.total_fees_dollars,
  sf.total_tax_dollars,
  sf.last_order_at,
  e.venue_name,
  e.venue_address,
  e.venue_city,
  e.venue_country,
  e.total_capacity AS capacity,
  e.url,
  CASE
    WHEN e.url IS NOT NULL THEN e.url || '/tickets?widget=popup'
    ELSE NULL
  END AS url_tickets_popup,
  e.slug,
  e.description,
  e.status,
  e.public,
  e.published,
  e.created_at,
  e.updated_at,
  e.ingested_at,
  e.banner_image_url,
  e.venue_lat_lng,
  (sf.session_start_local < NOW()) AS is_past,
  CASE
    WHEN sf.session_start_local < NOW() THEN NULL
    ELSE CEIL(EXTRACT(EPOCH FROM (sf.session_start_local - NOW())) / 86400)::INTEGER
  END AS days_until,
  e.raw->>'lat' AS latitude,
  e.raw->>'lon' AS longitude,
  sf.tags
FROM session_financials sf
LEFT JOIN events_htx e ON
  sf.event_source_id = e.source_id
  AND sf.canonical_source = e.source;

COMMENT ON VIEW session_complete IS
  'Unified view of Humanitix and Eventbrite sessions with complete event data and auto-merge support';

-- Grant access
GRANT SELECT ON session_financials TO authenticated;
GRANT SELECT ON session_financials TO anon;
GRANT SELECT ON session_complete TO authenticated;
GRANT SELECT ON session_complete TO anon;
