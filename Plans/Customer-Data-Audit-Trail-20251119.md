# Customer Data Audit Trail & Refresh Optimization
Created: 2025-11-19
Status: Pending

## Overview
Fix the `refresh_customer_engagement_metrics()` function that's causing unnecessary bulk updates to all customer records every 15 minutes, and implement comprehensive audit logging to track all changes to customer data.

## Problem Statement

**Current Issue:**
- Cron job runs every 15 minutes executing `refresh_customer_data()`
- `refresh_customer_engagement_metrics()` uses `ON CONFLICT DO UPDATE` that ALWAYS updates all 9,369 customer rows
- This triggers `recalculate_lead_score_on_engagement_change` trigger 9,369 times
- Each trigger execution updates `customer_profiles.updated_at`, making all timestamps identical
- Happens 96 times per day unnecessarily
- No audit trail to track what caused changes

**Evidence:**
- All customer_profiles have `updated_at = 2025-11-19 06:30:00+00` (identical)
- All customer_engagement_metrics have `updated_at = 2025-11-19 06:45:00.330499+00` (identical)
- Cron job: `refresh_customer_data` runs `*/15 * * * *`

## Changes Overview

### 1. Optimize Refresh Function
**File**: Database migration
- Modify `refresh_customer_engagement_metrics()` to only update when values actually change
- Add WHERE clause to ON CONFLICT DO UPDATE to compare old vs new values
- Prevent unnecessary trigger cascades

### 2. Implement Audit Logging System
**Files**: Database migration
- Create `audit_logs` table for row-level change tracking
- Create generic `audit_trigger()` function
- Apply audit triggers to critical tables
- Track: who, what, when, why, old values, new values

### 3. Optimize Trigger Cascade
**File**: Database migration
- Modify `recalculate_customer_profile_lead_score()` to check if update is needed
- Only update customer_profiles when lead score actually changes
- Add logging for trigger executions

### 4. Add Monitoring & Alerts
**Files**: Database migration, monitoring queries
- Create view to monitor cron job performance
- Add alerts for unexpected bulk updates
- Dashboard queries for audit log analysis

## Database Changes

### Migration 1: Create Audit Log Infrastructure

```sql
-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by uuid REFERENCES auth.users(id),
    changed_by_type text DEFAULT 'user' CHECK (changed_by_type IN ('user', 'system', 'trigger', 'cron', 'import', 'webhook')),
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    context jsonb, -- Additional metadata like IP, user agent, import ID, etc.
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs(changed_by) WHERE changed_by IS NOT NULL;
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation);

-- Partition by month for performance (optional but recommended)
-- CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- RLS policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values jsonb;
  v_new_values jsonb;
  v_changed_fields text[];
  v_changed_by uuid;
  v_changed_by_type text;
BEGIN
  -- Determine operation type
  IF TG_OP = 'DELETE' THEN
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
    v_changed_fields := ARRAY(SELECT jsonb_object_keys(v_old_values));
  ELSIF TG_OP = 'INSERT' THEN
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
    v_changed_fields := ARRAY(SELECT jsonb_object_keys(v_new_values));
  ELSE -- UPDATE
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);

    -- Only log fields that actually changed
    SELECT ARRAY_AGG(key)
    INTO v_changed_fields
    FROM jsonb_each(v_new_values)
    WHERE v_new_values->key IS DISTINCT FROM v_old_values->key;

    -- If nothing changed, don't log
    IF v_changed_fields IS NULL OR array_length(v_changed_fields, 1) = 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Determine who made the change
  v_changed_by := auth.uid();

  -- Determine change type based on context
  IF current_setting('app.change_context', true) = 'cron' THEN
    v_changed_by_type := 'cron';
  ELSIF current_setting('app.change_context', true) = 'import' THEN
    v_changed_by_type := 'import';
  ELSIF current_setting('app.change_context', true) = 'webhook' THEN
    v_changed_by_type := 'webhook';
  ELSIF v_changed_by IS NULL THEN
    v_changed_by_type := 'system';
  ELSE
    v_changed_by_type := 'user';
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    changed_by,
    changed_by_type,
    old_values,
    new_values,
    changed_fields,
    context
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_changed_by,
    v_changed_by_type,
    v_old_values,
    v_new_values,
    v_changed_fields,
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'trigger_name', TG_NAME,
      'transaction_id', txid_current()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Migration 2: Fix Refresh Function

```sql
-- Optimized refresh function - only updates when values change
CREATE OR REPLACE FUNCTION public.refresh_customer_engagement_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set context for audit logging
  PERFORM set_config('app.change_context', 'cron', true);

  WITH order_base AS (
      SELECT
          ce.customer_id,
          co.order_source_id,
          co.source,
          co.ordered_at,
          co.gross_amount,
          co.net_amount,
          co.event_name,
          co.raw_event_id
      FROM public.customer_orders_v co
      JOIN public.customer_emails ce ON lower(ce.email) = co.email AND ce.source = 'orders_sync'
  ),
  ticket_counts AS (
      SELECT order_source_id, COUNT(*) AS ticket_count
      FROM public.tickets_htx
      GROUP BY order_source_id
      UNION ALL
      SELECT order_source_id, COUNT(*)
      FROM public.tickets_eventbrite
      GROUP BY order_source_id
  ),
  order_with_tickets AS (
      SELECT
          ob.*,
          COALESCE(tc.ticket_count, 0) AS ticket_count
      FROM order_base ob
      LEFT JOIN (
          SELECT order_source_id, SUM(ticket_count) AS ticket_count
          FROM ticket_counts
          GROUP BY order_source_id
      ) tc ON tc.order_source_id = ob.order_source_id
  )
  INSERT INTO public.customer_engagement_metrics (
      customer_id,
      lifetime_orders,
      lifetime_tickets,
      lifetime_gross,
      lifetime_net,
      last_order_at,
      most_recent_event_id,
      most_recent_event_name,
      first_seen_at,
      last_seen_at,
      updated_at
  )
  SELECT
      customer_id,
      COUNT(*) AS lifetime_orders,
      SUM(ticket_count) AS lifetime_tickets,
      SUM(gross_amount) AS lifetime_gross,
      SUM(net_amount) AS lifetime_net,
      MAX(ordered_at) AS last_order_at,
      (ARRAY_AGG(raw_event_id ORDER BY ordered_at DESC))[1] AS most_recent_event_id,
      (ARRAY_AGG(event_name ORDER BY ordered_at DESC))[1] AS most_recent_event_name,
      MIN(ordered_at) AS first_seen_at,
      MAX(ordered_at) AS last_seen_at,
      now()
  FROM order_with_tickets
  GROUP BY customer_id
  ON CONFLICT (customer_id) DO UPDATE
  SET
      lifetime_orders = EXCLUDED.lifetime_orders,
      lifetime_tickets = EXCLUDED.lifetime_tickets,
      lifetime_gross = EXCLUDED.lifetime_gross,
      lifetime_net = EXCLUDED.lifetime_net,
      last_order_at = EXCLUDED.last_order_at,
      most_recent_event_id = EXCLUDED.most_recent_event_id,
      most_recent_event_name = EXCLUDED.most_recent_event_name,
      first_seen_at = EXCLUDED.first_seen_at,
      last_seen_at = EXCLUDED.last_seen_at,
      updated_at = now()
  WHERE
      -- CRITICAL: Only update if values actually changed
      customer_engagement_metrics.lifetime_orders IS DISTINCT FROM EXCLUDED.lifetime_orders
      OR customer_engagement_metrics.lifetime_tickets IS DISTINCT FROM EXCLUDED.lifetime_tickets
      OR customer_engagement_metrics.lifetime_gross IS DISTINCT FROM EXCLUDED.lifetime_gross
      OR customer_engagement_metrics.lifetime_net IS DISTINCT FROM EXCLUDED.lifetime_net
      OR customer_engagement_metrics.last_order_at IS DISTINCT FROM EXCLUDED.last_order_at
      OR customer_engagement_metrics.most_recent_event_id IS DISTINCT FROM EXCLUDED.most_recent_event_id
      OR customer_engagement_metrics.most_recent_event_name IS DISTINCT FROM EXCLUDED.most_recent_event_name
      OR customer_engagement_metrics.first_seen_at IS DISTINCT FROM EXCLUDED.first_seen_at
      OR customer_engagement_metrics.last_seen_at IS DISTINCT FROM EXCLUDED.last_seen_at;

  -- Reset context
  PERFORM set_config('app.change_context', '', true);
END;
$$;

COMMENT ON FUNCTION public.refresh_customer_engagement_metrics() IS
'Refreshes customer engagement metrics from order data. Only updates rows when values actually change to prevent unnecessary trigger cascades.';
```

### Migration 3: Optimize Trigger Cascade

```sql
-- Optimized trigger function - only updates when needed
CREATE OR REPLACE FUNCTION public.recalculate_customer_profile_lead_score()
RETURNS TRIGGER AS $$
DECLARE
  v_current_lead_score INTEGER;
  v_needs_update BOOLEAN := false;
BEGIN
  -- For DELETE operations, we still need to update
  IF TG_OP = 'DELETE' THEN
    UPDATE customer_profiles
    SET updated_at = NOW()
    WHERE id = OLD.customer_id;
    RETURN OLD;
  END IF;

  -- For INSERT/UPDATE, check if this actually affects the lead score
  -- Get current lead score
  SELECT lead_score INTO v_current_lead_score
  FROM customer_profiles
  WHERE id = NEW.customer_id;

  -- Determine if update is needed
  IF TG_OP = 'INSERT' THEN
    v_needs_update := true; -- New engagement metrics always need calculation
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only update if metrics that affect lead score changed
    v_needs_update := (
      OLD.lifetime_orders IS DISTINCT FROM NEW.lifetime_orders
      OR OLD.lifetime_net IS DISTINCT FROM NEW.lifetime_net
      OR OLD.last_order_at IS DISTINCT FROM NEW.last_order_at
    );
  END IF;

  -- Only trigger update if needed
  IF v_needs_update THEN
    UPDATE customer_profiles
    SET updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.recalculate_customer_profile_lead_score() IS
'Triggers customer profile lead score recalculation. Only updates when engagement metrics that affect lead score actually change.';
```

### Migration 4: Apply Audit Triggers

```sql
-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_customer_profiles ON public.customer_profiles;
CREATE TRIGGER audit_customer_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.customer_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_customer_engagement_metrics ON public.customer_engagement_metrics;
CREATE TRIGGER audit_customer_engagement_metrics
AFTER INSERT OR UPDATE OR DELETE ON public.customer_engagement_metrics
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_customer_emails ON public.customer_emails;
CREATE TRIGGER audit_customer_emails
AFTER INSERT OR UPDATE OR DELETE ON public.customer_emails
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_customer_phones ON public.customer_phones;
CREATE TRIGGER audit_customer_phones
AFTER INSERT OR UPDATE OR DELETE ON public.customer_phones
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_customer_addresses ON public.customer_addresses;
CREATE TRIGGER audit_customer_addresses
AFTER INSERT OR UPDATE OR DELETE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_customer_segment_links ON public.customer_segment_links;
CREATE TRIGGER audit_customer_segment_links
AFTER INSERT OR UPDATE OR DELETE ON public.customer_segment_links
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Add audit triggers to other critical tables
DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
```

### Migration 5: Monitoring Views

```sql
-- View to monitor bulk update operations
CREATE OR REPLACE VIEW public.bulk_update_monitor AS
SELECT
  table_name,
  DATE_TRUNC('minute', created_at) as minute,
  operation,
  changed_by_type,
  COUNT(*) as affected_rows,
  COUNT(DISTINCT record_id) as unique_records,
  MIN(created_at) as first_change,
  MAX(created_at) as last_change
FROM public.audit_logs
GROUP BY table_name, DATE_TRUNC('minute', created_at), operation, changed_by_type
HAVING COUNT(*) > 100 -- Flag operations affecting 100+ rows
ORDER BY minute DESC, affected_rows DESC;

COMMENT ON VIEW public.bulk_update_monitor IS
'Monitors bulk operations affecting 100+ rows to detect unexpected mass updates';

-- View to analyze customer profile changes
CREATE OR REPLACE VIEW public.customer_profile_changes AS
SELECT
  al.created_at,
  cp.canonical_full_name,
  (SELECT email FROM customer_emails WHERE customer_id = al.record_id AND is_primary = true LIMIT 1) as email,
  al.operation,
  al.changed_by_type,
  al.changed_fields,
  al.old_values,
  al.new_values,
  u.email as changed_by_email
FROM public.audit_logs al
JOIN public.customer_profiles cp ON cp.id = al.record_id
LEFT JOIN auth.users u ON u.id = al.changed_by
WHERE al.table_name = 'customer_profiles'
ORDER BY al.created_at DESC;

-- View for cron job impact analysis
CREATE OR REPLACE VIEW public.cron_job_impact AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  table_name,
  COUNT(*) as changes,
  COUNT(DISTINCT record_id) as unique_records
FROM public.audit_logs
WHERE changed_by_type = 'cron'
GROUP BY DATE_TRUNC('hour', created_at), table_name
ORDER BY hour DESC, changes DESC;
```

## Files to Modify/Create

1. **New Migration File**: `supabase/migrations/YYYYMMDDHHMMSS_customer_audit_trail_and_refresh_optimization.sql`
   - Contains all SQL from migrations 1-5 above
   - Creates audit_logs table, triggers, and monitoring views
   - Optimizes refresh functions

## Key Behaviors

✅ **Refresh Function:**
- Only updates customer_engagement_metrics rows when values actually change
- Uses WHERE clause on ON CONFLICT DO UPDATE
- Prevents unnecessary trigger cascades
- Sets app.change_context for audit logging

✅ **Audit Logging:**
- Tracks all INSERT/UPDATE/DELETE on customer tables
- Records who (user/system/cron), what (changed fields), when (timestamp)
- Stores old and new values as JSONB
- Identifies change source (user, cron, import, webhook, trigger, system)
- Only logs fields that actually changed (not entire row)

✅ **Optimized Triggers:**
- recalculate_customer_profile_lead_score only updates when metrics affecting lead score change
- Prevents cascade when engagement metrics update but values identical
- Reduces unnecessary customer_profiles.updated_at changes

✅ **Monitoring:**
- bulk_update_monitor view flags operations affecting 100+ rows
- customer_profile_changes view shows detailed change history
- cron_job_impact view analyzes scheduled job effects

## Testing Checklist

- [ ] Run migration in development environment
- [ ] Verify audit_logs table created with correct indexes and RLS
- [ ] Test refresh_customer_engagement_metrics() - confirm only changed rows updated
- [ ] Verify trigger optimization - lead score recalc only when needed
- [ ] Test audit logging for user-initiated changes (captures user_id)
- [ ] Test audit logging for cron job changes (captures 'cron' type)
- [ ] Test audit logging for import operations (captures 'import' type)
- [ ] Query bulk_update_monitor view - should not show 9000+ row updates
- [ ] Wait for next cron job execution (15 min) - verify only changed customers updated
- [ ] Check customer_profiles.updated_at - should have varied timestamps, not all identical
- [ ] Test customer_profile_changes view - verify change history visible
- [ ] Performance test: measure query time before/after on large result sets
- [ ] Verify RLS policies - only admins can view audit logs
- [ ] Test audit log retention - ensure old logs can be archived/deleted if needed

## Performance Considerations

**Audit Log Growth:**
- Estimate: ~50-100 changes per minute during business hours
- Daily: ~72,000 - 144,000 audit log entries
- Monthly: ~2.2M - 4.3M entries
- Recommendation: Implement monthly partitioning or archival after 90 days

**Index Performance:**
- audit_logs table has 4 indexes for common query patterns
- Monitor index usage with pg_stat_user_indexes
- Consider additional indexes if specific query patterns emerge

**Trigger Overhead:**
- Audit triggers add ~2-5ms per row operation
- Acceptable for transactional operations
- Bulk operations may see 10-15% performance impact
- Benefit: Complete change tracking worth the overhead

**Refresh Function Optimization:**
- Before: Updates all 9,369 rows every 15 minutes = 134,730 updates/day
- After: Only updates changed rows (estimate ~50-100/day) = 99.93% reduction
- Trigger cascade reduction: From 134,730 to ~50-100/day
- Database load: Significant reduction in WAL generation and replication lag

## Rollback Plan

If issues arise after deployment:

1. **Immediate rollback** (disable audit triggers):
```sql
ALTER TABLE customer_profiles DISABLE TRIGGER audit_customer_profiles;
ALTER TABLE customer_engagement_metrics DISABLE TRIGGER audit_customer_engagement_metrics;
-- etc for other tables
```

2. **Revert refresh function**:
```sql
-- Restore original function without WHERE clause
CREATE OR REPLACE FUNCTION refresh_customer_engagement_metrics() ...
-- (use previous version from git history)
```

3. **Full rollback**:
```sql
-- Drop audit infrastructure
DROP VIEW IF EXISTS bulk_update_monitor CASCADE;
DROP VIEW IF EXISTS customer_profile_changes CASCADE;
DROP VIEW IF EXISTS cron_job_impact CASCADE;
DROP TRIGGER IF EXISTS audit_customer_profiles ON customer_profiles;
-- etc for all audit triggers
DROP FUNCTION IF EXISTS audit_trigger() CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
```

## Migration Execution Plan

1. **Pre-deployment:**
   - Backup database
   - Test migration in staging environment
   - Verify audit log queries return expected results
   - Document baseline metrics (current update frequency, row counts)

2. **Deployment:**
   - Apply migration during low-traffic period
   - Monitor error logs during initial cron job executions
   - Verify audit_logs table populating correctly
   - Check bulk_update_monitor for unexpected patterns

3. **Post-deployment monitoring (first 24 hours):**
   - Query bulk_update_monitor every hour
   - Verify customer_profiles.updated_at has varied timestamps
   - Check audit_logs table growth rate
   - Monitor database CPU/memory usage
   - Review cron_job_impact view

4. **Week 1:**
   - Daily review of audit logs
   - Analyze most frequently changed fields
   - Identify any unexpected bulk operations
   - Fine-tune monitoring queries if needed

## Notes

- The WHERE clause on ON CONFLICT DO UPDATE is PostgreSQL 9.5+ syntax
- audit_logs table uses JSONB for flexible storage of old/new values
- Consider adding audit log archival job after 90-180 days
- Future enhancement: Add web UI for audit log browsing (admin dashboard)
- Future enhancement: Export audit logs to external SIEM system
- Context setting uses PostgreSQL transaction-scoped settings (set_config with is_local=true)
