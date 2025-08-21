-- Fix the dashboard function to work with existing tables

-- Drop the existing function that has issues
DROP FUNCTION IF EXISTS public.get_agency_dashboard_data(UUID, UUID);

-- Create a simplified version that works with existing tables
CREATE OR REPLACE FUNCTION public.get_agency_dashboard_data(
  _agency_id UUID,
  _manager_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  dashboard_data JSONB;
  recent_deals JSONB;
  artist_summary JSONB;
  financial_summary JSONB;
  pending_actions JSONB;
BEGIN
  -- Get recent deals (simplified - may be empty initially)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'artist_name', (SELECT stage_name FROM public.profiles WHERE id = artist_id),
      'proposed_fee', proposed_fee,
      'status', status,
      'created_at', created_at,
      'deadline', deadline
    )
  ), '[]'::JSONB) INTO recent_deals
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id
  AND created_at >= NOW() - INTERVAL '30 days'
  ORDER BY created_at DESC
  LIMIT 10;
  
  -- Get artist summary (simplified)
  SELECT COALESCE(jsonb_build_object(
    'total_artists', COUNT(*),
    'active_artists', COUNT(CASE WHEN is_active THEN 1 END),
    'top_performers', jsonb_agg(
      jsonb_build_object(
        'artist_id', artist_id,
        'artist_name', (SELECT stage_name FROM public.profiles WHERE id = artist_id),
        'total_revenue', COALESCE(total_revenue, 0),
        'bookings_count', COALESCE(bookings_count, 0)
      )
    )
  ), jsonb_build_object(
    'total_artists', 0,
    'active_artists', 0,
    'top_performers', '[]'::JSONB
  )) INTO artist_summary
  FROM (
    SELECT 
      am.artist_id,
      am.is_active,
      am.total_revenue,
      am.bookings_count
    FROM public.artist_management am
    WHERE am.agency_id = _agency_id
    ORDER BY am.total_revenue DESC NULLS LAST
    LIMIT 5
  ) top_artists;
  
  -- Get financial summary (simplified)
  SELECT COALESCE(jsonb_build_object(
    'total_revenue_30d', COALESCE(SUM(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN dn.proposed_fee END), 0),
    'commission_earned_30d', COALESCE(SUM(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN dn.proposed_fee * (COALESCE(am.commission_rate, 15) / 100) END), 0),
    'deals_closed_30d', COUNT(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN 1 END),
    'average_deal_value', COALESCE(AVG(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee END), 0)
  ), jsonb_build_object(
    'total_revenue_30d', 0,
    'commission_earned_30d', 0,
    'deals_closed_30d', 0,
    'average_deal_value', 0
  )) INTO financial_summary
  FROM public.deal_negotiations dn
  LEFT JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.agency_id = _agency_id;
  
  -- Get pending actions (simplified)
  SELECT COALESCE(jsonb_build_object(
    'pending_deals', COUNT(CASE WHEN status IN ('proposed', 'negotiating', 'counter_offered') THEN 1 END),
    'expiring_soon', COUNT(CASE WHEN status IN ('proposed', 'negotiating', 'counter_offered') AND deadline <= NOW() + INTERVAL '48 hours' THEN 1 END),
    'new_messages', COALESCE((
      SELECT COUNT(*)
      FROM public.deal_messages dm
      JOIN public.deal_negotiations dn ON dm.deal_id = dn.id
      WHERE dn.agency_id = _agency_id
      AND dm.created_at >= NOW() - INTERVAL '24 hours'
      AND dm.sender_id != COALESCE(_manager_id, '00000000-0000-0000-0000-000000000000'::UUID)
    ), 0)
  ), jsonb_build_object(
    'pending_deals', 0,
    'expiring_soon', 0,
    'new_messages', 0
  )) INTO pending_actions
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id;
  
  -- Build final dashboard data
  dashboard_data := jsonb_build_object(
    'agency_id', _agency_id,
    'generated_at', NOW(),
    'recent_deals', COALESCE(recent_deals, '[]'::JSONB),
    'artist_summary', COALESCE(artist_summary, '{}'::JSONB),
    'financial_summary', COALESCE(financial_summary, '{}'::JSONB),
    'pending_actions', COALESCE(pending_actions, '{}'::JSONB)
  );
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the negotiation strategy function to handle missing tables
DROP FUNCTION IF EXISTS public.calculate_negotiation_strategy(UUID, JSONB);

CREATE OR REPLACE FUNCTION public.calculate_negotiation_strategy(
  _deal_id UUID,
  _market_data JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  deal_record RECORD;
  market_average DECIMAL(10,2);
  strategy_result JSONB;
BEGIN
  -- Get deal details
  SELECT dn.*, p.stage_name, p.location, am.commission_rate as artist_commission_rate
  INTO deal_record
  FROM public.deal_negotiations dn
  JOIN public.profiles p ON dn.artist_id = p.id
  LEFT JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.id = _deal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  
  -- Use a simple market average calculation since comedian_bookings may not exist
  market_average := COALESCE(
    (_market_data->>'average_fee')::DECIMAL(10,2),
    deal_record.proposed_fee * 1.1, -- 10% above proposed fee
    500.00 -- Default minimum
  );
  
  -- Build simplified strategy
  strategy_result := jsonb_build_object(
    'recommended_minimum', GREATEST(
      COALESCE(deal_record.minimum_fee, 0),
      market_average * 0.7
    ),
    'recommended_target', GREATEST(
      COALESCE(deal_record.proposed_fee, 0),
      market_average
    ),
    'recommended_maximum', GREATEST(
      COALESCE(deal_record.maximum_fee, 0),
      market_average * 1.3
    ),
    'negotiation_approach', CASE
      WHEN COALESCE(deal_record.proposed_fee, 0) < market_average * 0.8 THEN 'aggressive'
      WHEN COALESCE(deal_record.proposed_fee, 0) > market_average * 1.2 THEN 'conservative'
      ELSE 'balanced'
    END,
    'artist_metrics', jsonb_build_object(
      'total_bookings', 0,
      'average_fee', market_average,
      'highest_fee', market_average * 1.5,
      'experience_level', 'emerging'
    ),
    'market_data', jsonb_build_object(
      'market_average', market_average,
      'market_position', 'market_rate'
    ),
    'auto_response_thresholds', jsonb_build_object(
      'auto_accept_above', market_average * 1.1,
      'auto_decline_below', market_average * 0.6,
      'requires_review_between', jsonb_build_array(
        market_average * 0.6,
        market_average * 1.1
      )
    ),
    'calculated_at', NOW()
  );
  
  -- Update deal with strategy
  UPDATE public.deal_negotiations
  SET 
    negotiation_strategy = strategy_result,
    auto_accept_threshold = (strategy_result->>'auto_accept_above')::DECIMAL(10,2),
    auto_decline_threshold = (strategy_result->>'auto_decline_below')::DECIMAL(10,2),
    updated_at = NOW()
  WHERE id = _deal_id;
  
  RETURN strategy_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_agency_dashboard_data(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_negotiation_strategy(UUID, JSONB) TO authenticated;