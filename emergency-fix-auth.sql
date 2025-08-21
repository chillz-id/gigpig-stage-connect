-- ============================================
-- EMERGENCY FIX FOR AUTH.USERS TABLE
-- ============================================

-- 1. First, check what's in auth.users
SELECT 
    'Current auth.users count' as info,
    COUNT(*) as count
FROM auth.users;

-- 2. Check if there are orphaned entries in related tables
SELECT 
    'Orphaned profiles' as info,
    COUNT(*) as count
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- 3. Clean up orphaned profiles
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 4. Clean up orphaned user_roles
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. Check and recreate the profile creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_role text := 'comedian';
BEGIN
    -- Try to create profile
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            new.id,
            new.email,
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    END;
    
    -- Try to create role
    BEGIN
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at
        ) VALUES (
            new.id,
            default_role,
            now()
        ) ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create role for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;

-- 8. Ensure RLS is properly configured
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Create permissive policies for service role
CREATE POLICY "Service role can do anything" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON public.user_roles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 10. Create policies for authenticated users
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 11. Final check
SELECT 
    'Setup complete' as status,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.user_roles) as total_roles;