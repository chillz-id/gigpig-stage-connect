-- Add missing order fields from Humanitix API to orders_htx table
-- Based on Humanitix OpenAPI spec Order schema and OrderTotals schema

DO $$
BEGIN

-- Rename orderedAt to ordered_at for consistency (if it doesn't exist)
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'orderedAt')
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'ordered_at') THEN
    ALTER TABLE orders_htx RENAME COLUMN "orderedAt" TO ordered_at;
END IF;

-- Add event_date_id (eventDateId from API)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'event_date_id') THEN
    ALTER TABLE orders_htx ADD COLUMN event_date_id TEXT;
END IF;

-- Add discount-related fields
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'discounts') THEN
    ALTER TABLE orders_htx ADD COLUMN discounts JSONB;
END IF;

-- Add order reference (explicit field from API)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'order_reference') THEN
    ALTER TABLE orders_htx ADD COLUMN order_reference TEXT;
END IF;

-- Financial fields from OrderTotals schema (all in cents for precision)
-- Fees
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'humanitix_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN humanitix_fee_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'booking_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN booking_fee_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'passed_on_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN passed_on_fee_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'amex_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN amex_fee_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'zip_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN zip_fee_cents BIGINT;
END IF;

-- Tax fields
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'booking_taxes_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN booking_taxes_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'passed_on_taxes_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN passed_on_taxes_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'total_taxes_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN total_taxes_cents BIGINT;
END IF;

-- Donation fields
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'order_client_donation_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN order_client_donation_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'net_client_donation_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN net_client_donation_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'donation_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN donation_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'dgr_donation_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN dgr_donation_cents BIGINT;
END IF;

-- Credit and gift card fields
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'gift_card_credit_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN gift_card_credit_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'credit_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN credit_cents BIGINT;
END IF;

-- Sales totals
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'discounts_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN discounts_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'refunds_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN refunds_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'referral_amount_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN referral_amount_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'outstanding_amount_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN outstanding_amount_cents BIGINT;
END IF;

-- Purchase totals (separate from order totals in API)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_total_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_total_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_subtotal_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_subtotal_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_net_sales_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_net_sales_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_gross_sales_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_gross_sales_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_humanitix_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_humanitix_fee_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_booking_fee_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_booking_fee_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_discounts_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_discounts_cents BIGINT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_refunds_cents') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_refunds_cents BIGINT;
END IF;

-- Boolean flags
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'fees_included') THEN
    ALTER TABLE orders_htx ADD COLUMN fees_included BOOLEAN;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_fees_included') THEN
    ALTER TABLE orders_htx ADD COLUMN purchase_fees_included BOOLEAN;
END IF;

-- Timestamps already exist but ensure proper format
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'created_at') THEN
    ALTER TABLE orders_htx ADD COLUMN created_at TIMESTAMPTZ;
END IF;

-- Complete any existing totals with cents conversion
-- Update comments for clarity
COMMENT ON COLUMN orders_htx.total_cents IS 'Total order amount in cents (from totals.total)';
COMMENT ON COLUMN orders_htx.net_sales_cents IS 'Net sales amount in cents (from totals.netSales)';
COMMENT ON COLUMN orders_htx.fees_cents IS 'Total fees in cents (calculated from various fee fields)';
COMMENT ON COLUMN orders_htx.tax_cents IS 'Total tax amount in cents (from totals.totalTaxes)';
COMMENT ON COLUMN orders_htx.discount_cents IS 'Total discount amount in cents (from totals.discounts)';

COMMENT ON COLUMN orders_htx.subtotal_cents IS 'Subtotal amount in cents (from totals.subtotal)';
COMMENT ON COLUMN orders_htx.gross_sales_cents IS 'Gross sales amount in cents (from totals.grossSales)';
COMMENT ON COLUMN orders_htx.humanitix_fee_cents IS 'Humanitix platform fee in cents (from totals.humanitixFee)';
COMMENT ON COLUMN orders_htx.booking_fee_cents IS 'Booking fee in cents (from totals.bookingFee)';

COMMENT ON COLUMN orders_htx.purchase_total_cents IS 'Purchase total in cents (from purchaseTotals.total)';
COMMENT ON COLUMN orders_htx.purchase_subtotal_cents IS 'Purchase subtotal in cents (from purchaseTotals.subtotal)';
COMMENT ON COLUMN orders_htx.purchase_net_sales_cents IS 'Purchase net sales in cents (from purchaseTotals.netSales)';
COMMENT ON COLUMN orders_htx.purchase_gross_sales_cents IS 'Purchase gross sales in cents (from purchaseTotals.grossSales)';

END $$;