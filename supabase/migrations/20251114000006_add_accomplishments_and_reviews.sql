-- Create comedian_accomplishments table
CREATE TABLE IF NOT EXISTS public.comedian_accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accomplishment TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create press_reviews table
CREATE TABLE IF NOT EXISTS public.press_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publication TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  hook_line TEXT NOT NULL,
  url TEXT,
  review_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_accomplishments_user_id ON public.comedian_accomplishments(user_id);
CREATE INDEX IF NOT EXISTS idx_accomplishments_display_order ON public.comedian_accomplishments(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_press_reviews_user_id ON public.press_reviews(user_id);

-- Enable RLS
ALTER TABLE public.comedian_accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comedian_accomplishments
CREATE POLICY "Anyone can view accomplishments"
  ON public.comedian_accomplishments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own accomplishments"
  ON public.comedian_accomplishments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accomplishments"
  ON public.comedian_accomplishments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accomplishments"
  ON public.comedian_accomplishments
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for press_reviews
CREATE POLICY "Anyone can view press reviews"
  ON public.press_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own press reviews"
  ON public.press_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own press reviews"
  ON public.press_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own press reviews"
  ON public.press_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comedian_accomplishments_updated_at
  BEFORE UPDATE ON public.comedian_accomplishments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_press_reviews_updated_at
  BEFORE UPDATE ON public.press_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
