-- ============================================================================
-- Fix P1 Security Issue: Add WITH CHECK to event_deals UPDATE policy
-- ============================================================================
-- Created: 2025-10-29
-- Issue: UPDATE policy on event_deals only has USING clause, allowing users to
--        update event_id to reference events they don't own, effectively writing
--        data into another organizer's records.
--
-- Fix: Add WITH CHECK clause to validate updated rows remain scoped to caller's events
--
-- Related: PR #15 review comment from chatgpt-codex-connector
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
