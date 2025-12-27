-- Add display_order column to press_reviews table for manual sorting

-- Add display_order column
ALTER TABLE press_reviews
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Update existing records to have sequential display_order based on review_date
WITH numbered_reviews AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY review_date DESC NULLS LAST, created_at DESC) - 1 AS row_num
  FROM press_reviews
)
UPDATE press_reviews pr
SET display_order = nr.row_num
FROM numbered_reviews nr
WHERE pr.id = nr.id;

-- Create index on display_order for faster sorting
CREATE INDEX IF NOT EXISTS idx_press_reviews_display_order
  ON press_reviews(user_id, display_order);

-- Add comment
COMMENT ON COLUMN press_reviews.display_order IS 'Manual ordering position for press reviews (0-indexed)';
