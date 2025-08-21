-- Create functions for Agency Management System automated features

-- Function to calculate deal negotiation strategy
CREATE OR REPLACE FUNCTION public.calculate_negotiation_strategy(
  _deal_id UUID,
  _market_data JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  deal_record RECORD;
  artist_history RECORD;
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
  
  -- Get artist performance history
  SELECT 
    COUNT(*) as total_bookings,
    AVG(cb.performance_fee) as average_fee,
    MAX(cb.performance_fee) as highest_fee,
    MIN(cb.performance_fee) as lowest_fee
  INTO artist_history
  FROM public.comedian_bookings cb
  JOIN public.events e ON cb.event_id = e.id
  WHERE cb.comedian_id = deal_record.artist_id
  AND cb.payment_status = 'paid'
  AND e.event_date >= NOW() - INTERVAL '12 months';
  
  -- Calculate market average (from market_data or default calculation)
  market_average := COALESCE(
    (_market_data->>'average_fee')::DECIMAL(10,2),
    artist_history.average_fee * 1.1, -- 10% above artist's average
    500.00 -- Default minimum
  );
  
  -- Build strategy based on data
  strategy_result := jsonb_build_object(
    'recommended_minimum', GREATEST(
      deal_record.minimum_fee,
      artist_history.average_fee * 0.8,
      market_average * 0.7
    ),
    'recommended_target', GREATEST(
      deal_record.proposed_fee,
      artist_history.average_fee * 1.2,
      market_average
    ),
    'recommended_maximum', GREATEST(
      deal_record.maximum_fee,
      artist_history.highest_fee,
      market_average * 1.3
    ),
    'negotiation_approach', CASE
      WHEN deal_record.proposed_fee < market_average * 0.8 THEN 'aggressive'
      WHEN deal_record.proposed_fee > market_average * 1.2 THEN 'conservative'
      ELSE 'balanced'
    END,
    'artist_metrics', jsonb_build_object(
      'total_bookings', COALESCE(artist_history.total_bookings, 0),
      'average_fee', COALESCE(artist_history.average_fee, 0),
      'highest_fee', COALESCE(artist_history.highest_fee, 0),
      'experience_level', CASE
        WHEN COALESCE(artist_history.total_bookings, 0) > 50 THEN 'experienced'
        WHEN COALESCE(artist_history.total_bookings, 0) > 20 THEN 'intermediate'
        ELSE 'emerging'
      END
    ),
    'market_data', jsonb_build_object(
      'market_average', market_average,
      'market_position', CASE
        WHEN deal_record.proposed_fee > market_average * 1.2 THEN 'premium'
        WHEN deal_record.proposed_fee < market_average * 0.8 THEN 'budget'
        ELSE 'market_rate'
      END
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

-- Function to process automated deal responses
CREATE OR REPLACE FUNCTION public.process_automated_deal_response(
  _deal_id UUID,
  _new_offer_amount DECIMAL(10,2),
  _responder_id UUID
) RETURNS JSONB AS $$
DECLARE
  deal_record RECORD;
  response_action TEXT;
  response_message TEXT;
  result_data JSONB;
BEGIN
  -- Get deal details
  SELECT * INTO deal_record
  FROM public.deal_negotiations
  WHERE id = _deal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  
  -- Only process if automated responses are enabled
  IF NOT deal_record.automated_responses THEN
    RETURN jsonb_build_object(
      'action', 'manual_review_required',
      'message', 'Automated responses are disabled for this deal'
    );
  END IF;
  
  -- Determine response action
  IF _new_offer_amount >= deal_record.auto_accept_threshold THEN
    response_action := 'accept';
    response_message := 'Offer automatically accepted based on predefined criteria.';
  ELSIF _new_offer_amount <= deal_record.auto_decline_threshold THEN
    response_action := 'decline';
    response_message := 'Offer automatically declined as it falls below minimum acceptable threshold.';
  ELSE
    response_action := 'counter_offer';
    response_message := 'Automated counter-offer generated based on negotiation strategy.';
  END IF;
  
  -- Execute the response action
  IF response_action = 'accept' THEN
    -- Accept the deal
    UPDATE public.deal_negotiations
    SET 
      status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
    WHERE id = _deal_id;
    
    -- Create acceptance message
    INSERT INTO public.deal_messages (
      deal_id, sender_id, message_type, content, is_automated
    ) VALUES (
      _deal_id, _responder_id, 'acceptance', response_message, true
    );
    
  ELSIF response_action = 'decline' THEN
    -- Decline the deal
    UPDATE public.deal_negotiations
    SET 
      status = 'declined',
      declined_at = NOW(),
      updated_at = NOW()
    WHERE id = _deal_id;
    
    -- Create decline message
    INSERT INTO public.deal_messages (
      deal_id, sender_id, message_type, content, is_automated
    ) VALUES (
      _deal_id, _responder_id, 'rejection', response_message, true
    );
    
  ELSE -- counter_offer
    -- Calculate counter offer amount
    DECLARE
      counter_amount DECIMAL(10,2);
      strategy JSONB;
    BEGIN
      strategy := deal_record.negotiation_strategy;
      
      -- Calculate counter offer based on strategy
      counter_amount := CASE
        WHEN (strategy->>'negotiation_approach') = 'aggressive' THEN
          GREATEST(
            _new_offer_amount * 1.3,
            (strategy->>'recommended_target')::DECIMAL(10,2)
          )
        WHEN (strategy->>'negotiation_approach') = 'conservative' THEN
          GREATEST(
            _new_offer_amount * 1.1,
            (strategy->>'recommended_minimum')::DECIMAL(10,2)
          )
        ELSE -- balanced
          GREATEST(
            _new_offer_amount * 1.2,
            (strategy->>'recommended_target')::DECIMAL(10,2) * 0.9
          )
      END;
      
      -- Update deal with counter offer
      UPDATE public.deal_negotiations
      SET 
        counter_offers = counter_offers || jsonb_build_array(
          jsonb_build_object(
            'amount', counter_amount,
            'offered_at', NOW(),
            'offered_by', _responder_id,
            'is_automated', true,
            'response_to_amount', _new_offer_amount
          )
        ),
        status = 'counter_offered',
        updated_at = NOW()
      WHERE id = _deal_id;
      
      -- Create counter offer message
      INSERT INTO public.deal_messages (
        deal_id, sender_id, message_type, content, 
        offer_amount, is_automated
      ) VALUES (
        _deal_id, _responder_id, 'counter_offer', 
        response_message || ' Counter offer: $' || counter_amount::TEXT,
        counter_amount, true
      );
    END;
  END IF;
  
  result_data := jsonb_build_object(
    'action', response_action,
    'message', response_message,
    'deal_id', _deal_id,
    'processed_at', NOW()
  );
  
  RETURN result_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update agency analytics
CREATE OR REPLACE FUNCTION public.update_agency_analytics(
  _agency_id UUID,
  _period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  _period_end DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
  analytics_data JSONB;
  artist_metrics RECORD;
  deal_metrics RECORD;
  financial_metrics RECORD;
BEGIN
  -- Calculate artist metrics
  SELECT 
    COUNT(DISTINCT am.artist_id) as total_artists,
    COUNT(DISTINCT CASE WHEN am.is_active THEN am.artist_id END) as active_artists,
    COUNT(DISTINCT CASE WHEN am.created_at >= _period_start THEN am.artist_id END) as new_artists
  INTO artist_metrics
  FROM public.artist_management am
  WHERE am.agency_id = _agency_id;
  
  -- Calculate deal metrics
  SELECT 
    COUNT(*) as deals_initiated,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as deals_closed,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as deals_declined,
    AVG(CASE WHEN status = 'accepted' THEN proposed_fee END) as average_deal_value,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as average_response_time_hours
  INTO deal_metrics
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id
  AND created_at >= _period_start
  AND created_at <= _period_end;
  
  -- Calculate financial metrics
  SELECT 
    SUM(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee END) as total_revenue,
    SUM(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee * (am.commission_rate / 100) END) as commission_earned,
    AVG(am.commission_rate) as average_commission_rate
  INTO financial_metrics
  FROM public.deal_negotiations dn
  JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.agency_id = _agency_id
  AND dn.created_at >= _period_start
  AND dn.created_at <= _period_end;
  
  -- Build analytics data
  analytics_data := jsonb_build_object(
    'total_artists', COALESCE(artist_metrics.total_artists, 0),
    'active_artists', COALESCE(artist_metrics.active_artists, 0),
    'new_artists', COALESCE(artist_metrics.new_artists, 0),
    'deals_initiated', COALESCE(deal_metrics.deals_initiated, 0),
    'deals_closed', COALESCE(deal_metrics.deals_closed, 0),
    'deals_declined', COALESCE(deal_metrics.deals_declined, 0),
    'average_deal_value', COALESCE(financial_metrics.total_revenue, 0),
    'total_revenue', COALESCE(financial_metrics.total_revenue, 0),
    'commission_earned', COALESCE(financial_metrics.commission_earned, 0),
    'average_commission_rate', COALESCE(financial_metrics.average_commission_rate, 0),
    'average_response_time_hours', COALESCE(deal_metrics.average_response_time_hours, 0),
    'client_satisfaction_score', 0.0 -- Placeholder for future implementation
  );
  
  -- Insert or update analytics record
  INSERT INTO public.agency_analytics (
    agency_id, period_start, period_end,
    total_artists, active_artists, new_artists,
    deals_initiated, deals_closed, deals_declined, average_deal_value,
    total_revenue, commission_earned, average_commission_rate,
    average_response_time_hours, client_satisfaction_score,
    metrics_data
  ) VALUES (
    _agency_id, _period_start, _period_end,
    (analytics_data->>'total_artists')::INTEGER,
    (analytics_data->>'active_artists')::INTEGER,
    (analytics_data->>'new_artists')::INTEGER,
    (analytics_data->>'deals_initiated')::INTEGER,
    (analytics_data->>'deals_closed')::INTEGER,
    (analytics_data->>'deals_declined')::INTEGER,
    (analytics_data->>'average_deal_value')::DECIMAL(12,2),
    (analytics_data->>'total_revenue')::DECIMAL(12,2),
    (analytics_data->>'commission_earned')::DECIMAL(12,2),
    (analytics_data->>'average_commission_rate')::DECIMAL(5,2),
    (analytics_data->>'average_response_time_hours')::DECIMAL(10,2),
    (analytics_data->>'client_satisfaction_score')::DECIMAL(3,2),
    analytics_data
  ) ON CONFLICT (agency_id, period_start, period_end)
  DO UPDATE SET
    total_artists = EXCLUDED.total_artists,
    active_artists = EXCLUDED.active_artists,
    new_artists = EXCLUDED.new_artists,
    deals_initiated = EXCLUDED.deals_initiated,
    deals_closed = EXCLUDED.deals_closed,
    deals_declined = EXCLUDED.deals_declined,
    average_deal_value = EXCLUDED.average_deal_value,
    total_revenue = EXCLUDED.total_revenue,
    commission_earned = EXCLUDED.commission_earned,
    average_commission_rate = EXCLUDED.average_commission_rate,
    average_response_time_hours = EXCLUDED.average_response_time_hours,
    client_satisfaction_score = EXCLUDED.client_satisfaction_score,
    metrics_data = EXCLUDED.metrics_data,
    updated_at = NOW();
  
  RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agency dashboard data
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
  -- Get recent deals
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'artist_name', (SELECT stage_name FROM public.profiles WHERE id = artist_id),
      'proposed_fee', proposed_fee,
      'status', status,
      'created_at', created_at,
      'deadline', deadline
    )
  ) INTO recent_deals
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id
  AND created_at >= NOW() - INTERVAL '30 days'
  ORDER BY created_at DESC
  LIMIT 10;
  
  -- Get artist summary
  SELECT jsonb_build_object(
    'total_artists', COUNT(*),
    'active_artists', COUNT(CASE WHEN is_active THEN 1 END),
    'top_performers', jsonb_agg(
      jsonb_build_object(
        'artist_id', artist_id,
        'artist_name', (SELECT stage_name FROM public.profiles WHERE id = artist_id),
        'total_revenue', total_revenue,
        'bookings_count', bookings_count
      )
    )
  ) INTO artist_summary
  FROM (
    SELECT 
      am.artist_id,
      am.is_active,
      am.total_revenue,
      am.bookings_count
    FROM public.artist_management am
    WHERE am.agency_id = _agency_id
    ORDER BY am.total_revenue DESC
    LIMIT 5
  ) top_artists;
  
  -- Get financial summary
  SELECT jsonb_build_object(
    'total_revenue_30d', COALESCE(SUM(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN dn.proposed_fee END), 0),
    'commission_earned_30d', COALESCE(SUM(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN dn.proposed_fee * (am.commission_rate / 100) END), 0),
    'deals_closed_30d', COUNT(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN 1 END),
    'average_deal_value', COALESCE(AVG(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee END), 0)
  ) INTO financial_summary
  FROM public.deal_negotiations dn
  JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.agency_id = _agency_id;
  
  -- Get pending actions
  SELECT jsonb_build_object(
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
  ) INTO pending_actions
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.calculate_negotiation_strategy(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_automated_deal_response(UUID, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_agency_analytics(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_dashboard_data(UUID, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.calculate_negotiation_strategy(UUID, JSONB) IS 'Calculates AI-driven negotiation strategy based on artist history and market data';
COMMENT ON FUNCTION public.process_automated_deal_response(UUID, DECIMAL, UUID) IS 'Processes automated deal responses based on predefined thresholds';
COMMENT ON FUNCTION public.update_agency_analytics(UUID, DATE, DATE) IS 'Updates agency analytics for a given period';
COMMENT ON FUNCTION public.get_agency_dashboard_data(UUID, UUID) IS 'Gets comprehensive dashboard data for agency management interface';