-- Create comedian_section_order table for drag-and-drop EPK section ordering
CREATE TABLE IF NOT EXISTS comedian_section_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id text NOT NULL CHECK (section_id IN ('bio', 'contact', 'media', 'shows', 'accomplishments')),
  display_order int NOT NULL CHECK (display_order >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, section_id)
);

-- Create index for faster lookups
CREATE INDEX idx_comedian_section_order_user ON comedian_section_order(user_id);
CREATE INDEX idx_comedian_section_order_user_order ON comedian_section_order(user_id, display_order);

-- Enable RLS
ALTER TABLE comedian_section_order ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read their own section order
CREATE POLICY "Users can view their own section order"
  ON comedian_section_order
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies: Users can insert their own section order
CREATE POLICY "Users can insert their own section order"
  ON comedian_section_order
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can update their own section order
CREATE POLICY "Users can update their own section order"
  ON comedian_section_order
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can delete their own section order
CREATE POLICY "Users can delete their own section order"
  ON comedian_section_order
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comedian_section_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_comedian_section_order_updated_at
  BEFORE UPDATE ON comedian_section_order
  FOR EACH ROW
  EXECUTE FUNCTION update_comedian_section_order_updated_at();
