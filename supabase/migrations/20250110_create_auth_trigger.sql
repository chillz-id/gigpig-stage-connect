-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      CONCAT(
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        CASE 
          WHEN new.raw_user_meta_data->>'first_name' IS NOT NULL 
          AND new.raw_user_meta_data->>'last_name' IS NOT NULL 
          THEN ' ' 
          ELSE '' 
        END,
        COALESCE(new.raw_user_meta_data->>'last_name', '')
      ),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'mobile',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = now();
  
  -- Insert user role
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (new.id, new.raw_user_meta_data->>'role', now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Default to member role
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (new.id, 'member', now())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();