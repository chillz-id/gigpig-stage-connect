-- Multi-Platform Ticketing System for Stand Up Sydney
-- Allows one event to sell tickets on multiple platforms simultaneously

-- Create ticket platforms table
CREATE TABLE IF NOT EXISTS public.ticket_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('humanitix', 'eventbrite', 'ticketek', 'trybooking', 'moshtix', 'direct')),
  external_event_id TEXT NOT NULL,
  external_event_url TEXT,
  
  -- Real-time ticket data
  tickets_sold INTEGER DEFAULT 0,
  tickets_available INTEGER DEFAULT 0,
  gross_sales DECIMAL(10,2) DEFAULT 0,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Platform-specific data
  platform_data JSONB,
  
  -- Metadata
  is_primary BOOLEAN DEFAULT false, -- Mark primary ticketing platform
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, platform),
  UNIQUE(platform, external_event_id)
);

-- Create ticket sales tracking table for historical data
CREATE TABLE IF NOT EXISTS public.ticket_sales_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_platform_id UUID REFERENCES public.ticket_platforms(id) ON DELETE CASCADE,
  tickets_sold INTEGER NOT NULL,
  tickets_available INTEGER NOT NULL,
  gross_sales DECIMAL(10,2),
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Track changes
  tickets_sold_delta INTEGER DEFAULT 0,
  sales_delta DECIMAL(10,2) DEFAULT 0
);

-- Add aggregated ticket data to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS total_tickets_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gross_sales DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platforms_count INTEGER DEFAULT 0;

-- Create real-time view for multi-platform ticket data
CREATE OR REPLACE VIEW public.event_ticket_summary AS
SELECT 
  e.id,
  e.title,
  e.event_date,
  e.venue,
  e.capacity,
  
  -- Platform breakdown
  COUNT(DISTINCT tp.platform) as platforms_count,
  COALESCE(SUM(tp.tickets_sold), 0) as total_tickets_sold,
  COALESCE(SUM(tp.tickets_available), 0) as total_tickets_available,
  COALESCE(SUM(tp.gross_sales), 0) as total_gross_sales,
  
  -- Platform details as JSON
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'platform', tp.platform,
      'tickets_sold', tp.tickets_sold,
      'tickets_available', tp.tickets_available,
      'gross_sales', tp.gross_sales,
      'url', tp.external_event_url,
      'last_sync', tp.last_sync_at,
      'is_primary', tp.is_primary
    ) ORDER BY tp.is_primary DESC, tp.platform
  ) as platform_breakdown,
  
  -- Sales velocity (tickets sold in last hour)
  (
    SELECT COALESCE(SUM(tickets_sold_delta), 0)
    FROM ticket_sales_log tsl
    JOIN ticket_platforms tp2 ON tsl.ticket_platform_id = tp2.id
    WHERE tp2.event_id = e.id
    AND tsl.sync_timestamp > NOW() - INTERVAL '1 hour'
  ) as tickets_sold_last_hour,
  
  -- Capacity utilization
  CASE 
    WHEN e.capacity > 0 THEN 
      ROUND((COALESCE(SUM(tp.tickets_sold), 0)::DECIMAL / e.capacity) * 100, 2)
    ELSE 0 
  END as capacity_utilization_percent
  
FROM public.events e
LEFT JOIN public.ticket_platforms tp ON e.id = tp.event_id
GROUP BY e.id, e.title, e.event_date, e.venue, e.capacity;

-- Function to update ticket sales and log changes
CREATE OR REPLACE FUNCTION update_ticket_sales(
  p_event_id UUID,
  p_platform TEXT,
  p_external_event_id TEXT,
  p_tickets_sold INTEGER,
  p_tickets_available INTEGER,
  p_gross_sales DECIMAL,
  p_external_url TEXT DEFAULT NULL,
  p_platform_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_platform_id UUID;
  v_old_tickets_sold INTEGER;
  v_old_gross_sales DECIMAL;
BEGIN
  -- Insert or update ticket platform
  INSERT INTO ticket_platforms (
    event_id, platform, external_event_id, 
    tickets_sold, tickets_available, gross_sales,
    external_event_url, platform_data, last_sync_at
  ) VALUES (
    p_event_id, p_platform, p_external_event_id,
    p_tickets_sold, p_tickets_available, p_gross_sales,
    p_external_url, p_platform_data, NOW()
  )
  ON CONFLICT (event_id, platform) DO UPDATE SET
    tickets_sold = EXCLUDED.tickets_sold,
    tickets_available = EXCLUDED.tickets_available,
    gross_sales = EXCLUDED.gross_sales,
    external_event_url = COALESCE(EXCLUDED.external_event_url, ticket_platforms.external_event_url),
    platform_data = COALESCE(EXCLUDED.platform_data, ticket_platforms.platform_data),
    last_sync_at = NOW()
  RETURNING id, 
    (SELECT tickets_sold FROM ticket_platforms WHERE id = ticket_platforms.id) as old_sold,
    (SELECT gross_sales FROM ticket_platforms WHERE id = ticket_platforms.id) as old_sales
  INTO v_platform_id, v_old_tickets_sold, v_old_gross_sales;
  
  -- Log the change
  INSERT INTO ticket_sales_log (
    ticket_platform_id, tickets_sold, tickets_available, 
    gross_sales, tickets_sold_delta, sales_delta
  ) VALUES (
    v_platform_id, p_tickets_sold, p_tickets_available,
    p_gross_sales, 
    p_tickets_sold - COALESCE(v_old_tickets_sold, 0),
    p_gross_sales - COALESCE(v_old_gross_sales, 0)
  );
  
  -- Update event totals
  UPDATE events e SET
    total_tickets_sold = (
      SELECT COALESCE(SUM(tp.tickets_sold), 0)
      FROM ticket_platforms tp
      WHERE tp.event_id = e.id
    ),
    total_gross_sales = (
      SELECT COALESCE(SUM(tp.gross_sales), 0)
      FROM ticket_platforms tp
      WHERE tp.event_id = e.id
    ),
    platforms_count = (
      SELECT COUNT(DISTINCT tp.platform)
      FROM ticket_platforms tp
      WHERE tp.event_id = e.id
    ),
    updated_at = NOW()
  WHERE e.id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_ticket_platforms_event_id ON public.ticket_platforms(event_id);
CREATE INDEX idx_ticket_platforms_platform ON public.ticket_platforms(platform);
CREATE INDEX idx_ticket_sales_log_timestamp ON public.ticket_sales_log(sync_timestamp);
CREATE INDEX idx_ticket_sales_log_platform_id ON public.ticket_sales_log(ticket_platform_id);

-- Enable RLS
ALTER TABLE public.ticket_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_sales_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all ticket platforms" ON public.ticket_platforms
  FOR SELECT USING (true);

CREATE POLICY "Promoters can manage their event ticket platforms" ON public.ticket_platforms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_platforms.event_id
      AND events.promoter_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all ticket platforms" ON public.ticket_platforms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.event_ticket_summary TO authenticated;
GRANT SELECT ON public.ticket_platforms TO authenticated;
GRANT SELECT ON public.ticket_sales_log TO authenticated;
GRANT EXECUTE ON FUNCTION update_ticket_sales TO authenticated;

-- Sample data showing multi-platform setup
COMMENT ON TABLE public.ticket_platforms IS 'Tracks ticket sales across multiple platforms for a single event';
COMMENT ON FUNCTION update_ticket_sales IS 'Updates ticket sales data and maintains historical log';