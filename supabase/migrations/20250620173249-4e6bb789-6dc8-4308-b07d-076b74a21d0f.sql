
-- Create storage bucket for event media (banners, images) if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'event-media', 'event-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-media');

-- Create storage bucket for user profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'profile-images', 'profile-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images');

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view event media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event media" ON storage.objects;

-- Create RLS policies for event-media bucket
CREATE POLICY "Anyone can view event media" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users can upload event media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own event media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own event media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Create RLS policies for profile-images bucket
CREATE POLICY "Anyone can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update the existing events table structure - add only missing columns
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Australia',
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS spots INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '5',
ADD COLUMN IF NOT EXISTS pay TEXT DEFAULT 'Free',
ADD COLUMN IF NOT EXISTS requirements TEXT[],
ADD COLUMN IF NOT EXISTS is_verified_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_recording BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_restriction TEXT DEFAULT '18+',
ADD COLUMN IF NOT EXISTS dress_code TEXT DEFAULT 'Casual',
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS applied_spots INTEGER DEFAULT 0;

-- Handle column renames more carefully
DO $$ 
BEGIN
  -- If venue_name exists but venue doesn't, rename it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'venue_name') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'venue') THEN
    ALTER TABLE public.events RENAME COLUMN venue_name TO venue;
  END IF;
  
  -- If venue_address exists but address doesn't, rename it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'venue_address') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'address') THEN
    ALTER TABLE public.events RENAME COLUMN venue_address TO address;
  END IF;
END $$;

-- Enable RLS on events table if not already enabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view open events" ON public.events;
DROP POLICY IF EXISTS "Promoters can create events" ON public.events;
DROP POLICY IF EXISTS "Promoters can update their own events" ON public.events;
DROP POLICY IF EXISTS "Promoters can delete their own events" ON public.events;

-- Create RLS policies for events
CREATE POLICY "Anyone can view open events" ON public.events
  FOR SELECT USING (status = 'open');

CREATE POLICY "Promoters can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = promoter_id);

CREATE POLICY "Promoters can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = promoter_id);

CREATE POLICY "Promoters can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = promoter_id);

-- Create event applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  comedian_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message TEXT,
  UNIQUE(event_id, comedian_id)
);

-- Enable RLS on event applications
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view applications for their events or their own applications" ON public.event_applications;
DROP POLICY IF EXISTS "Comedians can create applications" ON public.event_applications;
DROP POLICY IF EXISTS "Promoters can update applications for their events" ON public.event_applications;

-- Create RLS policies for event applications
CREATE POLICY "Users can view applications for their events or their own applications" 
  ON public.event_applications FOR SELECT USING (
    auth.uid() = comedian_id OR 
    auth.uid() IN (SELECT promoter_id FROM public.events WHERE id = event_id)
  );

CREATE POLICY "Comedians can create applications" ON public.event_applications
  FOR INSERT WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Promoters can update applications for their events" ON public.event_applications
  FOR UPDATE USING (
    auth.uid() IN (SELECT promoter_id FROM public.events WHERE id = event_id)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_promoter_id ON public.events(promoter_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_applications_event_id ON public.event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_comedian_id ON public.event_applications(comedian_id);
