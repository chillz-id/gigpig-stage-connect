-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS stage_name text,
ADD COLUMN IF NOT EXISTS name_display_preference text DEFAULT 'first_name',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS show_contact_in_epk boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_show_types text[],
ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create index on profile_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_slug ON public.profiles(profile_slug);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update the handle_new_user function to handle all cases properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with all available data
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
      CASE 
        WHEN new.raw_user_meta_data->>'first_name' IS NOT NULL OR new.raw_user_meta_data->>'last_name' IS NOT NULL
        THEN TRIM(CONCAT(COALESCE(new.raw_user_meta_data->>'first_name', ''), ' ', COALESCE(new.raw_user_meta_data->>'last_name', '')))
        ELSE split_part(new.email, '@', 1)
      END
    ),
    new.raw_user_meta_data->>'phone',
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

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();