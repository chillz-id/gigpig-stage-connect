-- Migration: Add status column to manual_ticket_entries
-- Supports order lifecycle: confirmed, cancelled, modified
-- Used by n8n workflows to handle cancellations from GYG, FEVER, Groupon etc.

-- 1. Add status column with default 'confirmed'
ALTER TABLE public.manual_ticket_entries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';

-- 2. Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_status
  ON public.manual_ticket_entries(status);

-- 3. Add cancelled_at timestamp for audit trail
ALTER TABLE public.manual_ticket_entries
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 4. Comment on columns
COMMENT ON COLUMN public.manual_ticket_entries.status IS 'Order status: confirmed, cancelled, modified. Updated by n8n workflows when cancellation emails are received.';
COMMENT ON COLUMN public.manual_ticket_entries.cancelled_at IS 'Timestamp when the order was cancelled, set by n8n cancellation workflow.';
