-- ============================================
-- DELETE ALL USERS EXCEPT ADMIN
-- ============================================
-- Keep only info@standupsydney.com and delete all others

-- 1. First, get the admin user ID
WITH admin_user AS (
    SELECT id FROM auth.users WHERE email = 'info@standupsydney.com'
)

-- 2. Delete user roles for all users except admin
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM admin_user);

-- 3. Delete profiles for all users except admin  
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM admin_user);

-- 4. Delete auth users except admin
DELETE FROM auth.users 
WHERE email != 'info@standupsydney.com';

-- 5. Show what remains
SELECT 'Remaining users:' as status;
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.name,
    p.first_name,
    p.last_name,
    array_agg(r.role) as roles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id
GROUP BY u.id, u.email, u.created_at, p.name, p.first_name, p.last_name
ORDER BY u.created_at;

SELECT 'Cleanup complete - Only admin user remains' as message;