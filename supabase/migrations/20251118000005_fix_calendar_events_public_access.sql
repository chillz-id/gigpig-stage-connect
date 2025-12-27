-- Fix calendar_events table for EPK public access
-- Issue: EPK pages are public but RLS was blocking calendar_events queries
-- Solution: Replace restrictive policy with public SELECT and add missing banner_url column

-- Add missing banner_url column
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Drop the old restrictive policy first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'calendar_events'
    AND policyname = 'Users can view their own calendar events'
  ) THEN
    DROP POLICY "Users can view their own calendar events" ON public.calendar_events;
  END IF;
END $$;

-- Add new public SELECT policy so anyone can view calendar events for EPK pages
CREATE POLICY "Public can view all calendar events"
  ON public.calendar_events
  FOR SELECT
  USING (true);

COMMENT ON COLUMN public.calendar_events.banner_url IS 'Optional banner image URL for the calendar event';
COMMENT ON POLICY "Public can view all calendar events" ON public.calendar_events IS 'Allows public EPK pages to display upcoming shows for any comedian';
