-- Add missing file columns to comedian_media table
-- These columns are expected by the MediaUpload component but were missing from the schema

ALTER TABLE public.comedian_media
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS external_type TEXT CHECK (external_type IN ('youtube', 'google_drive', 'vimeo')),
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_comedian_media_file_type ON public.comedian_media(media_type, file_type) WHERE file_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comedian_media_external_type ON public.comedian_media(media_type, external_type) WHERE external_type IS NOT NULL;

-- Add comment to clarify column usage
COMMENT ON COLUMN public.comedian_media.file_url IS 'URL for uploaded files in Supabase storage';
COMMENT ON COLUMN public.comedian_media.file_size IS 'File size in bytes for uploaded files';
COMMENT ON COLUMN public.comedian_media.file_type IS 'MIME type for uploaded files (e.g., image/jpeg, video/mp4)';
COMMENT ON COLUMN public.comedian_media.external_url IS 'Full URL for externally hosted media (YouTube, Google Drive, etc.)';
COMMENT ON COLUMN public.comedian_media.external_type IS 'Type of external hosting service';
COMMENT ON COLUMN public.comedian_media.external_id IS 'External service ID (e.g., YouTube video ID)';
