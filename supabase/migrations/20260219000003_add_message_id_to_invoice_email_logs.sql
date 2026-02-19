-- Add message_id column to invoice_email_logs for tracking SES message IDs
ALTER TABLE invoice_email_logs
ADD COLUMN IF NOT EXISTS message_id TEXT;

COMMENT ON COLUMN invoice_email_logs.message_id IS 'AWS SES Message ID for tracking delivery status';

-- Add index for message_id lookups
CREATE INDEX IF NOT EXISTS idx_invoice_email_logs_message_id
ON invoice_email_logs(message_id)
WHERE message_id IS NOT NULL;
