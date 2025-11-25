-- Enable public access for EPK pages
-- Issue: EPK pages are public but events and profiles tables require authentication
-- Solution: Add public SELECT policies for events and profiles tables

-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "Anyone can view open events" ON public.events;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Add new public SELECT policies that work for both authenticated and anonymous users
CREATE POLICY "Public can view all events"
  ON public.events
  FOR SELECT
  USING (true);

CREATE POLICY "Public can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

COMMENT ON POLICY "Public can view all events" ON public.events IS 'Allows public EPK pages to display event information';
COMMENT ON POLICY "Public can view all profiles" ON public.profiles IS 'Allows public EPK pages to display comedian profiles';
