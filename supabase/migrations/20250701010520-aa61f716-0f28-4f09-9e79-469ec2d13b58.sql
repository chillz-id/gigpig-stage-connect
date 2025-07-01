
-- Create comedian_reviews table for storing reviews and testimonials
CREATE TABLE public.comedian_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comedian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_title TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  event_name TEXT,
  event_date DATE,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add contact visibility fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_contact_in_epk BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Enable RLS on comedian_reviews
ALTER TABLE public.comedian_reviews ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to reviews (for EPK viewing)
CREATE POLICY "Public can view public reviews" 
  ON public.comedian_reviews 
  FOR SELECT 
  USING (is_public = true);

-- Create policy for comedians to manage their own reviews
CREATE POLICY "Comedians can manage their own reviews" 
  ON public.comedian_reviews 
  FOR ALL 
  USING (comedian_id = auth.uid());

-- Create policy for admins to manage all reviews
CREATE POLICY "Admins can manage all reviews" 
  ON public.comedian_reviews 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes for better performance
CREATE INDEX idx_comedian_reviews_comedian_id ON public.comedian_reviews(comedian_id);
CREATE INDEX idx_comedian_reviews_featured ON public.comedian_reviews(comedian_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_comedian_reviews_public ON public.comedian_reviews(comedian_id, is_public) WHERE is_public = true;

-- Create function to get comedian statistics
CREATE OR REPLACE FUNCTION public.get_comedian_stats(comedian_id_param UUID)
RETURNS TABLE (
  total_shows INTEGER,
  confirmed_shows INTEGER,
  total_vouches INTEGER,
  average_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(bookings.total_shows, 0) as total_shows,
    COALESCE(bookings.confirmed_shows, 0) as confirmed_shows,
    COALESCE(vouches.total_vouches, 0) as total_vouches,
    COALESCE(reviews.average_rating, 0) as average_rating
  FROM (
    SELECT 
      COUNT(*) as total_shows,
      COUNT(*) FILTER (WHERE payment_status = 'paid') as confirmed_shows
    FROM public.comedian_bookings cb
    JOIN public.events e ON cb.event_id = e.id
    WHERE cb.comedian_id = comedian_id_param
      AND e.event_date <= NOW()
  ) bookings
  CROSS JOIN (
    SELECT COUNT(*) as total_vouches
    FROM public.vouches
    WHERE vouchee_id = comedian_id_param
  ) vouches
  CROSS JOIN (
    SELECT AVG(rating) as average_rating
    FROM public.comedian_reviews
    WHERE comedian_id = comedian_id_param
      AND is_public = true
      AND rating IS NOT NULL
  ) reviews;
END;
$$;
