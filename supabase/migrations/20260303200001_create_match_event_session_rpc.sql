-- RPC function to match an event and session by name and date
-- Used by n8n workflows to find the correct event_id and session_id
-- when importing ticket data from email-based providers (SFF, Promotix, FEVER)

CREATE OR REPLACE FUNCTION public.match_event_session(
  p_event_name TEXT,
  p_event_date DATE
)
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  session_id UUID,
  session_starts_at TIMESTAMPTZ,
  match_confidence TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strategy 1: Exact name match + date match via sessions
  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    s.id AS session_id,
    s.starts_at AS session_starts_at,
    'exact'::TEXT AS match_confidence
  FROM public.events e
  JOIN public.sessions s ON s.event_id = e.id
  WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(p_event_name))
    AND s.starts_at::date = p_event_date
  ORDER BY s.starts_at ASC
  LIMIT 1;

  -- If we got a result, return it
  IF FOUND THEN RETURN; END IF;

  -- Strategy 2: Fuzzy name match (contains) + date match
  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    s.id AS session_id,
    s.starts_at AS session_starts_at,
    'fuzzy_name'::TEXT AS match_confidence
  FROM public.events e
  JOIN public.sessions s ON s.event_id = e.id
  WHERE (
    LOWER(TRIM(e.name)) LIKE '%' || LOWER(TRIM(p_event_name)) || '%'
    OR LOWER(TRIM(p_event_name)) LIKE '%' || LOWER(TRIM(e.name)) || '%'
  )
    AND s.starts_at::date = p_event_date
  ORDER BY s.starts_at ASC
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Strategy 3: Exact name match + event_date field (no session)
  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    NULL::UUID AS session_id,
    NULL::TIMESTAMPTZ AS session_starts_at,
    'event_only'::TEXT AS match_confidence
  FROM public.events e
  WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(p_event_name))
    AND e.event_date::date = p_event_date
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Strategy 4: Fuzzy name + event_date (loosest match)
  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    NULL::UUID AS session_id,
    NULL::TIMESTAMPTZ AS session_starts_at,
    'fuzzy_event_only'::TEXT AS match_confidence
  FROM public.events e
  WHERE (
    LOWER(TRIM(e.name)) LIKE '%' || LOWER(TRIM(p_event_name)) || '%'
    OR LOWER(TRIM(p_event_name)) LIKE '%' || LOWER(TRIM(e.name)) || '%'
  )
    AND e.event_date::date = p_event_date
  LIMIT 1;

  -- If nothing matched, returns empty result set
END;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.match_event_session(TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_event_session(TEXT, DATE) TO service_role;

COMMENT ON FUNCTION public.match_event_session IS 'Matches an event name and date to an event_id and session_id. Used by n8n ticket import workflows. Tries exact match first, then fuzzy name match, with and without session linking.';
