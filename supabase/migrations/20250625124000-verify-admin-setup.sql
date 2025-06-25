
-- Check if admin user exists and get details
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.name,
    p.is_verified,
    p.membership,
    p.has_comedian_pro_badge,
    p.has_promoter_pro_badge
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'chillz@standupsydney.com';

-- Check user roles
SELECT ur.role
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'chillz@standupsydney.com';

-- Check subscription status
SELECT 
    s.status,
    s.plan_type,
    s.has_comedian_pro,
    s.has_promoter_pro
FROM public.subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'chillz@standupsydney.com';

-- If user doesn't exist, create the admin user
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'chillz@standupsydney.com';
    admin_password text := 'Ztxreb890-';
BEGIN
    -- Check if user exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        -- Create the admin user directly in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            now(),
            null,
            null,
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Admin User"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Created admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
        
        -- Update password if user exists
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = admin_user_id;
    END IF;
    
    -- Ensure profile exists
    INSERT INTO public.profiles (id, email, name, is_verified, membership, has_comedian_pro_badge, has_promoter_pro_badge)
    VALUES (admin_user_id, admin_email, 'Admin User', true, 'premium', true, true)
    ON CONFLICT (id) DO UPDATE SET
        is_verified = true,
        membership = 'premium',
        has_comedian_pro_badge = true,
        has_promoter_pro_badge = true,
        updated_at = now();
    
    -- Ensure all roles exist
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'comedian') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'promoter') ON CONFLICT DO NOTHING;
    
    -- Ensure subscription exists
    INSERT INTO public.subscriptions (user_id, status, plan_type, has_comedian_pro, has_promoter_pro)
    VALUES (admin_user_id, 'active', 'premium', true, true)
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        plan_type = 'premium',
        has_comedian_pro = true,
        has_promoter_pro = true,
        updated_at = now();
        
END $$;
