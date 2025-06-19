
-- Update subscriptions table to support dual plan types
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS has_comedian_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_promoter_pro BOOLEAN DEFAULT false;

-- Update the plan_type column to reflect the new structure
-- We'll keep plan_type for backward compatibility but use the boolean flags for logic
UPDATE public.subscriptions 
SET 
  has_comedian_pro = CASE WHEN plan_type = 'verified_comedian' THEN true ELSE false END,
  has_promoter_pro = CASE WHEN plan_type = 'promoter' THEN true ELSE false END;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_comedian_pro ON public.subscriptions(has_comedian_pro) WHERE has_comedian_pro = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_promoter_pro ON public.subscriptions(has_promoter_pro) WHERE has_promoter_pro = true;

-- Update profiles table to support dual badges
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_comedian_pro_badge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_promoter_pro_badge BOOLEAN DEFAULT false;
