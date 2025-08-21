-- Enhance vouch system with proper constraints and permissions
-- This migration adds self-vouch prevention and edit functionality

-- Add constraint to prevent self-vouching
ALTER TABLE public.vouches 
ADD CONSTRAINT no_self_vouch CHECK (voucher_id != vouchee_id);

-- Add updated_at column for tracking edits
ALTER TABLE public.vouches 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update the updated_at field
CREATE TRIGGER update_vouches_updated_at 
    BEFORE UPDATE ON public.vouches 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for vouches to allow editing
DROP POLICY IF EXISTS "Users can create vouches" ON public.vouches;

-- Allow users to create vouches (insert)
CREATE POLICY "Users can create vouches" 
ON public.vouches 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = voucher_id 
  AND voucher_id != vouchee_id  -- Prevent self-vouching at policy level too
);

-- Allow users to update their own vouches
CREATE POLICY "Users can update own vouches" 
ON public.vouches 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = voucher_id)
WITH CHECK (auth.uid() = voucher_id);

-- Allow users to delete their own vouches
CREATE POLICY "Users can delete own vouches" 
ON public.vouches 
FOR DELETE 
TO authenticated 
USING (auth.uid() = voucher_id);

-- Create function to check if vouch exists between two users
CREATE OR REPLACE FUNCTION public.get_existing_vouch(giver_id UUID, receiver_id UUID)
RETURNS TABLE (
  id UUID,
  message TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.message,
    v.rating,
    v.created_at,
    v.updated_at
  FROM public.vouches v
  WHERE v.voucher_id = giver_id 
    AND v.vouchee_id = receiver_id;
END;
$$;

-- Create function to get vouch statistics for a user
CREATE OR REPLACE FUNCTION public.get_vouch_stats(user_id_param UUID)
RETURNS TABLE (
  total_given INTEGER,
  total_received INTEGER,
  average_rating_received NUMERIC,
  recent_vouches_received INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(given.total_given, 0) as total_given,
    COALESCE(received.total_received, 0) as total_received,
    COALESCE(received.average_rating, 0) as average_rating_received,
    COALESCE(recent.recent_count, 0) as recent_vouches_received
  FROM (
    SELECT COUNT(*) as total_given
    FROM public.vouches
    WHERE voucher_id = user_id_param
  ) given
  CROSS JOIN (
    SELECT 
      COUNT(*) as total_received,
      AVG(rating) as average_rating
    FROM public.vouches
    WHERE vouchee_id = user_id_param
      AND rating IS NOT NULL
  ) received
  CROSS JOIN (
    SELECT COUNT(*) as recent_count
    FROM public.vouches
    WHERE vouchee_id = user_id_param
      AND created_at >= NOW() - INTERVAL '30 days'
  ) recent;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vouches_voucher_id ON public.vouches(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vouches_vouchee_id ON public.vouches(vouchee_id);
CREATE INDEX IF NOT EXISTS idx_vouches_created_at ON public.vouches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vouches_rating ON public.vouches(vouchee_id, rating) WHERE rating IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_existing_vouch(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vouch_stats(UUID) TO authenticated;