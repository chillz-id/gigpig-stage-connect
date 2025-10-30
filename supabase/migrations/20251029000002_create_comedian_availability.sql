-- supabase/migrations/20251029000002_create_comedian_availability.sql

-- Create comedian_availability table
-- Tracks which events comedians mark as available for booking
CREATE TABLE IF NOT EXISTS comedian_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events_htx(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX idx_comedian_availability_user ON comedian_availability(user_id);
CREATE INDEX idx_comedian_availability_event ON comedian_availability(event_id);
CREATE INDEX idx_comedian_availability_composite ON comedian_availability(user_id, event_id);

-- Enable RLS
ALTER TABLE comedian_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view, insert, update, delete own availability
CREATE POLICY "Users can manage own availability"
  ON comedian_availability FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_comedian_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comedian_availability_updated_at
  BEFORE UPDATE ON comedian_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_comedian_availability_updated_at();
