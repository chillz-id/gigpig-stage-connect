-- Create customers table for CRM synchronization
-- This table will store unique customer data from ticket sales
-- and track synchronization with external CRM systems like Brevo

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  mobile TEXT,
  location TEXT DEFAULT 'AU',
  marketing_opt_in BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'humanitix' CHECK (source IN ('humanitix', 'eventbrite', 'manual', 'import')),
  
  -- Customer metrics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  last_event_id UUID REFERENCES public.events(id),
  last_event_name TEXT,
  
  -- Customer segmentation
  customer_segment TEXT DEFAULT 'new' CHECK (customer_segment IN ('new', 'active', 'vip', 'inactive')),
  preferred_venue TEXT,
  
  -- CRM synchronization fields
  brevo_contact_id TEXT,
  brevo_sync_status TEXT DEFAULT 'pending' CHECK (brevo_sync_status IN ('pending', 'synced', 'failed', 'skipped')),
  brevo_last_sync TIMESTAMPTZ,
  brevo_sync_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_brevo_sync_status ON public.customers(brevo_sync_status);
CREATE INDEX idx_customers_segment ON public.customers(customer_segment);
CREATE INDEX idx_customers_last_order_date ON public.customers(last_order_date);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage customers" ON public.customers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to update customer metrics
CREATE OR REPLACE FUNCTION update_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the customer record with latest order information
  UPDATE public.customers
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.total_amount,
    last_order_date = NEW.purchase_date,
    last_event_id = NEW.event_id,
    last_event_name = (SELECT title FROM public.events WHERE id = NEW.event_id),
    customer_segment = CASE
      WHEN total_orders >= 5 THEN 'vip'
      WHEN last_order_date > NOW() - INTERVAL '3 months' THEN 'active'
      WHEN last_order_date < NOW() - INTERVAL '6 months' THEN 'inactive'
      ELSE 'new'
    END,
    updated_at = NOW(),
    brevo_sync_status = 'pending' -- Mark for re-sync
  WHERE email = NEW.customer_email;
  
  -- If customer doesn't exist, create them
  IF NOT FOUND THEN
    INSERT INTO public.customers (
      email,
      first_name,
      last_name,
      source,
      total_orders,
      total_spent,
      last_order_date,
      last_event_id,
      last_event_name
    ) VALUES (
      NEW.customer_email,
      SPLIT_PART(NEW.customer_name, ' ', 1),
      SPLIT_PART(NEW.customer_name, ' ', 2),
      NEW.platform,
      1,
      NEW.total_amount,
      NEW.purchase_date,
      NEW.event_id,
      (SELECT title FROM public.events WHERE id = NEW.event_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on ticket_sales to update customer metrics
CREATE TRIGGER update_customer_on_ticket_sale
AFTER INSERT OR UPDATE ON public.ticket_sales
FOR EACH ROW
EXECUTE FUNCTION update_customer_metrics();

-- Create view for customer analytics
CREATE OR REPLACE VIEW public.customer_analytics AS
SELECT 
  c.id,
  c.email,
  c.first_name || ' ' || c.last_name as full_name,
  c.total_orders,
  c.total_spent,
  c.customer_segment,
  c.last_order_date,
  c.last_event_name,
  c.marketing_opt_in,
  c.brevo_sync_status,
  DATE_PART('day', NOW() - c.last_order_date) as days_since_last_order,
  CASE 
    WHEN c.total_orders = 1 THEN 'single_purchase'
    WHEN c.total_orders BETWEEN 2 AND 4 THEN 'repeat_customer'
    ELSE 'loyal_customer'
  END as loyalty_status,
  c.created_at as customer_since
FROM public.customers c
ORDER BY c.total_spent DESC;

-- Create function to queue customers for Brevo sync
CREATE OR REPLACE FUNCTION queue_brevo_sync()
RETURNS TABLE (
  customer_id UUID,
  email TEXT,
  sync_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.email,
    jsonb_build_object(
      'email', c.email,
      'attributes', jsonb_build_object(
        'FIRSTNAME', c.first_name,
        'LASTNAME', c.last_name,
        'SMS', c.mobile,
        'TOTAL_ORDERS', c.total_orders,
        'TOTAL_SPENT', c.total_spent,
        'LAST_EVENT_NAME', c.last_event_name,
        'LAST_ORDER_DATE', c.last_order_date,
        'CUSTOMER_SEGMENT', c.customer_segment,
        'MARKETING_OPT_IN', c.marketing_opt_in
      ),
      'listIds', ARRAY[
        CASE 
          WHEN c.customer_segment = 'vip' THEN 3
          WHEN c.customer_segment = 'active' THEN 2
          ELSE 1
        END
      ],
      'updateEnabled', true
    ) as sync_data
  FROM public.customers c
  WHERE c.brevo_sync_status IN ('pending', 'failed')
  AND c.email IS NOT NULL
  LIMIT 100; -- Process in batches
END;
$$ LANGUAGE plpgsql;

-- Create table for Brevo sync logs
CREATE TABLE IF NOT EXISTS public.brevo_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  sync_type TEXT CHECK (sync_type IN ('create', 'update', 'delete')),
  request_data JSONB,
  response_data JSONB,
  status TEXT CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.customers IS 'Central customer database for CRM synchronization with Brevo and other platforms';
COMMENT ON COLUMN public.customers.brevo_contact_id IS 'Brevo contact ID for API reference';
COMMENT ON COLUMN public.customers.brevo_sync_status IS 'Track synchronization status with Brevo CRM';

-- Populate customers table from existing ticket_sales data
INSERT INTO public.customers (
  email,
  first_name,
  last_name,
  source,
  total_orders,
  total_spent,
  last_order_date,
  last_event_id,
  last_event_name,
  created_at
)
SELECT DISTINCT ON (ts.customer_email)
  ts.customer_email as email,
  SPLIT_PART(ts.customer_name, ' ', 1) as first_name,
  SPLIT_PART(ts.customer_name, ' ', 2) as last_name,
  ts.platform as source,
  COUNT(*) OVER (PARTITION BY ts.customer_email) as total_orders,
  SUM(ts.total_amount) OVER (PARTITION BY ts.customer_email) as total_spent,
  MAX(ts.purchase_date) OVER (PARTITION BY ts.customer_email) as last_order_date,
  FIRST_VALUE(ts.event_id) OVER (PARTITION BY ts.customer_email ORDER BY ts.purchase_date DESC) as last_event_id,
  FIRST_VALUE(e.title) OVER (PARTITION BY ts.customer_email ORDER BY ts.purchase_date DESC) as last_event_name,
  MIN(ts.created_at) OVER (PARTITION BY ts.customer_email) as created_at
FROM public.ticket_sales ts
LEFT JOIN public.events e ON ts.event_id = e.id
WHERE ts.customer_email IS NOT NULL
AND ts.customer_email != ''
ON CONFLICT (email) DO NOTHING;