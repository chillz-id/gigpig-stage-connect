
-- Create profile-images bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

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

-- Create comedian-media bucket for comedian portfolios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comedian-media',
  'comedian-media',
  true,
  104857600, -- 100MB limit (for videos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/avi']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create policies for profile-images bucket
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

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

-- Create policies for comedian-media bucket
CREATE POLICY "Anyone can view comedian media" ON storage.objects
FOR SELECT USING (bucket_id = 'comedian-media');

CREATE POLICY "Users can upload their own comedian media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'comedian-media' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own comedian media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'comedian-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own comedian media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'comedian-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
