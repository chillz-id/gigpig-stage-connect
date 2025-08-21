-- Fix Ticket Sales Integration
-- This migration adds missing columns and creates the attendees table

-- Update ticket_sales table with missing columns
ALTER TABLE public.ticket_sales 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AUD',
ADD COLUMN IF NOT EXISTS raw_data JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS refund_date TIMESTAMPTZ;

-- Update refund_status constraint to include more states
ALTER TABLE public.ticket_sales 
DROP CONSTRAINT IF EXISTS ticket_sales_refund_status_check;

ALTER TABLE public.ticket_sales 
ADD CONSTRAINT ticket_sales_refund_status_check 
CHECK (refund_status IN ('none', 'requested', 'processed', 'cancelled', 'refunded', 'partial'));

-- Create attendees table for detailed attendee tracking
CREATE TABLE IF NOT EXISTS public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_sale_id UUID REFERENCES public.ticket_sales(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Attendee information
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Ticket details
  ticket_type TEXT,
  ticket_price DECIMAL(10,2),
  barcode TEXT,
  qr_code TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'no_show', 'cancelled')),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  
  -- Platform data
  platform TEXT CHECK (platform IN ('humanitix', 'eventbrite', 'manual')),
  platform_attendee_id TEXT,
  platform_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, platform_attendee_id)
);

-- Add platform_config to ticket_platforms for storing OAuth tokens
ALTER TABLE public.ticket_platforms
ADD COLUMN IF NOT EXISTS platform_config JSONB;

-- Add webhook_last_received to ticket_platforms
ALTER TABLE public.ticket_platforms
ADD COLUMN IF NOT EXISTS webhook_last_received TIMESTAMPTZ;

-- Create unique constraint for ticket_sales
ALTER TABLE public.ticket_sales
DROP CONSTRAINT IF EXISTS ticket_sales_platform_order_unique;

ALTER TABLE public.ticket_sales
ADD CONSTRAINT ticket_sales_platform_order_unique 
UNIQUE(platform, platform_order_id);

-- Create ticket sales analytics view
CREATE OR REPLACE VIEW public.ticket_sales_analytics AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.event_date,
  e.venue,
  
  -- Sales metrics
  COUNT(DISTINCT ts.id) as total_orders,
  SUM(ts.ticket_quantity) as total_tickets_sold,
  SUM(ts.total_amount) as gross_revenue,
  AVG(ts.total_amount) as average_order_value,
  
  -- Platform breakdown
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.platform = 'humanitix') as humanitix_orders,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.platform = 'eventbrite') as eventbrite_orders,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.platform = 'manual') as manual_orders,
  
  -- Refund metrics
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.refund_status != 'none') as refunded_orders,
  COALESCE(SUM(ts.refund_amount), 0) as total_refunds,
  
  -- Time-based metrics
  MIN(ts.purchase_date) as first_sale_date,
  MAX(ts.purchase_date) as last_sale_date,
  
  -- Daily sales velocity (last 7 days)
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.purchase_date >= NOW() - INTERVAL '7 days') as sales_last_7_days,
  
  -- Capacity metrics
  e.capacity,
  CASE 
    WHEN e.capacity > 0 THEN 
      ROUND((SUM(ts.ticket_quantity)::DECIMAL / e.capacity) * 100, 2)
    ELSE NULL 
  END as capacity_utilization_percent

FROM public.events e
LEFT JOIN public.ticket_sales ts ON e.id = ts.event_id
GROUP BY e.id, e.title, e.event_date, e.venue, e.capacity;

-- Create attendee check-in view
CREATE OR REPLACE VIEW public.attendee_checkin_status AS
SELECT 
  a.event_id,
  e.title as event_title,
  e.event_date,
  
  -- Attendee counts
  COUNT(DISTINCT a.id) as total_attendees,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'checked_in') as checked_in,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'registered') as not_checked_in,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'no_show') as no_shows,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled') as cancelled,
  
  -- Check-in percentage
  CASE 
    WHEN COUNT(DISTINCT a.id) > 0 THEN 
      ROUND((COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'checked_in')::DECIMAL / COUNT(DISTINCT a.id)) * 100, 2)
    ELSE 0 
  END as checkin_percentage,
  
  -- Platform breakdown
  COUNT(DISTINCT a.id) FILTER (WHERE a.platform = 'humanitix') as humanitix_attendees,
  COUNT(DISTINCT a.id) FILTER (WHERE a.platform = 'eventbrite') as eventbrite_attendees,
  COUNT(DISTINCT a.id) FILTER (WHERE a.platform = 'manual') as manual_attendees

FROM public.attendees a
JOIN public.events e ON a.event_id = e.id
GROUP BY a.event_id, e.title, e.event_date;

-- Function to process attendee data from webhook
CREATE OR REPLACE FUNCTION process_webhook_attendees(
  p_ticket_sale_id UUID,
  p_event_id UUID,
  p_attendees JSONB,
  p_platform TEXT
) RETURNS VOID AS $$
DECLARE
  v_attendee JSONB;
BEGIN
  -- Delete existing attendees for this ticket sale (in case of updates)
  DELETE FROM attendees WHERE ticket_sale_id = p_ticket_sale_id;
  
  -- Insert new attendees
  FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_attendees)
  LOOP
    INSERT INTO attendees (
      ticket_sale_id,
      event_id,
      first_name,
      last_name,
      email,
      ticket_type,
      ticket_price,
      platform,
      platform_attendee_id,
      platform_data
    ) VALUES (
      p_ticket_sale_id,
      p_event_id,
      v_attendee->>'first_name',
      v_attendee->>'last_name',
      v_attendee->>'email',
      v_attendee->>'ticket_type',
      (v_attendee->>'price')::DECIMAL,
      p_platform,
      v_attendee->>'id',
      v_attendee
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_sales_event_id ON public.ticket_sales(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_platform ON public.ticket_sales(platform);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_purchase_date ON public.ticket_sales(purchase_date);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_ticket_sale_id ON public.attendees(ticket_sale_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON public.attendees(status);

-- Enable RLS on attendees table
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendees
CREATE POLICY "Authenticated users can view attendees" ON public.attendees
  FOR SELECT USING (true);

CREATE POLICY "Event promoters can manage their attendees" ON public.attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = attendees.event_id
      AND events.promoter_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attendees" ON public.attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.ticket_sales_analytics TO authenticated;
GRANT SELECT ON public.attendee_checkin_status TO authenticated;
GRANT ALL ON public.attendees TO authenticated;
GRANT EXECUTE ON FUNCTION process_webhook_attendees TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_sales_updated_at BEFORE UPDATE ON public.ticket_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON public.attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.attendees IS 'Stores individual attendee information for events';
COMMENT ON VIEW public.ticket_sales_analytics IS 'Provides analytics and metrics for ticket sales';
COMMENT ON VIEW public.attendee_checkin_status IS 'Shows check-in status and statistics for events';
COMMENT ON FUNCTION process_webhook_attendees IS 'Processes attendee data from webhook payloads';