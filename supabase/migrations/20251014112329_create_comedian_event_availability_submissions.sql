-- Create table for comedian event availability submissions
-- This allows comedians to submit availability for specific events without authentication

CREATE TABLE IF NOT EXISTS public.comedian_event_availability_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  canonical_source TEXT NOT NULL,
  canonical_session_source_id TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one submission per comedian per session
  CONSTRAINT unique_comedian_session UNIQUE (email, canonical_source, canonical_session_source_id)
);

-- Create indexes for common queries
CREATE INDEX idx_availability_submissions_email
  ON public.comedian_event_availability_submissions(email);

CREATE INDEX idx_availability_submissions_session
  ON public.comedian_event_availability_submissions(canonical_source, canonical_session_source_id);

CREATE INDEX idx_availability_submissions_submitted_at
  ON public.comedian_event_availability_submissions(submitted_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.comedian_event_availability_submissions IS
  'Stores comedian availability submissions for specific events from session_financials. Unauthenticated submissions using email as identifier.';

-- Enable Row Level Security
ALTER TABLE public.comedian_event_availability_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public INSERT (for comedian submissions)
CREATE POLICY "Anyone can submit availability"
  ON public.comedian_event_availability_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policy: Allow authenticated users with specific roles to view submissions
CREATE POLICY "Authorized users can view submissions"
  ON public.comedian_event_availability_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('admin', 'promoter', 'venue_manager', 'agency_manager')
    )
  );

-- RLS Policy: Allow authorized users to update submissions (e.g., add notes)
CREATE POLICY "Authorized users can update submissions"
  ON public.comedian_event_availability_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('admin', 'promoter', 'venue_manager', 'agency_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('admin', 'promoter', 'venue_manager', 'agency_manager')
    )
  );

-- RLS Policy: Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
  ON public.comedian_event_availability_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comedian_event_availability_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_comedian_event_availability_submissions_updated_at
  BEFORE UPDATE ON public.comedian_event_availability_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_comedian_event_availability_submissions_updated_at();
