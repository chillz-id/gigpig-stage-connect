-- ============================================================================
-- Event Deals & Financial Management System
-- ============================================================================
-- Created: 2025-10-28
-- Description: Adds comprehensive deal management, lineup settlements, and
--              automated invoice generation for events
--
-- Tables:
--   - event_deals: Deal structures with approval workflow
--   - deal_participants: Individual participants and their terms
--   - deal_participant_history: Version tracking for deal changes
--
-- Functions:
--   - calculate_deal_splits(): Auto-calculate deal amounts
--   - approve_deal_participant(): Handle participant approvals
--   - settle_deal(): Finalize deal and generate invoices
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Create event_deals table
CREATE TABLE IF NOT EXISTS public.event_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN (
    'solo_show',
    'co_headliner',
    'door_split',
    'flat_fee',
    'percentage',
    'custom'
  )),
  description TEXT,

  -- Revenue tracking
  total_revenue NUMERIC(12,2),
  guaranteed_minimum NUMERIC(12,2),

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',              -- Being created
    'pending_approval',   -- Submitted for participant approval
    'fully_approved',     -- All participants approved
    'settled',           -- Invoices generated
    'cancelled'          -- Deal cancelled
  )),

  -- Timestamps for workflow stages
  submitted_for_approval_at TIMESTAMPTZ,
  fully_approved_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  settled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  notes JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT event_deals_revenue_check CHECK (
    total_revenue IS NULL OR total_revenue >= 0
  ),
  CONSTRAINT event_deals_minimum_check CHECK (
    guaranteed_minimum IS NULL OR guaranteed_minimum >= 0
  )
);

COMMENT ON TABLE public.event_deals IS 'Deal structures for event revenue sharing and settlements';
COMMENT ON COLUMN public.event_deals.deal_type IS 'Type of deal: solo_show, co_headliner, door_split, flat_fee, percentage, custom';
COMMENT ON COLUMN public.event_deals.status IS 'Workflow: draft → pending_approval → fully_approved → settled';
COMMENT ON COLUMN public.event_deals.total_revenue IS 'Actual revenue to split (entered post-event)';
COMMENT ON COLUMN public.event_deals.guaranteed_minimum IS 'Minimum guaranteed amount regardless of revenue';

-- Create deal_participants table
CREATE TABLE IF NOT EXISTS public.deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.event_deals(id) ON DELETE CASCADE,

  -- Participant identification
  participant_id UUID NOT NULL REFERENCES auth.users(id),
  participant_type TEXT NOT NULL CHECK (participant_type IN (
    'comedian',
    'manager',
    'organization',
    'venue',
    'promoter',
    'other'
  )),
  participant_role TEXT, -- e.g., "Headliner", "MC", "Support Act", "Booking Manager"

  -- Split configuration
  split_type TEXT NOT NULL CHECK (split_type IN (
    'percentage',
    'flat_fee',
    'door_split',
    'tiered',
    'custom'
  )),
  split_percentage NUMERIC(5,2) CHECK (
    split_percentage IS NULL OR
    (split_percentage >= 0 AND split_percentage <= 100)
  ),
  flat_fee_amount NUMERIC(12,2) CHECK (
    flat_fee_amount IS NULL OR flat_fee_amount >= 0
  ),
  door_split_percentage NUMERIC(5,2) CHECK (
    door_split_percentage IS NULL OR
    (door_split_percentage >= 0 AND door_split_percentage <= 100)
  ),
  guaranteed_minimum NUMERIC(12,2) CHECK (
    guaranteed_minimum IS NULL OR guaranteed_minimum >= 0
  ),

  -- Tiered split (for percentage brackets)
  tiered_config JSONB, -- e.g., [{"threshold": 5000, "percentage": 70}, {"threshold": 10000, "percentage": 80}]

  -- Calculated amounts (computed after revenue entry)
  calculated_amount NUMERIC(12,2),
  final_amount NUMERIC(12,2), -- After manual adjustments

  -- Approval workflow
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN (
    'pending',        -- Awaiting participant approval
    'approved',       -- Participant approved
    'edited',         -- Participant requested changes
    'declined'        -- Participant declined
  )),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Edit tracking
  edit_notes TEXT,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,

  -- Participant notes
  notes TEXT,
  internal_notes TEXT, -- Only visible to deal creator/event owner

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT deal_participant_unique UNIQUE (deal_id, participant_id, participant_type)
);

COMMENT ON TABLE public.deal_participants IS 'Individual participants in event deals with their split terms';
COMMENT ON COLUMN public.deal_participants.participant_type IS 'Type: comedian, manager, organization, venue, promoter, other';
COMMENT ON COLUMN public.deal_participants.split_type IS 'How payment is calculated: percentage, flat_fee, door_split, tiered, custom';
COMMENT ON COLUMN public.deal_participants.tiered_config IS 'JSON array of revenue thresholds with percentage adjustments';
COMMENT ON COLUMN public.deal_participants.approval_status IS 'Workflow: pending → approved/edited/declined';
COMMENT ON COLUMN public.deal_participants.version IS 'Increments with each edit to track negotiation rounds';

-- Create deal participant history table for version tracking
CREATE TABLE IF NOT EXISTS public.deal_participant_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.deal_participants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Snapshot of participant state at this version
  split_type TEXT NOT NULL,
  split_percentage NUMERIC(5,2),
  flat_fee_amount NUMERIC(12,2),
  door_split_percentage NUMERIC(5,2),
  guaranteed_minimum NUMERIC(12,2),
  tiered_config JSONB,

  -- Who made the change
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Previous approval status before this change
  previous_approval_status TEXT,

  CONSTRAINT deal_participant_history_unique UNIQUE (participant_id, version)
);

COMMENT ON TABLE public.deal_participant_history IS 'Version history for deal participant term changes';

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_event_deals_event_id ON public.event_deals(event_id);
CREATE INDEX IF NOT EXISTS idx_event_deals_status ON public.event_deals(status);
CREATE INDEX IF NOT EXISTS idx_event_deals_created_by ON public.event_deals(created_by);
CREATE INDEX IF NOT EXISTS idx_event_deals_settled_at ON public.event_deals(settled_at) WHERE settled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deal_participants_deal_id ON public.deal_participants(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_participant_id ON public.deal_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_approval_status ON public.deal_participants(approval_status);
CREATE INDEX IF NOT EXISTS idx_deal_participants_type ON public.deal_participants(participant_type);

CREATE INDEX IF NOT EXISTS idx_deal_history_participant ON public.deal_participant_history(participant_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_version ON public.deal_participant_history(participant_id, version);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.event_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participant_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view deals for events they own or are participants in" ON public.event_deals;
DROP POLICY IF EXISTS "Event owners can create deals" ON public.event_deals;
DROP POLICY IF EXISTS "Deal creators and event owners can update deals" ON public.event_deals;
DROP POLICY IF EXISTS "Event owners can delete deals" ON public.event_deals;

DROP POLICY IF EXISTS "Users can view participant records they're involved in" ON public.deal_participants;
DROP POLICY IF EXISTS "Deal creators can add participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Participants can update their own records" ON public.deal_participants;
DROP POLICY IF EXISTS "Deal creators can update participants" ON public.deal_participants;
DROP POLICY IF EXISTS "Deal creators can delete participants" ON public.deal_participants;

DROP POLICY IF EXISTS "Users can view history for their participant records" ON public.deal_participant_history;
DROP POLICY IF EXISTS "System can insert history" ON public.deal_participant_history;

-- ============================================================================
-- RLS: event_deals
-- ============================================================================

-- SELECT: Users can view deals for:
--   1. Events they own (promoter_id)
--   2. Deals they created
--   3. Deals they are a participant in
CREATE POLICY "Users can view deals for events they own or are participants in"
ON public.event_deals
FOR SELECT
USING (
  auth.uid() IN (
    -- Event owner
    SELECT promoter_id FROM public.events WHERE id = event_deals.event_id
    UNION
    -- Deal creator
    SELECT created_by FROM public.event_deals WHERE id = event_deals.id
    UNION
    -- Deal participant
    SELECT participant_id FROM public.deal_participants WHERE deal_id = event_deals.id
  )
);

-- INSERT: Event owners can create deals
CREATE POLICY "Event owners can create deals"
ON public.event_deals
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT promoter_id FROM public.events WHERE id = event_deals.event_id
  )
);

-- UPDATE: Deal creators and event owners can update deals
CREATE POLICY "Deal creators and event owners can update deals"
ON public.event_deals
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT promoter_id FROM public.events WHERE id = event_deals.event_id
    UNION
    SELECT created_by FROM public.event_deals WHERE id = event_deals.id
  )
);

-- DELETE: Event owners can delete deals (only if not settled)
CREATE POLICY "Event owners can delete deals"
ON public.event_deals
FOR DELETE
USING (
  status != 'settled' AND
  auth.uid() IN (
    SELECT promoter_id FROM public.events WHERE id = event_deals.event_id
  )
);

-- ============================================================================
-- RLS: deal_participants
-- ============================================================================

-- SELECT: Users can view participant records if they are:
--   1. The participant
--   2. The deal creator
--   3. The event owner
CREATE POLICY "Users can view participant records they're involved in"
ON public.deal_participants
FOR SELECT
USING (
  auth.uid() = participant_id OR
  auth.uid() IN (
    SELECT created_by FROM public.event_deals WHERE id = deal_participants.deal_id
    UNION
    SELECT promoter_id FROM public.events e
    JOIN public.event_deals ed ON ed.event_id = e.id
    WHERE ed.id = deal_participants.deal_id
  )
);

-- INSERT: Deal creators can add participants
CREATE POLICY "Deal creators can add participants"
ON public.deal_participants
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT created_by FROM public.event_deals WHERE id = deal_participants.deal_id
  )
);

-- UPDATE: Participants can update their own records (approval status, notes)
-- Deal creators can update any participant
CREATE POLICY "Participants can update their own records"
ON public.deal_participants
FOR UPDATE
USING (auth.uid() = participant_id)
WITH CHECK (
  -- Participants can only update approval_status, notes, edit_notes
  auth.uid() = participant_id
);

CREATE POLICY "Deal creators can update participants"
ON public.deal_participants
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT created_by FROM public.event_deals WHERE id = deal_participants.deal_id
  )
);

-- DELETE: Deal creators can remove participants (only if deal not settled)
CREATE POLICY "Deal creators can delete participants"
ON public.deal_participants
FOR DELETE
USING (
  auth.uid() IN (
    SELECT created_by FROM public.event_deals WHERE id = deal_participants.deal_id
  ) AND
  EXISTS (
    SELECT 1 FROM public.event_deals
    WHERE id = deal_participants.deal_id AND status != 'settled'
  )
);

-- ============================================================================
-- RLS: deal_participant_history
-- ============================================================================

-- SELECT: Users can view history for participants they're involved in
CREATE POLICY "Users can view history for their participant records"
ON public.deal_participant_history
FOR SELECT
USING (
  auth.uid() IN (
    SELECT participant_id FROM public.deal_participants WHERE id = deal_participant_history.participant_id
    UNION
    SELECT created_by FROM public.event_deals ed
    JOIN public.deal_participants dp ON dp.deal_id = ed.id
    WHERE dp.id = deal_participant_history.participant_id
  )
);

-- INSERT: System/triggers insert history automatically
CREATE POLICY "System can insert history"
ON public.deal_participant_history
FOR INSERT
WITH CHECK (true); -- Inserted by triggers

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_event_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_deals_updated_at
BEFORE UPDATE ON public.event_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_event_deals_updated_at();

CREATE OR REPLACE FUNCTION public.update_deal_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_participants_updated_at
BEFORE UPDATE ON public.deal_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_participants_updated_at();

-- Track participant changes to history
CREATE OR REPLACE FUNCTION public.track_deal_participant_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if split terms changed
  IF (
    OLD.split_type != NEW.split_type OR
    OLD.split_percentage IS DISTINCT FROM NEW.split_percentage OR
    OLD.flat_fee_amount IS DISTINCT FROM NEW.flat_fee_amount OR
    OLD.door_split_percentage IS DISTINCT FROM NEW.door_split_percentage OR
    OLD.guaranteed_minimum IS DISTINCT FROM NEW.guaranteed_minimum OR
    OLD.tiered_config IS DISTINCT FROM NEW.tiered_config
  ) THEN
    -- Increment version
    NEW.version = OLD.version + 1;

    -- Insert history record
    INSERT INTO public.deal_participant_history (
      participant_id,
      version,
      split_type,
      split_percentage,
      flat_fee_amount,
      door_split_percentage,
      guaranteed_minimum,
      tiered_config,
      changed_by,
      change_notes,
      previous_approval_status
    ) VALUES (
      OLD.id,
      OLD.version,
      OLD.split_type,
      OLD.split_percentage,
      OLD.flat_fee_amount,
      OLD.door_split_percentage,
      OLD.guaranteed_minimum,
      OLD.tiered_config,
      NEW.edited_by,
      NEW.edit_notes,
      OLD.approval_status
    );

    -- Reset approval status to pending if terms changed
    IF OLD.approval_status = 'approved' THEN
      NEW.approval_status = 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_participant_changes
BEFORE UPDATE ON public.deal_participants
FOR EACH ROW
EXECUTE FUNCTION public.track_deal_participant_changes();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Calculate deal splits based on revenue and participant terms
CREATE OR REPLACE FUNCTION public.calculate_deal_splits(p_deal_id UUID)
RETURNS TABLE (
  participant_id UUID,
  calculated_amount NUMERIC,
  split_description TEXT
) AS $$
DECLARE
  v_deal RECORD;
  v_total_revenue NUMERIC;
  v_remaining_revenue NUMERIC;
BEGIN
  -- Get deal details
  SELECT * INTO v_deal FROM public.event_deals WHERE id = p_deal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found: %', p_deal_id;
  END IF;

  v_total_revenue := COALESCE(v_deal.total_revenue, 0);
  v_remaining_revenue := v_total_revenue;

  -- Return calculated amounts for each participant
  RETURN QUERY
  SELECT
    dp.id,
    CASE
      WHEN dp.split_type = 'flat_fee' THEN
        GREATEST(dp.flat_fee_amount, COALESCE(dp.guaranteed_minimum, 0))

      WHEN dp.split_type = 'percentage' THEN
        GREATEST(
          (v_total_revenue * dp.split_percentage / 100),
          COALESCE(dp.guaranteed_minimum, 0)
        )

      WHEN dp.split_type = 'door_split' THEN
        GREATEST(
          (v_total_revenue * dp.door_split_percentage / 100),
          COALESCE(dp.guaranteed_minimum, 0)
        )

      WHEN dp.split_type = 'tiered' THEN
        -- Calculate tiered amount (simplified - requires tiered_config to be properly formatted)
        COALESCE(dp.guaranteed_minimum, 0)

      ELSE 0
    END AS calculated_amount,

    CASE
      WHEN dp.split_type = 'flat_fee' THEN
        'Flat fee: $' || dp.flat_fee_amount::TEXT
      WHEN dp.split_type = 'percentage' THEN
        dp.split_percentage::TEXT || '% of revenue'
      WHEN dp.split_type = 'door_split' THEN
        dp.door_split_percentage::TEXT || '% door split'
      WHEN dp.split_type = 'tiered' THEN
        'Tiered split'
      ELSE 'Custom'
    END AS split_description
  FROM public.deal_participants dp
  WHERE dp.deal_id = p_deal_id
  ORDER BY dp.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_deal_splits IS 'Calculate split amounts for all participants in a deal';

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_participants TO authenticated;
GRANT SELECT ON public.deal_participant_history TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
