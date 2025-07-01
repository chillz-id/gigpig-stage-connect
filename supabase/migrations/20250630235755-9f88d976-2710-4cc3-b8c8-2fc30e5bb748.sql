
-- Add a column to comedian_bookings for selection state
ALTER TABLE comedian_bookings 
ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT false;

-- Add columns to support percentage-based payments
ALTER TABLE comedian_bookings 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'fixed' CHECK (payment_type IN ('fixed', 'percentage_revenue', 'percentage_door'));

-- Add column for percentage amount when using percentage-based payments
ALTER TABLE comedian_bookings 
ADD COLUMN IF NOT EXISTS percentage_amount NUMERIC DEFAULT 0;

-- Add column to track if booking is editable
ALTER TABLE comedian_bookings 
ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;

-- Create a function to calculate revenue-based payments
CREATE OR REPLACE FUNCTION calculate_comedian_payment(
  booking_id UUID,
  total_event_revenue NUMERIC DEFAULT 0,
  door_sales NUMERIC DEFAULT 0
) RETURNS NUMERIC AS $$
DECLARE
  booking_record RECORD;
  calculated_fee NUMERIC;
BEGIN
  -- Get the booking details
  SELECT * INTO booking_record 
  FROM comedian_bookings 
  WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate payment based on type
  CASE booking_record.payment_type
    WHEN 'fixed' THEN
      calculated_fee := booking_record.performance_fee;
    WHEN 'percentage_revenue' THEN
      calculated_fee := (total_event_revenue * booking_record.percentage_amount / 100);
    WHEN 'percentage_door' THEN
      calculated_fee := (door_sales * booking_record.percentage_amount / 100);
    ELSE
      calculated_fee := booking_record.performance_fee;
  END CASE;
  
  RETURN COALESCE(calculated_fee, 0);
END;
$$ LANGUAGE plpgsql;

-- Create a table for batch payment processing
CREATE TABLE IF NOT EXISTS batch_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  total_amount NUMERIC DEFAULT 0,
  selected_bookings UUID[] DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  xero_batch_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on batch_payments
ALTER TABLE batch_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for batch_payments (admins only)
CREATE POLICY "Admins can manage batch payments" ON batch_payments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Update comedian_bookings policies to ensure currency is included
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can view all comedian bookings" ON comedian_bookings;
  DROP POLICY IF EXISTS "Admins can manage comedian bookings" ON comedian_bookings;
  
  -- Recreate policies
  CREATE POLICY "Admins can view all comedian bookings" ON comedian_bookings
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ));

  CREATE POLICY "Admins can manage comedian bookings" ON comedian_bookings
    FOR ALL USING (EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ));
END $$;
