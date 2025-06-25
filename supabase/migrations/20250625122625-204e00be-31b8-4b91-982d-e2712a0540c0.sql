
-- First, let's check the structure of the subscriptions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing constraints on subscriptions table
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.subscriptions'::regclass;

-- Let's also check if the admin user exists
SELECT 
    u.email,
    u.email_confirmed_at,
    u.id
FROM auth.users u
WHERE u.email = 'chillz@standupsydney.com';
