-- Update press_reviews rating column to support half-star increments
-- Change from INTEGER to NUMERIC(2,1) to support values like 3.5

-- Drop the old check constraint
ALTER TABLE press_reviews DROP CONSTRAINT IF EXISTS press_reviews_rating_check;

-- Change column type to NUMERIC(2,1)
ALTER TABLE press_reviews
  ALTER COLUMN rating TYPE NUMERIC(2,1);

-- Add new check constraint for 0.5 increments from 0 to 5
ALTER TABLE press_reviews
  ADD CONSTRAINT press_reviews_rating_check
  CHECK (
    rating IS NULL OR
    (rating >= 0 AND rating <= 5 AND (rating * 2) = FLOOR(rating * 2))
  );

-- Update comment
COMMENT ON COLUMN press_reviews.rating IS 'Star rating from 0-5 in half-star increments (e.g., 3.5)';
