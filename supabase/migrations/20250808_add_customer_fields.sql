-- Add enhanced customer fields for better data capture
-- Date of Birth, Address, Company fields + Always opt-in policy

-- Add new columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS company TEXT;

-- Update marketing_opt_in default to true (always opt-in policy)
ALTER TABLE public.customers 
ALTER COLUMN marketing_opt_in SET DEFAULT true;

-- Update existing customers to opt-in by default
UPDATE public.customers 
SET marketing_opt_in = true 
WHERE marketing_opt_in = false OR marketing_opt_in IS NULL;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_customers_date_of_birth ON public.customers(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company);

-- Update the customer analytics view to include new fields
CREATE OR REPLACE VIEW public.customer_analytics AS
SELECT 
  c.id,
  c.email,
  c.first_name || ' ' || c.last_name as full_name,
  c.mobile,
  c.date_of_birth,
  c.address,
  c.company,
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

-- Update the Brevo sync function to include new fields
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
        'FIRSTNAME', COALESCE(c.first_name, ''),
        'LASTNAME', COALESCE(c.last_name, ''),
        'SMS', COALESCE(c.mobile, ''),
        'DATE_OF_BIRTH', CASE WHEN c.date_of_birth IS NOT NULL THEN c.date_of_birth::TEXT ELSE '' END,
        'ADDRESS', COALESCE(c.address, ''),
        'COMPANY', COALESCE(c.company, ''),
        'ORDER_COUNT', COALESCE(c.total_orders, 0),
        'LIFETIME_VALUE', COALESCE(c.total_spent, 0),
        'LAST_EVENT_NAME', COALESCE(c.last_event_name, ''),
        'LAST_ORDER_DATE', CASE WHEN c.last_order_date IS NOT NULL THEN c.last_order_date::DATE::TEXT ELSE '' END,
        'CUSTOMER_SEGMENT', COALESCE(c.customer_segment, 'new'),
        'MARKETING_OPT_IN', COALESCE(c.marketing_opt_in, true),
        'PREFERRED_VENUE', COALESCE(c.preferred_venue, ''),
        'SOURCE', COALESCE(c.source, 'humanitix'),
        'CUSTOMER_SINCE', CASE WHEN c.created_at IS NOT NULL THEN c.created_at::DATE::TEXT ELSE '' END
      ),
      'listIds', ARRAY[3], -- Stand Up Sydney main list
      'updateEnabled', true
    ) as sync_data
  FROM public.customers c
  WHERE c.brevo_sync_status IN ('pending', 'failed')
  AND c.email IS NOT NULL
  AND c.email != ''
  ORDER BY c.updated_at DESC
  LIMIT 100; -- Process in batches
END;
$$ LANGUAGE plpgsql;

-- Add comments for new fields
COMMENT ON COLUMN public.customers.date_of_birth IS 'Customer date of birth for targeted campaigns and age demographics';
COMMENT ON COLUMN public.customers.address IS 'Customer address for location-based marketing and event recommendations';
COMMENT ON COLUMN public.customers.company IS 'Customer company for B2B marketing and corporate event targeting';

-- Update the customer metrics trigger to handle new fields
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
      WHEN (total_orders + 1) >= 5 OR (total_spent + NEW.total_amount) > 200 THEN 'vip'
      WHEN (total_orders + 1) >= 2 OR (total_spent + NEW.total_amount) > 50 THEN 'active'
      WHEN NEW.purchase_date < NOW() - INTERVAL '6 months' THEN 'inactive'
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
      marketing_opt_in, -- Always true now
      source,
      total_orders,
      total_spent,
      last_order_date,
      last_event_id,
      last_event_name
    ) VALUES (
      NEW.customer_email,
      SPLIT_PART(NEW.customer_name, ' ', 1),
      CASE 
        WHEN position(' ' in NEW.customer_name) > 0 
        THEN substring(NEW.customer_name from position(' ' in NEW.customer_name) + 1)
        ELSE ''
      END,
      true, -- Always opt-in
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