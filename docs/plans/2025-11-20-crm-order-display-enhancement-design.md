# CRM Order Display Enhancement Design

**Created:** 2025-11-20
**Status:** Approved

## Overview

Redesign the order display in CRM customer profiles to show comprehensive order information in a horizontal card layout that better utilizes available space. Currently shows minimal info (order #, status, source, name, total) in a simple vertical list. The enhanced design will display event details, transaction breakdown, ticket counts, and discounts in a visually organized 3-column layout.

## Problem Statement

**Current State:**
- Orders show only: "Order Placed | Status | Source | Customer name | Date/Time"
- Simple vertical left-aligned list
- Missing critical info: event name/date/venue, ticket count, discounts
- Poor horizontal space utilization

**User Need:**
> "I want to see things like order number/identifier, what session the order is for and its details eg. Magic Mic Comedy - Wednesdays Nov 19th 2025 7pm etc, how much the order was for, how many tickets he got, any discounts used."

## Design Decisions

### Layout Choice: Horizontal Card with Sections

**Rationale:** User selected this from 3 options (horizontal card, compact grid, expandable). Provides clear visual hierarchy, uses horizontal space efficiently, and groups related information logically.

### Net vs Total Pricing

**Decision:** Net amount is primary (large text), total amount secondary (smaller/muted).
**Rationale:** User feedback - "Net is more important to me" for understanding actual revenue.

### Order Identifiers

**Decision:** Show different fields based on source:
- **Humanitix**: Order Name (e.g., "#HTX-1234-ABCD")
- **Eventbrite**: Order ID (e.g., "6207829519")

**Rationale:** Each platform has different identifier conventions.

## Backend Changes

### Update `customer_orders_v` View

The view already has separate CTEs for Humanitix and Eventbrite orders. We'll enhance each CTE independently:

#### Humanitix Orders CTE Enhancement

```sql
humanitix_orders AS (
  SELECT
    -- Existing fields...
    lower(TRIM(BOTH FROM ohtx.purchaser_email)) AS email,
    TRIM(BOTH FROM ohtx.purchaser_name) AS purchaser_name,
    ohtx.source_id AS order_source_id,
    'humanitix'::text AS source,
    ohtx.ordered_at,
    COALESCE(ohtx.gross_sales_cents, ohtx.total_cents::bigint, 0::bigint)::numeric / 100.0 AS gross_amount,
    COALESCE(ohtx.net_sales_cents, 0)::numeric / 100.0 AS net_amount,
    ohtx.status,
    ohtx.event_source_id AS raw_event_id,
    ohtx.session_source_id AS raw_session_id,
    ohtx.currency,

    -- NEW: Session details from sessions_htx
    sh.name AS session_name,
    sh.start_date AS session_start_date,
    sh.venue_name,

    -- NEW: Ticket count from tickets_htx
    (SELECT COUNT(*)
     FROM tickets_htx th
     WHERE th.order_source_id = ohtx.source_id) AS ticket_count,

    -- NEW: Discount details
    ohtx.discount_code_used,
    ohtx.discount_code_amount_cents::numeric / 100.0 AS discount_amount,

    -- NEW: Order identifier
    ohtx.order_name

  FROM orders_htx ohtx
  LEFT JOIN sessions_htx sh ON sh.source_id = ohtx.session_source_id
    AND sh.source = 'humanitix'
)
```

#### Eventbrite Orders CTE Enhancement

```sql
eventbrite_orders AS (
  SELECT
    -- Existing fields...
    lower(TRIM(BOTH FROM oe.purchaser_email)) AS email,
    TRIM(BOTH FROM oe.purchaser_name) AS purchaser_name,
    oe.source_id AS order_source_id,
    'eventbrite'::text AS source,
    oe.ordered_at,
    COALESCE(oe.gross_sales_cents, oe.total_cents, 0)::numeric / 100.0 AS gross_amount,
    COALESCE(oe.net_sales_cents, 0)::numeric / 100.0 AS net_amount,
    oe.status,
    oe.event_source_id AS raw_event_id,
    COALESCE(oe.session_source_id, oe.event_source_id) AS raw_session_id,
    oe.currency,

    -- NEW: Session details from sessions_htx
    sh.name AS session_name,
    sh.start_date AS session_start_date,
    sh.venue_name,

    -- NEW: Ticket count from tickets_eventbrite
    (SELECT COUNT(*)
     FROM tickets_eventbrite te
     WHERE te.order_id = oe.source_id) AS ticket_count,

    -- NEW: Discount details (if available in orders_eventbrite)
    oe.discount_code AS discount_code_used,
    oe.discount_amount::numeric / 100.0 AS discount_amount,

    -- NEW: Order identifier
    oe.source_id AS order_id

  FROM orders_eventbrite oe
  LEFT JOIN sessions_htx sh ON sh.source_id = COALESCE(oe.session_source_id, oe.event_source_id)
    AND sh.source = 'eventbrite'
)
```

#### Key Principles

1. **Source separation**: Each source (Humanitix/Eventbrite) uses its own session and ticket tables
2. **LEFT JOIN sessions**: Handles cases where event hasn't synced yet (session data NULL)
3. **Subquery for ticket count**: Cleaner than GROUP BY, handles 0 tickets correctly
4. **Consistent column names**: Both CTEs return the same columns for clean UNION ALL

### Impact on Materialized View

`customer_activity_timeline` automatically picks up new fields in its metadata JSONB. No changes needed to the materialized view definition itself. After updating `customer_orders_v`, run:

```sql
REFRESH MATERIALIZED VIEW customer_activity_timeline;
```

## Frontend Changes

### Component: `OrderActivity.tsx`

**File:** `src/components/crm/activity/OrderActivity.tsx`

**New metadata interface:**
```typescript
interface OrderMetadata {
  // Existing
  order_id?: string;
  amount: number;
  net_amount: number;
  status: string;
  source: 'humanitix' | 'eventbrite';
  purchaser_name: string;

  // NEW fields from enhanced view
  session_name?: string;
  session_start_date?: string;
  venue_name?: string;
  ticket_count?: number;
  discount_code_used?: string;
  discount_amount?: number;
  order_name?: string; // Humanitix
  order_id?: string;    // Eventbrite
}
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Left (40%)            │ Center (35%)         │ Right (25%)          │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Event Details         │ Transaction          │ Order Metadata       │
│                       │                      │                      │
│ • Magic Mic Comedy... │ • $55.00 (large)     │ • #HTX-1234-ABCD     │
│ • Nov 19, 2025 7:30pm │ • $59.10 total       │ • Complete ✓         │
│ • Potts Point Hotel   │ • 2 tickets          │ • Nov 19, 6:10am     │
│ • [Humanitix]         │ • EARLYBIRD -$10     │                      │
└───────────────────────┴──────────────────────┴──────────────────────┘
```

### Visual Hierarchy

**Primary elements (largest/boldest):**
- Event name (left)
- Net amount (center)

**Secondary elements (medium):**
- Date/time, venue (left)
- Total amount, ticket count (center)
- Order identifier (right)

**Tertiary elements (small/muted):**
- Platform badge (left)
- Discount details (center)
- Status badge, timestamp (right)

### Component Pseudo-code

```tsx
export const OrderActivity = ({ metadata }: OrderActivityProps) => {
  const formatDateTime = (date: string) => {
    // "Nov 19, 2025 · 7:30pm" format
  };

  const getOrderIdentifier = () => {
    if (metadata.source === 'humanitix') {
      return metadata.order_name || metadata.order_id;
    }
    return metadata.order_id;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border rounded-lg">
      {/* Left: Event Details (40% = col-span-5) */}
      <div className="lg:col-span-5 space-y-2">
        {metadata.session_name ? (
          <>
            <h4 className="font-bold text-lg">{metadata.session_name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(metadata.session_start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{metadata.venue_name}</span>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Event details pending sync
          </div>
        )}
        <Badge variant="outline" className="text-xs">
          {metadata.source}
        </Badge>
      </div>

      {/* Center: Transaction (35% = col-span-4) */}
      <div className="lg:col-span-4 space-y-2">
        <div className="text-2xl font-bold">
          {formatCurrency(metadata.net_amount)}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(metadata.amount)} total
        </div>
        {metadata.ticket_count && (
          <div className="flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4" />
            <span>{metadata.ticket_count} tickets</span>
          </div>
        )}
        {metadata.discount_code_used && (
          <div className="text-sm text-green-600">
            Code: {metadata.discount_code_used} ·
            -{formatCurrency(metadata.discount_amount)}
          </div>
        )}
      </div>

      {/* Right: Order Metadata (25% = col-span-3) */}
      <div className="lg:col-span-3 space-y-2">
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {getOrderIdentifier()}
        </code>
        <StatusBadge status={metadata.status} />
        <div className="text-xs text-muted-foreground">
          {formatDateTime(metadata.ordered_at)}
        </div>
      </div>
    </div>
  );
};
```

### StatusBadge Component

```tsx
const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    complete: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const variant = variants[status.toLowerCase()] || variants.pending;

  return <Badge className={variant}>{status}</Badge>;
};
```

## Responsive Behavior

### Breakpoints

**Desktop (>1024px):**
- Full 3-column horizontal layout (40% | 35% | 25%)
- All information visible simultaneously
- Vertical dividers between sections

**Tablet (768px - 1024px):**
- 2-column layout (60% | 40%)
- Left: Event details + Transaction (stacked)
- Right: Order metadata
- Slightly reduced spacing

**Mobile (<768px):**
- Single column stack
- Order: Event → Transaction → Metadata
- Full width sections
- Increased vertical spacing between sections

### Tailwind Implementation

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
  <div className="md:col-span-1 lg:col-span-5">...</div>
  <div className="md:col-span-1 lg:col-span-4">...</div>
  <div className="md:col-span-2 lg:col-span-3">...</div>
</div>
```

## Edge Cases

### 1. Missing Session Data

**Scenario:** Order exists but session hasn't synced (LEFT JOIN returns NULL)

**Handling:**
- Display platform order ID as fallback title
- Show "Event details pending sync" placeholder text
- Still show transaction amounts, ticket count, status
- Don't fail or show error - degrade gracefully

### 2. No Discount

**Scenario:** `discount_code_used` is NULL or empty

**Handling:**
- Hide discount row entirely
- Don't show "No discount applied" message
- Keep layout compact

### 3. Free Orders

**Scenario:** Total amount = $0.00

**Handling:**
- Show "FREE" badge instead of $0.00 for total
- Net amount shown normally as $0.00
- Different visual treatment (green badge)

### 4. Long Event Names

**Scenario:** Session name exceeds 50 characters

**Handling:**
- Truncate with CSS `text-ellipsis`
- Add `title` attribute for hover tooltip
- Full name visible on hover

```tsx
<h4
  className="font-bold text-lg truncate"
  title={metadata.session_name}
>
  {metadata.session_name}
</h4>
```

### 5. Zero Tickets

**Scenario:** Ticket count = 0 (edge case, shouldn't happen but possible)

**Handling:**
- Hide ticket count row
- Don't show "0 tickets"

### 6. Missing Order Identifier

**Scenario:** Both `order_name` and `order_id` are NULL

**Handling:**
- Fallback to `order_source_id` from orders table
- At minimum, always show some identifier

## Data Flow

```
┌─────────────────┐
│  orders_htx     │ Humanitix raw orders
│  orders_eb      │ Eventbrite raw orders
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  customer_orders_v              │ Enhanced view with:
│  • Separate CTEs per source     │   - Session details (LEFT JOIN sessions_htx)
│  • Ticket counts (subquery)     │   - Discount info
│  • UNION ALL                    │   - Order identifiers
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  customer_activity_timeline     │ Materialized view
│  • metadata JSONB contains all  │   enriched order data
│  • Refreshed every 15 mins      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Frontend: OrderActivity.tsx    │
│  • Reads metadata from timeline │
│  • Renders 3-column layout      │
│  • Handles edge cases           │
└─────────────────────────────────┘
```

## Performance Considerations

### Query Performance

**Impact:** 2 additional LEFT JOINs + subquery per order
**Mitigation:** Materialized view pre-computes all data, so CRM page loads stay fast
**Refresh strategy:** Existing 15-minute refresh schedule (via cron) is sufficient

### Indexing Recommendations

Ensure these indexes exist for optimal JOIN performance:

```sql
-- sessions_htx
CREATE INDEX IF NOT EXISTS idx_sessions_htx_source_id
  ON sessions_htx(source_id, source);

-- tickets_htx
CREATE INDEX IF NOT EXISTS idx_tickets_htx_order_source_id
  ON tickets_htx(order_source_id);

-- tickets_eventbrite
CREATE INDEX IF NOT EXISTS idx_tickets_eb_order_id
  ON tickets_eventbrite(order_id);
```

## Testing Checklist

- [ ] Humanitix order displays all fields correctly
- [ ] Eventbrite order displays all fields correctly
- [ ] Free order shows "FREE" badge
- [ ] Order with discount shows discount row
- [ ] Order without discount hides discount row
- [ ] Missing session data shows fallback gracefully
- [ ] Long event names truncate with ellipsis
- [ ] Mobile responsive layout works
- [ ] Tablet responsive layout works
- [ ] Desktop 3-column layout works
- [ ] Status badges styled correctly (complete, pending, refunded)
- [ ] Ticket count displays correctly
- [ ] Net amount is visually prominent
- [ ] Materialized view refresh updates data

## Files Modified

1. **`customer_orders_v`** - View definition (migration required)
2. **`src/components/crm/activity/OrderActivity.tsx`** - Component redesign
3. **`src/services/crm/customer-activity-service.ts`** - Type updates for new metadata fields

## Migration Strategy

1. Create migration to update `customer_orders_v` definition
2. Test migration on local/dev database
3. Apply to staging
4. Refresh materialized view: `REFRESH MATERIALIZED VIEW customer_activity_timeline;`
5. Deploy frontend changes
6. Monitor performance and data accuracy
7. Apply to production

## Success Criteria

✅ CRM order display shows event name, date, venue
✅ Transaction section emphasizes net amount over total
✅ Ticket count and discount info visible
✅ Correct order identifier per source (order_name vs order_id)
✅ Responsive layout works on mobile/tablet/desktop
✅ Handles missing data gracefully
✅ No performance degradation in CRM page load times
