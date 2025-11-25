-- Add ticket_link and description to calendar_events
-- Enables comedians to add ticket purchase links and show descriptions for their EPK

-- Add new columns
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS ticket_link TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add column comments
COMMENT ON COLUMN public.calendar_events.ticket_link IS
  'External URL where customers can purchase tickets (e.g., Humanitix, Eventbrite, custom ticketing)';

COMMENT ON COLUMN public.calendar_events.description IS
  'Description of the show for display on EPK and promotional materials';

-- Index for faster queries on ticket_link (when filtering shows with tickets)
CREATE INDEX IF NOT EXISTS idx_calendar_events_ticket_link
  ON public.calendar_events(ticket_link)
  WHERE ticket_link IS NOT NULL;
