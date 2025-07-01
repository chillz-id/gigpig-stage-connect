-- Create comedian media tables for photos and videos
CREATE TABLE IF NOT EXISTS public.comedian_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  title TEXT,
  description TEXT,
  
  -- For uploaded files
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- For external links (YouTube, Google Drive)
  external_url TEXT,
  external_type TEXT CHECK (external_type IN ('youtube', 'google_drive', 'vimeo')),
  external_id TEXT, -- YouTube video ID, Google Drive file ID, etc.
  
  -- Media metadata
  thumbnail_url TEXT,
  duration INTEGER, -- for videos in seconds
  width INTEGER,
  height INTEGER,
  
  -- Organization
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  tags TEXT[], -- for categorization
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comedian_media_user_type ON public.comedian_media(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_comedian_media_featured ON public.comedian_media(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_comedian_media_order ON public.comedian_media(user_id, display_order);

-- Enable RLS
ALTER TABLE public.comedian_media ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all comedian media" ON public.comedian_media
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own media" ON public.comedian_media
FOR ALL USING (auth.uid() = user_id);

-- Create storage bucket for comedian media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comedian-media', 'comedian-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Authenticated users can upload comedian media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'comedian-media' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view comedian media" ON storage.objects
FOR SELECT USING (bucket_id = 'comedian-media');

CREATE POLICY "Users can update their own media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'comedian-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'comedian-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);