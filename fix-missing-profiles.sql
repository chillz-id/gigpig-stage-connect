-- ============================================
-- FIX MISSING USER PROFILES
-- ============================================

-- 1. Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        name,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Create profiles for all existing users who don't have one
INSERT INTO public.profiles (id, email, name, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
    ) as name,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Update any profiles that have avatar URLs in storage but not in the database
-- This will fix the current issue where images are uploaded but not linked
WITH user_avatars AS (
    SELECT 
        split_part(name, '/', 1)::uuid as user_id,
        'https://pdikjpfulhhpqpxzpgtu.supabase.co/storage/v1/object/public/profile-images/' || name || '/' || (
            SELECT f.name 
            FROM storage.objects f 
            WHERE f.bucket_id = 'profile-images' 
            AND f.name LIKE split_part(o.name, '/', 1) || '/%'
            ORDER BY f.created_at DESC 
            LIMIT 1
        ) as avatar_url
    FROM storage.objects o
    WHERE bucket_id = 'profile-images'
    AND name NOT LIKE '%/%'  -- Only get folder names (user IDs)
)
UPDATE public.profiles p
SET 
    avatar_url = ua.avatar_url,
    updated_at = now()
FROM user_avatars ua
WHERE p.id = ua.user_id
AND (p.avatar_url IS NULL OR p.avatar_url = '');

-- 5. Verify the fix
SELECT 
    'Summary:' as info,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as users_with_profiles,
    COUNT(DISTINCT CASE WHEN p.avatar_url IS NOT NULL THEN p.id END) as users_with_avatars
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- 7. Show fixed profiles
SELECT 
    p.id,
    p.email,
    p.name,
    LEFT(p.avatar_url, 50) || '...' as avatar_url_preview,
    p.updated_at
FROM public.profiles p
WHERE p.avatar_url IS NOT NULL
LIMIT 5;