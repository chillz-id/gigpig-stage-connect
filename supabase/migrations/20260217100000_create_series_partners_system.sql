-- Series Partners & Deals Migration
-- Creates tables for managing partners and deals at the series level
-- Partners are synced (copied) to event_partners with partner_type = 'series_inherited'

-- ============================================================================
-- RECURRING SERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID,
  default_venue TEXT,
  default_ticket_price NUMERIC(10,2),
  default_start_time TIME,
  default_end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_series_created_by ON recurring_series(created_by);
CREATE INDEX IF NOT EXISTS idx_recurring_series_organization_id ON recurring_series(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_series_is_active ON recurring_series(is_active);

-- Backfill from existing events with series_id
INSERT INTO recurring_series (id, name, created_by)
SELECT
  sub.series_id,
  sub.series_name,
  sub.promoter_id
FROM (
  SELECT DISTINCT ON (e.series_id)
    e.series_id,
    COALESCE(
      regexp_replace(e.title, '\s*-\s*\d+.*$', '', 'g'),
      'Unnamed Series'
    ) as series_name,
    e.promoter_id
  FROM events e
  WHERE e.series_id IS NOT NULL
  ORDER BY e.series_id, e.created_at ASC
) sub
ON CONFLICT (id) DO NOTHING;

-- Add foreign key from events to recurring_series
ALTER TABLE events
ADD CONSTRAINT events_series_id_fkey
FOREIGN KEY (series_id) REFERENCES recurring_series(id)
ON DELETE SET NULL;

-- ============================================================================
-- SERIES PARTNERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS series_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES recurring_series(id) ON DELETE CASCADE,
  partner_profile_id UUID REFERENCES auth.users(id),
  partner_type TEXT DEFAULT 'manual' CHECK (partner_type IN ('manual', 'deal_participant', 'co_promoter')),
  is_admin BOOLEAN DEFAULT false,
  can_view_details BOOLEAN DEFAULT true,
  can_edit_event BOOLEAN DEFAULT false,
  can_view_financials BOOLEAN DEFAULT false,
  can_manage_financials BOOLEAN DEFAULT false,
  can_receive_crm_data BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending_invite', 'active', 'inactive')),
  invited_email TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_id, partner_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_series_partners_series_id ON series_partners(series_id);
CREATE INDEX IF NOT EXISTS idx_series_partners_partner_profile_id ON series_partners(partner_profile_id);
CREATE INDEX IF NOT EXISTS idx_series_partners_status ON series_partners(status);
CREATE INDEX IF NOT EXISTS idx_series_partners_admin ON series_partners(series_id, partner_profile_id) WHERE is_admin = true;

-- ============================================================================
-- SERIES DEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS series_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES recurring_series(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deal_type TEXT CHECK (deal_type IN ('revenue_share', 'fixed_split', 'tiered', 'custom')),
  status TEXT DEFAULT 'draft',
  apply_to_all_events BOOLEAN DEFAULT true,
  apply_to_future_only BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_deals_series_id ON series_deals(series_id);
CREATE INDEX IF NOT EXISTS idx_series_deals_status ON series_deals(status);
CREATE INDEX IF NOT EXISTS idx_series_deals_created_by ON series_deals(created_by);

-- ============================================================================
-- UPDATE EVENT_PARTNERS CONSTRAINT TO ALLOW 'series_inherited'
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'event_partners_partner_type_check'
  ) THEN
    ALTER TABLE event_partners DROP CONSTRAINT event_partners_partner_type_check;
  END IF;

  ALTER TABLE event_partners
    ADD CONSTRAINT event_partners_partner_type_check
    CHECK (partner_type IN ('manual', 'deal_participant', 'co_promoter', 'series_inherited'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add unique constraint for ON CONFLICT in sync triggers
ALTER TABLE event_partners
ADD CONSTRAINT event_partners_event_id_partner_profile_id_key
UNIQUE (event_id, partner_profile_id);

-- ============================================================================
-- SYNC TRIGGER: SERIES_PARTNERS -> EVENT_PARTNERS
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
    END LOOP;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
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
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM event_partners
    WHERE partner_profile_id = OLD.partner_profile_id
      AND partner_type = 'series_inherited'
      AND event_id IN (SELECT id FROM events WHERE series_id = OLD.series_id);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_series_partners ON series_partners;
CREATE TRIGGER trigger_sync_series_partners
  AFTER INSERT OR UPDATE OR DELETE ON series_partners
  FOR EACH ROW
  EXECUTE FUNCTION sync_series_partners_to_events();

-- ============================================================================
-- SYNC TRIGGER: EVENT.SERIES_ID CHANGE -> INHERIT PARTNERS
-- ============================================================================

CREATE OR REPLACE FUNCTION inherit_series_partners_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.series_id IS NOT NULL AND
      (OLD.series_id IS NULL OR OLD.series_id != NEW.series_id)) OR
     (TG_OP = 'INSERT' AND NEW.series_id IS NOT NULL) THEN

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
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.series_id IS NOT NULL AND
     (NEW.series_id IS NULL OR NEW.series_id != OLD.series_id) THEN
    DELETE FROM event_partners
    WHERE event_id = NEW.id AND partner_type = 'series_inherited';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_inherit_series_partners ON events;
CREATE TRIGGER trigger_inherit_series_partners
  AFTER INSERT OR UPDATE OF series_id ON events
  FOR EACH ROW
  EXECUTE FUNCTION inherit_series_partners_on_event_join();

-- ============================================================================
-- ROW LEVEL SECURITY HELPER FUNCTIONS
-- These use SECURITY DEFINER to avoid circular RLS dependencies
-- ============================================================================

-- Check if user is the creator of a series (bypasses RLS)
CREATE OR REPLACE FUNCTION is_series_creator(p_series_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM recurring_series
    WHERE id = p_series_id
      AND created_by = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is an active partner on a series (bypasses RLS)
CREATE OR REPLACE FUNCTION is_series_partner(p_series_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM series_partners
    WHERE series_id = p_series_id
      AND partner_profile_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is an admin partner on a series (bypasses RLS)
CREATE OR REPLACE FUNCTION is_series_admin(p_series_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM series_partners
    WHERE series_id = p_series_id
      AND partner_profile_id = p_user_id
      AND is_admin = true
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE recurring_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_deals ENABLE ROW LEVEL SECURITY;

-- Recurring Series Policies (use helper functions to avoid circular deps)
CREATE POLICY recurring_series_select ON recurring_series
  FOR SELECT USING (
    created_by = auth.uid()
    OR is_series_partner(id, auth.uid())
  );

CREATE POLICY recurring_series_insert ON recurring_series
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY recurring_series_update ON recurring_series
  FOR UPDATE USING (
    created_by = auth.uid()
    OR is_series_admin(id, auth.uid())
  );

CREATE POLICY recurring_series_delete ON recurring_series
  FOR DELETE USING (created_by = auth.uid());

-- Series Partners Policies (use helper functions to avoid circular deps)
CREATE POLICY series_partners_select ON series_partners
  FOR SELECT USING (
    is_series_creator(series_id, auth.uid())
    OR partner_profile_id = auth.uid()
  );

CREATE POLICY series_partners_insert ON series_partners
  FOR INSERT WITH CHECK (
    is_series_creator(series_id, auth.uid())
    OR is_series_admin(series_id, auth.uid())
  );

CREATE POLICY series_partners_update ON series_partners
  FOR UPDATE USING (
    is_series_creator(series_id, auth.uid())
    OR is_series_admin(series_id, auth.uid())
  );

CREATE POLICY series_partners_delete ON series_partners
  FOR DELETE USING (
    is_series_creator(series_id, auth.uid())
    OR is_series_admin(series_id, auth.uid())
  );

-- Series Deals Policies
CREATE POLICY series_deals_select ON series_deals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recurring_series rs WHERE rs.id = series_deals.series_id AND rs.created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM series_partners sp
      WHERE sp.series_id = series_deals.series_id
        AND sp.partner_profile_id = auth.uid()
        AND (sp.is_admin = true OR sp.can_view_financials = true)
        AND sp.status = 'active'
    )
  );

CREATE POLICY series_deals_insert ON series_deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recurring_series rs WHERE rs.id = series_deals.series_id AND rs.created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM series_partners sp
      WHERE sp.series_id = series_deals.series_id
        AND sp.partner_profile_id = auth.uid()
        AND (sp.is_admin = true OR sp.can_manage_financials = true)
        AND sp.status = 'active'
    )
  );

CREATE POLICY series_deals_update ON series_deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recurring_series rs WHERE rs.id = series_deals.series_id AND rs.created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM series_partners sp
      WHERE sp.series_id = series_deals.series_id
        AND sp.partner_profile_id = auth.uid()
        AND (sp.is_admin = true OR sp.can_manage_financials = true)
        AND sp.status = 'active'
    )
  );

CREATE POLICY series_deals_delete ON series_deals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM recurring_series rs WHERE rs.id = series_deals.series_id AND rs.created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM series_partners sp
      WHERE sp.series_id = series_deals.series_id
        AND sp.partner_profile_id = auth.uid()
        AND sp.is_admin = true AND sp.status = 'active'
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS recurring_series_updated_at ON recurring_series;
CREATE TRIGGER recurring_series_updated_at
  BEFORE UPDATE ON recurring_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS series_partners_updated_at ON series_partners;
CREATE TRIGGER series_partners_updated_at
  BEFORE UPDATE ON series_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS series_deals_updated_at ON series_deals;
CREATE TRIGGER series_deals_updated_at
  BEFORE UPDATE ON series_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE recurring_series IS 'Stores metadata for recurring event series';
COMMENT ON COLUMN recurring_series.created_by IS 'User who created/owns the series';
COMMENT ON TABLE series_partners IS 'Partners at the series level. Synced to event_partners with partner_type=series_inherited';
COMMENT ON COLUMN series_partners.is_admin IS 'If true, partner can manage series settings, add/remove other partners, and create deals';
COMMENT ON COLUMN series_partners.partner_type IS 'manual: added manually, deal_participant: auto-added from deal, co_promoter: co-promoter role';
COMMENT ON TABLE series_deals IS 'Financial deals at the series level that can be applied to all events';
COMMENT ON COLUMN series_deals.apply_to_all_events IS 'If true, deal applies to all events in series';
COMMENT ON COLUMN series_deals.apply_to_future_only IS 'If true, deal only applies to future events';
