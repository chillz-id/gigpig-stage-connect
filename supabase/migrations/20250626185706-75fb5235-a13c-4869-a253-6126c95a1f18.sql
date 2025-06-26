
-- First, let's update the user_role enum to include the new roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'co_promoter';

-- Create a table to track co-promoter assignments for specific events
CREATE TABLE IF NOT EXISTS public.event_co_promoters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(event_id, user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.event_co_promoters ENABLE ROW LEVEL SECURITY;

-- Create policies for event_co_promoters table
CREATE POLICY "Promoters can manage co-promoters"
  ON public.event_co_promoters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'promoter'
    )
  );

CREATE POLICY "Co-promoters can view their assignments"
  ON public.event_co_promoters
  FOR SELECT
  USING (user_id = auth.uid());

-- Remove subscription-related columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS has_comedian_pro_badge,
DROP COLUMN IF EXISTS has_promoter_pro_badge,
DROP COLUMN IF EXISTS membership;

-- Update the handle_new_user function to set default role as 'member' instead of 'comedian'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Set default role as member
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Create function to check if user is co-promoter for specific event
CREATE OR REPLACE FUNCTION public.is_co_promoter_for_event(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_co_promoters
    WHERE user_id = _user_id 
      AND event_id = _event_id 
      AND is_active = true
  )
$$;

-- Drop the subscriptions table as it's no longer needed
DROP TABLE IF EXISTS public.subscriptions CASCADE;
