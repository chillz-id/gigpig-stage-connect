-- ============================================
-- EMERGENCY COMPLETE SYSTEM FIX
-- ============================================
-- This fixes ALL the broken fundamental issues

-- 1. First, let's see what auth users exist
SELECT 'Checking auth users...' as status;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 2. Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile
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
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        ),
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create default member role
    INSERT INTO public.user_roles (
        id,
        user_id,
        role,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        new.id,
        'member',
        now()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix ALL existing users who have no profiles
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

-- 5. Give all users without roles a default 'member' role
INSERT INTO public.user_roles (id, user_id, role, created_at)
SELECT 
    gen_random_uuid(),
    u.id,
    'member',
    now()
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE r.user_id IS NULL;

-- 6. Link orphaned profile images to profiles
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

-- 7. Create missing RPC functions
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

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION get_comedian_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vouch_stats TO authenticated;

-- 9. Final verification
SELECT 'VERIFICATION RESULTS:' as status;

SELECT 
    'Users' as entity,
    COUNT(DISTINCT u.id) as total,
    COUNT(DISTINCT p.id) as with_profiles,
    COUNT(DISTINCT r.user_id) as with_roles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id;

SELECT 
    'Profile Images' as check,
    COUNT(DISTINCT CASE WHEN p.avatar_url IS NOT NULL THEN p.id END) as profiles_with_avatars,
    COUNT(DISTINCT split_part(o.name, '/', 1)) as uploaded_images
FROM public.profiles p
FULL OUTER JOIN storage.objects o ON o.bucket_id = 'profile-images' AND o.name LIKE p.id::text || '/%';

SELECT 'FIX COMPLETE - All users should now have profiles and roles!' as message;