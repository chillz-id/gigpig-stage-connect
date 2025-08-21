-- Create function to assign spot to comedian atomically
CREATE OR REPLACE FUNCTION assign_spot_to_comedian(
  p_event_id UUID,
  p_comedian_id UUID,
  p_spot_type TEXT,
  p_confirmation_deadline_hours INTEGER DEFAULT 48
)
RETURNS TABLE(
  spot_id UUID,
  confirmation_deadline TIMESTAMPTZ,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_spot_id UUID;
  v_confirmation_deadline TIMESTAMPTZ;
  v_existing_spot_count INTEGER;
BEGIN
  -- Check if comedian is already assigned to a spot for this event
  SELECT COUNT(*) INTO v_existing_spot_count
  FROM public.event_spots
  WHERE event_id = p_event_id 
    AND comedian_id = p_comedian_id 
    AND is_filled = true;

  IF v_existing_spot_count > 0 THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TIMESTAMPTZ,
      false,
      'Comedian is already assigned to a spot for this event'::TEXT;
    RETURN;
  END IF;

  -- Find an available spot of the requested type
  SELECT id INTO v_spot_id
  FROM public.event_spots
  WHERE event_id = p_event_id
    AND spot_name = p_spot_type
    AND is_filled = false
  LIMIT 1;

  IF v_spot_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TIMESTAMPTZ,
      false,
      ('No available ' || p_spot_type || ' spots found for this event')::TEXT;
    RETURN;
  END IF;

  -- Calculate confirmation deadline
  v_confirmation_deadline := now() + (p_confirmation_deadline_hours || ' hours')::INTERVAL;

  -- Update the spot with comedian assignment
  UPDATE public.event_spots
  SET 
    comedian_id = p_comedian_id,
    is_filled = true,
    confirmation_status = 'pending',
    confirmation_deadline = v_confirmation_deadline,
    updated_at = now()
  WHERE id = v_spot_id;

  -- Return success result
  RETURN QUERY SELECT 
    v_spot_id,
    v_confirmation_deadline,
    true,
    'Spot assigned successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION assign_spot_to_comedian(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- Add RLS policy for the function if needed
COMMENT ON FUNCTION assign_spot_to_comedian IS 'Assigns a comedian to an available event spot with confirmation deadline';