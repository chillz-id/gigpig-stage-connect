
-- Create booking requests table
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue TEXT NOT NULL,
  budget DECIMAL(10,2),
  requested_comedian_id UUID REFERENCES auth.users,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user interests table to track events users are interested in
CREATE TABLE public.user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  event_id TEXT NOT NULL, -- Using TEXT since events might be mock data for now
  event_title TEXT NOT NULL,
  venue TEXT,
  event_date DATE,
  event_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on new tables
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking_requests
CREATE POLICY "Users can view their own booking requests" 
  ON public.booking_requests 
  FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = requested_comedian_id);

CREATE POLICY "Users can create booking requests" 
  ON public.booking_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own booking requests" 
  ON public.booking_requests 
  FOR UPDATE 
  USING (auth.uid() = requester_id OR auth.uid() = requested_comedian_id);

-- RLS policies for user_interests
CREATE POLICY "Users can view their own interests" 
  ON public.user_interests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interests" 
  ON public.user_interests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" 
  ON public.user_interests 
  FOR DELETE 
  USING (auth.uid() = user_id);
