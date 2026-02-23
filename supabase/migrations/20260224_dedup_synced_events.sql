-- Deduplicate synced events against org-owned events
--
-- Problem: sync_session_to_events() creates event rows from sessions_htx using
-- canonical_session_source_id as the conflict key. When an org creates events
-- separately (through the platform UI), the sync doesn't recognise them as the
-- same show and creates duplicates.
--
-- Fix: After every sync, merge synced duplicates into matching org events using
-- pg_trgm fuzzy title matching + same-date matching.

-- Enable pg_trgm for fuzzy title matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to merge synced events into matching org events
CREATE OR REPLACE FUNCTION merge_synced_into_org_events()
RETURNS TABLE(merged INT, deleted INT) AS $$
DECLARE
  v_merged INT := 0;
  v_deleted INT := 0;
BEGIN
  -- Find synced events that duplicate org events (same date + similar title)
  WITH dedup_pairs AS (
    SELECT DISTINCT ON (synced.id)
      synced.id as synced_id,
      org.id as org_id,
      synced.canonical_session_source_id as css_id,
      synced.ticket_count as s_ticket_count,
      synced.order_count as s_order_count,
      synced.gross_dollars as s_gross_dollars,
      synced.net_dollars as s_net_dollars,
      synced.fees_dollars as s_fees_dollars,
      synced.tax_dollars as s_tax_dollars,
      synced.last_order_at as s_last_order_at,
      synced.ticket_url as s_ticket_url,
      synced.ticket_popup_url as s_ticket_popup_url,
      synced.banner_url as s_banner_url
    FROM events synced
    JOIN events org ON
      DATE(org.event_date) = DATE(synced.event_date)
      AND org.organization_id IS NOT NULL
      AND synced.organization_id IS NULL
      AND synced.is_synced = true
      -- Title similarity using pg_trgm (0.25 catches variants like
      -- "ID Comedy Club" vs "iD Comedy Club - Carousel LAUNCH!")
      AND similarity(lower(org.title), lower(synced.title)) > 0.25
    ORDER BY synced.id, similarity(lower(org.title), lower(synced.title)) DESC
  ),
  -- Update org events with financial data from synced duplicates
  updated AS (
    UPDATE events org SET
      ticket_count = GREATEST(COALESCE(org.ticket_count, 0), COALESCE(d.s_ticket_count, 0)),
      order_count = GREATEST(COALESCE(org.order_count, 0), COALESCE(d.s_order_count, 0)),
      gross_dollars = GREATEST(COALESCE(org.gross_dollars, 0)::numeric, COALESCE(d.s_gross_dollars, 0)::numeric),
      net_dollars = GREATEST(COALESCE(org.net_dollars, 0)::numeric, COALESCE(d.s_net_dollars, 0)::numeric),
      fees_dollars = GREATEST(COALESCE(org.fees_dollars, 0)::numeric, COALESCE(d.s_fees_dollars, 0)::numeric),
      tax_dollars = GREATEST(COALESCE(org.tax_dollars, 0)::numeric, COALESCE(d.s_tax_dollars, 0)::numeric),
      last_order_at = GREATEST(org.last_order_at, d.s_last_order_at),
      ticket_url = COALESCE(org.ticket_url, d.s_ticket_url),
      ticket_popup_url = COALESCE(org.ticket_popup_url, d.s_ticket_popup_url),
      banner_url = COALESCE(org.banner_url, d.s_banner_url),
      -- Link to the canonical session so future syncs update in-place
      canonical_session_source_id = COALESCE(org.canonical_session_source_id, d.css_id),
      is_synced = true,
      synced_at = now(),
      updated_at = now()
    FROM dedup_pairs d
    WHERE org.id = d.org_id
    RETURNING org.id
  ),
  -- Delete the synced duplicates
  deleted_rows AS (
    DELETE FROM events
    WHERE id IN (SELECT synced_id FROM dedup_pairs)
    RETURNING id
  )
  SELECT COUNT(*)::int, COUNT(*)::int
  INTO v_merged, v_deleted
  FROM deleted_rows;

  RETURN QUERY SELECT v_merged, v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Update sync_session_to_events to call merge_synced_into_org_events() after sync
CREATE OR REPLACE FUNCTION sync_session_to_events(
  p_canonical_session_source_id TEXT DEFAULT NULL
) RETURNS TABLE(synced_count INT, inserted_count INT, updated_count INT) AS $$
DECLARE
  v_synced INT := 0;
  v_inserted INT := 0;
  v_updated INT := 0;
  v_dedup_merged INT := 0;
  v_dedup_deleted INT := 0;
BEGIN
  WITH source_data AS (
    SELECT
      sc.canonical_source AS source,
      sc.event_source_id AS source_id,
      sc.canonical_session_source_id,
      COALESCE(sc.session_name, sc.event_name, 'Untitled Event') AS title,
      sc.session_name AS name,
      sc.description,
      COALESCE(sc.venue_name, 'TBA') AS venue,
      COALESCE(sc.venue_address, '') AS address,
      COALESCE(sc.venue_city, 'Sydney') AS city,
      'NSW' AS state,
      COALESCE(sc.venue_country, 'AU') AS country,
      sc.session_start_local AS event_date,
      sc.session_start_local::time AS start_time,
      sc.capacity,
      sc.banner_image_url AS banner_url,
      sc.banner_image_url AS hero_image_url,
      sc.url AS ticket_url,
      sc.url_tickets_popup AS ticket_popup_url,
      sc.latitude,
      sc.longitude,
      sc.total_ticket_count AS ticket_count,
      sc.total_order_count AS order_count,
      sc.total_gross_dollars AS gross_dollars,
      sc.total_net_dollars AS net_dollars,
      sc.total_fees_dollars AS fees_dollars,
      sc.total_tax_dollars AS tax_dollars,
      sc.last_order_at,
      CASE WHEN sc.is_past = true THEN 'completed' ELSE 'open' END AS status,
      true AS is_synced,
      now() AS synced_at
    FROM (
      -- Single session: use LIVE view (real-time, no mat view dependency)
      SELECT * FROM session_complete_live
      WHERE p_canonical_session_source_id IS NOT NULL
        AND canonical_session_source_id = p_canonical_session_source_id
      UNION ALL
      -- Full sync: use mat view (performance)
      SELECT * FROM session_complete
      WHERE p_canonical_session_source_id IS NULL
    ) sc
    WHERE sc.session_start_local IS NOT NULL
  ),
  upserted AS (
    INSERT INTO events (
      source, source_id, canonical_session_source_id, title, name, description,
      venue, address, city, state, country, event_date, start_time, capacity,
      banner_url, hero_image_url, ticket_url, ticket_popup_url, latitude, longitude,
      ticket_count, order_count, gross_dollars, net_dollars, fees_dollars, tax_dollars,
      last_order_at, status, is_synced, synced_at, updated_at
    )
    SELECT
      sd.source, sd.source_id, sd.canonical_session_source_id, sd.title, sd.name, sd.description,
      sd.venue, sd.address, sd.city, sd.state, sd.country, sd.event_date, sd.start_time, sd.capacity,
      sd.banner_url, sd.hero_image_url, sd.ticket_url, sd.ticket_popup_url, sd.latitude, sd.longitude,
      sd.ticket_count, sd.order_count, sd.gross_dollars, sd.net_dollars, sd.fees_dollars, sd.tax_dollars,
      sd.last_order_at, sd.status, sd.is_synced, sd.synced_at, now()
    FROM source_data sd
    ON CONFLICT (canonical_session_source_id) WHERE canonical_session_source_id IS NOT NULL
    DO UPDATE SET
      ticket_count = EXCLUDED.ticket_count,
      order_count = EXCLUDED.order_count,
      gross_dollars = EXCLUDED.gross_dollars,
      net_dollars = EXCLUDED.net_dollars,
      fees_dollars = EXCLUDED.fees_dollars,
      tax_dollars = EXCLUDED.tax_dollars,
      last_order_at = EXCLUDED.last_order_at,
      event_date = COALESCE(EXCLUDED.event_date, events.event_date),
      start_time = COALESCE(EXCLUDED.start_time, events.start_time),
      title = COALESCE(events.title, EXCLUDED.title),
      name = COALESCE(events.name, EXCLUDED.name),
      description = COALESCE(events.description, EXCLUDED.description),
      venue = COALESCE(events.venue, EXCLUDED.venue),
      address = COALESCE(events.address, EXCLUDED.address),
      city = COALESCE(events.city, EXCLUDED.city),
      capacity = COALESCE(EXCLUDED.capacity, events.capacity),
      banner_url = COALESCE(events.banner_url, EXCLUDED.banner_url),
      hero_image_url = COALESCE(events.hero_image_url, EXCLUDED.hero_image_url),
      ticket_url = EXCLUDED.ticket_url,
      ticket_popup_url = EXCLUDED.ticket_popup_url,
      latitude = COALESCE(EXCLUDED.latitude, events.latitude),
      longitude = COALESCE(EXCLUDED.longitude, events.longitude),
      status = EXCLUDED.status,
      synced_at = now(),
      updated_at = now()
    RETURNING (xmax = 0)::int AS was_inserted
  )
  SELECT COUNT(*)::int, SUM(was_inserted)::int, (COUNT(*) - SUM(was_inserted))::int
  INTO v_synced, v_inserted, v_updated
  FROM upserted;

  -- Post-sync dedup: merge any synced events that duplicate org events
  SELECT m.merged, m.deleted INTO v_dedup_merged, v_dedup_deleted
  FROM merge_synced_into_org_events() m;

  -- Adjust counts: merged events were inserted then deleted
  v_inserted := v_inserted - COALESCE(v_dedup_deleted, 0);
  v_synced := v_synced - COALESCE(v_dedup_deleted, 0);

  RETURN QUERY SELECT v_synced, v_inserted, v_updated;
END;
$$ LANGUAGE plpgsql;
