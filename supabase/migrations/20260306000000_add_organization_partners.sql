-- Organization Partners Migration
-- Adds support for organization-level partnerships on recurring series.
-- Org partners grant access to all team members, with optional per-member overrides.

-- ============================================================================
-- 1a. Add partner_organization_id to series_partners
-- ============================================================================

ALTER TABLE series_partners
  ADD COLUMN IF NOT EXISTS partner_organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

-- Exactly one of: partner_profile_id, partner_organization_id, or invited_email
ALTER TABLE series_partners
  DROP CONSTRAINT IF EXISTS series_partners_one_partner_type;

ALTER TABLE series_partners
  ADD CONSTRAINT series_partners_one_partner_type CHECK (
    (partner_profile_id IS NOT NULL AND partner_organization_id IS NULL AND invited_email IS NULL)
    OR (partner_profile_id IS NULL AND partner_organization_id IS NOT NULL AND invited_email IS NULL)
    OR (partner_profile_id IS NULL AND partner_organization_id IS NULL AND invited_email IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_series_partners_org_unique
  ON series_partners(series_id, partner_organization_id)
  WHERE partner_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_series_partners_org_id
  ON series_partners(partner_organization_id);

-- ============================================================================
-- 1b. Add partner_organization_id to event_partners
-- ============================================================================

ALTER TABLE event_partners
  ADD COLUMN IF NOT EXISTS partner_organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_partners_org_unique
  ON event_partners(event_id, partner_organization_id)
  WHERE partner_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_partners_org_id
  ON event_partners(partner_organization_id);

-- ============================================================================
-- 1c. Add 'venue_partner' to partner_type constraints
-- ============================================================================

-- Update series_partners partner_type CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'series_partners_partner_type_check'
  ) THEN
    ALTER TABLE series_partners DROP CONSTRAINT series_partners_partner_type_check;
  END IF;
END $$;

ALTER TABLE series_partners
  ADD CONSTRAINT series_partners_partner_type_check
  CHECK (partner_type IN ('manual', 'deal_participant', 'co_promoter', 'venue_partner'));

-- Update event_partners partner_type CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'event_partners_partner_type_check'
  ) THEN
    ALTER TABLE event_partners DROP CONSTRAINT event_partners_partner_type_check;
  END IF;
END $$;

ALTER TABLE event_partners
  ADD CONSTRAINT event_partners_partner_type_check
  CHECK (partner_type IN ('manual', 'deal_participant', 'co_promoter', 'series_inherited', 'venue_partner'));

-- ============================================================================
-- 1d. Per-member permission overrides table
-- ============================================================================

CREATE TABLE IF NOT EXISTS series_partner_member_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_partner_id UUID NOT NULL REFERENCES series_partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view_details BOOLEAN,
  can_edit_event BOOLEAN,
  can_view_financials BOOLEAN,
  can_manage_financials BOOLEAN,
  can_receive_crm_data BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_partner_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_spmo_series_partner_id
  ON series_partner_member_overrides(series_partner_id);

CREATE INDEX IF NOT EXISTS idx_spmo_user_id
  ON series_partner_member_overrides(user_id);

ALTER TABLE series_partner_member_overrides ENABLE ROW LEVEL SECURITY;

-- RLS: Series creator / admin can manage overrides
CREATE POLICY spmo_select ON series_partner_member_overrides
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM series_partners sp
      JOIN recurring_series rs ON rs.id = sp.series_id
      WHERE sp.id = series_partner_member_overrides.series_partner_id
        AND (rs.created_by = auth.uid() OR is_series_admin(sp.series_id, auth.uid()))
    )
  );

CREATE POLICY spmo_insert ON series_partner_member_overrides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM series_partners sp
      JOIN recurring_series rs ON rs.id = sp.series_id
      WHERE sp.id = series_partner_member_overrides.series_partner_id
        AND (rs.created_by = auth.uid() OR is_series_admin(sp.series_id, auth.uid()))
    )
  );

CREATE POLICY spmo_update ON series_partner_member_overrides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM series_partners sp
      JOIN recurring_series rs ON rs.id = sp.series_id
      WHERE sp.id = series_partner_member_overrides.series_partner_id
        AND (rs.created_by = auth.uid() OR is_series_admin(sp.series_id, auth.uid()))
    )
  );

CREATE POLICY spmo_delete ON series_partner_member_overrides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM series_partners sp
      JOIN recurring_series rs ON rs.id = sp.series_id
      WHERE sp.id = series_partner_member_overrides.series_partner_id
        AND (rs.created_by = auth.uid() OR is_series_admin(sp.series_id, auth.uid()))
    )
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS spmo_updated_at ON series_partner_member_overrides;
CREATE TRIGGER spmo_updated_at
  BEFORE UPDATE ON series_partner_member_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 1e. Update sync trigger to handle org partners
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_series_partners_to_events()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR event_record IN
      SELECT id FROM events WHERE series_id = NEW.series_id
    LOOP
      -- For org partners (partner_profile_id IS NULL), use org unique index
      IF NEW.partner_organization_id IS NOT NULL THEN
        INSERT INTO event_partners (
          event_id, partner_profile_id, partner_organization_id, partner_type, source_deal_id,
          can_view_details, can_edit_event, can_view_financials,
          can_manage_financials, can_receive_crm_data, status, invited_email, added_by
        ) VALUES (
          event_record.id, NULL, NEW.partner_organization_id, 'series_inherited', NULL,
          NEW.can_view_details, NEW.can_edit_event, NEW.can_view_financials,
          NEW.can_manage_financials, NEW.can_receive_crm_data, NEW.status,
          NULL, NEW.added_by
        )
        ON CONFLICT (event_id, partner_organization_id)
          WHERE partner_organization_id IS NOT NULL
        DO UPDATE SET
          can_view_details = EXCLUDED.can_view_details,
          can_edit_event = EXCLUDED.can_edit_event,
          can_view_financials = EXCLUDED.can_view_financials,
          can_manage_financials = EXCLUDED.can_manage_financials,
          can_receive_crm_data = EXCLUDED.can_receive_crm_data,
          status = EXCLUDED.status,
          partner_type = 'series_inherited',
          updated_at = NOW();
      ELSE
        -- Individual partner (existing logic)
        INSERT INTO event_partners (
          event_id, partner_profile_id, partner_type, source_deal_id,
          can_view_details, can_edit_event, can_view_financials,
          can_manage_financials, can_receive_crm_data, status, invited_email, added_by
        ) VALUES (
          event_record.id, NEW.partner_profile_id, 'series_inherited', NULL,
          NEW.can_view_details, NEW.can_edit_event, NEW.can_view_financials,
          NEW.can_manage_financials, NEW.can_receive_crm_data, NEW.status,
          NEW.invited_email, NEW.added_by
        )
        ON CONFLICT (event_id, partner_profile_id)
        DO UPDATE SET
          can_view_details = EXCLUDED.can_view_details,
          can_edit_event = EXCLUDED.can_edit_event,
          can_view_financials = EXCLUDED.can_view_financials,
          can_manage_financials = EXCLUDED.can_manage_financials,
          can_receive_crm_data = EXCLUDED.can_receive_crm_data,
          status = EXCLUDED.status,
          partner_type = 'series_inherited',
          updated_at = NOW();
      END IF;
    END LOOP;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.partner_organization_id IS NOT NULL THEN
      UPDATE event_partners
      SET
        can_view_details = NEW.can_view_details,
        can_edit_event = NEW.can_edit_event,
        can_view_financials = NEW.can_view_financials,
        can_manage_financials = NEW.can_manage_financials,
        can_receive_crm_data = NEW.can_receive_crm_data,
        status = NEW.status,
        updated_at = NOW()
      WHERE partner_organization_id = NEW.partner_organization_id
        AND partner_type = 'series_inherited'
        AND event_id IN (SELECT id FROM events WHERE series_id = NEW.series_id);
    ELSE
      UPDATE event_partners
      SET
        can_view_details = NEW.can_view_details,
        can_edit_event = NEW.can_edit_event,
        can_view_financials = NEW.can_view_financials,
        can_manage_financials = NEW.can_manage_financials,
        can_receive_crm_data = NEW.can_receive_crm_data,
        status = NEW.status,
        updated_at = NOW()
      WHERE partner_profile_id = NEW.partner_profile_id
        AND partner_type = 'series_inherited'
        AND event_id IN (SELECT id FROM events WHERE series_id = NEW.series_id);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.partner_organization_id IS NOT NULL THEN
      DELETE FROM event_partners
      WHERE partner_organization_id = OLD.partner_organization_id
        AND partner_type = 'series_inherited'
        AND event_id IN (SELECT id FROM events WHERE series_id = OLD.series_id);
    ELSE
      DELETE FROM event_partners
      WHERE partner_profile_id = OLD.partner_profile_id
        AND partner_type = 'series_inherited'
        AND event_id IN (SELECT id FROM events WHERE series_id = OLD.series_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the event join trigger to handle org partners
CREATE OR REPLACE FUNCTION inherit_series_partners_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.series_id IS NOT NULL AND
      (OLD.series_id IS NULL OR OLD.series_id != NEW.series_id)) OR
     (TG_OP = 'INSERT' AND NEW.series_id IS NOT NULL) THEN

    -- Insert individual partners
    INSERT INTO event_partners (
      event_id, partner_profile_id, partner_type, source_deal_id,
      can_view_details, can_edit_event, can_view_financials,
      can_manage_financials, can_receive_crm_data, status, invited_email, added_by
    )
    SELECT
      NEW.id, sp.partner_profile_id, 'series_inherited', NULL,
      sp.can_view_details, sp.can_edit_event, sp.can_view_financials,
      sp.can_manage_financials, sp.can_receive_crm_data, sp.status,
      sp.invited_email, sp.added_by
    FROM series_partners sp
    WHERE sp.series_id = NEW.series_id AND sp.status = 'active'
      AND sp.partner_profile_id IS NOT NULL
    ON CONFLICT (event_id, partner_profile_id)
    DO UPDATE SET
      partner_type = 'series_inherited',
      can_view_details = EXCLUDED.can_view_details,
      can_edit_event = EXCLUDED.can_edit_event,
      can_view_financials = EXCLUDED.can_view_financials,
      can_manage_financials = EXCLUDED.can_manage_financials,
      can_receive_crm_data = EXCLUDED.can_receive_crm_data,
      status = EXCLUDED.status,
      updated_at = NOW();

    -- Insert org partners
    INSERT INTO event_partners (
      event_id, partner_organization_id, partner_type, source_deal_id,
      can_view_details, can_edit_event, can_view_financials,
      can_manage_financials, can_receive_crm_data, status, added_by
    )
    SELECT
      NEW.id, sp.partner_organization_id, 'series_inherited', NULL,
      sp.can_view_details, sp.can_edit_event, sp.can_view_financials,
      sp.can_manage_financials, sp.can_receive_crm_data, sp.status,
      sp.added_by
    FROM series_partners sp
    WHERE sp.series_id = NEW.series_id AND sp.status = 'active'
      AND sp.partner_organization_id IS NOT NULL
    ON CONFLICT (event_id, partner_organization_id)
      WHERE partner_organization_id IS NOT NULL
    DO UPDATE SET
      partner_type = 'series_inherited',
      can_view_details = EXCLUDED.can_view_details,
      can_edit_event = EXCLUDED.can_edit_event,
      can_view_financials = EXCLUDED.can_view_financials,
      can_manage_financials = EXCLUDED.can_manage_financials,
      can_receive_crm_data = EXCLUDED.can_receive_crm_data,
      status = EXCLUDED.status,
      updated_at = NOW();
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.series_id IS NOT NULL AND
     (NEW.series_id IS NULL OR NEW.series_id != OLD.series_id) THEN
    DELETE FROM event_partners
    WHERE event_id = NEW.id AND partner_type = 'series_inherited';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1f. Access-resolution function for org member partner check
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_member_series_partner(p_series_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM series_partners sp
    JOIN organization_team_members otm ON otm.organization_id = sp.partner_organization_id
    WHERE sp.series_id = p_series_id AND otm.user_id = p_user_id AND sp.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM series_partners sp
    JOIN organization_profiles op ON op.id = sp.partner_organization_id
    WHERE sp.series_id = p_series_id AND op.owner_id = p_user_id AND sp.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Similar function for event-level check
CREATE OR REPLACE FUNCTION is_org_member_event_partner(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_partners ep
    JOIN organization_team_members otm ON otm.organization_id = ep.partner_organization_id
    WHERE ep.event_id = p_event_id AND otm.user_id = p_user_id AND ep.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM event_partners ep
    JOIN organization_profiles op ON op.id = ep.partner_organization_id
    WHERE ep.event_id = p_event_id AND op.owner_id = p_user_id AND ep.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 1g. Update RLS policies to include org member access
-- ============================================================================

-- Update recurring_series SELECT policy
DROP POLICY IF EXISTS recurring_series_select ON recurring_series;
CREATE POLICY recurring_series_select ON recurring_series
  FOR SELECT USING (
    created_by = auth.uid()
    OR is_series_partner(id, auth.uid())
    OR is_org_member_series_partner(id, auth.uid())
  );

-- Update series_partners SELECT policy
DROP POLICY IF EXISTS series_partners_select ON series_partners;
CREATE POLICY series_partners_select ON series_partners
  FOR SELECT USING (
    is_series_creator(series_id, auth.uid())
    OR partner_profile_id = auth.uid()
    OR is_org_member_series_partner(series_id, auth.uid())
  );

-- Update event partner view policy to include org members
DROP POLICY IF EXISTS partners_view_partner_events ON events;
CREATE POLICY partners_view_partner_events ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_partners
      WHERE event_id = events.id
      AND partner_profile_id = auth.uid()
      AND status = 'active'
    )
    OR is_org_member_event_partner(events.id, auth.uid())
  );

-- ============================================================================
-- 1h. Add 'venue_manager' to organization_team_members manager_type constraint
-- ============================================================================

DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE organization_team_members
    DROP CONSTRAINT IF EXISTS organization_team_members_manager_type_check;

  -- Re-add with venue_manager included
  ALTER TABLE organization_team_members
    ADD CONSTRAINT organization_team_members_manager_type_check
    CHECK (manager_type IS NULL OR manager_type IN (
      'general',
      'comedian_manager',
      'social_media',
      'tour_manager',
      'booking_manager',
      'content_manager',
      'financial_manager',
      'venue_manager'
    ));
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN series_partners.partner_organization_id IS 'Organization partner. When set, all org team members inherit partner access.';
COMMENT ON TABLE series_partner_member_overrides IS 'Per-member permission overrides for org-level partners. NULL values inherit from the org partner.';
COMMENT ON FUNCTION is_org_member_series_partner IS 'Check if user is a team member or owner of an org that is an active series partner.';
