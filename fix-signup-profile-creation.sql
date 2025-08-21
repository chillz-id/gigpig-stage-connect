-- ============================================
-- FIX USER SIGNUP PROFILE CREATION
-- ============================================
-- This fixes the issue where user profiles are not being created with
-- first_name, last_name, and phone fields from the signup form

-- 1. Update the handle_new_user function to properly extract all fields
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
        COALESCE(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        new.raw_user_meta_data->>'first_name',  -- Extract first_name from metadata
        new.raw_user_meta_data->>'last_name',   -- Extract last_name from metadata
        new.raw_user_meta_data->>'mobile',      -- Extract mobile as phone
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        -- Update if profile exists but fields are missing
        first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
        last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
        phone = COALESCE(profiles.phone, EXCLUDED.phone),
        updated_at = now();
    
    -- Handle roles from metadata
    IF new.raw_user_meta_data->>'roles' IS NOT NULL THEN
        -- Parse roles array from metadata
        INSERT INTO public.user_roles (user_id, role)
        SELECT 
            new.id,
            role_value::text
        FROM jsonb_array_elements_text((new.raw_user_meta_data->'roles')::jsonb) as role_value
        WHERE role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF new.raw_user_meta_data->>'role' IS NOT NULL THEN
        -- Handle single role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (
            new.id,
            (new.raw_user_meta_data->>'role')::text
        )
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        -- Default to member role if no role specified
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'member')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger (in case it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix existing profiles that are missing first_name/last_name
-- This updates profiles where name exists but first_name/last_name are null
UPDATE public.profiles
SET 
    first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
    last_name = COALESCE(last_name, 
        CASE 
            WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
            THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
            ELSE ''
        END
    ),
    updated_at = now()
WHERE name IS NOT NULL 
AND (first_name IS NULL OR last_name IS NULL);

-- 4. Verify the fix by checking a recent user
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    u.raw_user_meta_data,
    p.name,
    p.first_name,
    p.last_name,
    p.phone,
    ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.created_at > now() - interval '7 days'
ORDER BY u.created_at DESC
LIMIT 5;

-- 5. Check if there are users without profiles
SELECT 
    COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 6. Summary of profile completeness
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as with_first_name,
    COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as with_last_name,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name
FROM public.profiles;