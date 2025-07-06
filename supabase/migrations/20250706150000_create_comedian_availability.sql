-- Create comedian availability table
CREATE TABLE IF NOT EXISTS public.comedian_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comedian_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  time_start TIME,
  time_end TIME,
  notes TEXT,
  recurring_type TEXT, -- 'none', 'weekly', 'monthly'
  recurring_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comedian_id, date)
);

-- Create comedian blocked dates table for unavailable periods
CREATE TABLE IF NOT EXISTS public.comedian_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comedian_id UUID REFERENCES auth.users NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  recurring_type TEXT DEFAULT 'none', -- 'none', 'weekly', 'monthly', 'yearly'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.comedian_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comedian_blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS policies for comedian_availability
CREATE POLICY "Comedians can view their own availability" 
  ON public.comedian_availability 
  FOR SELECT 
  USING (auth.uid() = comedian_id);

CREATE POLICY "Comedians can manage their own availability" 
  ON public.comedian_availability 
  FOR ALL
  USING (auth.uid() = comedian_id);

-- RLS policies for comedian_blocked_dates
CREATE POLICY "Comedians can view their own blocked dates" 
  ON public.comedian_blocked_dates 
  FOR SELECT 
  USING (auth.uid() = comedian_id);

CREATE POLICY "Comedians can manage their own blocked dates" 
  ON public.comedian_blocked_dates 
  FOR ALL
  USING (auth.uid() = comedian_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comedian_availability_comedian_id ON public.comedian_availability(comedian_id);
CREATE INDEX IF NOT EXISTS idx_comedian_availability_date ON public.comedian_availability(date);
CREATE INDEX IF NOT EXISTS idx_comedian_blocked_dates_comedian_id ON public.comedian_blocked_dates(comedian_id);
CREATE INDEX IF NOT EXISTS idx_comedian_blocked_dates_range ON public.comedian_blocked_dates(start_date, end_date);