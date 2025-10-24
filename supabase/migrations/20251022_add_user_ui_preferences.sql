-- Migration: Add UI preferences to notification_preferences table
-- Adds customization settings for sidebar items, calendar display, and other UI preferences
--
-- Schema:
-- ui_preferences: {
--   sidebar: {
--     hidden_items: string[],  // e.g., ["messages", "analytics"]
--     item_order: string[]      // e.g., ["dashboard", "browse", "calendar"]
--   },
--   calendar: {
--     hide_sundays_shows: boolean  // Shows page calendar only
--   }
-- }

-- Add ui_preferences JSONB column to notification_preferences table
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS ui_preferences JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_ui_preferences
  ON notification_preferences USING gin(ui_preferences);

-- Add comment explaining the column purpose
COMMENT ON COLUMN notification_preferences.ui_preferences IS
  'User UI customization settings including sidebar configuration, calendar display preferences, and other personalization options';

-- Set default empty object for existing rows
UPDATE notification_preferences
SET ui_preferences = '{}'::jsonb
WHERE ui_preferences IS NULL;
