
-- Check if the admin user exists and verify account details
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.encrypted_password IS NOT NULL as has_password,
    p.name,
    p.is_verified,
    p.membership
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'chillz@standupsydney.com';

-- Check if we can create/update the user with correct credentials
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'chillz@standupsydney.com';
    admin_password text := 'Ztxreb890-';
BEGIN
    -- Try to find existing user
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'User not found, this might be the issue';
    ELSE
        RAISE NOTICE 'User found with ID: %', admin_user_id;
        
        -- Update the user to ensure password is correct and email is confirmed
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'User credentials updated successfully';
    END IF;
END $$;
