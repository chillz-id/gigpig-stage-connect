-- Migration: Create customer_activity_timeline view
-- Created: 2025-11-19
-- Updated: 2025-11-20 - Added order_name, session_start_date, and venue_name to metadata
-- Purpose: Create the missing customer_activity_timeline view that the CRM depends on
--          This view aggregates activities (orders, messages, deals, tasks) for the activity timeline

-- Create customer_activity_timeline view for orders
CREATE OR REPLACE VIEW public.customer_activity_timeline AS
SELECT
  ce.customer_id,
  'order'::text AS activity_type,
  co.ordered_at AS created_at,
  co.order_source_id AS activity_id,
  jsonb_build_object(
    'total_cents', ROUND((co.net_amount * 100)::numeric, 0),
    'order_reference', co.order_source_id,
    'order_name', co.order_name,
    'order_id', co.order_source_id,
    'status', 'completed',
    'source', co.source,
    'purchaser_name', co.purchaser_name,
    'event_name', co.event_name,
    'session_name', co.session_name,
    'session_start_date', co.session_start_date,
    'venue_name', co.venue_name,
    'gross_amount', co.gross_amount,
    'net_amount', co.net_amount
  ) AS metadata
FROM public.customer_orders_v co
JOIN public.customer_emails ce ON LOWER(TRIM(ce.email)) = LOWER(TRIM(co.email))
WHERE ce.source = 'orders_sync';

COMMENT ON VIEW public.customer_activity_timeline IS
'Unified activity timeline for CRM customer detail pages. Includes order_name for human-readable Humanitix order identifiers (e.g., "NPMY8UMD" instead of MongoDB IDs), plus session details (name, date, venue). Currently includes orders, will expand to include messages, deals, and tasks.';

-- Grant permissions
GRANT SELECT ON customer_activity_timeline TO authenticated;
GRANT SELECT ON customer_activity_timeline TO anon;
