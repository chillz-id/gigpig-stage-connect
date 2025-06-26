
-- Add roles for chillz@standupsydney.com (admin with all permissions)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'chillz@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

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

-- Add roles for info@standupsydney.com (demo account with all permissions)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'info@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'comedian'::user_role
FROM auth.users 
WHERE email = 'info@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'promoter'::user_role
FROM auth.users 
WHERE email = 'info@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update profiles to ensure they have the proper membership and badges
UPDATE public.profiles 
SET 
  membership = 'premium',
  has_comedian_pro_badge = true,
  has_promoter_pro_badge = true,
  is_verified = true,
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('chillz@standupsydney.com', 'info@standupsydney.com')
);
