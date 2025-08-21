-- Add navigation preferences to profiles table
ALTER TABLE profiles ADD COLUMN navigation_preferences JSONB DEFAULT '{
  "tab_order": ["shows", "calendar", "dashboard", "invoices", "vouches", "settings", "profile", "signout"],
  "visible_tabs": ["shows", "calendar", "dashboard", "invoices", "vouches", "settings", "profile", "signout"],
  "mandatory_tabs": ["settings", "profile", "signout"],
  "dashboard_quick_links": []
}'::jsonb;

-- Add comment to describe the navigation preferences structure
COMMENT ON COLUMN profiles.navigation_preferences IS 'Navigation preferences for customizable navigation: tab_order (array), visible_tabs (array), mandatory_tabs (array), dashboard_quick_links (array)';

-- Create index for navigation preferences queries
CREATE INDEX idx_profiles_navigation_preferences ON profiles USING GIN (navigation_preferences);

-- Create function to validate navigation preferences
CREATE OR REPLACE FUNCTION validate_navigation_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure mandatory tabs are always present in visible_tabs
  IF NOT (NEW.navigation_preferences->'visible_tabs' @> '["settings", "profile", "signout"]'::jsonb) THEN
    RAISE EXCEPTION 'Mandatory tabs (settings, profile, signout) must be visible';
  END IF;
  
  -- Ensure tab_order and visible_tabs contain valid tab names
  IF NOT (NEW.navigation_preferences->'tab_order' <@ '["shows", "calendar", "dashboard", "invoices", "vouches", "settings", "profile", "signout", "applications", "messages", "notifications", "create-event", "admin", "comedians", "photographers"]'::jsonb) THEN
    RAISE EXCEPTION 'Invalid tab name in tab_order';
  END IF;
  
  IF NOT (NEW.navigation_preferences->'visible_tabs' <@ '["shows", "calendar", "dashboard", "invoices", "vouches", "settings", "profile", "signout", "applications", "messages", "notifications", "create-event", "admin", "comedians", "photographers"]'::jsonb) THEN
    RAISE EXCEPTION 'Invalid tab name in visible_tabs';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for navigation preferences validation
CREATE TRIGGER validate_navigation_preferences_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_navigation_preferences();

-- Update existing profiles with default navigation preferences
UPDATE profiles SET navigation_preferences = '{
  "tab_order": ["shows", "calendar", "dashboard", "invoices", "vouches", "settings", "profile", "signout"],
  "visible_tabs": ["shows", "calendar", "dashboard", "invoices", "vouches", "settings", "profile", "signout"],
  "mandatory_tabs": ["settings", "profile", "signout"],
  "dashboard_quick_links": []
}'::jsonb
WHERE navigation_preferences IS NULL;