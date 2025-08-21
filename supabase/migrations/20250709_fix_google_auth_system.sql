-- Fix Google Authentication System Migration
-- Generated at: 2025-07-09 for task P1.1

-- 1. Drop existing trigger to recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create enhanced trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  display_name text;
  base_slug text;
  unique_slug text;
  slug_counter integer := 1;
BEGIN
  -- Extract display name from user metadata
  display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Generate base slug from display name
  base_slug := lower(
    regexp_replace(
      regexp_replace(display_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Ensure unique profile slug
  unique_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profile_slug = unique_slug AND id != NEW.id
  ) LOOP
    unique_slug := base_slug || '-' || slug_counter;
    slug_counter := slug_counter + 1;
  END LOOP;
  
  -- Insert profile with comprehensive data
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    avatar_url, 
    profile_slug,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    display_name,
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture',
      ''
    ),
    unique_slug,
    NOW(),
    NOW()
  );
  
  -- Insert default member role
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'member', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create improved RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for manual fallback)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Create improved RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own roles (for manual fallback)
CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Fix any existing users without profiles
INSERT INTO public.profiles (id, email, name, avatar_url, profile_slug, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    split_part(au.email, '@', 1),
    'User'
  ),
  COALESCE(
    au.raw_user_meta_data ->> 'avatar_url',
    au.raw_user_meta_data ->> 'picture',
    ''
  ),
  lower(
    regexp_replace(
      regexp_replace(
        COALESCE(
          au.raw_user_meta_data ->> 'full_name',
          au.raw_user_meta_data ->> 'name',
          split_part(au.email, '@', 1),
          'User'
        ), 
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  ) || '-' || au.id::text, -- Use user ID to ensure uniqueness
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Ensure all users have at least member role
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  au.id,
  'member'::user_role,
  NOW()
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id AND ur.role = 'member'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.user_roles TO authenticated;

-- 9. Create function to manually fix user profile if needed
CREATE OR REPLACE FUNCTION public.fix_user_profile(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  profile_record public.profiles%ROWTYPE;
  result json;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Call handle_new_user function
  PERFORM public.handle_new_user() FROM (SELECT user_record.*) AS t;
  
  -- Get created profile
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;
  
  RETURN json_build_object(
    'success', true,
    'profile', row_to_json(profile_record)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 10. Add index for profile_slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_slug_unique 
ON public.profiles (profile_slug) 
WHERE profile_slug IS NOT NULL;

-- 11. Update profiles table to ensure updated_at is always set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();