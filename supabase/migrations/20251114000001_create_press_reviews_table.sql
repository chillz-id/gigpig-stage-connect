-- Create press_reviews table for comedian press and media reviews
CREATE TABLE IF NOT EXISTS press_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publication TEXT NOT NULL,
  hook_line TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date DATE,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_press_reviews_user_id ON press_reviews(user_id);

-- Create index on review_date for sorting
CREATE INDEX IF NOT EXISTS idx_press_reviews_review_date ON press_reviews(review_date DESC);

-- Enable Row Level Security
ALTER TABLE press_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read press reviews (public visibility)
CREATE POLICY "Press reviews are publicly readable"
  ON press_reviews
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own press reviews
CREATE POLICY "Users can insert their own press reviews"
  ON press_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own press reviews
CREATE POLICY "Users can update their own press reviews"
  ON press_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own press reviews
CREATE POLICY "Users can delete their own press reviews"
  ON press_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_press_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER press_reviews_updated_at
  BEFORE UPDATE ON press_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_press_reviews_updated_at();

-- Add comment for documentation
COMMENT ON TABLE press_reviews IS 'Stores press reviews and media mentions for comedians';
COMMENT ON COLUMN press_reviews.publication IS 'Name of the publication or media outlet';
COMMENT ON COLUMN press_reviews.hook_line IS 'Key quote or excerpt from the review';
COMMENT ON COLUMN press_reviews.rating IS 'Star rating from 1-5';
COMMENT ON COLUMN press_reviews.review_date IS 'Date the review was published';
COMMENT ON COLUMN press_reviews.external_url IS 'Link to the original review article';
