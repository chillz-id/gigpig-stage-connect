-- Temporarily allow all authenticated users to access customization settings
-- This is for testing - should be restricted to admins in production

-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage customization settings" ON public.customization_settings;

-- Create a more permissive policy for testing
CREATE POLICY "Authenticated users can read customization settings" ON public.customization_settings
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage (if user_roles table exists)
CREATE POLICY "Admins can manage customization settings" ON public.customization_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR auth.uid() IS NOT NULL -- Fallback: allow authenticated users
);