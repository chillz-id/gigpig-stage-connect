-- Drop the photographer_reviews table as we'll use the existing vouch system
DROP TABLE IF EXISTS public.photographer_reviews CASCADE;

-- Update the vouches table to support photographers/videographers
-- The existing vouch system already uses profile IDs, so it should work for any user type
-- No changes needed to the vouches table structure

-- Create a view to get vouch statistics for photographers
CREATE OR REPLACE VIEW photographer_vouch_stats AS
SELECT 
  p.id as photographer_id,
  COUNT(DISTINCT v.id) as total_vouches,
  COUNT(DISTINCT v.voucher_id) as unique_vouchers,
  COALESCE(AVG(v.rating), 0) as average_rating,
  COUNT(DISTINCT CASE WHEN v.created_at > NOW() - INTERVAL '6 months' THEN v.id END) as recent_vouches
FROM profiles p
LEFT JOIN vouches v ON v.vouch_for_id = p.id AND v.is_active = true
WHERE p.id IN (
  SELECT user_id FROM user_roles 
  WHERE role IN ('photographer', 'videographer')
)
GROUP BY p.id;

-- Grant permissions on the view
GRANT SELECT ON photographer_vouch_stats TO authenticated;

-- Create a function to get vouches for a photographer with voucher details
CREATE OR REPLACE FUNCTION get_photographer_vouches(photographer_id UUID)
RETURNS TABLE (
  id UUID,
  voucher_id UUID,
  voucher_name TEXT,
  voucher_avatar_url TEXT,
  voucher_role TEXT,
  message TEXT,
  rating INTEGER,
  relationship TEXT,
  created_at TIMESTAMPTZ,
  event_id UUID,
  event_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.voucher_id,
    vp.name as voucher_name,
    vp.avatar_url as voucher_avatar_url,
    ur.role as voucher_role,
    v.message,
    v.rating,
    v.relationship,
    v.created_at,
    v.event_id,
    e.title as event_title
  FROM vouches v
  JOIN profiles vp ON vp.id = v.voucher_id
  LEFT JOIN user_roles ur ON ur.user_id = v.voucher_id
  LEFT JOIN events e ON e.id = v.event_id
  WHERE v.vouch_for_id = photographer_id
    AND v.is_active = true
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_photographer_vouches(UUID) TO authenticated;

-- Add index for performance when querying vouches by role
CREATE INDEX IF NOT EXISTS idx_user_roles_role_photographer 
ON user_roles(role) 
WHERE role IN ('photographer', 'videographer');