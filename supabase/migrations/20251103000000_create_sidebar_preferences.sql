-- Create sidebar_preferences table for per-profile sidebar customization
CREATE TABLE IF NOT EXISTS public.sidebar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT,
  profile_id UUID,
  hidden_items TEXT[] DEFAULT '{}',
  item_order TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique constraint matching the upsert conflict in useSidebarPreferences.ts line 73
  UNIQUE(user_id, COALESCE(profile_type, ''), COALESCE(profile_id::text, ''))
);

-- Enable RLS
ALTER TABLE public.sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can only manage their own preferences
CREATE POLICY "Users can view own sidebar preferences"
  ON public.sidebar_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sidebar preferences"
  ON public.sidebar_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sidebar preferences"
  ON public.sidebar_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sidebar preferences"
  ON public.sidebar_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sidebar_preferences_user_id ON public.sidebar_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_preferences_profile ON public.sidebar_preferences(user_id, profile_type, profile_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sidebar_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sidebar_preferences_updated_at
  BEFORE UPDATE ON public.sidebar_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_sidebar_preferences_updated_at();
