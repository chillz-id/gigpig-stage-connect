-- Create booking_inquiries table for comedian booking requests
CREATE TABLE IF NOT EXISTS public.booking_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comedian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inquirer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME,
  event_details TEXT NOT NULL,
  budget NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_inquiries_comedian_id ON public.booking_inquiries(comedian_id);
CREATE INDEX IF NOT EXISTS idx_booking_inquiries_inquirer_id ON public.booking_inquiries(inquirer_id);
CREATE INDEX IF NOT EXISTS idx_booking_inquiries_status ON public.booking_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_booking_inquiries_event_date ON public.booking_inquiries(event_date);

-- Enable Row Level Security
ALTER TABLE public.booking_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Comedians can view inquiries sent to them
CREATE POLICY "Comedians can view their booking inquiries"
  ON public.booking_inquiries
  FOR SELECT
  USING (auth.uid() = comedian_id);

-- Policy: Inquirers can view inquiries they sent
CREATE POLICY "Inquirers can view their sent inquiries"
  ON public.booking_inquiries
  FOR SELECT
  USING (auth.uid() = inquirer_id);

-- Policy: Authenticated users can create booking inquiries
CREATE POLICY "Users can create booking inquiries"
  ON public.booking_inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = inquirer_id);

-- Policy: Comedians can update status of inquiries sent to them
CREATE POLICY "Comedians can update inquiry status"
  ON public.booking_inquiries
  FOR UPDATE
  USING (auth.uid() = comedian_id)
  WITH CHECK (auth.uid() = comedian_id);

-- Policy: Inquirers can cancel their own inquiries
CREATE POLICY "Inquirers can cancel their inquiries"
  ON public.booking_inquiries
  FOR UPDATE
  USING (auth.uid() = inquirer_id AND status = 'pending')
  WITH CHECK (auth.uid() = inquirer_id AND status = 'cancelled');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_inquiries_updated_at
  BEFORE UPDATE ON public.booking_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_inquiries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.booking_inquiries IS 'Stores booking inquiries sent to comedians';
COMMENT ON COLUMN public.booking_inquiries.comedian_id IS 'User ID of the comedian being inquired about';
COMMENT ON COLUMN public.booking_inquiries.inquirer_id IS 'User ID of the person making the inquiry';
COMMENT ON COLUMN public.booking_inquiries.event_date IS 'Date of the event';
COMMENT ON COLUMN public.booking_inquiries.event_time IS 'Time of the event';
COMMENT ON COLUMN public.booking_inquiries.event_details IS 'Description of the event and requirements';
COMMENT ON COLUMN public.booking_inquiries.budget IS 'Budget for the booking';
COMMENT ON COLUMN public.booking_inquiries.status IS 'Status of the inquiry: pending, accepted, declined, cancelled';
