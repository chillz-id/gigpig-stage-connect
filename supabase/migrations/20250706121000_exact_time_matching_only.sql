-- Update Smart Event Matching to require EXACT date and time matching
-- Removes proximity scoring - events must have exact matching timestamps

-- Drop and recreate the match_external_event function with strict time matching
CREATE OR REPLACE FUNCTION match_external_event(
  p_platform TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_venue TEXT,
  p_event_date TIMESTAMPTZ,
  p_event_data JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE (
  event_id UUID,
  match_score NUMERIC,
  match_reasons JSONB
) AS $$
DECLARE
  v_title_words TEXT[];
  v_venue_words TEXT[];
BEGIN
  -- Normalize and split title/venue into words for matching
  v_title_words := string_to_array(lower(regexp_replace(p_title, '[^a-zA-Z0-9\s]', '', 'g')), ' ');
  v_venue_words := string_to_array(lower(regexp_replace(p_venue, '[^a-zA-Z0-9\s]', '', 'g')), ' ');
  
  RETURN QUERY
  WITH match_scores AS (
    SELECT 
      e.id,
      -- Title similarity score (0-40 points)
      CASE 
        WHEN lower(e.title) = lower(p_title) THEN 40
        WHEN lower(e.title) LIKE '%' || lower(p_title) || '%' 
          OR lower(p_title) LIKE '%' || lower(e.title) || '%' THEN 30
        ELSE (
          SELECT COUNT(*)::NUMERIC * 5
          FROM unnest(v_title_words) AS word
          WHERE lower(e.title) LIKE '%' || word || '%'
          AND length(word) > 3
        )
      END AS title_score,
      
      -- Venue similarity score (0-30 points)
      CASE 
        WHEN lower(e.venue) = lower(p_venue) THEN 30
        WHEN lower(e.venue) LIKE '%' || lower(p_venue) || '%' 
          OR lower(p_venue) LIKE '%' || lower(e.venue) || '%' THEN 20
        ELSE (
          SELECT COUNT(*)::NUMERIC * 3
          FROM unnest(v_venue_words) AS word
          WHERE lower(e.venue) LIKE '%' || word || '%'
          AND length(word) > 3
        )
      END AS venue_score,
      
      -- Date and time score - EXACT MATCH ONLY (0 or 30 points)
      CASE 
        -- Exact date and time match (30 points)
        WHEN e.event_date = p_event_date THEN 30
        -- No partial credit - must be exact
        ELSE 0
      END AS date_score,
      
      -- Extract time difference for reporting
      ABS(EXTRACT(EPOCH FROM (e.event_date - p_event_date)) / 60) AS time_diff_minutes,
      
      -- Keyword match bonus (0-10 points)
      COALESCE((
        SELECT COUNT(*)::NUMERIC * 2
        FROM unnest(e.matching_keywords) AS keyword
        WHERE lower(p_title) LIKE '%' || lower(keyword) || '%'
          OR lower(p_venue) LIKE '%' || lower(keyword) || '%'
      ), 0) AS keyword_score
      
    FROM public.events e
    WHERE e.status != 'cancelled'
      AND e.event_date >= NOW() - INTERVAL '1 day'
      AND e.auto_match_platforms = true
      -- Don't match if already linked to this platform
      AND NOT EXISTS (
        SELECT 1 FROM public.ticket_platforms tp
        WHERE tp.event_id = e.id
        AND tp.platform = p_platform
      )
  )
  SELECT 
    ms.id AS event_id,
    (ms.title_score + ms.venue_score + ms.date_score + ms.keyword_score) AS match_score,
    jsonb_build_object(
      'title_score', ms.title_score,
      'venue_score', ms.venue_score,
      'date_score', ms.date_score,
      'keyword_score', ms.keyword_score,
      'title_match', ms.title_score > 0,
      'venue_match', ms.venue_score > 0,
      'date_match', ms.date_score > 0,
      'exact_time_match', ms.date_score = 30,
      'time_diff_minutes', ms.time_diff_minutes,
      'time_match_quality', CASE
        WHEN ms.date_score = 30 THEN 'exact'
        ELSE 'no_match'
      END
    ) AS match_reasons
  FROM match_scores ms
  JOIN public.events e ON e.id = ms.id
  WHERE (ms.title_score + ms.venue_score + ms.date_score + ms.keyword_score) >= 40
  ORDER BY match_score DESC, ms.time_diff_minutes ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the updated scoring
COMMENT ON FUNCTION match_external_event IS 'Matches external events to Stand Up Sydney events using title, venue, date/time, and keyword scoring. Date/time matching requires EXACT match (30pts) - no partial credit for close times.';