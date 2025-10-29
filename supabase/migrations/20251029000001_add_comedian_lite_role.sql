-- supabase/migrations/20251029000001_add_comedian_lite_role.sql

-- Add comedian_lite to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comedian_lite';

-- Update enum comment for documentation
COMMENT ON TYPE user_role IS
  'User roles: member, comedian, comedian_lite (limited beta), promoter, admin, agency_manager, venue_manager, photographer, videographer, organization';

-- No RLS changes needed - comedian_lite uses same policies as comedian
