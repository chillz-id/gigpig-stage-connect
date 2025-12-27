-- Add missing tags column to comedian_media table
-- The MediaUpload component expects this column for categorization

ALTER TABLE public.comedian_media
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for better tag search performance
CREATE INDEX IF NOT EXISTS idx_comedian_media_tags ON public.comedian_media USING GIN(tags);

-- Add comment to clarify column usage
COMMENT ON COLUMN public.comedian_media.tags IS 'Array of tags for categorizing media (e.g., Set, Showreel, Live Performance)';
