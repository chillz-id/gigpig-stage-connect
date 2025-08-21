-- Add missing fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS spot_type TEXT,
ADD COLUMN IF NOT EXISTS availability_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requirements_acknowledged BOOLEAN DEFAULT false;

-- Add spot confirmation fields to event_spots table
ALTER TABLE event_spots
ADD COLUMN IF NOT EXISTS confirmation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

-- Create spot_assignments tracking table
CREATE TABLE IF NOT EXISTS spot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES event_spots(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'expired')),
  confirmation_deadline TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure a comedian can only have one assignment per event
  UNIQUE(event_id, comedian_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spot_assignments_event_id ON spot_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_spot_assignments_comedian_id ON spot_assignments(comedian_id);
CREATE INDEX IF NOT EXISTS idx_spot_assignments_confirmation_status ON spot_assignments(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_applications_spot_type ON applications(spot_type);
CREATE INDEX IF NOT EXISTS idx_event_spots_confirmation_status ON event_spots(confirmation_status);

-- Create the assign_spot_to_comedian RPC function
CREATE OR REPLACE FUNCTION assign_spot_to_comedian(
  p_event_id UUID,
  p_comedian_id UUID,
  p_spot_type TEXT,
  p_confirmation_deadline_hours INTEGER DEFAULT 48
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_spot_id UUID;
  v_assignment_id UUID;
  v_confirmation_deadline TIMESTAMPTZ;
  v_existing_assignment UUID;
  v_application_id UUID;
BEGIN
  -- Check if comedian already has an assignment for this event
  SELECT id INTO v_existing_assignment
  FROM spot_assignments
  WHERE event_id = p_event_id AND comedian_id = p_comedian_id
  LIMIT 1;
  
  IF v_existing_assignment IS NOT NULL THEN
    RAISE EXCEPTION 'Comedian is already assigned to a spot for this event';
  END IF;
  
  -- Find an available spot of the requested type
  SELECT id INTO v_spot_id
  FROM event_spots
  WHERE event_id = p_event_id
    AND spot_name = p_spot_type
    AND is_filled = false
    AND comedian_id IS NULL
  ORDER BY spot_order
  LIMIT 1
  FOR UPDATE;
  
  IF v_spot_id IS NULL THEN
    RAISE EXCEPTION 'No available % spots found for this event', p_spot_type;
  END IF;
  
  -- Calculate confirmation deadline
  v_confirmation_deadline := now() + (p_confirmation_deadline_hours || ' hours')::INTERVAL;
  
  -- Update the event spot
  UPDATE event_spots
  SET 
    comedian_id = p_comedian_id,
    is_filled = true,
    confirmation_status = 'pending',
    confirmation_deadline = v_confirmation_deadline,
    updated_at = now()
  WHERE id = v_spot_id;
  
  -- Find related application if exists
  SELECT id INTO v_application_id
  FROM applications
  WHERE event_id = p_event_id 
    AND comedian_id = p_comedian_id
    AND status = 'pending'
  ORDER BY applied_at DESC
  LIMIT 1;
  
  -- Update application status if found
  IF v_application_id IS NOT NULL THEN
    UPDATE applications
    SET 
      status = 'accepted',
      responded_at = now()
    WHERE id = v_application_id;
  END IF;
  
  -- Create spot assignment record
  INSERT INTO spot_assignments (
    event_id,
    spot_id,
    comedian_id,
    application_id,
    assigned_by,
    confirmation_deadline,
    confirmation_status
  ) VALUES (
    p_event_id,
    v_spot_id,
    p_comedian_id,
    v_application_id,
    auth.uid(),
    v_confirmation_deadline,
    'pending'
  )
  RETURNING id INTO v_assignment_id;
  
  -- Return assignment details
  RETURN jsonb_build_object(
    'assignment_id', v_assignment_id,
    'spot_id', v_spot_id,
    'confirmation_deadline', v_confirmation_deadline,
    'application_updated', v_application_id IS NOT NULL
  );
END;
$$;

-- Add RLS policies for spot_assignments table
ALTER TABLE spot_assignments ENABLE ROW LEVEL SECURITY;

-- Comedians can view their own assignments
CREATE POLICY "Comedians can view their own assignments"
ON spot_assignments FOR SELECT
TO authenticated
USING (comedian_id = auth.uid());

-- Event promoters can view and manage assignments for their events
CREATE POLICY "Promoters can manage assignments for their events"
ON spot_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_id
    AND events.promoter_id = auth.uid()
  )
);

-- Admins can manage all assignments (using user_roles table)
CREATE POLICY "Admins can manage all assignments"
ON spot_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spot_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spot_assignments_updated_at
BEFORE UPDATE ON spot_assignments
FOR EACH ROW
EXECUTE FUNCTION update_spot_assignments_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON spot_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION assign_spot_to_comedian TO authenticated;