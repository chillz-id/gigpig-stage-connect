-- ============================================================================
-- Fix P1/P0 Security Issues: Add WITH CHECK to RLS UPDATE policies
-- ============================================================================
-- Created: 2025-10-29
-- Issues:
--   1. P1: event_deals UPDATE policy missing WITH CHECK - allows changing event_id
--          to other organizers' events
--   2. P1: deal_participants "Deal creators can update participants" policy missing
--          WITH CHECK - allows changing deal_id to other deals
--
-- Fix: Add WITH CHECK clauses to validate updated rows remain scoped correctly
--
-- Related: PR #15 review comments from chatgpt-codex-connector
-- ============================================================================

-- Drop existing vulnerable UPDATE policies
DROP POLICY IF EXISTS "Event owners can update deals for their events" ON public.event_deals;
DROP POLICY IF EXISTS "Deal creators and event owners can update deals" ON public.event_deals;

-- Recreate UPDATE policy with WITH CHECK for security
CREATE POLICY "Deal creators and event owners can update deals"
ON public.event_deals
FOR UPDATE
USING (
  -- Can target rows where user is event owner or deal creator
  auth.uid() IN (
    SELECT promoter_id FROM public.events WHERE id = event_deals.event_id
    UNION
    SELECT created_by FROM public.event_deals WHERE id = event_deals.id
  )
)
WITH CHECK (
  -- Updated row must still belong to user's events
  auth.uid() IN (
    SELECT promoter_id FROM public.events WHERE id = event_deals.event_id
    UNION
    SELECT created_by FROM public.event_deals WHERE id = event_deals.id
  )
);

COMMENT ON POLICY "Deal creators and event owners can update deals" ON public.event_deals IS
  'P1 Security Fix: WITH CHECK prevents users from updating event_id to reference events they do not own. Without this, users could write data into other organizers records by changing event_id during UPDATE.';

-- ============================================================================
-- Fix 2: deal_participants UPDATE policy
-- ============================================================================

-- Drop existing vulnerable UPDATE policy
DROP POLICY IF EXISTS "Deal creators can update participants" ON public.deal_participants;

-- Recreate UPDATE policy with WITH CHECK for security
CREATE POLICY "Deal creators can update participants"
ON public.deal_participants
FOR UPDATE
USING (
  -- Can target rows where user is deal creator
  auth.uid() IN (
    SELECT created_by FROM public.event_deals WHERE id = deal_participants.deal_id
  )
)
WITH CHECK (
  -- Updated row must still belong to user's deals
  auth.uid() IN (
    SELECT created_by FROM public.event_deals WHERE id = deal_participants.deal_id
  )
);

COMMENT ON POLICY "Deal creators can update participants" ON public.deal_participants IS
  'P1 Security Fix: WITH CHECK prevents users from updating deal_id to reference other deals they do not own. Without this, users could reassign participants to any deal by changing deal_id during UPDATE.';
