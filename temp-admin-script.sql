-- Temporary script to grant admin access for info@standupsydney.com

-- Find your user ID and grant admin role
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::user_role
FROM auth.users au
WHERE au.email = 'info@standupsydney.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was added
SELECT au.email, ur.role
FROM auth.users au
JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email = 'info@standupsydney.com';