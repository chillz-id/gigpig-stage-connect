
-- Create event-media bucket for event banners and media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create policies for event-media bucket
CREATE POLICY "Anyone can view event media" ON storage.objects
FOR SELECT USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users can upload event media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own event media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own event media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
