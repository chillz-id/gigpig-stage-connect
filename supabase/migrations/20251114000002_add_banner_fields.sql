-- Add banner image fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_position JSONB DEFAULT '{"x": 0, "y": 0, "scale": 1}';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.banner_url IS 'URL to banner/cover image for profile header';
COMMENT ON COLUMN public.profiles.banner_position IS 'JSON object storing banner image position and scale: {x, y, scale}';
