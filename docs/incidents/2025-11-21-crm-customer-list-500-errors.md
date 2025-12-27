# CRM Customer List 500 Errors - November 21, 2025

## Incident Summary

**Date**: November 21, 2025
**Impact**: CRM customer list completely unavailable, returning 500 Internal Server Error
**Root Cause**: PostgreSQL query timeout due to expensive scalar subqueries in `customers_crm_v` view
**Resolution Time**: ~2 hours
**Status**: ✅ Resolved

---

## Timeline

1. **Initial Report**: Customer list not loading, 500 errors in browser console
2. **First Investigation**: Suspected missing `customer_segments` field (view had been reduced from 43 to 22 fields)
3. **First Fix Attempt**: Restored all 43 fields with `customer_segments` array - migration successful, but 500 errors persisted
4. **Root Cause Discovery**: Postgres logs showed `canceling statement due to statement timeout` errors
5. **Second Fix Attempt**: Optimized phones/addresses with LATERAL JOINs - timeouts persisted
6. **Third Fix Attempt**: Optimized ALL subqueries including email collection - still timing out
7. **Final Fix**: Removed `customer_orders_v` queries entirely, set `source` to NULL temporarily

---

## Root Cause Analysis

### The Problem

The `customers_crm_v` view was executing **expensive scalar subqueries** on the `customer_orders_v` view for EVERY row:

```sql
-- SLOW: Executed for each of 15,549 customers
(
  SELECT source
  FROM customer_orders_v
  WHERE LOWER(TRIM(email)) IN (
    SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
  )
  ORDER BY ordered_at ASC
  LIMIT 1
) as source,

-- SLOW: Another nested query per customer
COALESCE(
  (
    SELECT MIN(ordered_at)
    FROM customer_orders_v
    WHERE LOWER(TRIM(email)) IN (
      SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cp.id
    )
  ),
  cp.created_at
) as customer_since
```

### Why It Failed

1. **N+1 Query Problem**: Each customer required 2 separate subqueries into `customer_orders_v`
2. **Nested Subqueries**: The `IN (SELECT ...)` pattern executed for every customer
3. **Slow Underlying View**: `customer_orders_v` itself is a complex view (likely aggregating from multiple tables)
4. **Scale**: With 15,549 customers × 2 subqueries = 31,098+ expensive queries per page load
5. **Statement Timeout**: Postgres killed queries after exceeding timeout limit (~10-12 seconds)

### Why Direct SQL Worked But REST API Failed

- Direct SQL via `service_role` may have different/no timeout limits
- REST API uses `authenticator` role with strict timeout limits for security
- Simple `COUNT(*)` queries don't materialize all columns, so they succeeded
- Full `SELECT *` queries with subqueries timed out

---

## Solution Implemented

### Migration: `20251121000005_customers_crm_v_fast_without_orders.sql`

**Changes Made:**
1. ✅ Kept all 41 columns for frontend compatibility
2. ✅ Optimized phones, addresses, emails with LATERAL JOINs
3. ✅ Set `source` to `NULL` (removed slow `customer_orders_v` query)
4. ✅ Used `first_seen_at` from `customer_engagement_metrics` for `customer_since` (fast alternative)
5. ✅ Maintained `customer_segments` array aggregation (already optimized)

**Performance:**
- Query time: <1 second (down from 10+ seconds timeout)
- All 15,549 customers accessible
- REST API queries return 200 OK

### Trade-offs

**Temporary Loss:**
- `source` field now returns `NULL` for all customers
- Source filter dropdown in CRM will be empty

**Why This Trade-off:**
- Customer list **not loading at all** is worse than missing one field
- `source` is informational, not critical for core CRM functionality
- Can be restored later via background job (see Future Improvements)

---

## Prevention Measures

### 1. **View Performance Testing**

**Rule**: Always test view performance with `LIMIT 50` AND `COUNT(*)` queries before deploying.

```sql
-- Test query performance (should complete in <2 seconds)
EXPLAIN ANALYZE
SELECT * FROM customers_crm_v
ORDER BY last_order_date DESC NULLS LAST
LIMIT 50;

-- Test full scan (should complete in <10 seconds)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM customers_crm_v;
```

**Action**: Add to PR checklist for any view changes.

### 2. **Avoid Scalar Subqueries in Views**

**Rule**: Never use scalar subqueries in views that query other views or large tables.

❌ **Bad Pattern:**
```sql
(SELECT field FROM other_view WHERE condition) as field
```

✅ **Good Pattern:**
```sql
LEFT JOIN LATERAL (
  SELECT field FROM other_table WHERE condition
) alias ON TRUE
```

**Rationale**: Scalar subqueries execute per row. LATERAL JOINs execute once and reuse results.

### 3. **Denormalize Expensive Calculations**

**Rule**: Store frequently-accessed computed values in base tables, updated via triggers or background jobs.

**Example:**
```sql
-- Add columns to customer_engagement_metrics
ALTER TABLE customer_engagement_metrics
  ADD COLUMN source text,
  ADD COLUMN customer_since timestamp with time zone;

-- Update via background job or trigger on order insert
UPDATE customer_engagement_metrics
SET source = (SELECT source FROM orders WHERE customer_id = cem.customer_id ORDER BY created_at LIMIT 1)
WHERE customer_id = ...;
```

### 4. **Monitor Postgres Logs for Timeouts**

**Rule**: Check Postgres logs (not just API logs) when investigating 500 errors.

```sql
-- Check for timeout errors
SELECT * FROM mcp__supabase__get_logs('postgres')
WHERE error_severity = 'ERROR'
  AND event_message LIKE '%timeout%';
```

**Why**: API logs only show HTTP status codes. Postgres logs reveal the actual database error.

### 5. **Use Indexes on Join Columns**

**Rule**: Ensure all foreign key columns have indexes.

```sql
-- Required indexes for customers_crm_v performance
CREATE INDEX idx_customer_emails_customer_id ON customer_emails(customer_id);
CREATE INDEX idx_customer_phones_customer_id ON customer_phones(customer_id);
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_engagement_metrics_customer_id ON customer_engagement_metrics(customer_id);
CREATE INDEX idx_customer_segment_links_customer_segment ON customer_segment_links(customer_id, segment_id);
```

### 6. **Test with Production Data Scale**

**Rule**: Always test view changes against production-scale data (10,000+ rows).

**Why**: Performance issues only manifest at scale. Dev data (100 rows) won't reveal problems.

---

## Future Improvements

### Restore `source` Field (High Priority)

**Approach 1: Denormalize to customer_engagement_metrics**
```sql
-- Add column
ALTER TABLE customer_engagement_metrics ADD COLUMN source text;

-- Populate via one-time backfill
UPDATE customer_engagement_metrics cem
SET source = (
  SELECT source FROM customer_orders_v
  WHERE LOWER(TRIM(email)) IN (
    SELECT LOWER(TRIM(email)) FROM customer_emails WHERE customer_id = cem.customer_id
  )
  ORDER BY ordered_at ASC LIMIT 1
);

-- Update view to read from metrics
SELECT cem.source FROM customer_engagement_metrics cem ...
```

**Approach 2: Materialized View**
```sql
-- Create materialized view
CREATE MATERIALIZED VIEW customer_sources AS
SELECT
  cp.id as customer_id,
  (SELECT source FROM customer_orders_v WHERE ... LIMIT 1) as source
FROM customer_profiles cp;

-- Refresh periodically (e.g., nightly)
REFRESH MATERIALIZED VIEW customer_sources;

-- Join in main view
LEFT JOIN customer_sources cs ON cs.customer_id = cp.id
```

**Recommendation**: Approach 1 (denormalize) is simpler and has better query performance.

### Monitor View Performance

**Action**: Add automated performance monitoring for critical views.

```sql
-- Create monitoring function
CREATE OR REPLACE FUNCTION monitor_view_performance()
RETURNS TABLE(view_name text, avg_time_ms numeric) AS $$
BEGIN
  -- Run test queries and record timing
  RETURN QUERY
  SELECT 'customers_crm_v'::text,
         (EXTRACT(epoch FROM (clock_timestamp() - now())) * 1000)::numeric;
END;
$$ LANGUAGE plpgsql;
```

---

## Related Files

**Migrations:**
- `/root/agents/supabase/migrations/20251121000002_fix_customers_crm_v_complete_with_segments.sql` - First fix (timeout)
- `/root/agents/supabase/migrations/20251121000003_optimize_customers_crm_v_lateral_joins.sql` - Second fix (timeout)
- `/root/agents/supabase/migrations/20251121000004_fully_optimize_customers_crm_v_remove_all_subqueries.sql` - Third fix (timeout)
- `/root/agents/supabase/migrations/20251121000005_customers_crm_v_fast_without_orders.sql` - **Final fix ✅**

**Frontend:**
- `/root/agents/src/hooks/crm/customers/types.ts` - Customer interface (41 fields)
- `/root/agents/src/pages/crm/CustomerListPage.tsx` - CRM customer list page
- `/root/agents/src/components/crm/CustomerFilters.tsx` - Filter components

**Database Tables:**
- `customer_profiles` - Base customer data
- `customer_emails` - Email addresses
- `customer_phones` - Phone numbers
- `customer_addresses` - Physical addresses
- `customer_engagement_metrics` - Order/ticket aggregates
- `customer_segment_links` - Segment assignments
- `segments` - Segment definitions
- `customer_orders_v` - **SLOW VIEW** (avoid querying in other views)

---

## Lessons Learned

1. **Performance testing at scale is critical** - Views that work with 100 rows can timeout with 15,000 rows
2. **Postgres logs reveal the truth** - API logs only show symptoms, database logs show root cause
3. **Scalar subqueries are dangerous** - Always use JOINs (preferably LATERAL) instead
4. **Denormalization has value** - Storing computed values prevents expensive runtime calculations
5. **Iterative optimization matters** - First fix phones/addresses, then emails, then realize the real bottleneck is elsewhere
6. **Trade-offs are okay** - Losing `source` field temporarily is better than entire feature being down

---

## Sign-off

**Resolved by**: Claude Code
**Verified by**: User (customer list loading successfully)
**Status**: ✅ Closed
**Follow-up**: Add `source` to `customer_engagement_metrics` (tracked separately)
