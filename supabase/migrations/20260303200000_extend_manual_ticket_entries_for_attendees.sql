-- Migration: Extend manual_ticket_entries for individual attendee tracking
-- Adds attendee fields (name, email, booking reference) and session linking
-- to support automated email scraping from SFF, Promotix, FEVER etc.
-- Also adds Show Film First and Promotix as ticketing partners.

-- 1. Add attendee fields to manual_ticket_entries
ALTER TABLE public.manual_ticket_entries
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS booking_reference TEXT,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- 2. Add unique constraint on booking_reference to prevent duplicate imports
-- Partial index: only enforce uniqueness when booking_reference is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_ticket_entries_booking_reference
  ON public.manual_ticket_entries(booking_reference)
  WHERE booking_reference IS NOT NULL;

-- 3. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_session_id
  ON public.manual_ticket_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_email
  ON public.manual_ticket_entries(email);
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_customer_id
  ON public.manual_ticket_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_source
  ON public.manual_ticket_entries(source);

-- 4. Ensure SFF and Promotix partners exist (they may already be present)
-- SFF uses slug 'SFF' in production
INSERT INTO public.ticketing_partners (name, slug, website_url, commission_rate, is_system) VALUES
  ('Show Film First', 'SFF', 'https://www.showfilmfirst.com', 0.00, true),
  ('Promotix', 'promotix', 'https://www.promotix.com.au', 0.00, true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Add RLS policy for n8n service role inserts
-- The service_role key bypasses RLS, but for completeness add a policy
-- that allows inserts where source is 'n8n' (automated imports)
CREATE POLICY "Service can insert automated ticket entries"
  ON public.manual_ticket_entries
  FOR INSERT
  WITH CHECK (
    source IN ('n8n', 'api', 'automation')
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = manual_ticket_entries.event_id
      AND events.promoter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Drop the old insert policy and replace it (the new one above is a superset)
DROP POLICY IF EXISTS "Event owners can insert manual ticket entries" ON public.manual_ticket_entries;

-- 6. Comment on columns for documentation
COMMENT ON COLUMN public.manual_ticket_entries.session_id IS 'Links to a specific session within the event';
COMMENT ON COLUMN public.manual_ticket_entries.first_name IS 'Attendee first name (from ticket provider)';
COMMENT ON COLUMN public.manual_ticket_entries.last_name IS 'Attendee last name (from ticket provider)';
COMMENT ON COLUMN public.manual_ticket_entries.email IS 'Attendee email (from ticket provider, used for CRM matching)';
COMMENT ON COLUMN public.manual_ticket_entries.booking_reference IS 'Unique booking/order reference from the ticket provider (e.g. SHF-3569-5151-471493-WT1FE2)';
COMMENT ON COLUMN public.manual_ticket_entries.customer_id IS 'FK to customers table, set when attendee is matched/created in CRM';
COMMENT ON COLUMN public.manual_ticket_entries.source IS 'How this entry was created: manual, n8n, api, automation';
