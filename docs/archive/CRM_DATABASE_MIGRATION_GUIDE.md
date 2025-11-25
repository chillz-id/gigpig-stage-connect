# CRM Database Migration Guide

**Created**: 2025-10-15
**Status**: Ready for Application
**Phase**: 7 - Database Automation

---

## Overview

This guide covers the application and testing of two critical database migrations for the CRM system:

1. **Customer Activity Timeline** - Materialized view aggregating customer interactions
2. **Lead Scoring** - RFM-based scoring model for customer segmentation

## Migration Files

### 1. Customer Activity Timeline
**File**: `supabase/migrations/20250115000000_create_customer_activity_timeline.sql`

**Purpose**: Creates a materialized view that aggregates activities from three sources:
- **Orders**: Purchase history and event attendance
- **Messages**: Communication history
- **Deals**: Sales pipeline activities

**Key Objects**:
- Materialized view: `customer_activity_timeline`
- Indexes: `idx_customer_activity_customer_date`, `idx_customer_activity_type`

### 2. Lead Scoring
**File**: `supabase/migrations/20250115000001_create_lead_scoring.sql`

**Purpose**: Implements RFM (Recency, Frequency, Monetary) scoring model for lead qualification.

**Key Objects**:
- New columns on `customers` table:
  - `lead_score` (INTEGER) - Composite score (6-30 range)
  - `rfm_recency` (INTEGER) - 1-5 scale
  - `rfm_frequency` (INTEGER) - 1-5 scale
  - `rfm_monetary` (DECIMAL) - 1-5 scale
  - `last_scored_at` (TIMESTAMP) - Auto-updated
- Functions:
  - `calculate_lead_score()` - Computes RFM scores
  - `recalculate_customer_lead_score()` - Trigger helper
- Triggers:
  - `calculate_customer_lead_score` - On customer update
  - `recalculate_lead_score_on_order_change` - On order changes
- Indexes: `idx_customers_lead_score`, `idx_customers_rfm_scores`

---

## Application Steps

### Option 1: Supabase Dashboard (Recommended for Manual Application)

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy the contents of `20250115000000_create_customer_activity_timeline.sql`
5. Execute the query
6. Verify success in the **Database** → **Tables** section (check for materialized views)
7. Repeat steps 3-6 for `20250115000001_create_lead_scoring.sql`
8. Verify new columns in **Database** → **Tables** → `customers`

### Option 2: Supabase CLI (Automated)

```bash
# From the agents/ directory
cd agents

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
npx supabase db push

# Or apply specific migrations
npx supabase db push --include-all
```

### Option 3: MCP Server (Programmatic)

```bash
# Ensure SUPABASE_ACCESS_TOKEN is set
export SUPABASE_ACCESS_TOKEN="your_access_token"

# Use the Supabase MCP tool
# (This will be automated once token is available)
```

---

## Verification Steps

### 1. Verify Customer Activity Timeline

```sql
-- Check if materialized view was created
SELECT schemaname, matviewname, matviewowner
FROM pg_matviews
WHERE matviewname = 'customer_activity_timeline';

-- Verify data structure
SELECT activity_type, COUNT(*) as count
FROM customer_activity_timeline
GROUP BY activity_type
ORDER BY count DESC;

-- Test customer-specific timeline query
SELECT
  activity_type,
  created_at,
  metadata
FROM customer_activity_timeline
WHERE customer_id = 'YOUR_TEST_CUSTOMER_ID'
ORDER BY created_at DESC
LIMIT 10;

-- Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'customer_activity_timeline';
```

**Expected Results**:
- Materialized view exists with owner set to authenticated user
- Three activity types: 'order', 'message', 'deal'
- Timeline shows chronological activities for test customer
- Two indexes exist: `idx_customer_activity_customer_date` and `idx_customer_activity_type`

### 2. Verify Lead Scoring

```sql
-- Check if new columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('lead_score', 'rfm_recency', 'rfm_frequency', 'rfm_monetary', 'last_scored_at')
ORDER BY column_name;

-- Verify triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('calculate_customer_lead_score', 'recalculate_lead_score_on_order_change');

-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('calculate_lead_score', 'recalculate_customer_lead_score')
  AND routine_schema = 'public';

-- Test lead score calculation (force recalculation)
UPDATE customers
SET updated_at = NOW()
WHERE id = 'YOUR_TEST_CUSTOMER_ID';

-- Verify scores were calculated
SELECT
  id,
  email,
  lead_score,
  rfm_recency,
  rfm_frequency,
  rfm_monetary,
  last_scored_at
FROM customers
WHERE id = 'YOUR_TEST_CUSTOMER_ID';

-- Check lead score distribution
SELECT
  CASE
    WHEN lead_score >= 24 THEN 'Hot Lead (24-30)'
    WHEN lead_score >= 18 THEN 'Warm Lead (18-23)'
    WHEN lead_score >= 12 THEN 'Cool Lead (12-17)'
    ELSE 'Cold Lead (6-11)'
  END as lead_category,
  COUNT(*) as customer_count,
  ROUND(AVG(lead_score), 2) as avg_score
FROM customers
WHERE lead_score > 0
GROUP BY lead_category
ORDER BY avg_score DESC;
```

**Expected Results**:
- 5 new columns exist on `customers` table with correct data types
- 2 triggers exist and are active
- 2 functions exist and are callable
- Test customer has scores calculated (all values > 0)
- Lead score distribution shows realistic segmentation

### 3. Test Materialized View Refresh

```sql
-- Manually refresh the materialized view
REFRESH MATERIALIZED VIEW customer_activity_timeline;

-- Verify last refresh time (requires pg_stat_all_tables)
SELECT
  schemaname,
  matviewname,
  last_autovacuum,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
WHERE relname = 'customer_activity_timeline';
```

**Expected Results**:
- Refresh completes without errors
- Statistics show recent activity

### 4. Performance Testing

```sql
-- Test timeline query performance
EXPLAIN ANALYZE
SELECT *
FROM customer_activity_timeline
WHERE customer_id = 'YOUR_TEST_CUSTOMER_ID'
ORDER BY created_at DESC
LIMIT 20;

-- Test lead score query performance
EXPLAIN ANALYZE
SELECT *
FROM customers
WHERE lead_score >= 24
ORDER BY lead_score DESC
LIMIT 50;
```

**Expected Results**:
- Timeline query uses `idx_customer_activity_customer_date` index
- Lead score query uses `idx_customers_lead_score` index
- Both queries complete in < 50ms for typical data volumes

---

## Post-Migration Tasks

### 1. Initial Data Population

```sql
-- Trigger lead score calculation for all existing customers
UPDATE customers
SET updated_at = NOW()
WHERE lead_score = 0 OR lead_score IS NULL;

-- Verify all customers now have scores
SELECT
  COUNT(*) as total_customers,
  COUNT(lead_score) as scored_customers,
  ROUND(AVG(lead_score), 2) as avg_lead_score
FROM customers;
```

### 2. Set Up Materialized View Refresh Schedule

**Option A: Manual Refresh (Simple)**
```sql
-- Refresh daily via cron job or scheduled function
REFRESH MATERIALIZED VIEW customer_activity_timeline;
```

**Option B: Automated Refresh (Recommended)**

Create a database function to refresh on schedule:

```sql
-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_customer_activity_timeline()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW customer_activity_timeline;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron extension (if available)
SELECT cron.schedule(
  'refresh-customer-timeline',
  '0 2 * * *',  -- 2 AM daily
  $$SELECT refresh_customer_activity_timeline();$$
);
```

**Option C: Event-Driven Refresh**

For real-time requirements, consider refreshing after significant data changes:

```sql
-- Trigger refresh after bulk order imports
-- (Add to import procedures/functions)
REFRESH MATERIALIZED VIEW CONCURRENTLY customer_activity_timeline;
```

### 3. Create Views for Common Queries

```sql
-- View for hot leads (lead score >= 24)
CREATE OR REPLACE VIEW hot_leads AS
SELECT
  c.id,
  c.email,
  c.full_name,
  c.lead_score,
  c.rfm_recency,
  c.rfm_frequency,
  c.rfm_monetary,
  c.last_scored_at
FROM customers c
WHERE c.lead_score >= 24
ORDER BY c.lead_score DESC;

-- View for recent customer activity summary
CREATE OR REPLACE VIEW customer_activity_summary AS
SELECT
  customer_id,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE activity_type = 'order') as order_count,
  COUNT(*) FILTER (WHERE activity_type = 'message') as message_count,
  COUNT(*) FILTER (WHERE activity_type = 'deal') as deal_count,
  MAX(created_at) as last_activity_at
FROM customer_activity_timeline
GROUP BY customer_id;
```

---

## Troubleshooting

### Issue: Materialized view creation fails

**Error**: `relation "customers" does not exist`

**Solution**: Ensure the `customers`, `orders`, `messages`, and `deals` tables exist before creating the view.

```sql
-- Verify required tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'orders', 'messages', 'deals');
```

### Issue: Lead scoring trigger not firing

**Error**: Scores remain 0 after customer update

**Solution**: Verify trigger is enabled and function is valid:

```sql
-- Check trigger status
SELECT trigger_name, action_statement, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'calculate_customer_lead_score';

-- Re-create trigger if needed
DROP TRIGGER IF EXISTS calculate_customer_lead_score ON customers;
CREATE TRIGGER calculate_customer_lead_score
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION calculate_lead_score();
```

### Issue: Performance degradation on large datasets

**Error**: Slow queries on timeline or lead score

**Solution**: Verify indexes and consider partitioning:

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('customer_activity_timeline', 'customers')
ORDER BY idx_scan DESC;

-- If materialized view is very large, consider CONCURRENTLY refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY customer_activity_timeline;
```

---

## Rollback Procedures

### Rollback Customer Activity Timeline

```sql
-- Drop indexes first
DROP INDEX IF EXISTS idx_customer_activity_type;
DROP INDEX IF EXISTS idx_customer_activity_customer_date;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS customer_activity_timeline;
```

### Rollback Lead Scoring

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS recalculate_lead_score_on_order_change ON orders;
DROP TRIGGER IF EXISTS calculate_customer_lead_score ON customers;

-- Drop functions
DROP FUNCTION IF EXISTS recalculate_customer_lead_score();
DROP FUNCTION IF EXISTS calculate_lead_score();

-- Drop indexes
DROP INDEX IF EXISTS idx_customers_rfm_scores;
DROP INDEX IF EXISTS idx_customers_lead_score;

-- Remove columns
ALTER TABLE customers
DROP COLUMN IF EXISTS last_scored_at,
DROP COLUMN IF EXISTS rfm_monetary,
DROP COLUMN IF EXISTS rfm_frequency,
DROP COLUMN IF EXISTS rfm_recency,
DROP COLUMN IF EXISTS lead_score;
```

---

## Maintenance

### Regular Tasks

1. **Weekly**: Review lead score distribution and adjust thresholds if needed
2. **Monthly**: Analyze materialized view refresh performance
3. **Quarterly**: Review RFM scoring algorithm effectiveness

### Monitoring Queries

```sql
-- Monitor materialized view size
SELECT
  schemaname,
  matviewname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE matviewname = 'customer_activity_timeline';

-- Monitor lead score recalculation frequency
SELECT
  DATE(last_scored_at) as score_date,
  COUNT(*) as customers_scored
FROM customers
WHERE last_scored_at IS NOT NULL
GROUP BY DATE(last_scored_at)
ORDER BY score_date DESC
LIMIT 7;
```

---

## Success Criteria

✅ **Customer Activity Timeline**:
- [ ] Materialized view created successfully
- [ ] Indexes created and being used
- [ ] Sample queries return expected data
- [ ] Refresh strategy determined and documented
- [ ] Performance acceptable (< 100ms for customer-specific queries)

✅ **Lead Scoring**:
- [ ] All 5 columns added to customers table
- [ ] Both triggers active and firing correctly
- [ ] All existing customers have scores calculated
- [ ] Lead distribution shows realistic segmentation
- [ ] Performance acceptable (< 50ms for lead score queries)

✅ **Integration**:
- [ ] CRM dashboard can query timeline data
- [ ] Lead score displayed in customer profiles
- [ ] No errors in application logs
- [ ] Database performance metrics stable

---

## Next Steps

After successful migration:

1. **Update CRM UI Components** to display:
   - Customer activity timeline widget
   - Lead score badges and indicators
   - Lead segmentation filters

2. **Create API Endpoints**:
   - `GET /api/customers/:id/timeline` - Fetch activity timeline
   - `GET /api/customers/leads?score_min=24` - Query by lead score
   - `POST /api/admin/refresh-timeline` - Manual refresh trigger

3. **Add Analytics Queries**:
   - Lead conversion funnel by score
   - Activity frequency correlation with deal close rate
   - RFM segment performance analysis

4. **Documentation**:
   - Update API documentation with new endpoints
   - Create user guide for lead scoring interpretation
   - Document materialized view refresh schedule

---

## Contact

For questions or issues with these migrations:
- Create an issue with label `database` in the repository
- Include relevant error messages and query execution plans
- Tag with `crm` and `phase-7` labels
