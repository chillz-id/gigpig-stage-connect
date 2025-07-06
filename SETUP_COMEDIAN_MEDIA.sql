-- Create comedian_media table for storing comedian photos and videos
CREATE TABLE IF NOT EXISTS public.comedian_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  external_url TEXT,
  external_type TEXT CHECK (external_type IN ('youtube', 'google_drive', 'vimeo') OR external_type IS NULL),
  external_id TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either file_url or external_url is present, but not both
  CONSTRAINT valid_media_source CHECK (
    (file_url IS NOT NULL AND external_url IS NULL) OR 
    (file_url IS NULL AND external_url IS NOT NULL)
  ),
  
  -- If external_url is present, external_type must also be present
  CONSTRAINT valid_external_media CHECK (
    (external_url IS NULL) OR 
    (external_url IS NOT NULL AND external_type IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comedian_media_user_id ON public.comedian_media(user_id);
CREATE INDEX IF NOT EXISTS idx_comedian_media_media_type ON public.comedian_media(media_type);
CREATE INDEX IF NOT EXISTS idx_comedian_media_featured ON public.comedian_media(is_featured);
CREATE INDEX IF NOT EXISTS idx_comedian_media_display_order ON public.comedian_media(display_order);
CREATE INDEX IF NOT EXISTS idx_comedian_media_created_at ON public.comedian_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comedian_media_tags ON public.comedian_media USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_comedian_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_comedian_media_updated_at ON public.comedian_media;
CREATE TRIGGER tr_comedian_media_updated_at
  BEFORE UPDATE ON public.comedian_media
  FOR EACH ROW
  EXECUTE FUNCTION update_comedian_media_updated_at();

-- Enable Row Level Security
ALTER TABLE public.comedian_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comedian media" ON public.comedian_media;
DROP POLICY IF EXISTS "Users can insert own media" ON public.comedian_media;
DROP POLICY IF EXISTS "Users can update own media" ON public.comedian_media;
DROP POLICY IF EXISTS "Users can delete own media" ON public.comedian_media;

-- RLS Policies
-- Anyone can view media (for public profiles)
CREATE POLICY "Anyone can view comedian media"
  ON public.comedian_media FOR SELECT
  USING (true);

-- Users can insert their own media
CREATE POLICY "Users can insert own media"
  ON public.comedian_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
CREATE POLICY "Users can update own media"
  ON public.comedian_media FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete own media"
  ON public.comedian_media FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.comedian_media IS 'Stores media (photos and videos) for comedian profiles';
COMMENT ON COLUMN public.comedian_media.media_type IS 'Type of media: photo or video';
COMMENT ON COLUMN public.comedian_media.file_url IS 'URL for uploaded files in Supabase storage';
COMMENT ON COLUMN public.comedian_media.external_url IS 'URL for external media (YouTube, Google Drive, etc)';
COMMENT ON COLUMN public.comedian_media.external_type IS 'Type of external media platform';
COMMENT ON COLUMN public.comedian_media.external_id IS 'ID of the media on the external platform';
COMMENT ON COLUMN public.comedian_media.is_featured IS 'Whether this media item should be prominently displayed';
COMMENT ON COLUMN public.comedian_media.display_order IS 'Order in which media items should be displayed';
COMMENT ON COLUMN public.comedian_media.tags IS 'Array of tags for categorizing media';