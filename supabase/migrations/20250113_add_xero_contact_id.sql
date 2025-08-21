-- Add Xero contact ID to profiles table for contact synchronization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xero_contact_id VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_xero_contact_id 
ON public.profiles(xero_contact_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.xero_contact_id IS 'Xero contact ID for synchronizing comedian/promoter profiles with Xero accounting system';