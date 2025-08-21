-- ============================================
-- CREATE STORAGE BUCKETS FOR STAND UP SYDNEY
-- ============================================
-- Run this in Supabase SQL Editor to create the missing storage buckets

-- Create profile-images bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create comedian-media bucket for comedian portfolios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comedian-media',
  'comedian-media',
  true,
  52428800, -- 50MB limit (for videos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create event-media bucket for event banners and media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view comedian media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own comedian media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own comedian media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own comedian media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event media" ON storage.objects;

-- Policies for profile-images bucket
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid() IS NOT NULL
);

-- Policies for comedian-media bucket
CREATE POLICY "Anyone can view comedian media" ON storage.objects
FOR SELECT USING (bucket_id = 'comedian-media');

CREATE POLICY "Users can upload their own comedian media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'comedian-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own comedian media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'comedian-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own comedian media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'comedian-media' 
  AND auth.uid() IS NOT NULL
);

-- Policies for event-media bucket
CREATE POLICY "Anyone can view event media" ON storage.objects
FOR SELECT USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users can upload event media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own event media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own event media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-media' 
  AND auth.uid() IS NOT NULL
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if buckets were created
SELECT 
    id,
    name,
    public,
    file_size_limit,
    array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id IN ('profile-images', 'comedian-media', 'event-media')
ORDER BY id;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profile images%' 
   OR policyname LIKE '%comedian media%' 
   OR policyname LIKE '%event media%'
ORDER BY policyname;

SELECT '✅ Storage buckets and policies created successfully!' as message;