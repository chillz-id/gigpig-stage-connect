-- Update get_vouches_with_profiles to include user roles
CREATE OR REPLACE FUNCTION public.get_vouches_with_profiles(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  voucher_id UUID,
  vouchee_id UUID,
  message TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  voucher_profile JSONB,
  vouchee_profile JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.voucher_id,
    v.vouchee_id,
    v.message,
    v.rating,
    v.created_at,
    v.updated_at,
    jsonb_build_object(
      'id', vp.id,
      'name', vp.name,
      'stage_name', vp.stage_name,
      'avatar_url', vp.avatar_url,
      'roles', COALESCE(
        (
          SELECT jsonb_agg(ur.role)
          FROM public.user_roles ur
          WHERE ur.user_id = vp.id
        ),
        '[]'::jsonb
      )
    ) as voucher_profile,
    jsonb_build_object(
      'id', ep.id,
      'name', ep.name,
      'stage_name', ep.stage_name,
      'avatar_url', ep.avatar_url,
      'roles', COALESCE(
        (
          SELECT jsonb_agg(ur.role)
          FROM public.user_roles ur
          WHERE ur.user_id = ep.id
        ),
        '[]'::jsonb
      )
    ) as vouchee_profile
  FROM public.vouches v
  JOIN public.profiles vp ON vp.id = v.voucher_id
  JOIN public.profiles ep ON ep.id = v.vouchee_id
  WHERE v.voucher_id = user_id_param
    OR v.vouchee_id = user_id_param
  ORDER BY v.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vouches_with_profiles(UUID) TO authenticated;
