# Event Management UI Components Library
Created: 2025-10-28
Status: Approved

## Overview

Building a comprehensive UI component library for the Event Management & Financial System (Phase 3 of 6). Components organized by subdomain with container/presentational pattern, using shadcn/ui foundation, and aligned for page-tab driven assembly in Phase 4.

## Design Decisions

### Organization Strategy
- **Subdomain directories**: `/components/applications/`, `/components/lineup/`, `/components/deals/`, `/components/event-management/`
- **Container/Presentational Pattern**: Containers handle data fetching with React Query hooks, presentational components focus on UI rendering
- **Page-Tab Driven Build Order**: Components grouped by tab pages for natural progression to Phase 4 assembly

### Architecture
- **UI Foundation**: shadcn/ui + Radix UI (existing project components from `/components/ui/`)
- **State Management**:
  - Server state via React Query (5min stale time, optimistic updates)
  - Local UI state via useState
  - Form state via React Hook Form + Zod validation
- **Build Strategy**: Page-tab driven (Overview → Applications → Lineup → Deals)

## Component Inventory

### Total: 27 Component Files
- 17 presentational components (pure UI)
- 10 container components (data fetching + state)

### By Subdomain

#### `/components/event-management/`
1. `EventManagementHeader.tsx` (presentational)
2. `EventManagementHeaderContainer.tsx` (container)

#### `/components/applications/`
3. `ApplicationCard.tsx` (presentational)
4. `ApplicationCardContainer.tsx` (container)
5. `ApplicationList.tsx` (presentational)
6. `ApplicationListContainer.tsx` (container)
7. `ShortlistPanel.tsx` (presentational)
8. `ShortlistPanelContainer.tsx` (container)
9. `ApplicationFilters.tsx` (presentational)
10. `ApplicationBulkActions.tsx` (presentational)

#### `/components/lineup/`
11. `SpotCard.tsx` (presentational)
12. `SpotCardContainer.tsx` (container)
13. `SpotList.tsx` (presentational)
14. `SpotListContainer.tsx` (container)
15. `SpotPaymentEditor.tsx` (presentational)
16. `SpotPaymentEditorContainer.tsx` (container)
17. `LineupTimeline.tsx` (presentational)
18. `SpotFilters.tsx` (presentational)

#### `/components/deals/`
19. `DealCard.tsx` (presentational)
20. `DealCardContainer.tsx` (container)
21. `DealList.tsx` (presentational)
22. `DealListContainer.tsx` (container)
23. `DealBuilder.tsx` (presentational)
24. `DealBuilderContainer.tsx` (container)
25. `DealApprovalPanel.tsx` (presentational)
26. `DealApprovalPanelContainer.tsx` (container)
27. `ParticipantList.tsx` (presentational)
28. `ParticipantCard.tsx` (presentational)
29. `SplitCalculator.tsx` (presentational)
30. `SettleButton.tsx` (presentational)

## Container/Presentational Pattern

### Container Component Responsibilities
- Import and use React Query hooks (useEventDeals, useDealParticipants, useApplicationApproval, useSpotPayments)
- Handle loading, error, and empty states
- Manage local UI state (modals, dialogs, form visibility)
- Handle mutations and side effects
- Pass clean data and callbacks to presentational components

### Presentational Component Responsibilities
- Receive data via props (typed interfaces)
- Render UI using shadcn/ui components (Button, Card, Dialog, Form, etc.)
- Follow Tailwind CSS class ordering: layout → spacing → color
- Emit events through callback props
- Zero data fetching, pure UI logic

### Example Pattern

```typescript
// ApplicationCardContainer.tsx (container)
export function ApplicationCardContainer({ applicationId }: { applicationId: string }) {
  const { data: application, isLoading } = useApplicationById(applicationId);
  const { mutate: approve } = useApproveApplication();
  const { mutate: addToShortlist } = useAddToShortlist();
  const { mutate: addToFavourites } = useAddToFavourites();
  const { mutate: hideComedian } = useHideComedian();

  if (isLoading) return <Skeleton />;
  if (!application) return null;

  return (
    <ApplicationCard
      application={application}
      onApprove={() => approve({ applicationId, eventId: application.event_id })}
      onAddToShortlist={() => addToShortlist({ applicationId, userId, eventId })}
      onFavourite={() => addToFavourites({ userId, comedianId: application.comedian_id })}
      onHide={(scope) => hideComedian({ userId, comedianId: application.comedian_id, scope, eventId })}
    />
  );
}

// ApplicationCard.tsx (presentational)
interface ApplicationCardProps {
  application: ApplicationData;
  onApprove: () => void;
  onAddToShortlist: () => void;
  onFavourite: () => void;
  onHide: (scope: 'event' | 'global') => void;
}

export function ApplicationCard({
  application,
  onApprove,
  onAddToShortlist,
  onFavourite,
  onHide
}: ApplicationCardProps) {
  return (
    <Card>
      <CardHeader>{application.comedian_name}</CardHeader>
      <CardContent>...</CardContent>
      <CardFooter>
        <Button onClick={onApprove}>Approve</Button>
        <Button onClick={onAddToShortlist}>Add to Shortlist</Button>
        <Button onClick={onFavourite}><Star /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger><EyeOff /></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onHide('event')}>
              Hide from this show
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHide('global')}>
              Hide from all shows
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
```

## Data Flow & State Management

### React Query Integration

Each container uses Phase 2B hooks:
- `useEventDeals`, `useEventDeal`, `useEventDealStats`, `useDealCalculations`
- `useDealParticipants`, `usePendingApprovalsForUser`, `useParticipantStats`
- `useApplicationsByEvent`, `useShortlistedApplications`, `useShortlistStats`
- `useEventSpots`, `useUnpaidSpots`, `usePaymentStats`

Plus new hooks for user preferences:
- `useFavourites`, `useAddToFavourites`, `useRemoveFromFavourites`
- `useHiddenComedians`, `useHideComedian`, `useUnhideComedian`

### State Management Layers

1. **Server State (React Query):**
   - Cached with 5-minute stale time
   - Auto-refetch on reconnect
   - Optimistic updates for shortlist/approval/favourite actions
   - Coordinated cache invalidation across related queries

2. **Local UI State (useState):**
   - Dialog/modal visibility
   - Filter selections
   - Expanded/collapsed states

3. **Form State (React Hook Form + Zod):**
   - DealBuilder form validation
   - SpotPaymentEditor form validation
   - Participant split configuration
   - Validated against Zod schemas before submission

### Data Flow Example (Application Approval)

```
User clicks "Approve" on ApplicationCard
  ↓
ApplicationCardContainer calls useApproveApplication mutation
  ↓
Optimistic update: UI shows approved badge immediately
  ↓
API call to approveApplication service function
  ↓
On success: invalidate related queries (applications list, shortlist stats)
  ↓
React Query refetches fresh data
  ↓
UI updates with confirmed state
  ↓
Toast notification shows "Application approved"
```

### Error Handling
- Mutations include retry logic (1 retry, 1s delay)
- Optimistic updates rollback on error
- Toast notifications for all errors
- Loading skeletons during data fetch

## Component-Specific Designs

### Applications Tab Components

#### ApplicationCard / ApplicationCardContainer
**Purpose**: Display individual comedian application with all relevant info and actions

**Props (Presentational):**
```typescript
interface ApplicationCardProps {
  application: ApplicationData;
  isFavourited: boolean;
  isHidden: boolean;
  onApprove: () => void;
  onAddToShortlist: () => void;
  onFavourite: () => void;
  onUnfavourite: () => void;
  onHide: (scope: 'event' | 'global') => void;
  onUnhide: () => void;
}
```

**UI Elements:**
- Comedian photo (Avatar component)
- Name, bio snippet, experience level
- Application status badge (pending/accepted)
- Favourited indicator (filled star if favourited)
- Hidden indicator (if hidden for this event)
- Actions:
  - **Approve** button (primary)
  - **Add to Shortlist** button
  - **Favourite** button (star icon, toggles favourited state)
  - **Hide** dropdown (eye-off icon):
    - "Hide from this show" option
    - "Hide from all shows" option
  - **Unhide** button (if currently hidden)

**Container Logic:**
- Fetch application data
- Check if comedian is in user's favourites list
- Check if comedian is in user's hidden list for this event
- Handle all mutation callbacks

#### ShortlistPanel / ShortlistPanelContainer
**Purpose**: Drag-and-drop panel showing shortlisted comedians with reordering

**Props (Presentational):**
```typescript
interface ShortlistPanelProps {
  applications: ApplicationData[];
  totalSpots: number;
  onReorder: (newOrder: string[]) => void;
  onRemove: (applicationId: string) => void;
  onApproveAll: () => void;
  onRemoveAll: () => void;
}
```

**UI Elements:**
- Header: "Shortlist (X/Y)" where X = shortlisted count, Y = total spots
- Drag-and-drop list (using dnd-kit or similar)
- Each item shows comedian name, photo, quick stats
- Remove button per item
- Bulk actions: "Approve All", "Remove All from Shortlist"
- Empty state: "No comedians shortlisted yet"

**Container Logic:**
- Fetch shortlisted applications using useShortlistedApplications
- Handle reorder mutations
- Handle bulk operations

#### ApplicationFilters (Presentational Only)
**Purpose**: Filter and search applications

**Props:**
```typescript
interface ApplicationFiltersProps {
  statusFilter: 'all' | 'pending' | 'accepted';
  shortlistFilter: 'all' | 'shortlisted' | 'not-shortlisted';
  showHidden: boolean;
  searchQuery: string;
  onStatusChange: (status: string) => void;
  onShortlistChange: (filter: string) => void;
  onToggleHidden: (show: boolean) => void;
  onSearchChange: (query: string) => void;
}
```

**UI Elements:**
- Status dropdown: All, Pending, Accepted
- Shortlist filter: All, Shortlisted, Not Shortlisted
- Search input with icon
- "Show Hidden" toggle switch

#### ApplicationBulkActions (Presentational Only)
**Purpose**: Bulk operations on selected applications

**Props:**
```typescript
interface ApplicationBulkActionsProps {
  selectedCount: number;
  onApproveSelected: () => void;
  onShortlistSelected: () => void;
  onFavouriteSelected: () => void;
  onHideSelected: (scope: 'event' | 'global') => void;
  onClearSelection: () => void;
}
```

**UI Elements:**
- Selection indicator: "X selected"
- Bulk approve button
- Bulk add to shortlist button
- Bulk favourite button
- Bulk hide dropdown
- Clear selection button

### Lineup Tab Components

#### SpotCard / SpotCardContainer
**Purpose**: Display event spot with time, comedian assignment, payment status

**Props (Presentational):**
```typescript
interface SpotCardProps {
  spot: EventSpot;
  onEditPayment: () => void;
  onMarkAsPaid: () => void;
  onUnassign: () => void;
}
```

**UI Elements:**
- Time and duration display
- Comedian name (if assigned) or "Unassigned"
- Payment status badge (color-coded: green=paid, yellow=pending, red=unpaid, gray=refunded)
- Payment amount (if visible per revenue rules)
- Actions:
  - Edit payment button
  - Mark as paid button (if unpaid/pending)
  - Unassign button (if assigned)

**Container Logic:**
- Fetch spot data
- Check revenue visibility (canViewFinancials helper)
- Handle payment mutations

#### SpotPaymentEditor / SpotPaymentEditorContainer
**Purpose**: Form to edit payment details with real-time tax calculations

**Props (Presentational):**
```typescript
interface SpotPaymentEditorProps {
  spot: EventSpot;
  onSave: (payment: PaymentInput) => void;
  onCancel: () => void;
}
```

**UI Elements:**
- Payment amount input (number)
- Tax included/excluded toggle
- Tax rate input (percentage)
- Real-time breakdown display:
  - Gross amount
  - Net amount
  - Tax amount
- Payment notes textarea
- Payment status dropdown (unpaid/pending/paid/partially_paid/refunded)
- Save and Cancel buttons

**Container Logic:**
- Uses React Hook Form + Zod validation
- Real-time calculations using calculateTaxBreakdown utility
- Mutation with useUpdatePayment hook

#### LineupTimeline (Presentational Only)
**Purpose**: Visual chronological timeline of all spots

**Props:**
```typescript
interface LineupTimelineProps {
  spots: EventSpot[];
  eventStartTime: Date;
  eventEndTime: Date;
}
```

**UI Elements:**
- Horizontal timeline with time markers
- Spot blocks positioned by time
- Color-coded by payment status
- Shows overlaps, gaps, breaks visually
- Click to expand spot details

#### SpotFilters (Presentational Only)
**Purpose**: Filter spots by various criteria

**Props:**
```typescript
interface SpotFiltersProps {
  paymentStatusFilter: 'all' | 'paid' | 'unpaid' | 'pending';
  assignmentFilter: 'all' | 'assigned' | 'unassigned';
  onPaymentStatusChange: (status: string) => void;
  onAssignmentChange: (filter: string) => void;
}
```

### Deals Tab Components

#### DealBuilder / DealBuilderContainer
**Purpose**: Multi-step form to create deals with participants and splits

**Props (Presentational):**
```typescript
interface DealBuilderProps {
  eventId: string;
  onComplete: (deal: EventDeal) => void;
  onCancel: () => void;
}
```

**UI Steps:**
1. **Basic Info**: Deal name, deal type (door/bar/guarantee/hybrid)
2. **Add Participants**:
   - Search and add comedians/managers/venues
   - Configure split per participant (percentage/fixed/tiered)
   - Real-time validation (percentages sum to 100% or less)
3. **Review Calculations**: Show SplitCalculator with breakdown
4. **Submit**: Creates draft deal

**Container Logic:**
- Multi-step form state management
- React Hook Form + Zod validation
- Validates splits with validateParticipantSplit
- useCreateDeal mutation

#### DealApprovalPanel / DealApprovalPanelContainer
**Purpose**: Display all participants with approval workflow

**Props (Presentational):**
```typescript
interface DealApprovalPanelProps {
  deal: EventDealWithDetails;
  participants: DealParticipantWithDetails[];
  currentUserId: string;
  onApprove: (participantId: string) => void;
  onRequestChanges: (participantId: string, changes: UpdateParticipantSplitInput) => void;
  onDecline: (participantId: string, reason?: string) => void;
}
```

**UI Elements:**
- Deal status banner (draft/pending_approval/approved/settled/cancelled)
- Overall approval progress bar
- List of participants with:
  - Name, role (comedian/manager/venue)
  - Split configuration
  - Calculated amount (if visible per revenue rules)
  - Approval status badge (pending/approved/declined/changes_requested)
  - Actions (if current user is participant):
    - Approve button
    - Request Changes button (opens modal)
    - Decline button (opens modal)
- Filter: All, Pending, Approved, Declined

**Container Logic:**
- Fetch deal and participants
- Check if current user is a participant
- Handle approval workflow mutations

#### ParticipantCard (Presentational Only)
**Purpose**: Individual participant row in deal

**Props:**
```typescript
interface ParticipantCardProps {
  participant: DealParticipantWithDetails;
  canViewFinancials: boolean;
  isCurrentUser: boolean;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onDecline?: () => void;
}
```

**UI Elements:**
- Participant name and avatar
- Type badge (comedian/manager/venue)
- Split configuration display
- Calculated amount (if canViewFinancials)
- Approval status badge
- Actions (if isCurrentUser and pending)

#### SplitCalculator (Presentational Only)
**Purpose**: Real-time display of revenue split breakdown

**Props:**
```typescript
interface SplitCalculatorProps {
  totalRevenue: number;
  participants: Array<{
    name: string;
    splitConfig: SplitConfig;
    calculatedAmount: number;
  }>;
}
```

**UI Elements:**
- Total revenue input/display
- List showing each participant:
  - Name
  - Split method (percentage/fixed/tiered)
  - Percentage or amount
  - Calculated payout
- Remaining amount display
- Validation warnings (if splits don't add up correctly)

#### SettleButton (Presentational Only)
**Purpose**: Validate and trigger settlement workflow

**Props:**
```typescript
interface SettleButtonProps {
  dealId: string;
  canSettle: boolean;
  validationErrors: string[];
  onSettle: () => void;
}
```

**UI Elements:**
- Button disabled if !canSettle
- Shows validation errors on hover
- Opens confirmation modal on click
- Modal shows final breakdown and confirms settlement

### Event Management Header

#### EventManagementHeader / EventManagementHeaderContainer
**Purpose**: Top-level header with event info, stats, and navigation

**Props (Presentational):**
```typescript
interface EventManagementHeaderProps {
  event: EventData;
  stats: {
    applicationsCount: number;
    spotsFilled: number;
    spotsTotal: number;
    approvedDealsCount: number;
    totalRevenue?: number; // only if canViewFinancials
  };
  canViewFinancials: boolean;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onBackToEvent: () => void;
}
```

**UI Elements:**
- Event name (h1)
- Event date and venue
- Quick stats cards:
  - Applications: X total
  - Spots: X filled / Y total
  - Approved Deals: X
  - Revenue: $X (only shown if canViewFinancials)
- Tab navigation: Overview, Applications, Lineup, Deals
- Back to event detail link

**Container Logic:**
- Fetch event data
- Fetch aggregated stats
- Check financial visibility with canViewFinancials helper
- Handle tab routing

## New Features: Favourites, Hide, Revenue Visibility

### Favourites Feature

**Scope**: User-level favourites (across all events)

**Database Schema:**
```sql
CREATE TABLE user_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comedian_id)
);

CREATE INDEX idx_user_favourites_user ON user_favourites(user_id);
```

**Service Functions** (userPreferencesService.ts):
```typescript
export async function addToFavourites(userId: string, comedianId: string): Promise<void>
export async function removeFromFavourites(userId: string, comedianId: string): Promise<void>
export async function getFavourites(userId: string): Promise<Profile[]>
export async function isFavourited(userId: string, comedianId: string): Promise<boolean>
```

**React Query Hooks** (useUserPreferences.ts):
```typescript
export function useFavourites(userId: string | undefined)
export function useAddToFavourites()
export function useRemoveFromFavourites()
```

**UI Integration:**
- Star icon in ApplicationCard (filled if favourited)
- Toggle favourite with optimistic update
- Favourited comedians can be filtered/sorted to top

### Hide Feature

**Scope**: User-level hide with two options:
1. Hide from this show (event-specific)
2. Hide from all shows (global, with "Show Hidden" toggle to reveal)

**Database Schema:**
```sql
CREATE TABLE user_hidden_comedians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT CHECK (scope IN ('event', 'global')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- null for global scope
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comedian_id, scope, event_id)
);

CREATE INDEX idx_user_hidden_user ON user_hidden_comedians(user_id);
CREATE INDEX idx_user_hidden_event ON user_hidden_comedians(event_id) WHERE scope = 'event';
```

**Service Functions** (userPreferencesService.ts):
```typescript
export async function hideComedian(
  userId: string,
  comedianId: string,
  scope: 'event' | 'global',
  eventId?: string
): Promise<void>

export async function unhideComedian(
  userId: string,
  comedianId: string,
  eventId?: string
): Promise<void>

export async function getHiddenComedians(
  userId: string,
  eventId?: string
): Promise<Profile[]>

export async function isHidden(
  userId: string,
  comedianId: string,
  eventId?: string
): Promise<boolean>
```

**React Query Hooks** (useUserPreferences.ts):
```typescript
export function useHiddenComedians(userId: string | undefined, eventId?: string)
export function useHideComedian()
export function useUnhideComedian()
```

**UI Integration:**
- Eye-off icon dropdown in ApplicationCard with two options
- Applications filtered by default if hidden
- "Show Hidden" toggle in ApplicationFilters reveals hidden applications
- Hidden applications show "Hidden" badge

### Revenue Visibility

**Rules:**
- Event owner always sees all financials
- Non-owner users who have a 100% approved deal become "partners" and can see financials
- Revenue shown in: EventManagementHeader stats, DealCard, ParticipantCard amounts, SplitCalculator

**Helper Function** (eventDealService.ts):
```typescript
export async function canViewFinancials(
  userId: string,
  eventId: string
): Promise<boolean> {
  // Check if user is event owner
  const { data: event } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .single();

  if (event?.created_by === userId) return true;

  // Check if user has any 100% approved deals for this event
  const { data: userDeals } = await supabase
    .from('event_deals')
    .select(`
      id,
      deal_participants!inner(
        id,
        participant_id,
        approval_status
      )
    `)
    .eq('event_id', eventId)
    .eq('deal_participants.participant_id', userId);

  // Check if any deal has all participants approved
  for (const deal of userDeals || []) {
    const allApproved = deal.deal_participants.every(
      p => p.approval_status === 'approved'
    );
    if (allApproved) return true;
  }

  return false;
}
```

**Usage in Components:**
- Containers call canViewFinancials on mount
- Pass boolean to presentational components
- Conditionally render financial amounts

## Styling & UX Patterns

### Design System Compliance
- All components use shadcn/ui primitives (Button, Card, Dialog, Form, Badge, Dropdown, etc.)
- Tailwind CSS class ordering: layout → spacing → color
- Consistent spacing: p-4 for card padding, gap-4 for flex layouts, space-y-4 for vertical stacks

### Color Coding
- **Payment status**:
  - Green (paid): `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
  - Yellow (pending): `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
  - Red (unpaid): `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
  - Gray (refunded): `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`

- **Approval status**:
  - Green (approved): `bg-green-100 text-green-800`
  - Yellow (pending): `bg-yellow-100 text-yellow-800`
  - Blue (changes requested): `bg-blue-100 text-blue-800`
  - Red (declined): `bg-red-100 text-red-800`

- **Application status**:
  - Green (accepted): `bg-green-100 text-green-800`
  - Gray (pending): `bg-gray-100 text-gray-800`

### Interactive Patterns
- **Optimistic Updates**: Shortlist add/remove, favourite toggle show immediate UI changes with rollback on error
- **Confirmation Dialogs**: Delete actions, hide from all shows, settle deal require confirmation modals
- **Toast Notifications**: Success/error feedback for all mutations (using useToast hook)
- **Loading States**: Skeleton loaders during data fetch, spinner buttons during mutations
- **Empty States**: Friendly messages with CTAs when lists are empty

### Accessibility
- All actions keyboard accessible (Enter/Space for buttons)
- Focus management in dialogs/modals
- ARIA labels for icon-only buttons:
  - `aria-label="Favourite comedian"` for star button
  - `aria-label="Hide comedian"` for eye-off button
  - `aria-label="Edit payment"` for edit button
- Screen reader announcements for optimistic updates
- Color contrast ratios meet WCAG AA standards

### Responsive Design
- Mobile-first Tailwind classes
- Cards stack vertically on mobile (`flex flex-col`), grid on desktop (`md:grid md:grid-cols-2 lg:grid-cols-3`)
- Dropdowns become bottom sheets on mobile (using shadcn/ui Sheet component)
- Tables become scrollable cards on mobile
- Timeline becomes vertical list on mobile

### Animation
- Smooth transitions for optimistic updates: `transition-all duration-200`
- Drag-and-drop visual feedback in ShortlistPanel
- Toast slide-in animations (built into shadcn/ui Toast)
- Loading skeleton pulse effect: `animate-pulse`

### Icon Library
Using lucide-react (already in project):
- `Star` (favourite)
- `EyeOff` (hide)
- `Check` (approve)
- `X` (reject)
- `Plus` (add)
- `Edit` (edit payment)
- `DollarSign` (financial)
- `Clock` (pending)
- `ChevronDown` (dropdowns)
- `Search` (search inputs)

## Dependencies

### New Services to Create
1. **userPreferencesService.ts** (~300 lines)
   - Favourites CRUD
   - Hide/unhide CRUD
   - Query helpers (isFavourited, isHidden)

### New Hooks to Create
1. **useUserPreferences.ts** (~400 lines)
   - useFavourites query
   - useAddToFavourites, useRemoveFromFavourites mutations
   - useHiddenComedians query
   - useHideComedian, useUnhideComedian mutations
   - Optimistic updates for favourites toggle

### Database Migrations
1. **create_user_favourites_table.sql**
2. **create_user_hidden_comedians_table.sql**

### Existing Hooks to Use
- useEventDeals, useEventDeal, useEventDealStats, useDealCalculations
- useDealParticipants, usePendingApprovalsForUser, useParticipantStats
- useApplicationsByEvent, useShortlistedApplications, useShortlistStats
- useEventSpots, useUnpaidSpots, usePaymentStats

### Existing UI Components to Use (from shadcn/ui)
- Button, Card, Dialog, Form, Badge, Dropdown, Input, Textarea
- Select, Checkbox, Switch, Tabs, Toast, Skeleton
- Avatar, Separator, ScrollArea, Sheet (for mobile)

## Build Order (Page-Tab Driven)

### Week 3, Day 1-2: Overview + Applications Tab
1. Create userPreferencesService.ts + migrations
2. Create useUserPreferences.ts hook
3. EventManagementHeader components (2 files)
4. ApplicationCard components (2 files)
5. ApplicationList components (2 files)
6. ShortlistPanel components (2 files)
7. ApplicationFilters component (1 file)
8. ApplicationBulkActions component (1 file)

**Deliverable:** Applications tab fully functional with favourites, hide, shortlist features

### Week 3, Day 3-4: Lineup Tab
1. SpotCard components (2 files)
2. SpotList components (2 files)
3. SpotPaymentEditor components (2 files)
4. LineupTimeline component (1 file)
5. SpotFilters component (1 file)

**Deliverable:** Lineup tab fully functional with payment management

### Week 3, Day 5-7: Deals Tab
1. DealCard components (2 files)
2. DealList components (2 files)
3. DealBuilder components (2 files)
4. DealApprovalPanel components (2 files)
5. ParticipantList component (1 file)
6. ParticipantCard component (1 file)
7. SplitCalculator component (1 file)
8. SettleButton component (1 file)

**Deliverable:** Deals tab fully functional with approval workflow and settlement

## Testing Strategy

### Unit Tests (per component)
- Presentational components: Test rendering with various prop combinations
- Container components: Test data fetching, loading states, error handling
- Mock React Query hooks with MSW or vitest mocks

### Integration Tests
- Test complete flows: application approval → shortlist → lineup assignment
- Test deal creation → participant approval → settlement
- Test favourites and hide interactions

### Accessibility Tests
- Keyboard navigation through all interactive elements
- Screen reader compatibility with jest-axe
- Focus management in modals

### Visual Regression Tests (Optional)
- Chromatic or Percy for component screenshots
- Ensure consistent styling across all components

## Next Phase (Phase 4)

Phase 4 will assemble these components into tab pages:
- EventOverviewTab.tsx (uses EventManagementHeader, summary cards)
- ApplicationsTab.tsx (uses ApplicationList, ShortlistPanel, ApplicationFilters)
- LineupTab.tsx (uses SpotList, LineupTimeline, SpotFilters)
- DealsTab.tsx (uses DealList, DealApprovalPanel, DealBuilder modal)

Main page EventManagement.tsx will wrap all tabs with routing at `/events/:eventId/manage`.

## Technical Notes

### TypeScript Strict Mode
All components must pass strict TypeScript checks:
- No implicit any
- Null-check all array access
- Proper typing for all props and hooks

### Performance Considerations
- Use React.memo for expensive presentational components
- Virtualize long lists (ApplicationList, SpotList) with react-window if >100 items
- Debounce search inputs (300ms delay)
- Optimize React Query stale/cache times (5min/10min)

### Error Boundaries
- Wrap each tab in ErrorBoundary component
- Graceful degradation if component fails to render
- Show user-friendly error message with retry option

---

## Summary

Phase 3 delivers a complete, production-ready UI component library with:
- 27 component files organized by subdomain
- Container/presentational pattern for clean separation
- New favourites and hide features for comedian management
- Revenue visibility based on ownership and deal approval
- Full integration with Phase 2B React Query hooks
- shadcn/ui foundation for consistent, accessible UI
- Page-tab driven build order for smooth progression to Phase 4

**Estimated:** 5-7 days of focused development
**Lines of Code:** ~3,000-4,000 across all components
**Dependencies:** 2 new services, 1 new hook file, 2 database migrations
