-- Create manual_gigs table for comedians to track non-platform gigs
CREATE TABLE IF NOT EXISTS manual_gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_manual_gigs_user ON manual_gigs(user_id);
CREATE INDEX idx_manual_gigs_start_date ON manual_gigs(start_datetime);

-- Auto-update timestamp trigger
CREATE TRIGGER manual_gigs_updated_at
  BEFORE UPDATE ON manual_gigs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE manual_gigs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own manual gigs
CREATE POLICY "Users can manage own manual gigs"
  ON manual_gigs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE manual_gigs IS 'Manually added gigs by comedians for personal tracking and calendar export';
