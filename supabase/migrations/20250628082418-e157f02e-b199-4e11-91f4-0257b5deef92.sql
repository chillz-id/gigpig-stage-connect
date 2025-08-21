
-- Add featured column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create an index on the featured column for better query performance
CREATE INDEX IF NOT EXISTS idx_events_featured_date 
ON public.events (featured, event_date) 
WHERE featured = true;

-- Add some sample featured events for testing
UPDATE public.events 
SET featured = true 
WHERE id IN (
  SELECT id 
  FROM public.events 
  WHERE event_date >= CURRENT_DATE 
  ORDER BY event_date ASC 
  LIMIT 3
);
