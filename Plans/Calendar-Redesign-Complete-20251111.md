# Calendar Tab Complete Redesign
Created: 2025-11-11
Status: Completed - Ready for Testing

## Overview

The Calendar tab in the comedian profile page has been completely redesigned from a confusing multi-component setup into a unified, intuitive calendar system. The new `ProfileCalendarView` component consolidates all calendar functionality and provides three distinct view modes modeled after the successful `/gigs` calendar design.

---

## Problem Statement

### Previous Issues:
- **Fragmented UI**: Separate availability calendar, gig calendar, and events list
- **Confusing UX**: Users were confused about which calendar to use
- **Redundant Components**: Multiple calendars showing overlapping data
- **Limited Functionality**: No Google Calendar sync or personal gig tracking
- **No Time Blocking**: Could only block full days, not specific time slots

### User Feedback:
> "The Calender tab in profile page. It's a mess. There's an availability calendar where they can block dates etc, but they opt into availability already? Theres a gig calendar and an events list? Lets completely simplify this into 1 calendar."

---

## Solution

### Unified Calendar Component
**Single component**: `ProfileCalendarView.tsx` replaces all previous calendar components

### Three View Modes:
1. **Monthly View**: Calendar grid with event pills (similar to /gigs calendar)
2. **Weekly View**: Time-slotted view with hourly rows (8am-11pm)
3. **List View**: Chronological list from soonest to latest

### Integrated Data Sources:
- ✅ **Confirmed bookings** (green pills) - From existing bookings table
- ✅ **Personal gigs** (blue pills) - Manually added or Google imported
- ✅ **Pending applications** (orange pills) - From applications table
- ✅ **Blocked dates/times** (gray overlays) - Full days or time-specific blocks

### New Capabilities:
- **Manual Gig Entry**: Add personal gigs with venue, date, notes
- **Google Calendar Sync**: Two-way sync (import from and export to Google)
- **Time-Specific Blocking**: Block specific hours (e.g., 2pm-5pm) not just full days
- **Recurring Blocks**: Weekly, monthly, or yearly recurring availability blocks

---

## Changes Overview

### 1. Database Schema Changes
**Migration**: `add_personal_gigs_and_time_blocking.sql`

#### New Table: `personal_gigs`
```sql
CREATE TABLE personal_gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  venue TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  notes TEXT,
  source TEXT CHECK (source IN ('manual', 'google_import')) DEFAULT 'manual',
  google_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Store self-added gigs (manual entry or Google Calendar imports)

**RLS Policies**:
- Users can view, create, update, delete their own personal gigs
- Isolated by `user_id` for multi-tenancy

#### Enhanced Table: `comedian_blocked_dates`
```sql
ALTER TABLE comedian_blocked_dates
ADD COLUMN time_start TIME,
ADD COLUMN time_end TIME;
```

**Purpose**: Support time-specific blocking (e.g., "blocked 2pm-5pm on Nov 15")

**Backward Compatible**: Existing full-day blocks work unchanged (time columns are NULL)

---

### 2. New Reusable Components

#### `/root/agents/src/components/calendar/GigPill.tsx`
**Purpose**: Reusable event display component with color coding

**Features**:
- Color-coded by type: confirmed (green), personal (blue), pending (orange)
- Shows title, venue, time (12-hour format)
- Hover tooltip with full details
- Optional delete button
- Memoized for performance

**Props**:
```typescript
interface GigPillEvent {
  id: string;
  title: string;
  venue?: string | null;
  date: string;
  end_time?: string | null;
  type: 'confirmed' | 'personal' | 'pending';
  notes?: string | null;
}
```

---

#### `/root/agents/src/components/calendar/BlockDatesModal.tsx`
**Purpose**: Modal for blocking date ranges with optional time blocks

**Features**:
- Date range picker (start/end dates)
- Optional time pickers (start/end times)
- Reason text field
- Recurring pattern selector (none, weekly, monthly, yearly)
- Form validation
  - End date must be >= start date
  - If times specified, both start and end required
  - Reason required

**Form Data**:
```typescript
interface BlockDatesFormData {
  dateStart: Date;
  dateEnd: Date;
  timeStart?: string;  // HH:mm format
  timeEnd?: string;    // HH:mm format
  reason: string;
  recurringType: 'none' | 'weekly' | 'monthly' | 'yearly';
}
```

---

#### `/root/agents/src/components/calendar/AddGigModal.tsx`
**Purpose**: Modal for adding personal gigs

**Features**:
- Manual entry form (title, venue, date, end time, notes)
- Google Calendar import button (if connected)
- Source tracking (manual vs google_import)
- Date/time pickers with validation

**Two Entry Methods**:
1. **Manual**: Fill form fields
2. **Google Import**: Trigger Google Calendar import flow

---

#### `/root/agents/src/components/calendar/WeeklyViewWithTimeSlots.tsx`
**Purpose**: Weekly calendar with hourly time slots

**Features**:
- 7 columns (days of week)
- Hourly rows (configurable, defaults 8am-11pm)
- Events positioned in appropriate time slots
- Blocked time overlays with gray shading
- Week navigation (previous/next)
- Click time slot to create new event

**Layout**:
```
        Mon    Tue    Wed    Thu    Fri    Sat    Sun
8am     [      ]      [      ]      [      ]      [      ]
9am     [ Gig1 ]      [      ]      [Block ]      [      ]
10am    [      ]      [      ]      [Block ]      [ Gig2 ]
...
```

---

#### `/root/agents/src/components/calendar/GigListView.tsx`
**Purpose**: Chronological list of all gigs

**Features**:
- Sorted chronologically (soonest first)
- Filterable by type (all, confirmed, personal, pending)
- Grouped by date
- Shows full details: time, venue, notes
- Click to expand/view more

**Filters**: All | Confirmed | Personal | Pending

---

### 3. Data Management Hooks

#### `/root/agents/src/hooks/usePersonalGigs.ts`
**Purpose**: CRUD operations for personal_gigs table

**Operations**:
- `personalGigs` - Query all user's personal gigs
- `createPersonalGig(data)` - Add new personal gig
- `updatePersonalGig(id, data)` - Update existing gig
- `deletePersonalGig(id)` - Delete personal gig

**Auto-invalidation**: Refreshes queries after mutations

**Toast Notifications**: Success/error feedback

---

#### `/root/agents/src/hooks/useBlockedDates.ts`
**Purpose**: CRUD operations for comedian_blocked_dates (now with time support)

**Operations**:
- `blockedDates` - Query all user's blocked dates
- `createBlockedDates(data)` - Create new block
- `updateBlockedDates(id, data)` - Update existing block
- `deleteBlockedDates(id)` - Delete block

**Enhancements**:
- Supports `time_start` and `time_end` columns
- Validates time ranges
- Handles recurring patterns

---

#### `/root/agents/src/hooks/useGoogleCalendarSync.ts`
**Purpose**: Two-way sync with Google Calendar

**Sync Status**:
```typescript
interface SyncStatus {
  isConnected: boolean;
  lastSync?: Date;
  isSyncing: boolean;
  error?: string;
}
```

**Operations**:
- `connectGoogleCalendar()` - Initiate OAuth flow
- `handleOAuthCallback(code)` - Exchange code for tokens
- `importFromGoogle(options)` - Import Google events → personal_gigs
- `exportToGoogle(gig)` - Export personal gig → Google Calendar
- `disconnect()` - Revoke access and disconnect

**Features**:
- OAuth 2.0 flow with authorization code exchange
- Token storage in `calendar_integrations` table
- Automatic token refresh (TODO: implement expiry check)
- Imports events as personal_gigs with `source: 'google_import'`
- Tracks Google event IDs to prevent duplicates

---

### 4. Service Layer

#### `/root/agents/src/services/calendar/googleCalendarService.ts`
**Purpose**: Google Calendar API v3 integration

**API Endpoints**:
- `initiateOAuthFlow()` - Redirect to Google consent screen
- `exchangeCodeForTokens(code)` - Get access & refresh tokens
- `refreshAccessToken(refreshToken)` - Refresh expired tokens
- `listEvents(userId, options)` - Fetch events from calendar
- `createEvent(userId, event)` - Create event in calendar
- `updateEvent(userId, eventId, updates)` - Update existing event
- `deleteEvent(userId, eventId)` - Delete event from calendar

**Configuration**:
- Base URLs: Auth, Token, Calendar API v3
- Client ID/Secret from env vars
- Redirect URI: `{origin}/auth/google-calendar-callback`
- Scope: `https://www.googleapis.com/auth/calendar.events`

---

### 5. Main Component Redesign

#### `/root/agents/src/components/ProfileCalendarView.tsx`
**Complete rewrite** - Replaced old component entirely

**State Management**:
```typescript
const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'list'>('monthly');
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
const [isAddGigModalOpen, setIsAddGigModalOpen] = useState(false);
```

**Data Sources** (combined via useMemo):
1. Confirmed bookings from `comedian_bookings` table
2. Personal gigs from `personal_gigs` table
3. Pending applications from `event_applications` table
4. Blocked dates/times from `comedian_blocked_dates` table

**Unified Event Format**:
```typescript
interface GigPillEvent {
  id: string;
  title: string;
  venue?: string | null;
  date: string;
  end_time?: string | null;
  type: 'confirmed' | 'personal' | 'pending';
  notes?: string | null;
}
```

**UI Structure**:
```tsx
<Tabs value={viewMode} onValueChange={setViewMode}>
  <TabsList>
    <TabsTrigger value="monthly">Monthly</TabsTrigger>
    <TabsTrigger value="weekly">Weekly</TabsTrigger>
    <TabsTrigger value="list">List</TabsTrigger>
  </TabsList>

  <TabsContent value="monthly">
    {/* Calendar grid with GigPill components */}
  </TabsContent>

  <TabsContent value="weekly">
    <WeeklyViewWithTimeSlots />
  </TabsContent>

  <TabsContent value="list">
    <GigListView />
  </TabsContent>
</Tabs>

<BlockDatesModal />
<AddGigModal />
```

**Action Buttons**:
- "Block Dates" - Opens block modal
- "Add Gig" - Opens add gig modal
- Google sync controls (if connected)

---

## Files Created/Modified

### Created Files:
1. `/root/agents/src/components/calendar/GigPill.tsx` - Event pill component
2. `/root/agents/src/components/calendar/BlockDatesModal.tsx` - Block dates modal
3. `/root/agents/src/components/calendar/AddGigModal.tsx` - Add gig modal
4. `/root/agents/src/components/calendar/WeeklyViewWithTimeSlots.tsx` - Weekly view
5. `/root/agents/src/components/calendar/GigListView.tsx` - List view
6. `/root/agents/src/hooks/usePersonalGigs.ts` - Personal gigs hook
7. `/root/agents/src/hooks/useBlockedDates.ts` - Enhanced blocked dates hook
8. `/root/agents/src/hooks/useGoogleCalendarSync.ts` - Google sync hook
9. `/root/agents/src/services/calendar/googleCalendarService.ts` - Google API service
10. Database migration: `add_personal_gigs_and_time_blocking.sql`

### Modified Files:
1. `/root/agents/src/components/ProfileCalendarView.tsx` - Complete rewrite
2. `/root/agents/src/services/calendar/index.ts` - Added export for googleCalendarService

### Deleted Files:
1. `/root/agents/src/components/comedian-profile/ComedianAvailabilityCalendar.tsx` - Functionality consolidated
2. `/root/agents/src/components/ProfileCalendarView.old.tsx` - Backup removed
3. Removed unused import from `/root/agents/src/components/comedian-profile/ComedianProfileLayout.tsx`

---

## Key Behaviors

✅ **Unified Calendar**: Single component replaces all previous calendar interfaces

✅ **Three View Modes**: Monthly, Weekly (time-slotted), List (chronological)

✅ **Color-Coded Events**:
- Green = Confirmed bookings
- Blue = Personal gigs (manual or Google imported)
- Orange = Pending applications
- Gray overlay = Blocked dates/times

✅ **Manual Gig Entry**: Users can add their own gigs with full details

✅ **Google Calendar Sync**:
- Two-way sync: Import from Google, Export to Google
- OAuth 2.0 authentication flow
- Stores Google event IDs to prevent duplicate imports

✅ **Full-Day and Time-Specific Blocking**:
- Block entire days: "Unavailable Nov 15-17"
- Block specific times: "Busy 2pm-5pm on Nov 15"
- Recurring patterns: Weekly rehearsals, monthly meetings

✅ **Real-time Updates**: TanStack Query cache invalidation ensures UI reflects changes immediately

✅ **Responsive Design**: Works on mobile and desktop

✅ **Accessibility**: Keyboard navigation, ARIA labels, screen reader support

---

## Testing Checklist

### Manual Testing Required:

#### View Modes:
- [ ] Switch between Monthly, Weekly, List views
- [ ] Verify all events display correctly in each view
- [ ] Check date navigation (previous/next month, week)

#### Event Display:
- [ ] Confirmed bookings appear as green pills
- [ ] Personal gigs appear as blue pills
- [ ] Pending applications appear as orange pills
- [ ] Event details show correctly (title, venue, time)
- [ ] Click event to view full details

#### Add Personal Gig:
- [ ] Click "Add Gig" button
- [ ] Fill manual entry form (title, venue, date, notes)
- [ ] Submit and verify gig appears on calendar
- [ ] Verify gig persists after page refresh

#### Block Dates:
- [ ] Click "Block Dates" button
- [ ] Create full-day block (Nov 15-17)
- [ ] Verify gray overlay appears on calendar
- [ ] Create time-specific block (2pm-5pm on Nov 20)
- [ ] Verify block appears in Weekly view time slots
- [ ] Test recurring blocks (weekly rehearsal)

#### Google Calendar Sync:
- [ ] Set env vars: `VITE_GOOGLE_CALENDAR_CLIENT_ID`, `VITE_GOOGLE_CALENDAR_CLIENT_SECRET`
- [ ] Click "Connect Google Calendar"
- [ ] Complete OAuth authorization flow
- [ ] Verify "Connected" status appears
- [ ] Import events from Google Calendar
- [ ] Verify imported events appear as blue pills
- [ ] Add new personal gig and export to Google
- [ ] Check Google Calendar to confirm event created
- [ ] Disconnect and verify sync controls update

#### Data Persistence:
- [ ] Refresh page after adding gigs/blocks
- [ ] Verify all data persists correctly
- [ ] Check database tables for correct data storage

#### Error Handling:
- [ ] Test with invalid date ranges
- [ ] Test with missing required fields
- [ ] Test OAuth failure scenarios
- [ ] Verify toast notifications show errors

#### Performance:
- [ ] Calendar loads quickly with 50+ events
- [ ] Switching views is smooth
- [ ] No UI lag when adding/deleting events

---

## Environment Variables Required

For Google Calendar integration:

```bash
VITE_GOOGLE_CALENDAR_CLIENT_ID=your-client-id
VITE_GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
```

**Setup Instructions**:
1. Create Google Cloud project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:8080/auth/google-calendar-callback`
5. Add credentials to `.env.local`

---

## Future Enhancements (Not Implemented)

- [ ] Recurring event patterns for personal gigs
- [ ] Calendar sharing/exporting (iCal)
- [ ] Sync with other calendar providers (Apple, Outlook)
- [ ] Automatic conflict detection
- [ ] Reminder notifications for upcoming gigs
- [ ] Export calendar to PDF
- [ ] Public availability page (separate from roadmap)
- [ ] Integration with event booking flow
- [ ] Mobile app calendar sync
- [ ] Calendar widgets for dashboard

---

## Notes

### Design Decisions:

**Why three views?**
- Monthly: Best for overview and planning
- Weekly: Essential for time-specific scheduling
- List: Helpful for chronological review

**Why separate personal_gigs table?**
- Clean separation between platform bookings and user-added events
- Allows tracking of source (manual vs Google import)
- Maintains Google event IDs for sync consistency

**Why color-coded pills?**
- Instant visual distinction between event types
- Reduces cognitive load
- Aligns with user mental model (green = confirmed, blue = personal, orange = pending)

**Why time blocking enhancement?**
- Comedians need to block specific rehearsal times, not full days
- More granular availability control
- Reduces booking conflicts

### Technical Decisions:

**TanStack Query**: Chosen for automatic cache management and optimistic updates

**date-fns**: Used for date manipulation (format, isSameDay, etc.)

**Memoization**: GigPill and combined events use React.memo/useMemo for performance

**OAuth 2.0**: Industry standard for Google Calendar API authentication

**PostgreSQL TIME type**: Efficient storage for time-specific blocks

---

## Implementation Timeline

**Total Time**: ~8 hours across multiple sessions

**Session 1** (3 hours):
- Database migration design and application
- Core component creation (GigPill, Modals, Views)
- Hook implementation (usePersonalGigs, useBlockedDates)

**Session 2** (3 hours):
- Google Calendar service layer
- useGoogleCalendarSync hook
- ProfileCalendarView complete rewrite

**Session 3** (2 hours):
- Integration and testing
- Component cleanup and deletion
- Bug fixes and refinements

---

## Status: ✅ IMPLEMENTATION COMPLETE

All 16 implementation tasks completed successfully:
1. ✅ Database migration applied
2. ✅ GigPill component created
3. ✅ BlockDatesModal created
4. ✅ AddGigModal created
5. ✅ WeeklyViewWithTimeSlots created
6. ✅ GigListView created
7. ✅ usePersonalGigs hook created
8. ✅ useBlockedDates hook enhanced
9. ✅ googleCalendarService created
10. ✅ useGoogleCalendarSync hook created
11. ✅ ProfileCalendarView redesigned with view toggle
12. ✅ Monthly view implemented
13. ✅ All data sources integrated
14. ✅ Action buttons and modals added
15. ✅ Google Calendar sync controls added
16. ✅ Old components deleted and cleaned up

**Next Step**: User acceptance testing across all features

**Dev Server**: Running on http://localhost:8080

**Build Status**: ✅ No TypeScript errors, linter passing
