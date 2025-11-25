-- =====================================================
-- Add Event Columns to orders_eventbrite
-- =====================================================
-- Extracts commonly-queried event fields to dedicated columns
-- for faster filtering and sorting. Complex/nested data
-- remains in raw JSONB for flexibility.

-- Add event information columns
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS event_description TEXT,
  ADD COLUMN IF NOT EXISTS event_status TEXT,
  ADD COLUMN IF NOT EXISTS event_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_timezone TEXT;

-- Add capacity columns
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS event_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS capacity_is_custom BOOLEAN;

-- Add venue columns
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS venue_city TEXT,
  ADD COLUMN IF NOT EXISTS venue_region TEXT,
  ADD COLUMN IF NOT EXISTS venue_country TEXT,
  ADD COLUMN IF NOT EXISTS online_event BOOLEAN;

-- Add classification columns
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS category_name TEXT,
  ADD COLUMN IF NOT EXISTS format_name TEXT;

-- Add flags
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN,
  ADD COLUMN IF NOT EXISTS event_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listed BOOLEAN,
  ADD COLUMN IF NOT EXISTS invite_only BOOLEAN,
  ADD COLUMN IF NOT EXISTS shareable BOOLEAN;

-- Add timestamps
ALTER TABLE orders_eventbrite
  ADD COLUMN IF NOT EXISTS event_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_changed_at TIMESTAMPTZ;

-- =====================================================
-- Backfill existing data from raw JSONB
-- =====================================================
UPDATE orders_eventbrite
SET
  -- Event information
  event_name = raw->'event'->'name'->>'text',
  event_description = raw->'event'->'description'->>'text',
  event_status = raw->'event'->>'status',
  event_start_date = (raw->'event'->'start'->>'utc')::timestamptz,
  event_end_date = (raw->'event'->'end'->>'utc')::timestamptz,
  event_timezone = raw->'event'->'start'->>'timezone',

  -- Capacity
  event_capacity = (raw->'event'->>'capacity')::integer,
  capacity_is_custom = (raw->'event'->>'capacity_is_custom')::boolean,

  -- Venue
  venue_name = raw->'event'->'venue'->>'name',
  venue_city = raw->'event'->'venue'->'address'->>'city',
  venue_region = raw->'event'->'venue'->'address'->>'region',
  venue_country = raw->'event'->'venue'->'address'->>'country',
  online_event = (raw->'event'->>'online_event')::boolean,

  -- Classification
  category_name = raw->'event'->'category'->>'name',
  format_name = raw->'event'->'format'->>'name',

  -- Flags
  is_free = (raw->'event'->>'is_free')::boolean,
  event_published_at = (raw->'event'->>'published')::timestamptz,
  listed = (raw->'event'->>'listed')::boolean,
  invite_only = (raw->'event'->>'invite_only')::boolean,
  shareable = (raw->'event'->>'shareable')::boolean,

  -- Timestamps
  event_created_at = (raw->'event'->>'created')::timestamptz,
  event_changed_at = (raw->'event'->>'changed')::timestamptz

WHERE raw->'event' IS NOT NULL;

-- =====================================================
-- Create indexes for performance
-- =====================================================

-- Most common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_event_name
  ON orders_eventbrite(event_name);

CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_event_start_date
  ON orders_eventbrite(event_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_venue_city
  ON orders_eventbrite(venue_city);

CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_event_status
  ON orders_eventbrite(event_status);

-- Composite indexes for common filters
CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_city_start_date
  ON orders_eventbrite(venue_city, event_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_status_start_date
  ON orders_eventbrite(event_status, event_start_date DESC);

-- Full-text search on event name
CREATE INDEX IF NOT EXISTS idx_orders_eventbrite_event_name_trgm
  ON orders_eventbrite USING gin(event_name gin_trgm_ops);

-- =====================================================
-- Add helpful comment
-- =====================================================
COMMENT ON COLUMN orders_eventbrite.event_name IS 'Extracted from raw->event->name->text for fast queries';
COMMENT ON COLUMN orders_eventbrite.event_start_date IS 'Extracted from raw->event->start->utc, indexed for date range queries';
COMMENT ON COLUMN orders_eventbrite.venue_city IS 'Extracted from raw->event->venue->address->city for location filtering';
