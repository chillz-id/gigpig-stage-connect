-- Create sidebar_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS sidebar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT,
  profile_id UUID,
  hidden_items TEXT[] DEFAULT '{}',
  item_order TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for valid profile types
ALTER TABLE sidebar_preferences
  ADD CONSTRAINT IF NOT EXISTS valid_profile_type CHECK (
    profile_type IN ('comedian', 'manager', 'organization', 'venue', NULL)
  );

-- Create composite unique constraint for user + profile combination
CREATE UNIQUE INDEX IF NOT EXISTS sidebar_preferences_user_profile_unique
  ON sidebar_preferences(user_id, COALESCE(profile_type, ''), COALESCE(profile_id::text, ''));

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sidebar_preferences_user_id ON sidebar_preferences(user_id);

-- Enable RLS
ALTER TABLE sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view their own sidebar preferences"
  ON sidebar_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own sidebar preferences"
  ON sidebar_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own sidebar preferences"
  ON sidebar_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own sidebar preferences"
  ON sidebar_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_sidebar_preferences_updated_at ON sidebar_preferences;
CREATE TRIGGER set_sidebar_preferences_updated_at
  BEFORE UPDATE ON sidebar_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from notification_preferences.ui_preferences if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences'
    AND column_name = 'ui_preferences'
  ) THEN
    -- Insert global preferences from existing notification_preferences
    INSERT INTO sidebar_preferences (user_id, profile_type, profile_id, hidden_items, item_order)
    SELECT
      user_id,
      NULL,
      NULL,
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(ui_preferences->'sidebar'->'hidden_items')),
        '{}'::TEXT[]
      ),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(ui_preferences->'sidebar'->'item_order')),
        '{}'::TEXT[]
      )
    FROM notification_preferences
    WHERE ui_preferences IS NOT NULL
      AND ui_preferences->'sidebar' IS NOT NULL
    ON CONFLICT (user_id, COALESCE(profile_type, ''), COALESCE(profile_id::text, '')) DO NOTHING;
  END IF;
END $$;
