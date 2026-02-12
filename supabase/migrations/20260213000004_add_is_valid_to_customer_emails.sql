-- Add is_valid flag to customer_emails for bounce tracking
ALTER TABLE customer_emails ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_customer_emails_is_valid ON customer_emails(is_valid) WHERE is_valid = false;

COMMENT ON COLUMN customer_emails.is_valid IS 'Set to false after 3+ bounces from Mautic. Used to suppress sends to invalid addresses.';
