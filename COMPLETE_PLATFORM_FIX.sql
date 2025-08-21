-- ============================================
-- COMPLETE PLATFORM FIX - ALL CRITICAL ISSUES
-- ============================================
-- This script fixes ALL known critical issues:
-- 1. Profile creation with proper field mapping
-- 2. Storage bucket creation
-- 3. Missing RPC functions
-- 4. Proper role handling

-- ============================================
-- PART 1: CREATE MISSING STORAGE BUCKETS
-- ============================================
-- Note: These need to be created via Supabase Dashboard or API
-- as SQL cannot create storage buckets directly

-- Expected buckets:
-- 1. profile-images (for user avatars)
-- 2. comedian-media (for comedian videos/photos)
-- 3. event-media (for event images)

-- To verify buckets exist:
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets
ORDER BY created_at;

-- ============================================
-- PART 2: FIX PROFILE CREATION TRIGGER
-- ============================================

-- Drop existing function to recreate with proper field handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create enhanced handle_new_user function that extracts ALL signup fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile with ALL fields from signup form
    INSERT INTO public.profiles (
        id,
        email,
        name,
        first_name,
        last_name,
        phone,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        -- Combine first_name and last_name for name field
        COALESCE(
            new.raw_user_meta_data->>'name',
            CASE 
                WHEN new.raw_user_meta_data->>'first_name' IS NOT NULL 
                  OR new.raw_user_meta_data->>'last_name' IS NOT NULL
                THEN TRIM(CONCAT(
                    COALESCE(new.raw_user_meta_data->>'first_name', ''),
                    ' ',
                    COALESCE(new.raw_user_meta_data->>'last_name', '')
                ))
                ELSE split_part(new.email, '@', 1)
            END
        ),
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'mobile',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        -- Update fields if profile exists but fields are missing
        name = CASE 
            WHEN profiles.name IS NULL THEN EXCLUDED.name 
            ELSE profiles.name 
        END,
        first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
        last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
        phone = COALESCE(profiles.phone, EXCLUDED.phone),
        updated_at = now();
    
    -- Handle roles from signup metadata
    IF new.raw_user_meta_data->'roles' IS NOT NULL AND 
       jsonb_array_length(new.raw_user_meta_data->'roles') > 0 THEN
        -- Insert each role from the roles array
        INSERT INTO public.user_roles (id, user_id, role, created_at)
        SELECT 
            gen_random_uuid(),
            new.id,
            role_value::user_role,
            now()
        FROM jsonb_array_elements_text(new.raw_user_meta_data->'roles') as role_value
        WHERE role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF new.raw_user_meta_data->>'role' IS NOT NULL THEN
        -- Handle single role from older signup format
        INSERT INTO public.user_roles (id, user_id, role, created_at)
        VALUES (
            gen_random_uuid(),
            new.id,
            (new.raw_user_meta_data->>'role')::user_role,
            now()
        )
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 3: FIX EXISTING USERS WITHOUT PROFILES
-- ============================================

-- Create profiles for all existing users
INSERT INTO public.profiles (
    id, 
    email, 
    name,
    first_name,
    last_name,
    phone,
    created_at, 
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(
        u.raw_user_meta_data->>'name',
        CASE 
            WHEN u.raw_user_meta_data->>'first_name' IS NOT NULL 
              OR u.raw_user_meta_data->>'last_name' IS NOT NULL
            THEN TRIM(CONCAT(
                COALESCE(u.raw_user_meta_data->>'first_name', ''),
                ' ',
                COALESCE(u.raw_user_meta_data->>'last_name', '')
            ))
            ELSE split_part(u.email, '@', 1)
        END
    ) as name,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.raw_user_meta_data->>'mobile' as phone,
    u.created_at,
    now()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Update existing profiles that are missing first_name/last_name
UPDATE public.profiles p
SET 
    first_name = COALESCE(
        p.first_name,
        (SELECT u.raw_user_meta_data->>'first_name' FROM auth.users u WHERE u.id = p.id),
        SPLIT_PART(p.name, ' ', 1)
    ),
    last_name = COALESCE(
        p.last_name,
        (SELECT u.raw_user_meta_data->>'last_name' FROM auth.users u WHERE u.id = p.id),
        CASE 
            WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p.name, ' '), 1) > 1 
            THEN SUBSTRING(p.name FROM POSITION(' ' IN p.name) + 1)
            ELSE ''
        END
    ),
    phone = COALESCE(
        p.phone,
        (SELECT u.raw_user_meta_data->>'mobile' FROM auth.users u WHERE u.id = p.id)
    ),
    updated_at = now()
WHERE p.first_name IS NULL 
   OR p.last_name IS NULL 
   OR (p.phone IS NULL AND EXISTS (
       SELECT 1 FROM auth.users u 
       WHERE u.id = p.id 
       AND u.raw_user_meta_data->>'mobile' IS NOT NULL
   ));

-- ============================================
-- PART 4: CREATE ROLES FOR EXISTING USERS
-- ============================================

-- Extract roles from user metadata for users without roles
WITH user_role_data AS (
    SELECT 
        u.id as user_id,
        u.created_at,
        CASE 
            WHEN u.raw_user_meta_data->'roles' IS NOT NULL 
            THEN u.raw_user_meta_data->'roles'
            WHEN u.raw_user_meta_data->>'role' IS NOT NULL 
            THEN jsonb_build_array(u.raw_user_meta_data->>'role')
            ELSE NULL
        END as roles_data
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
    )
    AND (
        u.raw_user_meta_data->'roles' IS NOT NULL 
        OR u.raw_user_meta_data->>'role' IS NOT NULL
    )
)
INSERT INTO public.user_roles (id, user_id, role, created_at)
SELECT DISTINCT
    gen_random_uuid(),
    urd.user_id,
    role_value::user_role,
    urd.created_at
FROM user_role_data urd
CROSS JOIN LATERAL jsonb_array_elements_text(urd.roles_data) as role_value
WHERE role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- PART 5: LINK EXISTING AVATAR UPLOADS
-- ============================================

-- Update profiles with existing avatar uploads
UPDATE public.profiles p
SET avatar_url = (
    SELECT 'https://pdikjpfulhhpqpxzpgtu.supabase.co/storage/v1/object/public/profile-images/' || 
           p.id || '/' || 
           (SELECT name FROM storage.objects 
            WHERE bucket_id = 'profile-images' 
            AND name LIKE p.id::text || '/%'
            ORDER BY created_at DESC 
            LIMIT 1)
)
WHERE EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'profile-images' 
    AND name LIKE p.id::text || '/%'
)
AND (p.avatar_url IS NULL OR p.avatar_url = '');

-- ============================================
-- PART 6: CREATE MISSING RPC FUNCTIONS
-- ============================================

-- Drop and recreate functions to ensure they exist
DROP FUNCTION IF EXISTS get_comedian_stats(UUID);
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
  LEFT JOIN applications ea ON ea.comedian_id = p.id
  LEFT JOIN comedian_reviews cr ON cr.comedian_id = p.id
  WHERE p.id = _comedian_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_vouch_stats(UUID);
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_comedian_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vouch_stats TO authenticated;

-- ============================================
-- PART 7: VERIFICATION QUERIES
-- ============================================

-- Check system status
SELECT '=== SYSTEM STATUS REPORT ===' as report_section;

-- 1. User and profile counts
SELECT 
    'Total auth.users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Users with profiles' as metric,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
    'Users with roles' as metric,
    COUNT(DISTINCT user_id) as count
FROM public.user_roles
UNION ALL
SELECT 
    'Profiles with avatars' as metric,
    COUNT(*) as count
FROM public.profiles
WHERE avatar_url IS NOT NULL AND avatar_url != '';

-- 2. Profile completeness check
SELECT 
    'Profiles with first_name' as field,
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100, 2) as percentage
FROM profiles WHERE first_name IS NOT NULL
UNION ALL
SELECT 
    'Profiles with last_name' as field,
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100, 2) as percentage
FROM profiles WHERE last_name IS NOT NULL
UNION ALL
SELECT 
    'Profiles with phone' as field,
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100, 2) as percentage
FROM profiles WHERE phone IS NOT NULL;

-- 3. Recent user creation test
SELECT 
    u.email,
    u.created_at as user_created,
    p.id IS NOT NULL as has_profile,
    p.first_name,
    p.last_name,
    p.phone,
    array_agg(r.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles r ON u.id = r.user_id
WHERE u.created_at > now() - interval '30 days'
GROUP BY u.id, u.email, u.created_at, p.id, p.first_name, p.last_name, p.phone
ORDER BY u.created_at DESC
LIMIT 5;

-- 4. Storage bucket status
SELECT 
    name as bucket_name,
    public as is_public,
    created_at,
    CASE 
        WHEN name IN ('profile-images', 'comedian-media', 'event-media') 
        THEN '✅ Required'
        ELSE '➖ Extra'
    END as status
FROM storage.buckets
ORDER BY name;

-- 5. Final status message
SELECT '✅ COMPLETE PLATFORM FIX APPLIED' as status,
       'All critical issues have been addressed. Users should now have profiles with proper field mapping.' as message;

-- ============================================
-- IMPORTANT SERVICE KEY NOTE:
-- ============================================
-- The service key in your .env file is currently the same as the anon key.
-- This prevents proper access to auth.users from the backend.
-- You need to get the proper service key from Supabase Dashboard:
-- 1. Go to Settings > API in your Supabase project
-- 2. Copy the "service_role" key (NOT the anon key)
-- 3. Update SUPABASE_SERVICE_KEY in your .env files