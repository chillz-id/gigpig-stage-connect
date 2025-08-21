
-- First, add the missing unique constraint on user_roles table
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);

-- Now create the admin user roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'chillz@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure the user has comedian and promoter roles for full access
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'comedian'::user_role
FROM auth.users 
WHERE email = 'chillz@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'promoter'::user_role
FROM auth.users 
WHERE email = 'chillz@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update the profile to mark as verified and set premium membership
UPDATE public.profiles 
SET 
  is_verified = true,
  membership = 'premium',
  has_comedian_pro_badge = true,
  has_promoter_pro_badge = true,
  name = COALESCE(name, 'Admin User'),
  updated_at = now()
WHERE email = 'chillz@standupsydney.com';

-- Check if subscription record exists, if not create one, if it exists update it
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'chillz@standupsydney.com';
    
    -- Check if subscription exists
    IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = admin_user_id) THEN
        -- Update existing subscription
        UPDATE public.subscriptions 
        SET 
            status = 'active',
            plan_type = 'premium',
            has_comedian_pro = true,
            has_promoter_pro = true,
            updated_at = now()
        WHERE user_id = admin_user_id;
    ELSE
        -- Insert new subscription
        INSERT INTO public.subscriptions (user_id, status, plan_type, has_comedian_pro, has_promoter_pro)
        VALUES (admin_user_id, 'active', 'premium', true, true);
    END IF;
END $$;
