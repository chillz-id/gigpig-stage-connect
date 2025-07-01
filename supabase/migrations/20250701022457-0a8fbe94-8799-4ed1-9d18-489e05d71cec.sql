
-- Add profile_slug column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_slug text;

-- Create a unique index to ensure profile slugs are unique
CREATE UNIQUE INDEX idx_profiles_profile_slug 
ON public.profiles (profile_slug) 
WHERE profile_slug IS NOT NULL;
