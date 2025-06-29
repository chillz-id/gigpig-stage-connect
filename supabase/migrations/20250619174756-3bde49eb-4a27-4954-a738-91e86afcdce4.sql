
-- Create calendar_events table for tracking comedian events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comedian_id UUID REFERENCES auth.users NOT NULL,
  event_id UUID REFERENCES public.events,
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  calendar_sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_integrations table for storing calendar connection info
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'apple', etc.
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_requests table for promoter requests
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users NOT NULL,
  comedian_id UUID REFERENCES auth.users NOT NULL,
  request_type TEXT NOT NULL, -- 'manager', 'agent', 'both'
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, comedian_id, request_type)
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events" 
  ON public.calendar_events 
  FOR SELECT 
  USING (auth.uid() = comedian_id);

CREATE POLICY "Users can create their own calendar events" 
  ON public.calendar_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Users can update their own calendar events" 
  ON public.calendar_events 
  FOR UPDATE 
  USING (auth.uid() = comedian_id);

CREATE POLICY "Users can delete their own calendar events" 
  ON public.calendar_events 
  FOR DELETE 
  USING (auth.uid() = comedian_id);

-- RLS policies for calendar_integrations
CREATE POLICY "Users can view their own calendar integrations" 
  ON public.calendar_integrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar integrations" 
  ON public.calendar_integrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations" 
  ON public.calendar_integrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations" 
  ON public.calendar_integrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for contact_requests
CREATE POLICY "Users can view contact requests they made or received" 
  ON public.contact_requests 
  FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = comedian_id);

CREATE POLICY "Users can create contact requests" 
  ON public.contact_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Comedians can update requests made to them" 
  ON public.contact_requests 
  FOR UPDATE 
  USING (auth.uid() = comedian_id);

-- Create indexes for better performance
CREATE INDEX idx_calendar_events_comedian_id ON public.calendar_events(comedian_id);
CREATE INDEX idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX idx_calendar_integrations_user_id ON public.calendar_integrations(user_id);
CREATE INDEX idx_contact_requests_comedian_id ON public.contact_requests(comedian_id);
CREATE INDEX idx_contact_requests_requester_id ON public.contact_requests(requester_id);
CREATE INDEX idx_contact_requests_status ON public.contact_requests(status);
