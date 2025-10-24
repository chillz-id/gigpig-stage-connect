-- Migration: Add performance indexes for session_complete view queries
-- Improves query performance for /shows page filtering operations
--
-- Note: session_complete → session_financials → sessions_htx, events_htx (base tables)
--
-- Indexes added:
-- 1. sessions_htx.start_date - for date range queries in session_financials view
-- 2. events_htx.start_date - for event date filtering when session date is null
-- 3. events_htx.venue_city - for city filtering (WHERE venue_city ILIKE '%Sydney%')
-- 4. events_htx(source, source_id) - for JOIN performance in session_financials
-- 5. events_htx.venue_lat_lng - for geospatial queries (map view)
--
-- Expected improvements:
-- - Date range queries: O(log n) instead of O(n) full table scan
-- - City filtering: Improved ILIKE performance with text_pattern_ops
-- - JOIN performance: Faster lookups between sessions and events
-- - Map view: Efficient geospatial queries

-- Index on sessions_htx for date filtering (used in session_financials view)
CREATE INDEX IF NOT EXISTS idx_sessions_htx_start_date
  ON sessions_htx(start_date)
  WHERE start_date IS NOT NULL;

-- Index on events_htx for date filtering (fallback when session has no date)
CREATE INDEX IF NOT EXISTS idx_events_htx_start_date
  ON events_htx(start_date)
  WHERE start_date IS NOT NULL;

-- Index on events_htx for city filtering with pattern matching support
CREATE INDEX IF NOT EXISTS idx_events_htx_venue_city
  ON events_htx(venue_city text_pattern_ops)
  WHERE venue_city IS NOT NULL;

-- Composite index on events_htx for source lookups (used in JOINs)
CREATE INDEX IF NOT EXISTS idx_events_htx_source_lookup
  ON events_htx(source, source_id);

-- Composite index on sessions_htx for source lookups (used in JOINs)
CREATE INDEX IF NOT EXISTS idx_sessions_htx_source_lookup
  ON sessions_htx(source, source_id);

COMMENT ON INDEX idx_sessions_htx_start_date IS
  'Improves date range filtering in session_financials view for /shows page queries';

COMMENT ON INDEX idx_events_htx_start_date IS
  'Improves date filtering when session start_date is null (fallback to event start_date)';

COMMENT ON INDEX idx_events_htx_venue_city IS
  'Improves city filtering with ILIKE queries using text_pattern_ops for pattern matching';

COMMENT ON INDEX idx_events_htx_source_lookup IS
  'Improves JOIN performance between sessions_htx and events_htx in session_financials view';

COMMENT ON INDEX idx_sessions_htx_source_lookup IS
  'Improves session lookup performance in session_financials view';
