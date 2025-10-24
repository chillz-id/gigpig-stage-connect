-- Create materialized view for customer activity timeline
-- This aggregates activities from orders, messages, and deal_negotiations into a unified timeline
-- NOTE: Schema adjusted to match actual database structure

CREATE MATERIALIZED VIEW IF NOT EXISTS customer_activity_timeline AS
-- Order activities
SELECT
  c.id as customer_id,
  'order' as activity_type,
  o.created_at,
  jsonb_build_object(
    'order_id', o.id,
    'amount', COALESCE(o.total_cents / 100.0, o.amount),
    'order_reference', o.order_reference,
    'status', o.status,
    'source', o.source
  ) as metadata
FROM customers c
JOIN orders o ON o.customer_id = c.id

UNION ALL

-- Message activities (where customer is recipient)
SELECT
  c.id as customer_id,
  'message' as activity_type,
  m.created_at,
  jsonb_build_object(
    'message_id', m.id,
    'subject', m.subject,
    'sender_id', m.sender_id,
    'read_at', m.read_at
  ) as metadata
FROM customers c
JOIN messages m ON m.recipient_id = c.id

UNION ALL

-- Deal negotiation activities
-- NOTE: deal_negotiations link to promoter_id/artist_id (profiles), not customers
-- This section will only populate for customers who are also promoters or artists
SELECT
  c.id as customer_id,
  'deal' as activity_type,
  d.created_at,
  jsonb_build_object(
    'deal_id', d.id,
    'title', d.title,
    'proposed_fee', d.proposed_fee,
    'performance_date', d.performance_date
  ) as metadata
FROM customers c
JOIN deal_negotiations d ON d.promoter_id = c.id OR d.artist_id = c.id

ORDER BY created_at DESC;

-- Create index for efficient customer-specific timeline queries
CREATE INDEX IF NOT EXISTS idx_customer_activity_customer_date
ON customer_activity_timeline(customer_id, created_at DESC);

-- Create index for activity type filtering
CREATE INDEX IF NOT EXISTS idx_customer_activity_type
ON customer_activity_timeline(activity_type);

-- Add comment explaining refresh strategy
COMMENT ON MATERIALIZED VIEW customer_activity_timeline IS
'Aggregated customer activity timeline from orders, messages, and deals.
Refresh manually with: REFRESH MATERIALIZED VIEW customer_activity_timeline;
Consider scheduling automated refresh based on data update frequency.';
