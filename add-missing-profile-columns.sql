-- ============================================
-- ADD MISSING PROFILE COLUMNS & CREATE TRIGGER
-- ============================================

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS name_display_preference TEXT DEFAULT 'real' CHECK (name_display_preference IN ('real', 'stage', 'both'));

-- 2. Split existing names into first_name and last_name
UPDATE public.profiles 
SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
        THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
    END,
    updated_at = now()
WHERE first_name IS NULL AND name IS NOT NULL;

-- 3. Create or replace the profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
        name = COALESCE(profiles.name, EXCLUDED.name),
        first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
        last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
        phone = COALESCE(profiles.phone, EXCLUDED.phone),
        updated_at = now();
    
    -- Handle roles from signup
    IF new.raw_user_meta_data->'roles' IS NOT NULL AND 
       jsonb_array_length(new.raw_user_meta_data->'roles') > 0 THEN
        INSERT INTO public.user_roles (id, user_id, role, created_at)
        SELECT 
            gen_random_uuid(),
            new.id,
            role_value::user_role,
            now()
        FROM jsonb_array_elements_text(new.raw_user_meta_data->'roles') as role_value
        WHERE role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Create profiles for existing users without profiles
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

-- 6. Create roles for existing users
INSERT INTO public.user_roles (id, user_id, role, created_at)
SELECT DISTINCT
    gen_random_uuid(),
    u.id,
    role_value::user_role,
    u.created_at
FROM auth.users u
CROSS JOIN LATERAL (
    SELECT role_value
    FROM jsonb_array_elements_text(
        CASE 
            WHEN u.raw_user_meta_data->'roles' IS NOT NULL 
            THEN u.raw_user_meta_data->'roles'
            WHEN u.raw_user_meta_data->>'role' IS NOT NULL 
            THEN jsonb_build_array(u.raw_user_meta_data->>'role')
            ELSE '[]'::jsonb
        END
    ) as role_value
) as roles
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
)
AND role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Create missing RPC functions
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

GRANT EXECUTE ON FUNCTION get_comedian_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vouch_stats TO authenticated;

-- 8. Link existing avatars
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

-- 9. Verification
SELECT '=== FINAL STATUS ===' as section;

SELECT 
    'Total users in auth.users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Total profiles created' as metric,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
    'Profiles with first_name' as metric,
    COUNT(*) as count
FROM public.profiles
WHERE first_name IS NOT NULL
UNION ALL
SELECT 
    'Profiles with last_name' as metric,
    COUNT(*) as count
FROM public.profiles
WHERE last_name IS NOT NULL
UNION ALL
SELECT 
    'Users with roles' as metric,
    COUNT(DISTINCT user_id) as count
FROM public.user_roles;

-- Show recent users
SELECT 
    u.email,
    u.created_at,
    p.first_name,
    p.last_name,
    p.phone,
    array_agg(r.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles r ON u.id = r.user_id
WHERE u.created_at > now() - interval '30 days'
GROUP BY u.id, u.email, u.created_at, p.first_name, p.last_name, p.phone
ORDER BY u.created_at DESC
LIMIT 5;

SELECT '✅ SCHEMA UPDATED - Profiles now have first_name and last_name columns' as message;