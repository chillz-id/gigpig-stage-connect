-- ============================================
-- COMPLETE SUPABASE SETUP FOR STAND UP SYDNEY
-- ============================================
-- This script creates all required storage buckets, RPC functions, and policies
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. STORAGE BUCKETS
-- ============================================

-- Create profile-images bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
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
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']::text[]
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
-- 2. STORAGE POLICIES
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

-- Policies for comedian-media bucket
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

-- Policies for event-media bucket
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

-- ============================================
-- 3. CRITICAL RPC FUNCTIONS
-- ============================================

-- Function to check if user is co-promoter for an event
CREATE OR REPLACE FUNCTION is_co_promoter_for_event(_user_id UUID, _event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM events 
    WHERE id = _event_id 
    AND _user_id = ANY(co_promoter_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comedian stats
CREATE OR REPLACE FUNCTION get_comedian_stats(_comedian_id UUID)
RETURNS TABLE (
  total_shows INTEGER,
  total_applications INTEGER,
  accepted_applications INTEGER,
  average_rating NUMERIC,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT es.event_id), 0)::INTEGER as total_shows,
    COALESCE(COUNT(DISTINCT ea.id), 0)::INTEGER as total_applications,
    COALESCE(COUNT(DISTINCT CASE WHEN ea.status = 'accepted' THEN ea.id END), 0)::INTEGER as accepted_applications,
    COALESCE(AVG(cr.rating), 0)::NUMERIC as average_rating,
    COALESCE(COUNT(DISTINCT cr.id), 0)::INTEGER as total_reviews
  FROM profiles p
  LEFT JOIN event_spots es ON es.performer_id = p.id
  LEFT JOIN event_applications ea ON ea.comedian_id = p.id
  LEFT JOIN comedian_reviews cr ON cr.comedian_id = p.id
  WHERE p.id = _comedian_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vouch stats
CREATE OR REPLACE FUNCTION get_vouch_stats(_profile_id UUID)
RETURNS TABLE (
  vouches_received INTEGER,
  vouches_given INTEGER,
  unique_vouchers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT CASE WHEN vouched_for_id = _profile_id THEN id END), 0)::INTEGER as vouches_received,
    COALESCE(COUNT(DISTINCT CASE WHEN voucher_id = _profile_id THEN id END), 0)::INTEGER as vouches_given,
    COALESCE(COUNT(DISTINCT CASE WHEN vouched_for_id = _profile_id THEN voucher_id END), 0)::INTEGER as unique_vouchers
  FROM vouches
  WHERE vouched_for_id = _profile_id OR voucher_id = _profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get existing vouch
CREATE OR REPLACE FUNCTION get_existing_vouch(_voucher_id UUID, _vouched_for_id UUID)
RETURNS TABLE (
  id UUID,
  voucher_id UUID,
  vouched_for_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT v.id, v.voucher_id, v.vouched_for_id, v.created_at
  FROM vouches v
  WHERE v.voucher_id = _voucher_id 
  AND v.vouched_for_id = _vouched_for_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. CRITICAL MISSING COLUMNS
-- ============================================

-- Add stage_name column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stage_name TEXT;

-- Add name_display_preference column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name_display_preference TEXT 
CHECK (name_display_preference IN ('real', 'stage', 'both'))
DEFAULT 'real';

-- Add co_promoter_ids to events if it doesn't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS co_promoter_ids UUID[] DEFAULT '{}';

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION is_co_promoter_for_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_comedian_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vouch_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_existing_vouch TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if storage buckets were created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('profile-images', 'comedian-media', 'event-media');

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('stage_name', 'name_display_preference');

-- Check if RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_schema = 'public'
AND routine_name IN ('is_co_promoter_for_event', 'get_comedian_stats', 'get_vouch_stats', 'get_existing_vouch');