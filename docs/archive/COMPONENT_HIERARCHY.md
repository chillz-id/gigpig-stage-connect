# Component Hierarchy - Lineup & Deals Tabs

## Lineup Tab Component Tree

```
SpotListContainer (Container - Data Fetching)
└── SpotList (Presentational - Timeline Layout)
    └── SpotCardContainer (Container - Individual Spot Data)
        └── SpotCard (Presentational - Spot Display)
            ├── Avatar (shadcn/ui)
            ├── Badge (shadcn/ui)
            └── Button (shadcn/ui)

LineupTimeline (Presentational - Visual Timeline)
├── Badge (shadcn/ui)
└── Avatar (shadcn/ui)
```

## Deals Tab Component Tree

```
DealListContainer (Container - Data Fetching)
└── DealList (Presentational - Accordion Layout)
    └── DealCardContainer (Container - Individual Deal Data)
        └── DealCard (Presentational - Deal Display)
            ├── Progress (shadcn/ui)
            ├── Badge (shadcn/ui)
            ├── Button (shadcn/ui)
            ├── Tooltip (shadcn/ui)
            └── ParticipantList (Presentational)
                ├── Avatar (shadcn/ui)
                ├── Badge (shadcn/ui)
                └── Tooltip (shadcn/ui)

SplitCalculator (Presentational - Split Editor)
├── Avatar (shadcn/ui)
├── Input (shadcn/ui)
├── Slider (shadcn/ui)
└── Alert (shadcn/ui)
```

## Data Flow Patterns

### Lineup Tab
```
1. Parent Page
   ↓
2. SpotListContainer
   - Fetches: useEventSpots(eventId)
   - Sorts: By time and position
   ↓
3. SpotList (Receives: sorted spots array)
   - Renders: Timeline layout
   ↓
4. SpotCardContainer (Per spot)
   - Handles: Mutations (delete, assign)
   ↓
5. SpotCard
   - Displays: Spot details
   - Actions: Edit, Delete, Assign
```

### Deals Tab
```
1. Parent Page
   ↓
2. DealListContainer
   - Fetches: useEventDeals(eventId)
   - Sorts: By created date
   - Permissions: Checks canViewFinancials
   ↓
3. DealList (Receives: sorted deals array)
   - Groups: By status (pending/confirmed/rejected)
   - Layout: Accordion sections
   ↓
4. DealCardContainer (Per deal)
   - Handles: Mutations (confirm, reject)
   - Checks: User permissions
   ↓
5. DealCard
   - Displays: Deal details, progress
   - Actions: Confirm, Reject, Edit
   ↓
6. ParticipantList
   - Displays: Splits per participant
   - Respects: canViewFinancials
```

## Component Responsibilities

### Container Components (Smart)
**Responsibilities:**
- Data fetching with React Query hooks
- Mutation handling
- Loading and error states
- Permission checks
- Data transformation/sorting

**Do NOT:**
- Render UI directly (except loaders)
- Handle presentation logic
- Style elements

### Presentational Components (Dumb)
**Responsibilities:**
- Render UI based on props
- Handle user interactions (via callbacks)
- Display states (empty, loading via props)
- Styling and layout

**Do NOT:**
- Fetch data
- Perform mutations
- Manage state (except local UI state)

## Permission System

### Revenue Visibility (Deals)
```typescript
canViewFinancials = userId === eventOwnerId || hasFullyConfirmedDeal

if (canViewFinancials) {
  // Show: "$1,000.00"
} else {
  // Show: "🔒 ****" + tooltip
}
```

### User Actions (Deals)
```typescript
canConfirm = user is participant
hasConfirmed = participant.status === 'confirmed'

if (canConfirm && !hasConfirmed && status === 'pending') {
  // Show: Confirm and Reject buttons
} else if (hasConfirmed) {
  // Show: "You confirmed this deal" message
}
```

## Styling Guidelines

### Color Coding

**Spot Types (Lineup):**
- MC: Blue (`bg-blue-100`, `border-blue-500`)
- Feature: Yellow (`bg-yellow-100`, `border-yellow-500`)
- Headliner: Purple (`bg-purple-100`, `border-purple-500`)
- Guest: Green (`bg-green-100`, `border-green-500`)

**Status Badges:**
- Pending: Yellow (`bg-yellow-100 text-yellow-800`)
- Confirmed: Green (`bg-green-100 text-green-800`)
- Rejected: Red (`bg-red-100 text-red-800`)
- Available: Gray (`bg-gray-100 text-gray-800`)

**Gradients:**
- Timeline: `from-pink-500 via-purple-600 to-purple-800`
- Position Badge: `from-pink-500 to-purple-600`
- Total Amount: `from-pink-50 to-purple-50`

### Spacing
- Card padding: `p-6` (header/footer), `p-6 pt-0` (content)
- Gap between elements: `gap-2` (buttons), `gap-3` (cards), `gap-4` (sections)
- Space between sections: `space-y-2`, `space-y-3`, `space-y-4`

### Typography
- Card title: `text-lg font-semibold`
- Amount: `text-2xl font-bold`
- Body text: `text-sm`, `text-base`
- Labels: `text-sm font-medium`
- Hints: `text-xs text-gray-500`

## Usage Examples

### Minimal Integration
```typescript
import { SpotListContainer, LineupTimeline } from '@/components/lineup';
import { DealListContainer } from '@/components/deals';

// In EventDetail page:
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="lineup">Lineup</TabsTrigger>
    <TabsTrigger value="deals">Deals</TabsTrigger>
  </TabsList>

  <TabsContent value="lineup">
    <SpotListContainer eventId={eventId} />
    {/* Optional timeline view: */}
    <LineupTimeline
      spots={spots}
      eventStartTime={event.start_time}
      eventEndTime={event.end_time}
    />
  </TabsContent>

  <TabsContent value="deals">
    <DealListContainer
      eventId={eventId}
      userId={userId}
      eventOwnerId={event.owner_id}
    />
  </TabsContent>
</Tabs>
```

### With Custom Data
```typescript
// If you already have the data (avoid double-fetching):
<SpotListContainer
  eventId={eventId}
  spotsData={spots} // Pass directly
/>

<DealListContainer
  eventId={eventId}
  userId={userId}
  eventOwnerId={eventOwnerId}
  dealsData={deals} // Pass directly
/>
```

## File Structure

```
src/
├── types/
│   ├── spot.ts        # Spot-related types
│   └── deal.ts        # Deal-related types
│
├── components/
│   ├── lineup/
│   │   ├── SpotCard.tsx               # Presentational
│   │   ├── SpotCardContainer.tsx      # Container
│   │   ├── SpotList.tsx               # Presentational
│   │   ├── SpotListContainer.tsx      # Container
│   │   ├── LineupTimeline.tsx         # Presentational
│   │   └── index.ts                   # Exports
│   │
│   └── deals/
│       ├── DealCard.tsx               # Presentational
│       ├── DealCardContainer.tsx      # Container
│       ├── DealList.tsx               # Presentational
│       ├── DealListContainer.tsx      # Container
│       ├── ParticipantList.tsx        # Presentational
│       ├── SplitCalculator.tsx        # Presentational
│       └── index.ts                   # Exports
│
└── hooks/ (To be implemented)
    ├── useEventSpots.ts
    ├── useSpot.ts
    ├── useDeleteSpot.ts
    ├── useAssignComedian.ts
    ├── useEventDeals.ts
    ├── useDeal.ts
    ├── useConfirmDeal.ts
    └── useRejectDeal.ts
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

**Presentational Components:**
```typescript
// Test rendering with various props
// Test user interactions (button clicks)
// Test conditional rendering (empty states)
// Test accessibility (ARIA labels)
```

**Container Components:**
```typescript
// Mock hooks
// Test loading states
// Test error handling
// Test mutation calls
```

### Integration Tests (Playwright E2E)

**Lineup Tab:**
- View spot timeline
- Assign comedian to spot
- Edit spot details
- Delete spot
- Reorder spots (Phase 4)

**Deals Tab:**
- View deal list
- Confirm deal
- Reject deal
- View participant splits
- Check revenue visibility permissions

---

**Last Updated:** 2025-10-28
**Status:** ✅ Complete - Ready for Phase 3 Integration
