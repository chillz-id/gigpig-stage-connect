-- Create materialized view for customer activity timeline (CORRECTED VERSION)
-- This aggregates order activities from customer_orders_v unified view
-- Works with the real customer_profiles table and links via customer_emails

CREATE MATERIALIZED VIEW IF NOT EXISTS customer_activity_timeline AS

-- Order activities from unified order view (Humanitix + Eventbrite)
SELECT
  cp.id as customer_id,
  'order' as activity_type,
  co.ordered_at as created_at,
  jsonb_build_object(
    'order_id', co.order_source_id,
    'amount', co.gross_amount,
    'net_amount', co.net_amount,
    'event_name', co.event_name,
    'status', co.status,
    'source', co.source,
    'purchaser_name', co.purchaser_name,
    'event_id', co.raw_event_id
  ) as metadata
FROM customer_profiles cp
JOIN customer_emails ce ON ce.customer_id = cp.id
JOIN customer_orders_v co ON LOWER(TRIM(co.email)) = LOWER(TRIM(ce.email))

ORDER BY created_at DESC;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_customer_activity_timeline_customer_date
ON customer_activity_timeline(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_activity_timeline_type
ON customer_activity_timeline(activity_type);

-- Add helpful comment
COMMENT ON MATERIALIZED VIEW customer_activity_timeline IS
'Customer activity timeline showing order history from both Humanitix and Eventbrite platforms.
Uses customer_orders_v unified view and links via customer_emails table to handle multiple email addresses per customer.
Refresh with: REFRESH MATERIALIZED VIEW customer_activity_timeline;
Consider scheduling automated refresh based on data update frequency (recommendation: daily at 2 AM).
NOTE: Currently only includes order activities. Future enhancement: add messages and deal_negotiations when those features are active.';
