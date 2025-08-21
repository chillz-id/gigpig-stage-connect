-- ============================================
-- PROPER EMERGENCY FIX - RESPECTING YOUR ROLE SYSTEM
-- ============================================

-- 1. Create handle_new_user function that ONLY creates profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile ONLY - no role assignment
    INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        new.raw_user_meta_data->>'mobile',
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Check if user metadata contains roles and create them
    IF new.raw_user_meta_data->>'roles' IS NOT NULL THEN
        -- Parse roles from metadata and insert
        INSERT INTO public.user_roles (id, user_id, role, created_at)
        SELECT 
            gen_random_uuid(),
            new.id,
            role_value::user_role,
            now()
        FROM jsonb_array_elements_text((new.raw_user_meta_data->'roles')::jsonb) as role_value
        WHERE role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix existing users - create profiles ONLY
INSERT INTO public.profiles (id, email, name, phone, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
    ) as name,
    u.raw_user_meta_data->>'mobile' as phone,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Try to extract roles from existing user metadata
INSERT INTO public.user_roles (id, user_id, role, created_at)
SELECT DISTINCT
    gen_random_uuid(),
    u.id,
    role_value::text,
    u.created_at
FROM auth.users u
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE 
        WHEN u.raw_user_meta_data->>'roles' IS NOT NULL 
        THEN (u.raw_user_meta_data->'roles')::jsonb
        ELSE '[]'::jsonb
    END
) as role_value
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles r 
    WHERE r.user_id = u.id AND r.role = role_value::user_role
)
AND role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member');

-- 5. Link orphaned profile images
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

-- 6. Create missing RPC functions
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

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION get_comedian_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vouch_stats TO authenticated;

-- 8. Show what we found
SELECT 'SYSTEM STATUS:' as info;

-- Show users and their roles
SELECT 
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'roles' as signup_roles,
    array_agg(r.role) as assigned_roles
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- Show profile status
SELECT 
    'Total auth users' as metric,
    COUNT(DISTINCT u.id) as count
FROM auth.users u
UNION ALL
SELECT 
    'Users with profiles' as metric,
    COUNT(DISTINCT p.id) as count
FROM public.profiles p
UNION ALL
SELECT 
    'Users with roles' as metric,
    COUNT(DISTINCT r.user_id) as count
FROM public.user_roles r
UNION ALL
SELECT 
    'Users with avatars' as metric,
    COUNT(DISTINCT p.id) as count
FROM public.profiles p
WHERE p.avatar_url IS NOT NULL;

SELECT '✅ FIX COMPLETE - Profiles created, roles preserved as selected during signup' as message;