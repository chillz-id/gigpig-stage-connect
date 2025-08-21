-- Add spot confirmation fields to event_spots table
ALTER TABLE public.event_spots
ADD COLUMN confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'expired')),
ADD COLUMN confirmation_deadline TIMESTAMPTZ,
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN declined_at TIMESTAMPTZ;

-- Create indexes for efficient filtering
CREATE INDEX idx_event_spots_confirmation_status ON public.event_spots(confirmation_status);
CREATE INDEX idx_event_spots_confirmation_deadline ON public.event_spots(confirmation_deadline);

-- Add comments to document the new fields
COMMENT ON COLUMN public.event_spots.confirmation_status IS 'Status of comedian confirmation for the assigned spot';
COMMENT ON COLUMN public.event_spots.confirmation_deadline IS 'Deadline for comedian to confirm spot assignment';
COMMENT ON COLUMN public.event_spots.confirmed_at IS 'When the comedian confirmed the spot assignment';
COMMENT ON COLUMN public.event_spots.declined_at IS 'When the comedian declined the spot assignment';