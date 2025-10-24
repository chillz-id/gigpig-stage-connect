-- Add lead scoring columns to customers table
-- Implements RFM (Recency, Frequency, Monetary) scoring model for customer segmentation

-- Add lead scoring columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rfm_recency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rfm_frequency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rfm_monetary DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP WITH TIME ZONE;

-- Create function to calculate lead score based on RFM model
CREATE OR REPLACE FUNCTION calculate_lead_score()
RETURNS TRIGGER AS $$
DECLARE
  days_since_last_order INTEGER;
  total_orders INTEGER;
  total_spent DECIMAL(10,2);
  recency_score INTEGER;
  frequency_score INTEGER;
  monetary_score INTEGER;
BEGIN
  -- Calculate recency (days since last order)
  -- NOTE: Removed status filter as orders table doesn't filter by 'completed' in this version
  SELECT
    COALESCE(EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER, 999)
  INTO days_since_last_order
  FROM orders
  WHERE customer_id = NEW.id;

  -- Calculate frequency (total number of orders)
  SELECT COUNT(*)
  INTO total_orders
  FROM orders
  WHERE customer_id = NEW.id;

  -- Calculate monetary (total amount spent, converting cents to dollars)
  -- NOTE: Using total_cents field and converting to dollars
  SELECT COALESCE(SUM(COALESCE(total_cents, 0) / 100.0), 0)
  INTO total_spent
  FROM orders
  WHERE customer_id = NEW.id;

  -- Score recency (1-5 scale, 5 = most recent)
  recency_score := CASE
    WHEN days_since_last_order <= 30 THEN 5
    WHEN days_since_last_order <= 60 THEN 4
    WHEN days_since_last_order <= 90 THEN 3
    WHEN days_since_last_order <= 180 THEN 2
    ELSE 1
  END;

  -- Score frequency (1-5 scale, 5 = most frequent)
  frequency_score := CASE
    WHEN total_orders >= 10 THEN 5
    WHEN total_orders >= 5 THEN 4
    WHEN total_orders >= 3 THEN 3
    WHEN total_orders >= 1 THEN 2
    ELSE 1
  END;

  -- Score monetary (1-5 scale, 5 = highest spending)
  monetary_score := CASE
    WHEN total_spent >= 1000 THEN 5
    WHEN total_spent >= 500 THEN 4
    WHEN total_spent >= 200 THEN 3
    WHEN total_spent >= 50 THEN 2
    ELSE 1
  END;

  -- Update customer record with RFM scores
  NEW.rfm_recency := recency_score;
  NEW.rfm_frequency := frequency_score;
  NEW.rfm_monetary := monetary_score;
  NEW.lead_score := (recency_score * 3) + (frequency_score * 2) + (monetary_score * 1);
  NEW.last_scored_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to recalculate lead score when customer is updated
DROP TRIGGER IF EXISTS calculate_customer_lead_score ON customers;
CREATE TRIGGER calculate_customer_lead_score
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION calculate_lead_score();

-- Create trigger to recalculate lead score when orders change
CREATE OR REPLACE FUNCTION recalculate_customer_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the customer record to trigger lead score recalculation
  UPDATE customers
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_lead_score_on_order_change ON orders;
CREATE TRIGGER recalculate_lead_score_on_order_change
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION recalculate_customer_lead_score();

-- Create index for lead score queries
CREATE INDEX IF NOT EXISTS idx_customers_lead_score ON customers(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_customers_rfm_scores ON customers(rfm_recency, rfm_frequency, rfm_monetary);

-- Add comments
COMMENT ON COLUMN customers.lead_score IS
'Composite lead score (weighted: recency×3 + frequency×2 + monetary×1). Range: 6-30. Higher = better lead quality.';

COMMENT ON COLUMN customers.rfm_recency IS
'Recency score (1-5): 5=last order ≤30 days, 4=≤60 days, 3=≤90 days, 2=≤180 days, 1=>180 days';

COMMENT ON COLUMN customers.rfm_frequency IS
'Frequency score (1-5): 5=≥10 orders, 4=≥5 orders, 3=≥3 orders, 2=≥1 order, 1=0 orders';

COMMENT ON COLUMN customers.rfm_monetary IS
'Monetary score (1-5): 5=≥$1000 spent, 4=≥$500, 3=≥$200, 2=≥$50, 1=<$50';

COMMENT ON COLUMN customers.last_scored_at IS
'Timestamp of last lead score calculation. Automatically updated by trigger.';
