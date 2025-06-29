
-- First, let's ensure the admin user exists with the correct credentials
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'info@standupsydney.com';
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
            '{"name": "Stand Up Sydney Admin"}',
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
        
        -- Update password and ensure email is confirmed
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = admin_user_id;
    END IF;
    
    -- Ensure profile exists with proper admin details
    INSERT INTO public.profiles (id, email, name, is_verified, location)
    VALUES (admin_user_id, admin_email, 'Stand Up Sydney Admin', true, 'Sydney, NSW')
    ON CONFLICT (id) DO UPDATE SET
        name = 'Stand Up Sydney Admin',
        is_verified = true,
        location = 'Sydney, NSW',
        updated_at = now();
    
    -- Ensure all admin roles exist
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'comedian') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'promoter') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'member') ON CONFLICT DO NOTHING;
        
END $$;

-- Add some sample live events to make the site look active
INSERT INTO public.events (
    id,
    title,
    description,
    venue,
    address,
    event_date,
    start_time,
    end_time,
    promoter_id,
    spots,
    comedian_slots,
    status,
    type,
    pay,
    duration,
    requirements,
    city,
    state,
    country,
    age_restriction,
    dress_code,
    created_at
) VALUES 
(
    gen_random_uuid(),
    'Thursday Night Comedy at The Comedy Store',
    'Join us for our weekly Thursday night comedy showcase featuring the best local and touring comedians. A night of laughs guaranteed!',
    'The Comedy Store Sydney',
    '16-18 Parramatta Rd, Annandale NSW 2038',
    (CURRENT_DATE + INTERVAL '7 days')::timestamp with time zone,
    '20:00'::time,
    '22:30'::time,
    (SELECT id FROM auth.users WHERE email = 'info@standupsydney.com'),
    8,
    8,
    'open',
    'Open Mic',
    'Free',
    '5',
    'Clean material preferred. 5-7 minute sets.',
    'Sydney',
    'NSW',
    'Australia',
    '18+',
    'Smart Casual',
    now()
),
(
    gen_random_uuid(),
    'Friday Night Laughs - Newtown Social Club',
    'Premium comedy night featuring established acts and rising stars. Book your spot for our popular Friday showcase.',
    'Newtown Social Club',
    '387-391 King St, Newtown NSW 2042',
    (CURRENT_DATE + INTERVAL '8 days')::timestamp with time zone,
    '19:30'::time,
    '22:00'::time,
    (SELECT id FROM auth.users WHERE email = 'info@standupsydney.com'),
    6,
    6,
    'open',
    'Showcase',
    '$50',
    '7',
    'Experienced comedians only. Original material required.',
    'Sydney',
    'NSW',
    'Australia',
    '18+',
    'Casual',
    now()
),
(
    gen_random_uuid(),
    'Saturday Comedy Night - The Gaelic Club',
    'Weekend comedy extravaganza! Multiple acts, great atmosphere, and fantastic prizes for the best performers.',
    'The Gaelic Club',
    '64 Devonshire St, Surry Hills NSW 2010',
    (CURRENT_DATE + INTERVAL '9 days')::timestamp with time zone,
    '20:30'::time,
    '23:00'::time,
    (SELECT id FROM auth.users WHERE email = 'info@standupsydney.com'),
    10,
    10,
    'open',
    'Competition',
    '$75',
    '8',
    'All levels welcome. Theme: Australian life and culture.',
    'Sydney',
    'NSW',
    'Australia',
    '18+',
    'Smart Casual',
    now()
);

-- Create some event spots for the events
INSERT INTO public.event_spots (event_id, spot_name, spot_order, duration_minutes, payment_amount, currency, is_paid)
SELECT 
    e.id,
    'Spot ' || generate_series(1, LEAST(e.comedian_slots, 10)),
    generate_series(1, LEAST(e.comedian_slots, 10)),
    CASE 
        WHEN e.duration = '5' THEN 5
        WHEN e.duration = '7' THEN 7
        WHEN e.duration = '8' THEN 8
        ELSE 5
    END,
    CASE 
        WHEN e.pay = 'Free' THEN 0
        WHEN e.pay = '$50' THEN 50
        WHEN e.pay = '$75' THEN 75
        ELSE 0
    END,
    e.currency,
    CASE WHEN e.pay != 'Free' THEN true ELSE false END
FROM public.events e
WHERE e.promoter_id = (SELECT id FROM auth.users WHERE email = 'info@standupsydney.com');
