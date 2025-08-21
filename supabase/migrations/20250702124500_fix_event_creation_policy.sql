-- Fix event creation policy to allow any authenticated user to create events
-- This addresses the P1.2 issue where users can't publish events due to RLS restrictions

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Promoters can manage own events" ON public.events;

-- Create separate policies for different operations

-- Allow any authenticated user to insert events (they become the promoter)
CREATE POLICY "Authenticated users can create events" 
ON public.events 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = promoter_id);

-- Allow promoters to view and manage their own events
CREATE POLICY "Promoters can manage own events" 
ON public.events 
FOR ALL 
TO authenticated 
USING (auth.uid() = promoter_id);

-- The existing SELECT policy for viewing events remains unchanged
-- "Anyone can view open events" ON public.events FOR SELECT TO authenticated USING (true);

-- Also ensure users get the promoter role when they create their first event
-- This trigger will automatically add the promoter role if they don't have it
CREATE OR REPLACE FUNCTION public.ensure_promoter_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user already has promoter role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.promoter_id AND role = 'promoter'
  ) THEN
    -- Add promoter role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.promoter_id, 'promoter')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after event insertion
CREATE OR REPLACE TRIGGER ensure_promoter_role_trigger
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.ensure_promoter_role();