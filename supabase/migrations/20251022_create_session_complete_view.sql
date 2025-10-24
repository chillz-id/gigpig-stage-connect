-- Migration: Create session_complete view for /shows page
-- Extends session_financials with event metadata from events_htx
--
-- Purpose: Provide a single comprehensive view for browsing events with:
-- - All financial data (ticket sales, orders, revenue from Humanitix + Eventbrite)
-- - Event metadata (URL, capacity, venue details, images)
-- - Computed fields for filtering (is_past, days_until)
-- - Geolocation data extracted for map views
--
-- Usage: Powers the /shows page event browsing functionality

CREATE OR REPLACE VIEW session_complete AS
SELECT
  -- Core identifiers from session_financials
  sf.canonical_source,
  sf.canonical_session_source_id,
  sf.session_name,
  sf.event_name,
  sf.event_source_id,
  sf.session_start,
  sf.timezone,
  sf.session_start_local,

  -- Humanitix financial data
  sf.humanitix_order_count,
  sf.humanitix_ticket_count,
  sf.humanitix_gross_dollars,
  sf.humanitix_net_dollars,
  sf.humanitix_fees_dollars,
  sf.humanitix_tax_dollars,
  sf.humanitix_last_order_at,

  -- Eventbrite financial data
  sf.eventbrite_order_count,
  sf.eventbrite_ticket_count,
  sf.eventbrite_gross_dollars,
  sf.eventbrite_net_dollars,
  sf.eventbrite_fees_dollars,
  sf.eventbrite_tax_dollars,
  sf.eventbrite_last_order_at,

  -- Merged/aggregated data
  sf.merged_sources,
  sf.total_order_count,
  sf.total_ticket_count,
  sf.total_gross_dollars,
  sf.total_net_dollars,
  sf.total_fees_dollars,
  sf.total_tax_dollars,
  sf.last_order_at,

  -- Event metadata from events_htx (for ShowCard display)
  e.url AS ticket_url,
  e.total_capacity,
  e.venue_name,
  e.venue_address,
  e.venue_city,
  e.venue_country,
  e.venue_lat_lng,
  e.banner_image_url,

  -- Computed columns for /shows page filtering and display
  (sf.session_start_local < NOW()) AS is_past,
  CASE
    WHEN sf.session_start_local < NOW() THEN NULL
    ELSE CEIL(EXTRACT(EPOCH FROM (sf.session_start_local - NOW())) / 86400)::INTEGER
  END AS days_until,

  -- Extract latitude/longitude from PostGIS point for map view
  -- venue_lat_lng is stored as point type, need to cast and extract
  CASE
    WHEN e.venue_lat_lng IS NOT NULL THEN ST_Y(e.venue_lat_lng::geometry)
    ELSE NULL
  END AS latitude,
  CASE
    WHEN e.venue_lat_lng IS NOT NULL THEN ST_X(e.venue_lat_lng::geometry)
    ELSE NULL
  END AS longitude

FROM session_financials sf
LEFT JOIN events_htx e
  ON sf.event_source_id = e.source_id
  AND sf.canonical_source = e.source;

-- Add helpful comment for database documentation
COMMENT ON VIEW session_complete IS
  'Complete session view combining financial data from session_financials with event metadata from events_htx. ' ||
  'Used by /shows page for browsing upcoming events with ticket sales, venue info, and geolocation data.';
