-- Draft definition for the event_sessions_overview_v view.
-- This SQL is a starting point for a Supabase migration; adjust field list
-- and join logic against production data before shipping.

-- DROP VIEW IF EXISTS event_sessions_overview_v CASCADE;

CREATE VIEW event_sessions_overview_v AS
WITH source_map AS (
  SELECT
    canonical_source,
    canonical_session_source_id,
    jsonb_object_agg(source, source_session_id) FILTER (WHERE source_session_id IS NOT NULL) AS provider_session_ids,
    jsonb_object_agg(source, source_event_id) FILTER (WHERE source_event_id IS NOT NULL)   AS provider_event_ids,
    MAX(CASE WHEN source = canonical_source THEN source_session_id END)                    AS canonical_provider_session_id,
    MAX(CASE WHEN source = canonical_source THEN source_event_id END)                      AS canonical_provider_event_id,
    MAX(CASE WHEN source = 'humanitix' THEN source_session_id END)                         AS humanitix_session_id,
    MAX(CASE WHEN source = 'humanitix' THEN source_event_id END)                           AS humanitix_event_id,
    MAX(CASE WHEN source = 'eventbrite' THEN source_session_id END)                        AS eventbrite_session_id,
    MAX(CASE WHEN source = 'eventbrite' THEN source_event_id END)                          AS eventbrite_event_id
  FROM session_sources
  GROUP BY canonical_source, canonical_session_source_id
), base AS (
  SELECT
    sf.canonical_source,
    sf.canonical_session_source_id,
    sf.session_name,
    sf.event_name                                              AS sf_event_name,
    sf.event_source_id,
    sf.session_start,
    sf.timezone                                                AS sf_timezone,
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
    sf.total_order_count,
    sf.total_ticket_count,
    sf.total_gross_dollars,
    sf.total_net_dollars,
    sf.total_fees_dollars,
    sf.total_tax_dollars,
    sf.last_order_at,
    sf.merged_sources,
    sm.provider_session_ids,
    sm.provider_event_ids,
    sm.humanitix_session_id,
    sm.humanitix_event_id,
    sm.eventbrite_session_id,
    sm.eventbrite_event_id,
    sm.canonical_provider_session_id,
    sm.canonical_provider_event_id,
    ses.id                                                     AS internal_session_id,
    ses.event_id                                               AS internal_event_id,
    ses.starts_at                                              AS internal_session_start,
    ses.capacity                                               AS internal_capacity,
    ses.ticket_url                                             AS internal_ticket_url,
    ses.status                                                 AS internal_session_status,
    ses.venue_name                                             AS internal_session_venue,
    ev.title                                                   AS internal_event_title,
    ev.status                                                  AS internal_event_status,
    ev.type                                                    AS internal_event_type,
    ev.venue                                                   AS internal_event_venue,
    ev.address                                                 AS internal_event_address,
    ev.city                                                    AS internal_event_city,
    ev.state                                                   AS internal_event_state,
    ev.country                                                 AS internal_event_country,
    ev.spots                                                   AS internal_event_spots,
    ev.filled_slots                                            AS internal_event_filled_slots,
    ev.applied_spots                                           AS internal_event_applied_spots,
    ev.capacity                                                AS internal_event_capacity,
    ev.banner_url                                              AS internal_event_banner_url,
    ev.hero_image_url                                          AS internal_event_image_url
  FROM session_financials sf
  LEFT JOIN source_map sm
    ON sm.canonical_source = sf.canonical_source
   AND sm.canonical_session_source_id = sf.canonical_session_source_id
  LEFT JOIN sessions ses
    ON ses.source   = sf.canonical_source
   AND ses.source_id = sm.canonical_provider_session_id
  LEFT JOIN events ev
    ON ev.id = ses.event_id
)
SELECT
  base.canonical_source,
  base.canonical_session_source_id,
  base.internal_session_id                                    AS session_id,
  base.internal_event_id                                      AS event_id,
  COALESCE(base.internal_session_id::text,
           base.canonical_provider_session_id,
           base.canonical_session_source_id)                  AS stable_session_id,
  COALESCE(base.internal_event_id::text,
           base.canonical_provider_event_id,
           base.eventbrite_event_id,
           base.humanitix_event_id)                           AS stable_event_id,
  COALESCE(base.internal_event_title, base.sf_event_name)     AS event_name,
  base.session_name,
  session_start_utc,
  timezone(resolved_timezone, session_start_utc)              AS session_start_local,
  session_end_utc,
  timezone(resolved_timezone, session_end_utc)                AS session_end_local,
  resolved_timezone                                            AS timezone,
  (session_start_utc < NOW())                                 AS is_past,
  base.internal_session_status                                AS session_status,
  COALESCE(base.internal_event_status, base.internal_session_status) AS status,
  resolved_capacity                                           AS capacity,
  COALESCE(base.internal_ticket_url,
           htx_session.raw ->> 'ticketUrl',
           htx_event.url)                                     AS ticket_url,
  htx_event.url                                               AS event_url,
  htx_event.banner_image_url                                  AS event_banner_image_url,
  htx_event.feature_image_url                                 AS event_feature_image_url,
  htx_event.social_image_url                                  AS event_social_image_url,
  htx_event.venue_lat_lng                                     AS humanitix_venue_lat_lng,
  COALESCE(base.provider_session_ids, '{}'::jsonb)            AS provider_session_ids,
  COALESCE(base.provider_event_ids, '{}'::jsonb)              AS provider_event_ids,
  base.humanitix_session_id,
  base.humanitix_event_id,
  base.eventbrite_session_id,
  base.eventbrite_event_id,
  v.id                                                        AS venue_id,
  resolved_venue_name                                         AS venue_name,
  resolved_venue_address                                      AS venue_address,
  resolved_venue_city                                         AS venue_city,
  resolved_venue_state                                        AS venue_state,
  resolved_venue_postcode                                     AS venue_postcode,
  resolved_venue_country                                      AS venue_country,
  resolved_venue_latitude                                     AS venue_latitude,
  resolved_venue_longitude                                    AS venue_longitude,
  COALESCE(base.internal_event_type, htx_event.category)      AS event_type,
  base.internal_event_banner_url                              AS event_banner_url,
  base.internal_event_image_url                               AS event_image_url,
  base.humanitix_order_count,
  base.humanitix_ticket_count,
  base.humanitix_gross_dollars,
  base.humanitix_net_dollars,
  base.humanitix_fees_dollars,
  base.humanitix_tax_dollars,
  base.humanitix_last_order_at,
  base.eventbrite_order_count,
  base.eventbrite_ticket_count,
  base.eventbrite_gross_dollars,
  base.eventbrite_net_dollars,
  base.eventbrite_fees_dollars,
  base.eventbrite_tax_dollars,
  base.eventbrite_last_order_at,
  base.total_order_count,
  base.total_ticket_count,
  base.total_gross_dollars,
  base.total_net_dollars,
  base.total_fees_dollars,
  base.total_tax_dollars,
  sfa.humanitix_gross_cents,
  sfa.humanitix_net_cents,
  sfa.humanitix_fees_cents,
  sfa.humanitix_tax_cents,
  sfa.eventbrite_gross_cents,
  sfa.eventbrite_net_cents,
  sfa.eventbrite_fees_cents,
  sfa.eventbrite_tax_cents,
  sfa.total_gross_cents,
  sfa.total_net_cents,
  sfa.total_fees_cents,
  sfa.total_tax_cents,
  application_counts.total_applications,
  application_counts.pending_applications,
  application_counts.accepted_applications,
  application_counts.rejected_applications,
  application_counts.withdrawn_applications,
  application_counts.last_application_at,
  spot_counts.total_spots,
  spot_counts.filled_spots,
  spot_counts.open_spots,
  spot_counts.paid_spots,
  GREATEST(
    COALESCE(spot_counts.open_spots,
             COALESCE(base.internal_event_spots, 0) - COALESCE(base.internal_event_filled_slots, 0)),
    0
  )                                                          AS available_spots,
  spot_counts.waitlist_spots,
  COALESCE(base.internal_event_spots, spot_counts.total_spots) AS spots,
  COALESCE(base.internal_event_applied_spots, spot_counts.filled_spots, application_counts.total_applications) AS applied_spots,
  COALESCE(base.internal_event_filled_slots, spot_counts.filled_spots) AS filled_slots,
  customer_data.customer_samples,
  discount_data.discount_summary,
  lineup.confirmed_lineup,
  base.merged_sources,
  base.last_order_at,
  NOW()                                                       AS refreshed_at
FROM base
LEFT JOIN session_financials_agg sfa
  ON sfa.canonical_source = base.canonical_source
 AND sfa.canonical_session_source_id = base.canonical_session_source_id
LEFT JOIN sessions_htx htx_session
  ON htx_session.source_id = base.humanitix_session_id
LEFT JOIN events_htx htx_event
  ON htx_event.source_id = base.humanitix_event_id
LEFT JOIN venues v
  ON v.name IS NOT NULL
 AND base.internal_event_venue IS NOT NULL
 AND LOWER(v.name) = LOWER(base.internal_event_venue)
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                                   AS total_applications,
    COUNT(*) FILTER (WHERE a.status = 'pending')               AS pending_applications,
    COUNT(*) FILTER (WHERE a.status = 'accepted')              AS accepted_applications,
    COUNT(*) FILTER (WHERE a.status = 'rejected')              AS rejected_applications,
    COUNT(*) FILTER (WHERE a.status = 'withdrawn')             AS withdrawn_applications,
    MAX(a.applied_at)                                          AS last_application_at
  FROM applications a
  WHERE a.event_id = base.internal_event_id
) application_counts ON TRUE
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                                   AS total_spots,
    COUNT(*) FILTER (WHERE es.is_filled)                       AS filled_spots,
    COUNT(*) FILTER (WHERE NOT es.is_filled)                   AS open_spots,
    COUNT(*) FILTER (WHERE es.is_paid)                         AS paid_spots,
    COUNT(*) FILTER (WHERE es.confirmation_status = 'pending') AS waitlist_spots
  FROM event_spots es
  WHERE es.event_id = base.internal_event_id
) spot_counts ON TRUE
LEFT JOIN LATERAL (
  SELECT jsonb_strip_nulls(jsonb_build_object(
           'humanitix', (
             SELECT jsonb_agg(
                      jsonb_build_object(
                        'code', dc.discount_code,
                        'orders', dc.orders,
                        'discount_cents', dc.discount_cents,
                        'auto_discount_cents', dc.auto_discount_cents
                      )
                    )
             FROM (
               SELECT
                 ohx.discount_code_used                        AS discount_code,
                 COUNT(*)                                      AS orders,
                 SUM(COALESCE(ohx.discount_code_amount_cents, 0)) AS discount_cents,
                 SUM(COALESCE(ohx.auto_discount_amount_cents, 0)) AS auto_discount_cents
               FROM orders_htx ohx
               WHERE ohx.session_source_id = base.humanitix_session_id
                 AND ohx.discount_code_used IS NOT NULL
               GROUP BY ohx.discount_code_used
             ) dc
           ),
           'eventbrite', (
             SELECT CASE WHEN SUM(COALESCE(oeb.discounts_cents, 0)) <> 0 THEN
                      jsonb_build_object(
                        'orders', COUNT(*),
                        'discount_cents', SUM(COALESCE(oeb.discounts_cents, 0))
                      )
                    END
             FROM orders_eventbrite oeb
             WHERE oeb.session_source_id = base.eventbrite_session_id
           )
         )) AS discount_summary
) discount_data ON TRUE
LEFT JOIN LATERAL (
  SELECT jsonb_agg(
           jsonb_strip_nulls(jsonb_build_object(
             'spot_id', es.id,
             'spot_name', es.spot_name,
             'order', es.spot_order,
             'comedian_id', es.comedian_id,
             'comedian_display_name', COALESCE(p.display_name, p.stage_name, p.name),
             'comedian_first_name', p.first_name,
             'comedian_last_name', p.last_name,
             'comedian_stage_name', p.stage_name,
             'comedian_avatar_url', p.avatar_url,
             'comedian_profile_slug', p.profile_slug,
             'duration_minutes', es.duration_minutes,
             'payment_amount', es.payment_amount,
             'is_paid', es.is_paid,
             'confirmation_status', es.confirmation_status,
             'confirmed_at', es.confirmed_at
           ))
           ORDER BY es.spot_order NULLS LAST
         ) AS confirmed_lineup
  FROM event_spots es
  LEFT JOIN profiles p
    ON es.comedian_id = p.id
  WHERE es.event_id = base.internal_event_id
    AND es.is_filled
) lineup ON TRUE
LEFT JOIN LATERAL (
  SELECT jsonb_strip_nulls(jsonb_build_object(
           'humanitix', (
             SELECT jsonb_agg(
                      jsonb_build_object(
                        'order_reference', sample.order_reference,
                        'purchaser_name', sample.purchaser_name,
                        'purchaser_email', sample.purchaser_email,
                        'ordered_at', sample.ordered_at
                      )
                    )
             FROM (
               SELECT
                 ohx.order_reference,
                 ohx.purchaser_name,
                 ohx.purchaser_email,
                 ohx.ordered_at
               FROM orders_htx ohx
               WHERE ohx.session_source_id = base.humanitix_session_id
               ORDER BY ohx.ordered_at DESC
               LIMIT 5
             ) sample
           ),
           'eventbrite', (
             SELECT jsonb_agg(
                      jsonb_build_object(
                        'order_id', sample.source_id,
                        'purchaser_name', sample.purchaser_name,
                        'purchaser_email', sample.purchaser_email,
                        'ordered_at', sample.ordered_at
                      )
                    )
             FROM (
               SELECT
                 oeb.source_id,
                 oeb.purchaser_name,
                 oeb.purchaser_email,
                 oeb.ordered_at
               FROM orders_eventbrite oeb
               WHERE oeb.session_source_id = base.eventbrite_session_id
               ORDER BY oeb.ordered_at DESC
               LIMIT 5
             ) sample
           )
         )) AS customer_samples
) customer_data ON TRUE
CROSS JOIN LATERAL (
  SELECT
    COALESCE(base.session_start, base.internal_session_start, htx_session.start_date) AS session_start_utc,
    COALESCE(htx_session.end_date, base.session_start, base.internal_session_start)    AS session_end_utc,
    COALESCE(base.sf_timezone, htx_session.timezone, 'UTC')                            AS resolved_timezone,
    COALESCE(base.internal_capacity,
             base.internal_event_capacity,
             htx_event.total_capacity)                                                AS resolved_capacity,
    COALESCE(v.name,
             base.internal_event_venue,
             htx_session.venue_name,
             htx_event.venue_name,
             base.internal_session_venue)                                             AS resolved_venue_name,
    COALESCE(v.address_line1,
             base.internal_event_address,
             htx_event.venue_address,
             htx_event.eventlocation ->> 'street')                                    AS resolved_venue_address,
    COALESCE(v.city,
             base.internal_event_city,
             htx_event.venue_city,
             htx_event.eventlocation ->> 'city')                                      AS resolved_venue_city,
    COALESCE(v.state,
             base.internal_event_state,
             htx_event.eventlocation ->> 'state')                                     AS resolved_venue_state,
    COALESCE(v.postcode,
             htx_event.eventlocation ->> 'postcode')                                  AS resolved_venue_postcode,
    COALESCE(v.country,
             base.internal_event_country,
             htx_event.venue_country,
             htx_event.eventlocation ->> 'country')                                   AS resolved_venue_country,
    COALESCE(v.latitude,
             (htx_event.venue_lat_lng ->> 'lat')::double precision,
             (htx_event.eventlocation ->> 'lat')::double precision)                   AS resolved_venue_latitude,
    COALESCE(v.longitude,
             (htx_event.venue_lat_lng ->> 'lng')::double precision,
             (htx_event.eventlocation ->> 'lng')::double precision)                   AS resolved_venue_longitude
) derived;
