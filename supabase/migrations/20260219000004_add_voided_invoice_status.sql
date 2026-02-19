-- Add 'voided' to allowed invoice statuses
-- This allows sent invoices to be voided instead of deleted

-- Drop the existing check constraint
ALTER TABLE invoices
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add new check constraint with 'voided' included
ALTER TABLE invoices
ADD CONSTRAINT invoices_status_check
CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'voided', 'cancelled'));

-- Add index for voided invoices lookup
CREATE INDEX IF NOT EXISTS idx_invoices_voided
ON invoices(id) WHERE status = 'voided';

COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, paid, overdue, voided, cancelled';
