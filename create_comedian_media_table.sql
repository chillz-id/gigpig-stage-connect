-- Create comedian_media table for storing comedian photos and videos
-- This table supports both direct file uploads and external media (YouTube, Google Drive, Vimeo)

-- Create the table
CREATE TABLE IF NOT EXISTS public.comedian_media (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to auth.users
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Media type with check constraint
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    
    -- Basic metadata
    title TEXT,
    description TEXT,
    
    -- File upload fields
    file_url TEXT,
    thumbnail_url TEXT,
    file_size BIGINT,
    file_type TEXT,
    
    -- External media fields
    external_url TEXT,
    external_type TEXT CHECK (external_type IN ('youtube', 'google_drive', 'vimeo', NULL)),
    external_id TEXT,
    
    -- Media dimensions and duration
    duration INTEGER, -- in seconds for videos
    width INTEGER,
    height INTEGER,
    
    -- Display settings
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Tags for categorization
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_media_source CHECK (
        -- Either file_url OR external_url must be present, but not both
        (file_url IS NOT NULL AND external_url IS NULL) OR 
        (file_url IS NULL AND external_url IS NOT NULL)
    ),
    CONSTRAINT valid_external_media CHECK (
        -- If external_url is present, external_type must also be present
        (external_url IS NULL) OR (external_url IS NOT NULL AND external_type IS NOT NULL)
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_comedian_media_user_id ON public.comedian_media(user_id);
CREATE INDEX idx_comedian_media_media_type ON public.comedian_media(media_type);
CREATE INDEX idx_comedian_media_is_featured ON public.comedian_media(is_featured);
CREATE INDEX idx_comedian_media_display_order ON public.comedian_media(display_order);
CREATE INDEX idx_comedian_media_created_at ON public.comedian_media(created_at DESC);
CREATE INDEX idx_comedian_media_tags ON public.comedian_media USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comedian_media_updated_at 
    BEFORE UPDATE ON public.comedian_media 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.comedian_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Users can view all published media (for public profiles)
CREATE POLICY "Anyone can view comedian media"
    ON public.comedian_media
    FOR SELECT
    USING (true);

-- Policy 2: Users can insert their own media
CREATE POLICY "Users can insert their own media"
    ON public.comedian_media
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own media
CREATE POLICY "Users can update their own media"
    ON public.comedian_media
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own media
CREATE POLICY "Users can delete their own media"
    ON public.comedian_media
    FOR DELETE
    USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.comedian_media IS 'Stores comedian media files (photos and videos) with support for both direct uploads and external sources';
COMMENT ON COLUMN public.comedian_media.id IS 'Unique identifier for the media item';
COMMENT ON COLUMN public.comedian_media.user_id IS 'Reference to the comedian user who owns this media';
COMMENT ON COLUMN public.comedian_media.media_type IS 'Type of media: photo or video';
COMMENT ON COLUMN public.comedian_media.title IS 'Optional title for the media item';
COMMENT ON COLUMN public.comedian_media.description IS 'Optional description or caption for the media';
COMMENT ON COLUMN public.comedian_media.file_url IS 'URL to the uploaded file in storage (mutually exclusive with external_url)';
COMMENT ON COLUMN public.comedian_media.thumbnail_url IS 'URL to the thumbnail image (for videos or custom photo thumbnails)';
COMMENT ON COLUMN public.comedian_media.file_size IS 'Size of the uploaded file in bytes';
COMMENT ON COLUMN public.comedian_media.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.comedian_media.external_url IS 'URL to external media source (mutually exclusive with file_url)';
COMMENT ON COLUMN public.comedian_media.external_type IS 'Type of external media source: youtube, google_drive, or vimeo';
COMMENT ON COLUMN public.comedian_media.external_id IS 'ID of the media on the external platform (e.g., YouTube video ID)';
COMMENT ON COLUMN public.comedian_media.duration IS 'Duration in seconds (for videos)';
COMMENT ON COLUMN public.comedian_media.width IS 'Width in pixels';
COMMENT ON COLUMN public.comedian_media.height IS 'Height in pixels';
COMMENT ON COLUMN public.comedian_media.is_featured IS 'Whether this media item should be prominently displayed';
COMMENT ON COLUMN public.comedian_media.display_order IS 'Order for displaying media items (lower numbers first)';
COMMENT ON COLUMN public.comedian_media.tags IS 'Array of tags for categorizing and searching media';
COMMENT ON COLUMN public.comedian_media.created_at IS 'Timestamp when the media was added';
COMMENT ON COLUMN public.comedian_media.updated_at IS 'Timestamp when the media was last updated';

-- Grant permissions to the service role
GRANT ALL ON public.comedian_media TO service_role;
GRANT USAGE ON SEQUENCE public.comedian_media_id_seq TO service_role;

-- Create storage bucket for comedian media if it doesn't exist
-- Note: This needs to be run separately in the Supabase dashboard or via the storage API
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'comedian-media',
--     'comedian-media',
--     true,
--     52428800, -- 50MB limit
--     ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
-- ) ON CONFLICT (id) DO NOTHING;

-- Storage policies for the comedian-media bucket
-- These also need to be created via Supabase dashboard or storage API
-- 1. Anyone can view files
-- 2. Authenticated users can upload to their own folder
-- 3. Users can update/delete their own files