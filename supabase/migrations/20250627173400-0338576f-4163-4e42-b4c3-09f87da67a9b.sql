
-- Add missing columns to events table for enhanced functionality
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS filled_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_costs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending';

-- Update any NULL values to defaults
UPDATE events SET 
  tickets_sold = COALESCE(tickets_sold, 0),
  ticket_price = COALESCE(ticket_price, 0),
  filled_slots = COALESCE(filled_slots, 0),
  total_revenue = COALESCE(total_revenue, 0),
  total_costs = COALESCE(total_costs, 0),
  profit_margin = COALESCE(profit_margin, 0),
  capacity = COALESCE(capacity, 0),
  settlement_status = COALESCE(settlement_status, 'pending');

-- Create ticket_sales table to track individual ticket purchases
CREATE TABLE IF NOT EXISTS public.ticket_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  ticket_quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  platform TEXT DEFAULT 'gigpigs',
  platform_order_id TEXT,
  ticket_type TEXT DEFAULT 'general',
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comedian_bookings table to track comedian assignments
CREATE TABLE IF NOT EXISTS public.comedian_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES public.profiles(id),
  performance_fee NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  set_duration INTEGER DEFAULT 5,
  performance_notes TEXT,
  xero_bill_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.ticket_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comedian_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ticket_sales (admins can see all)
CREATE POLICY "Admins can view all ticket sales" ON public.ticket_sales
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage ticket sales" ON public.ticket_sales
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for comedian_bookings (admins can see all)
CREATE POLICY "Admins can view all comedian bookings" ON public.comedian_bookings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage comedian bookings" ON public.comedian_bookings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Add some sample data for testing
INSERT INTO public.ticket_sales (event_id, customer_name, customer_email, ticket_quantity, total_amount) 
SELECT 
  id, 
  'John Doe', 
  'john@example.com', 
  2, 
  50.00
FROM public.events 
WHERE NOT EXISTS (SELECT 1 FROM public.ticket_sales WHERE event_id = events.id)
LIMIT 3;

INSERT INTO public.comedian_bookings (event_id, comedian_id, performance_fee, payment_status) 
SELECT 
  e.id, 
  p.id, 
  100.00,
  'pending'
FROM public.events e
CROSS JOIN public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.comedian_bookings WHERE event_id = e.id)
LIMIT 5;
