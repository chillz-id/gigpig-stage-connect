-- =====================================================
-- Update Event Times to Use Local Times
-- =====================================================
-- Changes event_start_date and event_end_date to use
-- event.start.local and event.end.local instead of UTC times

UPDATE orders_eventbrite
SET
  event_start_date = (raw->'event'->'start'->>'local')::timestamptz,
  event_end_date = (raw->'event'->'end'->>'local')::timestamptz
WHERE raw->'event'->'start' IS NOT NULL
  AND raw->'event'->'end' IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN orders_eventbrite.event_start_date IS 'Local event start time from event.start.local (not UTC)';
COMMENT ON COLUMN orders_eventbrite.event_end_date IS 'Local event end time from event.end.local (not UTC)';
