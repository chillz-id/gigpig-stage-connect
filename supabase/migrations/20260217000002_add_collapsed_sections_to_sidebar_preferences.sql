-- Add collapsed_sections column to sidebar_preferences
-- This column was being queried but didn't exist, causing 400 errors

ALTER TABLE public.sidebar_preferences
ADD COLUMN IF NOT EXISTS collapsed_sections text[] DEFAULT '{}';

COMMENT ON COLUMN public.sidebar_preferences.collapsed_sections IS
'Array of section keys that are collapsed in the sidebar';
