
-- Create a table for event waitlists
CREATE TABLE public.event_waitlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_event_waitlists_event_id ON public.event_waitlists(event_id);
CREATE INDEX idx_event_waitlists_position ON public.event_waitlists(event_id, position);

-- Enable RLS on event_waitlists
ALTER TABLE public.event_waitlists ENABLE ROW LEVEL SECURITY;

-- Create policies for event_waitlists
CREATE POLICY "Anyone can view waitlist entries for events" 
  ON public.event_waitlists 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can join waitlists" 
  ON public.event_waitlists 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Event promoters can manage their event waitlists" 
  ON public.event_waitlists 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_waitlists.event_id 
      AND events.promoter_id = auth.uid()
    )
  );

-- Function to automatically set waitlist position
CREATE OR REPLACE FUNCTION public.set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the position to be the next available position for this event
  SELECT COALESCE(MAX(position), 0) + 1 
  INTO NEW.position 
  FROM public.event_waitlists 
  WHERE event_id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set position
CREATE TRIGGER trigger_set_waitlist_position
  BEFORE INSERT ON public.event_waitlists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_position();

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_waitlist_updated_at
  BEFORE UPDATE ON public.event_waitlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
