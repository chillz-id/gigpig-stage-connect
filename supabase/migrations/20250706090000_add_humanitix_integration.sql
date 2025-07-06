-- Add Humanitix integration columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS external_source TEXT,
ADD COLUMN IF NOT EXISTS external_ticket_url TEXT,
ADD COLUMN IF NOT EXISTS humanitix_data JSONB;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_external_id ON public.events(external_id);
CREATE INDEX IF NOT EXISTS idx_events_external_source ON public.events(external_source);

-- Add check constraint for external sources
ALTER TABLE public.events 
ADD CONSTRAINT valid_external_source 
CHECK (external_source IN ('humanitix', 'eventbrite', 'ticketek', NULL));

-- Create a mapping table for Humanitix organisers to Stand Up Sydney promoters
CREATE TABLE IF NOT EXISTS public.humanitix_organiser_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  humanitix_organiser_id TEXT UNIQUE NOT NULL,
  promoter_id UUID REFERENCES auth.users(id) NOT NULL,
  organiser_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample mapping for iD Comedy Club (from your API response)
-- You'll need to update this with actual promoter IDs
INSERT INTO public.humanitix_organiser_mapping (humanitix_organiser_id, promoter_id, organiser_name)
VALUES 
  ('6821a3b77a7599aeef88b30c', 'YOUR_ID_COMEDY_PROMOTER_UUID', 'iD Comedy Club')
ON CONFLICT (humanitix_organiser_id) DO NOTHING;

-- Create a view for easy access to Humanitix events
CREATE OR REPLACE VIEW public.humanitix_events AS
SELECT 
  e.*,
  hom.organiser_name as humanitix_organiser_name
FROM public.events e
LEFT JOIN public.humanitix_organiser_mapping hom 
  ON (e.humanitix_data->>'organiser_id')::text = hom.humanitix_organiser_id
WHERE e.external_source = 'humanitix';

-- Grant permissions
GRANT SELECT ON public.humanitix_events TO authenticated;
GRANT ALL ON public.humanitix_organiser_mapping TO authenticated;

-- Add RLS policies
ALTER TABLE public.humanitix_organiser_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage organiser mappings" ON public.humanitix_organiser_mapping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Promoters can view their own mappings" ON public.humanitix_organiser_mapping
  FOR SELECT USING (promoter_id = auth.uid());