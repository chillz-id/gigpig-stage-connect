-- Smart Event Matching System
-- Automatically matches external events to Stand Up Sydney events

-- Add matching fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS matching_keywords TEXT[],
ADD COLUMN IF NOT EXISTS auto_match_platforms BOOLEAN DEFAULT true;

-- Create event matching rules table
CREATE TABLE IF NOT EXISTS public.event_matching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('exact_title', 'keyword', 'date_venue', 'custom')),
  rule_data JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unmatched external events table
CREATE TABLE IF NOT EXISTS public.unmatched_external_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_data JSONB NOT NULL,
  suggested_matches JSONB,
  match_status TEXT DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'ignored', 'no_match')),
  matched_event_id UUID REFERENCES public.events(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_event_id)
);

-- Function to find potential matches for external events
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
      
      -- Date proximity score (0-30 points)
      CASE 
        WHEN DATE(e.event_date) = DATE(p_event_date) THEN 30
        WHEN ABS(EXTRACT(EPOCH FROM (e.event_date - p_event_date)) / 3600) <= 24 THEN 20
        WHEN ABS(EXTRACT(EPOCH FROM (e.event_date - p_event_date)) / 3600) <= 72 THEN 10
        ELSE 0
      END AS date_score,
      
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
      'date_match', ms.date_score > 0
    ) AS match_reasons
  FROM match_scores ms
  WHERE (ms.title_score + ms.venue_score + ms.date_score + ms.keyword_score) >= 40
  ORDER BY match_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to process and auto-match external events
CREATE OR REPLACE FUNCTION process_external_event(
  p_platform TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_venue TEXT,
  p_event_date TIMESTAMPTZ,
  p_capacity INTEGER DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::JSONB,
  p_auto_match_threshold NUMERIC DEFAULT 70
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

-- Create view for pending matches that need review
CREATE OR REPLACE VIEW public.pending_event_matches AS
SELECT 
  uee.id,
  uee.platform,
  uee.external_event_id,
  uee.event_data->>'title' AS external_title,
  uee.event_data->>'venue' AS external_venue,
  (uee.event_data->>'event_date')::TIMESTAMPTZ AS external_date,
  uee.suggested_matches,
  uee.created_at,
  -- Get top suggested match details
  e.id AS suggested_event_id,
  e.title AS suggested_title,
  e.venue AS suggested_venue,
  e.event_date AS suggested_date
FROM public.unmatched_external_events uee
LEFT JOIN LATERAL (
  SELECT id, title, venue, event_date
  FROM public.events
  WHERE id = (uee.suggested_matches->0->>'event_id')::UUID
) e ON true
WHERE uee.match_status = 'pending'
ORDER BY uee.created_at DESC;

-- Function to manually link events
CREATE OR REPLACE FUNCTION link_external_event(
  p_platform TEXT,
  p_external_id TEXT,
  p_event_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Create the platform link
  INSERT INTO public.ticket_platforms (event_id, platform, external_event_id)
  VALUES (p_event_id, p_platform, p_external_id)
  ON CONFLICT (event_id, platform) DO UPDATE SET
    external_event_id = EXCLUDED.external_event_id;
  
  -- Update the unmatched events table
  UPDATE public.unmatched_external_events
  SET 
    match_status = 'matched',
    matched_event_id = p_event_id,
    updated_at = NOW()
  WHERE platform = p_platform
  AND external_event_id = p_external_id;
END;
$$ LANGUAGE plpgsql;

-- Sample matching rules
INSERT INTO public.event_matching_rules (platform, rule_type, rule_data, priority)
VALUES 
  ('humanitix', 'keyword', '{"keywords": ["comedy", "stand up", "standup", "open mic"]}', 10),
  ('eventbrite', 'keyword', '{"keywords": ["comedy", "stand up", "standup", "open mic"]}', 10)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_unmatched_external_events_status ON public.unmatched_external_events(match_status);
CREATE INDEX idx_unmatched_external_events_platform ON public.unmatched_external_events(platform);

-- Grant permissions
GRANT ALL ON public.event_matching_rules TO authenticated;
GRANT ALL ON public.unmatched_external_events TO authenticated;
GRANT ALL ON public.pending_event_matches TO authenticated;
GRANT EXECUTE ON FUNCTION match_external_event TO authenticated;
GRANT EXECUTE ON FUNCTION process_external_event TO authenticated;
GRANT EXECUTE ON FUNCTION link_external_event TO authenticated;