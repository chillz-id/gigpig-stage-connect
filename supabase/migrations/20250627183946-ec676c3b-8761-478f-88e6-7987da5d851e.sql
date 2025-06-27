
-- Create financial_reports table for storing generated reports
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id),
  report_period_start DATE,
  report_period_end DATE,
  total_ticket_revenue NUMERIC DEFAULT 0,
  total_performer_costs NUMERIC DEFAULT 0,
  venue_costs NUMERIC DEFAULT 0,
  marketing_costs NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  profit_margin_percentage NUMERIC DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  attendance_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create xero_integrations table for XERO connection management
CREATE TABLE IF NOT EXISTS public.xero_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tenant_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'revoked')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create xero_invoices table for tracking XERO invoice sync
CREATE TABLE IF NOT EXISTS public.xero_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id),
  ticket_sale_id UUID REFERENCES public.ticket_sales(id),
  xero_invoice_id TEXT NOT NULL,
  xero_invoice_number TEXT,
  invoice_status TEXT DEFAULT 'draft',
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  created_in_xero_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create xero_bills table for tracking comedian payment bills
CREATE TABLE IF NOT EXISTS public.xero_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comedian_booking_id UUID REFERENCES public.comedian_bookings(id),
  xero_bill_id TEXT NOT NULL,
  xero_bill_number TEXT,
  bill_status TEXT DEFAULT 'draft',
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  due_date DATE,
  created_in_xero_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create venue_costs table for tracking venue expenses
CREATE TABLE IF NOT EXISTS public.venue_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  cost_type TEXT NOT NULL DEFAULT 'venue_rental',
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  cost_date DATE DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  xero_bill_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketing_costs table for tracking marketing expenses
CREATE TABLE IF NOT EXISTS public.marketing_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id),
  campaign_name TEXT,
  platform TEXT, -- facebook, instagram, google, etc
  cost_type TEXT DEFAULT 'advertising', -- advertising, promotional_materials, etc
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  spend_date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  xero_bill_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for financial_reports
CREATE POLICY "Admins can view all financial reports" ON public.financial_reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage financial reports" ON public.financial_reports
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for xero_integrations
CREATE POLICY "Admins can view XERO integrations" ON public.xero_integrations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage XERO integrations" ON public.xero_integrations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for xero_invoices
CREATE POLICY "Admins can view XERO invoices" ON public.xero_invoices
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage XERO invoices" ON public.xero_invoices
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for xero_bills
CREATE POLICY "Admins can view XERO bills" ON public.xero_bills
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage XERO bills" ON public.xero_bills
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for venue_costs
CREATE POLICY "Admins can view venue costs" ON public.venue_costs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage venue costs" ON public.venue_costs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for marketing_costs
CREATE POLICY "Admins can view marketing costs" ON public.marketing_costs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage marketing costs" ON public.marketing_costs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_reports_event_id ON public.financial_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON public.financial_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_xero_invoices_event_id ON public.xero_invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_xero_bills_comedian_booking_id ON public.xero_bills(comedian_booking_id);
CREATE INDEX IF NOT EXISTS idx_venue_costs_event_id ON public.venue_costs(event_id);
CREATE INDEX IF NOT EXISTS idx_marketing_costs_event_id ON public.marketing_costs(event_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_xero_integrations_updated_at 
  BEFORE UPDATE ON public.xero_integrations 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_costs_updated_at 
  BEFORE UPDATE ON public.venue_costs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing tables to use AUD as default currency
ALTER TABLE public.ticket_sales ALTER COLUMN total_amount SET DEFAULT 0;
UPDATE public.ticket_sales SET total_amount = COALESCE(total_amount, 0) WHERE total_amount IS NULL;

-- Add currency column to comedian_bookings if it doesn't exist
ALTER TABLE public.comedian_bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AUD';
UPDATE public.comedian_bookings SET currency = 'AUD' WHERE currency IS NULL;

-- Add currency column to events if it doesn't exist (already exists, just ensure AUD default)
UPDATE public.events SET currency = 'AUD' WHERE currency IS NULL OR currency = 'USD';

-- Create a function to calculate event profitability
CREATE OR REPLACE FUNCTION public.calculate_event_profitability(event_id_param UUID)
RETURNS TABLE (
  event_id UUID,
  total_revenue NUMERIC,
  total_costs NUMERIC,
  net_profit NUMERIC,
  profit_margin NUMERIC,
  tickets_sold INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    COALESCE(revenue.total, 0) as total_revenue,
    COALESCE(costs.performer_costs, 0) + COALESCE(costs.venue_costs, 0) + COALESCE(costs.marketing_costs, 0) as total_costs,
    COALESCE(revenue.total, 0) - (COALESCE(costs.performer_costs, 0) + COALESCE(costs.venue_costs, 0) + COALESCE(costs.marketing_costs, 0)) as net_profit,
    CASE 
      WHEN COALESCE(revenue.total, 0) > 0 THEN 
        ((COALESCE(revenue.total, 0) - (COALESCE(costs.performer_costs, 0) + COALESCE(costs.venue_costs, 0) + COALESCE(costs.marketing_costs, 0))) / COALESCE(revenue.total, 0)) * 100
      ELSE 0 
    END as profit_margin,
    COALESCE(revenue.tickets_count, 0) as tickets_sold
  FROM public.events e
  LEFT JOIN (
    SELECT 
      ts.event_id,
      SUM(ts.total_amount) as total,
      SUM(ts.ticket_quantity) as tickets_count
    FROM public.ticket_sales ts
    WHERE ts.event_id = event_id_param
    GROUP BY ts.event_id
  ) revenue ON e.id = revenue.event_id
  LEFT JOIN (
    SELECT 
      cb.event_id,
      SUM(cb.performance_fee) as performer_costs,
      COALESCE(vc.venue_total, 0) as venue_costs,
      COALESCE(mc.marketing_total, 0) as marketing_costs
    FROM public.comedian_bookings cb
    LEFT JOIN (
      SELECT event_id, SUM(amount) as venue_total
      FROM public.venue_costs 
      WHERE event_id = event_id_param
      GROUP BY event_id
    ) vc ON cb.event_id = vc.event_id
    LEFT JOIN (
      SELECT event_id, SUM(amount) as marketing_total
      FROM public.marketing_costs 
      WHERE event_id = event_id_param
      GROUP BY event_id
    ) mc ON cb.event_id = mc.event_id
    WHERE cb.event_id = event_id_param
    GROUP BY cb.event_id, vc.venue_total, mc.marketing_total
  ) costs ON e.id = costs.event_id
  WHERE e.id = event_id_param;
END;
$$;
