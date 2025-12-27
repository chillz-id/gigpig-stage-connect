-- Add media_layout field to profiles table for EPK customization
-- Allows comedians to choose how their media portfolio is displayed publicly

-- Create enum type for media layout options
DO $$ BEGIN
  CREATE TYPE media_layout_type AS ENUM ('grid', 'masonic', 'list');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add media_layout column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS media_layout media_layout_type DEFAULT 'grid';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.media_layout IS 'Display layout for media portfolio on public EPK: grid (standard grid), masonic (Pinterest-style), or list (vertical list with large previews)';
