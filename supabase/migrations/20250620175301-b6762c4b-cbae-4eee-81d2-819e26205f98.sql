
-- Create event_templates table for saving reusable templates
CREATE TABLE public.event_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_spots table for the spot system
CREATE TABLE public.event_spots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  spot_name TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_filled BOOLEAN NOT NULL DEFAULT false,
  comedian_id UUID NULL,
  spot_order INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add recurring event fields to events table
ALTER TABLE public.events 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern TEXT DEFAULT NULL,
ADD COLUMN parent_event_id UUID DEFAULT NULL,
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN series_id UUID DEFAULT NULL;

-- Enable RLS on event_templates
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for event_templates
CREATE POLICY "Users can view their own templates" 
  ON public.event_templates 
  FOR SELECT 
  USING (promoter_id = auth.uid());

CREATE POLICY "Users can create their own templates" 
  ON public.event_templates 
  FOR INSERT 
  WITH CHECK (promoter_id = auth.uid());

CREATE POLICY "Users can update their own templates" 
  ON public.event_templates 
  FOR UPDATE 
  USING (promoter_id = auth.uid());

CREATE POLICY "Users can delete their own templates" 
  ON public.event_templates 
  FOR DELETE 
  USING (promoter_id = auth.uid());

-- Enable RLS on event_spots
ALTER TABLE public.event_spots ENABLE ROW LEVEL SECURITY;

-- Create policies for event_spots
CREATE POLICY "Users can view spots for their events" 
  ON public.event_spots 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_spots.event_id 
      AND events.promoter_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage spots for their events" 
  ON public.event_spots 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_spots.event_id 
      AND events.promoter_id = auth.uid()
    )
  );

-- Create foreign key constraints
ALTER TABLE public.event_templates 
ADD CONSTRAINT fk_event_templates_promoter 
FOREIGN KEY (promoter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.event_spots 
ADD CONSTRAINT fk_event_spots_event 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_spots 
ADD CONSTRAINT fk_event_spots_comedian 
FOREIGN KEY (comedian_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.events 
ADD CONSTRAINT fk_events_parent 
FOREIGN KEY (parent_event_id) REFERENCES public.events(id) ON DELETE SET NULL;
