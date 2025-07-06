-- Strict Event Matching - Only match if ALL criteria are exact
-- Title, Date, Time, and Venue must all match

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
BEGIN
  RETURN QUERY
  WITH match_scores AS (
    SELECT 
      e.id,
      -- Title match (0 or 25 points)
      CASE 
        WHEN lower(e.title) = lower(p_title) THEN 25
        ELSE 0
      END AS title_score,
      
      -- Venue match (0 or 25 points)
      CASE 
        WHEN lower(e.venue) = lower(p_venue) THEN 25
        ELSE 0
      END AS venue_score,
      
      -- Date match (0 or 25 points)
      CASE 
        WHEN DATE(e.event_date) = DATE(p_event_date) THEN 25
        ELSE 0
      END AS date_score,
      
      -- Time match (0 or 25 points)
      CASE 
        WHEN e.event_date::time = p_event_date::time THEN 25
        ELSE 0
      END AS time_score
      
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
    (ms.title_score + ms.venue_score + ms.date_score + ms.time_score) AS match_score,
    jsonb_build_object(
      'title_match', ms.title_score = 25,
      'venue_match', ms.venue_score = 25,
      'date_match', ms.date_score = 25,
      'time_match', ms.time_score = 25,
      'all_match', (ms.title_score + ms.venue_score + ms.date_score + ms.time_score) = 100
    ) AS match_reasons
  FROM match_scores ms
  -- Only return if ALL criteria match (score = 100)
  WHERE (ms.title_score + ms.venue_score + ms.date_score + ms.time_score) = 100
  ORDER BY ms.id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update the auto-match threshold to 100 (require perfect match)
CREATE OR REPLACE FUNCTION process_external_event(
  p_platform TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_venue TEXT,
  p_event_date TIMESTAMPTZ,
  p_capacity INTEGER DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::JSONB,
  p_auto_match_threshold NUMERIC DEFAULT 100  -- Changed from 70 to 100
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
  
  -- Get best match if above threshold (now requires 100)
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
  
  -- If we have a perfect match, create the platform link
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

COMMENT ON FUNCTION match_external_event IS 'Strict event matching - requires EXACT match on Title, Venue, Date, and Time. All four must match to link automatically.';