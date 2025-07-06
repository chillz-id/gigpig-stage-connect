-- Smart Flexible Event Matching
-- Matches events based on Title, Date, Time, and Venue with intelligent flexibility

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
  v_title_normalized TEXT;
  v_venue_normalized TEXT;
BEGIN
  -- Normalize title and venue for better matching
  v_title_normalized := lower(regexp_replace(p_title, '[^a-zA-Z0-9\s]', '', 'g'));
  v_venue_normalized := lower(regexp_replace(p_venue, '[^a-zA-Z0-9\s]', '', 'g'));
  
  RETURN QUERY
  WITH match_scores AS (
    SELECT 
      e.id,
      -- Title similarity (0-25 points)
      CASE 
        -- Exact match
        WHEN lower(e.title) = lower(p_title) THEN 25
        -- Normalized match (removes special chars)
        WHEN lower(regexp_replace(e.title, '[^a-zA-Z0-9\s]', '', 'g')) = v_title_normalized THEN 24
        -- One contains the other
        WHEN lower(e.title) LIKE '%' || lower(p_title) || '%' 
          OR lower(p_title) LIKE '%' || lower(e.title) || '%' THEN 23
        -- High word overlap
        WHEN (
          SELECT COUNT(*)::NUMERIC FROM (
            SELECT unnest(string_to_array(v_title_normalized, ' ')) 
            INTERSECT 
            SELECT unnest(string_to_array(lower(regexp_replace(e.title, '[^a-zA-Z0-9\s]', '', 'g')), ' '))
          ) t
        ) >= 3 THEN 22
        ELSE 0
      END AS title_score,
      
      -- Venue similarity (0-25 points)
      CASE 
        -- Exact match
        WHEN lower(e.venue) = lower(p_venue) THEN 25
        -- Normalized match
        WHEN lower(regexp_replace(e.venue, '[^a-zA-Z0-9\s]', '', 'g')) = v_venue_normalized THEN 24
        -- Common venue name variations
        WHEN lower(e.venue) LIKE '%' || lower(p_venue) || '%' 
          OR lower(p_venue) LIKE '%' || lower(e.venue) || '%' THEN 23
        -- Handle "The" prefix variations
        WHEN lower(regexp_replace(e.venue, '^the\s+', '', 'i')) = lower(regexp_replace(p_venue, '^the\s+', '', 'i')) THEN 23
        -- High word overlap for venue
        WHEN (
          SELECT COUNT(*)::NUMERIC FROM (
            SELECT unnest(string_to_array(v_venue_normalized, ' ')) 
            INTERSECT 
            SELECT unnest(string_to_array(lower(regexp_replace(e.venue, '[^a-zA-Z0-9\s]', '', 'g')), ' '))
          ) t
        ) >= 2 THEN 22
        ELSE 0
      END AS venue_score,
      
      -- Date match (0-25 points) - must be same day
      CASE 
        WHEN DATE(e.event_date) = DATE(p_event_date) THEN 25
        ELSE 0
      END AS date_score,
      
      -- Time match (0-25 points) - must be exact
      CASE 
        WHEN e.event_date::time = p_event_date::time THEN 25
        ELSE 0
      END AS time_score
      
    FROM public.events e
    WHERE e.status != 'cancelled'
      AND e.event_date >= NOW() - INTERVAL '1 day'
      AND e.auto_match_platforms = true
      -- Must at least be on the same day
      AND DATE(e.event_date) = DATE(p_event_date)
      -- Don't match if already linked to this platform
      AND NOT EXISTS (
        SELECT 1 FROM public.ticket_platforms tp
        WHERE tp.event_id = e.id
        AND tp.platform = p_platform
      )
  )
  SELECT 
    ms.id AS event_id,
    (ms.title_score + ms.venue_score + ms.date_score + ms.time_score) AS match_score,
    jsonb_build_object(
      'title_score', ms.title_score,
      'venue_score', ms.venue_score,
      'date_score', ms.date_score,
      'time_score', ms.time_score,
      'title_match', ms.title_score >= 22,
      'venue_match', ms.venue_score >= 22,
      'date_match', ms.date_score = 25,
      'time_match', ms.time_score = 25
    ) AS match_reasons
  FROM match_scores ms
  -- Must score at least 90/100 to be considered a match
  -- This means all 4 criteria must be very close matches
  WHERE (ms.title_score + ms.venue_score + ms.date_score + ms.time_score) >= 90
  ORDER BY (ms.title_score + ms.venue_score + ms.date_score + ms.time_score) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update process function to use 90 threshold
CREATE OR REPLACE FUNCTION process_external_event(
  p_platform TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_venue TEXT,
  p_event_date TIMESTAMPTZ,
  p_capacity INTEGER DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::JSONB,
  p_auto_match_threshold NUMERIC DEFAULT 90  -- High confidence threshold
) RETURNS JSONB AS $$
DECLARE
  v_matches JSONB;
  v_best_match RECORD;
  v_result JSONB;
BEGIN
  -- Find potential matches
  SELECT jsonb_agg(row_to_json(m.*)) INTO v_matches
  FROM match_external_event(
    p_platform, p_external_id, p_title, p_venue, p_event_date, p_event_data
  ) m;
  
  -- Get best match if above threshold
  SELECT * INTO v_best_match
  FROM match_external_event(
    p_platform, p_external_id, p_title, p_venue, p_event_date, p_event_data
  )
  WHERE match_score >= p_auto_match_threshold
  LIMIT 1;
  
  -- Store in unmatched events for review
  INSERT INTO public.unmatched_external_events (
    platform, external_event_id, event_data, suggested_matches, match_status, matched_event_id
  ) VALUES (
    p_platform, 
    p_external_id,
    p_event_data || jsonb_build_object(
      'title', p_title,
      'venue', p_venue,
      'event_date', p_event_date,
      'capacity', p_capacity
    ),
    v_matches,
    CASE WHEN v_best_match.event_id IS NOT NULL THEN 'matched' ELSE 'pending' END,
    v_best_match.event_id
  )
  ON CONFLICT (platform, external_event_id) DO UPDATE SET
    event_data = EXCLUDED.event_data,
    suggested_matches = EXCLUDED.suggested_matches,
    updated_at = NOW();
  
  -- If we have a high-confidence match, create the platform link
  IF v_best_match.event_id IS NOT NULL THEN
    INSERT INTO public.ticket_platforms (
      event_id, platform, external_event_id
    ) VALUES (
      v_best_match.event_id, p_platform, p_external_id
    )
    ON CONFLICT (event_id, platform) DO NOTHING;
    
    v_result := jsonb_build_object(
      'status', 'matched',
      'event_id', v_best_match.event_id,
      'match_score', v_best_match.match_score,
      'match_reasons', v_best_match.match_reasons
    );
  ELSE
    v_result := jsonb_build_object(
      'status', 'pending_review',
      'suggested_matches', v_matches
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION match_external_event IS 'Smart event matching with flexibility for real-world variations. Handles different formatting, special characters, and common variations while requiring high confidence (90+ score) for auto-matching.';