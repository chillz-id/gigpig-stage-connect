-- Add collapsed_sections column to sidebar_preferences table
-- This column stores an array of section keys that are collapsed in the sidebar

ALTER TABLE public.sidebar_preferences
ADD COLUMN IF NOT EXISTS collapsed_sections TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.sidebar_preferences.collapsed_sections IS
  'Array of section keys that are collapsed (opportunities, work, business, manager, admin, account)';
