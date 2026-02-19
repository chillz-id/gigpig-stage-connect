-- Fix conflicting invoice_type constraints
-- There were two constraints on invoice_type:
-- 1. check_invoice_type - only allowed 'promoter', 'comedian', 'other' (outdated)
-- 2. invoices_invoice_type_check - allows all types including 'receivable' and 'payable'
-- This migration removes the outdated constraint

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS check_invoice_type;

-- Ensure the correct constraint exists
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_type_check
  CHECK (invoice_type IN ('promoter', 'comedian', 'other', 'receivable', 'payable'));

COMMENT ON COLUMN invoices.invoice_type IS 'Type: receivable (you send), payable (you receive), or legacy types (promoter, comedian, other)';
