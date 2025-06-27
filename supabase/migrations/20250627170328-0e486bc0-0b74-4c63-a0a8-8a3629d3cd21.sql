
-- Add new columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS comedian_slots INTEGER DEFAULT 5;
ALTER TABLE events ADD COLUMN IF NOT EXISTS filled_slots INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS humanitix_event_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS eventbrite_event_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_costs DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS xero_invoice_id TEXT;

-- Create ticket_sales table
CREATE TABLE IF NOT EXISTS ticket_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  ticket_quantity INTEGER NOT NULL DEFAULT 1,
  ticket_type TEXT DEFAULT 'general',
  total_amount DECIMAL(10,2) NOT NULL,
  platform TEXT CHECK (platform IN ('humanitix', 'eventbrite', 'manual')),
  platform_order_id TEXT,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'processed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ticket_sales
ALTER TABLE ticket_sales ENABLE ROW LEVEL SECURITY;

-- Create policy for ticket_sales
CREATE POLICY "Authenticated users can view ticket sales"
  ON ticket_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ticket sales"
  ON ticket_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create comedian_bookings table
CREATE TABLE IF NOT EXISTS comedian_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  performance_fee DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  performance_notes TEXT,
  set_duration INTEGER, -- minutes
  xero_bill_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on comedian_bookings
ALTER TABLE comedian_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for comedian_bookings
CREATE POLICY "Authenticated users can view comedian bookings"
  ON comedian_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage comedian bookings"
  ON comedian_bookings FOR ALL
  TO authenticated
  USING (true);

-- Create financial_reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  report_period_start DATE,
  report_period_end DATE,
  total_ticket_revenue DECIMAL(10,2),
  total_performer_costs DECIMAL(10,2),
  venue_costs DECIMAL(10,2),
  marketing_costs DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  profit_margin_percentage DECIMAL(5,2),
  tickets_sold INTEGER,
  attendance_rate DECIMAL(5,2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on financial_reports
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_reports
CREATE POLICY "Authenticated users can view financial reports"
  ON financial_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage financial reports"
  ON financial_reports FOR ALL
  TO authenticated
  USING (true);

-- Enable realtime for ticket sales updates
ALTER TABLE ticket_sales REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_sales;

-- Enable realtime for comedian bookings
ALTER TABLE comedian_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE comedian_bookings;

-- Enable realtime for financial reports
ALTER TABLE financial_reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE financial_reports;
