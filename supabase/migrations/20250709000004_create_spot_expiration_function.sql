-- Create function to handle expired spot confirmations
CREATE OR REPLACE FUNCTION handle_expired_spot_confirmations()
RETURNS TABLE(
  expired_count INTEGER,
  notification_count INTEGER
) AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_notification_count INTEGER := 0;
  expired_spot RECORD;
BEGIN
  -- Find all expired spots and process them
  FOR expired_spot IN
    SELECT 
      es.id,
      es.event_id,
      es.comedian_id,
      es.spot_name,
      e.title as event_title,
      e.event_date,
      e.promoter_id,
      p.name as comedian_name
    FROM public.event_spots es
    JOIN public.events e ON es.event_id = e.id
    LEFT JOIN public.profiles p ON es.comedian_id = p.id
    WHERE es.confirmation_status = 'pending'
      AND es.confirmation_deadline < now()
      AND es.is_filled = true
  LOOP
    -- Update the spot to expired status
    UPDATE public.event_spots
    SET 
      confirmation_status = 'expired',
      is_filled = false,
      comedian_id = NULL,
      updated_at = now()
    WHERE id = expired_spot.id;
    
    v_expired_count := v_expired_count + 1;
    
    -- Create notification for the comedian
    IF expired_spot.comedian_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority,
        data,
        action_url,
        action_label
      ) VALUES (
        expired_spot.comedian_id,
        'spot_expired',
        'Spot Assignment Expired: ' || expired_spot.event_title,
        'Your ' || expired_spot.spot_name || ' spot assignment for "' || expired_spot.event_title || '" on ' || expired_spot.event_date::date || ' has expired due to no response by the deadline.',
        'high',
        jsonb_build_object(
          'event_id', expired_spot.event_id,
          'spot_type', expired_spot.spot_name,
          'expired_at', now()
        ),
        '/events/' || expired_spot.event_id,
        'View Event'
      );
      
      v_notification_count := v_notification_count + 1;
    END IF;
    
    -- Create notification for the promoter
    IF expired_spot.promoter_id IS NOT NULL AND expired_spot.comedian_name IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority,
        data,
        action_url,
        action_label
      ) VALUES (
        expired_spot.promoter_id,
        'spot_expired',
        'Spot Assignment Expired: ' || expired_spot.event_title,
        expired_spot.comedian_name || ' did not confirm their ' || expired_spot.spot_name || ' spot for "' || expired_spot.event_title || '" by the deadline. The spot is now available for reassignment.',
        'medium',
        jsonb_build_object(
          'event_id', expired_spot.event_id,
          'spot_type', expired_spot.spot_name,
          'comedian_id', expired_spot.comedian_id,
          'expired_at', now()
        ),
        '/admin/events/' || expired_spot.event_id,
        'Manage Event'
      );
      
      v_notification_count := v_notification_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_expired_count, v_notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_expired_spot_confirmations() TO service_role;

-- Create a scheduled job to run this function every hour
-- Note: This requires pg_cron extension, which should be enabled by the database administrator
-- SELECT cron.schedule('handle-expired-spots', '0 * * * *', 'SELECT handle_expired_spot_confirmations();');

-- For now, we'll create a manual function that can be called
CREATE OR REPLACE FUNCTION cleanup_expired_spots()
RETURNS TEXT AS $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM handle_expired_spot_confirmations();
  
  RETURN 'Processed ' || result.expired_count || ' expired spots and sent ' || result.notification_count || ' notifications.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_spots() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_spots() TO authenticated;

-- Add comment
COMMENT ON FUNCTION handle_expired_spot_confirmations IS 'Handles expired spot confirmations by freeing up spots and sending notifications';
COMMENT ON FUNCTION cleanup_expired_spots IS 'Manual function to cleanup expired spots - can be called from application';