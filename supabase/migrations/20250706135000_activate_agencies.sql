-- Update all agencies to active status for testing
-- In production, you'd have a proper verification process

UPDATE public.agencies 
SET status = 'active', verified_at = NOW()
WHERE status = 'pending_verification';

-- Also create a function to easily activate agencies
CREATE OR REPLACE FUNCTION public.activate_agency(_agency_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agencies 
  SET status = 'active', verified_at = NOW(), updated_at = NOW()
  WHERE id = _agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.activate_agency(UUID) TO authenticated;