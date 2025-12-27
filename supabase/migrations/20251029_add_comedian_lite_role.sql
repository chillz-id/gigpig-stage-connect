-- Add comedian_lite to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comedian_lite';

-- Add comment explaining the role
COMMENT ON TYPE user_role IS
  'User roles: member (default), comedian (full), comedian_lite (limited beta), promoter, admin, co_promoter, photographer, videographer, manager, visual_artist, agency_manager, venue_manager';
