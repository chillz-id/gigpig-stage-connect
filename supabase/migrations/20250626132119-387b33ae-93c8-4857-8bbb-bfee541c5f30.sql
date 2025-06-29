
-- First, let's check what plan types are currently allowed
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND column_name = 'plan_type';

-- Check if there's a check constraint on plan_type
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.subscriptions'::regclass 
AND contype = 'c';

-- Update the demo user (info@standupsydney.com) to have Comedian Pro and Promoter Pro
-- Using 'premium' as the plan_type since 'dual_pro' doesn't exist
UPDATE public.subscriptions 
SET 
  status = 'active',
  plan_type = 'premium',
  has_comedian_pro = true,
  has_promoter_pro = true,
  current_period_start = now(),
  current_period_end = now() + interval '1 month',
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'info@standupsydney.com'
);

-- If no subscription record exists, create one
INSERT INTO public.subscriptions (user_id, status, plan_type, has_comedian_pro, has_promoter_pro, current_period_start, current_period_end)
SELECT 
  id, 
  'active', 
  'premium', 
  true, 
  true, 
  now(), 
  now() + interval '1 month'
FROM auth.users 
WHERE email = 'info@standupsydney.com'
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'info@standupsydney.com')
);

-- Update the profile to reflect the pro badges and premium membership
UPDATE public.profiles 
SET 
  has_comedian_pro_badge = true,
  has_promoter_pro_badge = true,
  membership = 'premium',
  is_verified = true,
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'info@standupsydney.com'
);
