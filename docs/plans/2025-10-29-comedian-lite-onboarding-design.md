# Comedian Lite Onboarding & Availability System - Design Document

**Created**: 2025-10-29
**Status**: Approved
**Implementation**: Ready

## Executive Summary

Complete redesign of comedian onboarding flow with gradual access model. Core goal: Get comedians to input their availability for the rest of the year while we perfect SSO and backend workflows. Introduces `comedian_lite` role with limited but focused feature access, availability selection on /gigs calendar, personal gig management, and automatic calendar sync.

## Strategic Goals

1. **User Acquisition**: Quick sign-up on /gigs with minimal friction
2. **Value Exchange**: Comedians provide availability data, we provide gig discovery
3. **Gradual Onboarding**: Limited access initially, unlock features (social media scheduler, etc.) as workflows mature
4. **Feedback Loop**: Feature Roadmap for users to request features and vote

## Architecture Overview

### 8 Major Components

1. **Time Fix** - Fix timezone bug showing 6am instead of correct times
2. **comedian_lite Role** - New limited access role for beta testing
3. **Quick Sign-Up** - Inline registration card on /gigs page
4. **Availability Selection** - Core feature: Click events to mark availability
5. **My Gigs + Calendar Sync** - Personal gig management with webcal subscription
6. **Feature Roadmap** - Kanban board for feature requests and voting
7. **Profile UI Improvements** - Polish existing components
8. **Auth Protection** - Security hardening for protected routes

### Priority Implementation Order

**Phase 1 (Critical - Week 1)**:
1. Time Fix
2. comedian_lite Role + Database migration
3. Quick Sign-Up
4. Availability Selection

**Phase 2 (Core Value - Week 2)**:
5. My Gigs + Calendar Sync
6. Notifications integration

**Phase 3 (Feedback & Polish - Week 3)**:
7. Feature Roadmap
8. Profile UI improvements
9. Auth protection hardening

## Component 1: Time Display Fix

### Problem
- Database stores `session_start_local` correctly in venue timezone
- `parseISO()` treats ambiguous timestamps as browser timezone
- Users in different timezones see wrong times (6am instead of 8pm)

### Solution
Extract time directly from ISO string without timezone parsing:

```typescript
const formatEventTime = (value: string | null | undefined) => {
  if (!value) return 'TBC';
  try {
    // Extract time: "2025-11-15T20:00:00" → "20:00"
    const timePart = value.slice(11, 16);
    const [hours, minutes] = timePart.split(':').map(Number);

    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  } catch (error) {
    return 'TBC';
  }
};
```

**Files**: `/root/agents/src/pages/Gigs.tsx` (lines 31-39)

## Component 2: comedian_lite Role System

### Purpose
Limited access role for new users to:
- Browse gigs and mark availability
- Manage personal calendar
- Access basic profile features
- Provide feedback via Feature Roadmap

### Database Migration

**File**: `20251029_add_comedian_lite_role.sql`

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comedian_lite';

COMMENT ON TYPE user_role IS
  'User roles: member, comedian, comedian_lite (limited), promoter, admin, etc.';
```

### Access Control

**comedian_lite CAN access** (13 items):
- Dashboard
- Gigs (with availability selection)
- My Gigs (personal gig management)
- Add Gig (manual entry)
- Calendar (view all gigs + sync)
- Notifications (booking confirmations)
- Profile (including Calendar tab)
- Vouches
- Settings
- Applications
- Media Library
- Feature Roadmap

**comedian_lite CANNOT access**:
- Shows, Messages, Browse pages, Tasks, Invoices, Earnings, Analytics, CRM, Admin pages, Social Media Manager

### Display Label
Role displays as **"Comedian"** in UI (not "comedian_lite") - backend distinction only.

**Implementation**:
```typescript
const getRoleDisplayName = (role: string): string => {
  if (role === 'comedian_lite') return 'Comedian';
  if (role === 'agency_manager') return 'Agency Manager';
  return role.charAt(0).toUpperCase() + role.slice(1);
};
```

## Component 3: Quick Sign-Up Card

### Purpose
Inline registration on /gigs page to reduce friction in sign-up flow.

### Requirements
- Only visible when user NOT logged in
- ProfileHeader-sized card (~200-250px height)
- Auto-assign `comedian_lite` role
- Fields: First Name, Last Name, Email, Password
- Default avatar (no upload)
- Validation: Password min 6 chars, email format

### User Flow
1. Visitor lands on /gigs
2. Sees QuickSignUpCard above calendar
3. Fills in 4 fields, clicks "Sign Up & Find Gigs"
4. Account created with comedian_lite role
5. Card disappears, calendar becomes interactive
6. Can immediately start marking availability

**File**: `/root/agents/src/components/auth/QuickSignUpCard.tsx` (new)

### Sign-Up API Call
```typescript
await signUp(email, password, {
  first_name: firstName,
  last_name: lastName,
  name: `${firstName} ${lastName}`,
  role: 'comedian_lite',
  roles: ['comedian_lite', 'member']
});
```

## Component 4: Availability Selection

### Purpose
**PRIMARY USE CASE**: Get comedians to mark their availability for rest of year.

### Database Schema

**File**: `20251029_create_comedian_availability.sql`

```sql
CREATE TABLE comedian_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events_htx(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_comedian_availability_user ON comedian_availability(user_id);
CREATE INDEX idx_comedian_availability_event ON comedian_availability(event_id);

-- RLS Policies
ALTER TABLE comedian_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own availability"
  ON comedian_availability FOR ALL
  USING (auth.uid() = user_id);
```

### UI Behavior

**Event Selection**:
- Each event card in /gigs calendar is clickable
- Click = toggle availability on/off
- Selected events show green checkmark or highlighted border
- Optimistic UI update (immediate visual feedback)

**Weekday Bulk Selection**:
- Weekday headers (Mon/Tue/Wed/Thu/Fri/Sat/Sun) are clickable buttons
- Click "Mon" = select ALL Monday events in **current month**
- Click again = deselect all Monday events in current month
- Visual feedback: "X events selected this month" counter

**Save Status Indicator**:
- Position: Top-right of calendar header
- States:
  - `<Loader2 className="w-3 h-3 animate-spin" /> Autosaving...` (during debounce)
  - `<Save className="w-3 h-3" /> Saved` (visible 2s after save)
  - Hidden when no recent activity
- Styling: `flex items-center gap-1.5 text-xs text-white/70`
- Icons: Lucide React (Loader2, Save)

**Debounced Auto-Save**:
- Waits 2 seconds after last click
- Batch saves all changes in single API call
- Prevents excessive database writes
- Toast notification on error only

### Technical Implementation

**New Hook**: `useAvailabilitySelection`
```typescript
interface UseAvailabilitySelectionReturn {
  selectedEvents: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  toggleEvent: (eventId: string) => void;
  selectWeekday: (weekday: number, events: Event[]) => void;
}
```

**Component State**:
- `/gigs` page maintains selection mode state
- Event cards render with selection styling when user logged in
- Weekday headers styled as buttons when interactive

## Component 5: My Gigs + Calendar Sync

### Three Calendar Views

**1. /gigs (Browse & Availability)**
- Platform gigs for discovery
- Interactive availability selection
- Weekday bulk selection
- NOT personal calendar

**2. My Gigs (Personal Management)**
- Manually add off-platform shows
- Form: Venue, Date, Time, Pay, Notes
- "Add Gig" button opens dialog
- Calendar subscription button

**3. Calendar (Unified View)**
- Platform confirmed bookings (purple)
- My Gigs manual entries (green)
- Read-only view
- Calendar subscription button

### Calendar Subscription (Webcal)

**Purpose**: Automatic sync to Google/Apple Calendar without .ics downloads.

**How It Works**:
1. User clicks "📅 Subscribe to Calendar" button
2. Backend generates unique webcal URL per user
3. Opens in native Calendar app or prompts for Google Calendar
4. Calendar app subscribes and auto-updates every 15-30 minutes
5. Confirmed gigs + My Gigs entries appear automatically

**Database Schema**:

**File**: `20251029_create_calendar_subscriptions.sql`

```sql
CREATE TABLE calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_token TEXT NOT NULL UNIQUE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_calendar_subscriptions_token ON calendar_subscriptions(subscription_token);
CREATE INDEX idx_calendar_subscriptions_user ON calendar_subscriptions(user_id);
```

**API Endpoint**:
- `GET /api/calendar/subscribe/:token`
- Returns iCal format feed
- No auth required (token is authentication)
- Rate limited to prevent abuse

**iCal Feed Contents**:
- Platform confirmed bookings (status: confirmed)
- User's manually added gigs from My Gigs
- Event details: Title, Location, Start/End time, Description, URL
- Auto-updates when gigs added/confirmed/removed

**Security**:
- Token: 32-byte cryptographically random string
- Stored hashed in database
- User can regenerate token (revokes old subscriptions)
- Rate limiting: 10 requests per minute per token

**UI Locations** (consistent across all three):
1. My Gigs page - Primary CTA
2. Calendar page - Natural location
3. Profile → Calendar tab - Settings area

**Subscription Dialog**:
```
Subscribe to Calendar
────────────────────────────────
Your gigs will automatically sync to your phone calendar.

[Add to iPhone/Mac Calendar]  (opens webcal:// link)
[Add to Google Calendar]      (opens Google Calendar with URL)

⚠️ Keep this link private - it gives access to your calendar.
[Regenerate Link] if you need to revoke access.
```

**Future Enhancement**: OAuth + Calendar API push for direct integration (post-MVP).

## Component 6: Feature Roadmap

### Purpose
Feedback collection system where users can:
- View features in progress
- Request new features
- Vote on features (upvote)
- Comment and discuss
- Track development stages

### Database Schema

**File**: `20251029_create_feature_roadmap_tables.sql`

```sql
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  category TEXT,
  priority INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('requested', 'under_review', 'planned', 'in_progress', 'completed'))
);

CREATE TABLE feature_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, user_id)
);

CREATE TABLE feature_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Kanban Board

**5 Columns**:
1. **Requested** - Community feature requests
2. **Under Review** - Team evaluation in progress
3. **Planned** - Approved for development
4. **In Progress** - Currently being built
5. **Completed** - Shipped features

**Features**:
- Drag-and-drop between columns (admin only)
- Vote counter with upvote button
- Category badges
- Comment count indicator
- "Request Feature" button
- Click card → Detail dialog with comments

**User Permissions**:
- All users: View, vote, comment, request features
- Admins: Change status, edit/delete any feature, set priority

**RLS Policies**:
- Public read on all tables
- Authenticated users can create requests, votes, comments
- Users can edit/delete own content
- Admins can modify all content

### Components

**New Files**:
- `/root/agents/src/pages/Roadmap.tsx` - Main kanban board
- `/root/agents/src/components/roadmap/FeatureCard.tsx` - Card component
- `/root/agents/src/components/roadmap/FeatureDetailDialog.tsx` - Detail view
- `/root/agents/src/components/roadmap/RequestFeatureDialog.tsx` - Request form
- `/root/agents/src/services/roadmap/roadmap-service.ts` - API layer
- `/root/agents/src/hooks/useRoadmap.ts` - TanStack Query hooks

## Component 7: Profile UI Improvements

### ProfileHeader
- Remove ribbon vouch button (keep Crown only)
- Wire Messages button to `/messages` route

### Social Media & Links
- Default visible: Instagram, YouTube, Website
- Hidden until + clicked: Twitter, TikTok, Facebook, LinkedIn
- Remove "URL" text from platform headings
- Remove green preview text under inputs
- Keep validation indicators

### Media Portfolio
**Videos**:
- YouTube only (remove Google Drive option)
- Explainer text: "Upload videos as Unlisted to YouTube, then paste link here"

**Photos**:
- Rename "Photos" tab to "Media Library"
- Remove "Featured" checkbox
- Remove featured badge display
- Style upload button to match primary actions

## Component 8: Auth Protection

### Protected Routes
- Homepage (/) redirects to /auth if not logged in
- Shows, Dashboard, Profile require authentication
- Loading spinner during auth check
- Null render if not authenticated

### Public Routes (No Auth Required)
- /auth - Auth page
- /gigs - Gigs page with QuickSignUpCard
- /:profileType/:slug/* - Public profile pages

## Database Migration Strategy

### Migration Files (in order)

1. **`20251029_add_comedian_lite_role.sql`**
   - Add comedian_lite to user_role enum
   - Non-breaking, safe to run first

2. **`20251029_create_comedian_availability.sql`**
   - Create comedian_availability table
   - Indexes and RLS policies
   - No dependencies on other migrations

3. **`20251029_create_calendar_subscriptions.sql`**
   - Create calendar_subscriptions table
   - Token storage and management
   - Independent of other tables

4. **`20251029_create_feature_roadmap_tables.sql`**
   - Create feature_requests, feature_votes, feature_comments
   - Indexes and RLS policies
   - Independent system

### Deployment Sequence

1. Run all 4 migrations together (no dependencies between them)
2. Regenerate Supabase types: `npx supabase gen types typescript`
3. Deploy code changes
4. Monitor for errors

### Rollback Strategy
- All tables are new (safe to drop if needed)
- comedian_lite enum value is additive (safe to leave)
- No data migration required
- No breaking changes to existing features

## TypeScript Type Updates

### Files to Modify

**1. `/root/agents/src/types/auth.ts`**
```typescript
export interface UserRole {
  id: string;
  user_id: string;
  role: 'member' | 'comedian' | 'comedian_lite' | 'promoter' | 'admin' | ...;
  created_at: string;
}
```

**2. `/root/agents/src/config/sidebarMenuItems.tsx`**
```typescript
export type UserRole = 'comedian' | 'comedian_lite' | 'promoter' | ...;

// Add comedian_lite to relevant menu items
{
  id: 'gigs',
  roles: ['comedian', 'comedian_lite', 'promoter', ...]
}

// Add new menu item
{
  id: 'roadmap',
  label: 'Feature Roadmap',
  path: '/roadmap',
  icon: Lightbulb,
  roles: ['comedian', 'comedian_lite', 'promoter', ...],
  section: 'account'
}
```

**3. `/root/agents/src/contexts/AuthContext.tsx`**
```typescript
const hasRole = useCallback((role: 'member' | 'comedian' | 'comedian_lite' | ...) => {
  return roles.some(userRole => userRole.role === role);
}, [roles]);
```

## Testing Checklist

### Time Display
- [ ] Events show correct times (not 6am)
- [ ] 8pm shows display as 8pm regardless of browser timezone
- [ ] Time format: 12-hour with am/pm

### comedian_lite Role
- [ ] QuickSignUp creates comedian_lite account
- [ ] Sidebar shows 13 allowed items only
- [ ] Role displays as "Comedian" in UI
- [ ] Can access all allowed pages
- [ ] Cannot access restricted pages (redirects)

### Availability Selection
- [ ] Click event toggles selection (green highlight)
- [ ] Click weekday selects all events for that day in month
- [ ] Status shows "Autosaving..." during debounce
- [ ] Status shows "Saved" after successful save
- [ ] Selection persists after page refresh
- [ ] Optimistic UI updates (immediate feedback)

### My Gigs + Calendar
- [ ] Can add manual gig with all fields
- [ ] Manual gigs appear in Calendar view (green)
- [ ] Platform bookings appear in Calendar view (purple)
- [ ] Calendar subscription button visible in 3 locations
- [ ] Subscription dialog opens with platform options
- [ ] Webcal URL generated and stored
- [ ] iCal feed accessible via subscription URL
- [ ] Feed contains confirmed + manual gigs
- [ ] Token regeneration works and revokes old URL

### Feature Roadmap
- [ ] Roadmap accessible at /roadmap
- [ ] 5 columns display correctly
- [ ] Features grouped by status
- [ ] Vote button adds/removes vote
- [ ] Vote count updates in real-time
- [ ] Vote button highlights when voted
- [ ] Click card opens detail dialog
- [ ] Comments display with avatars
- [ ] Can add new comment
- [ ] Can edit/delete own comments
- [ ] "Request Feature" opens form
- [ ] Can submit new feature
- [ ] Feature appears in "Requested" column
- [ ] Admin can drag features (non-admins cannot)
- [ ] Status updates when card moved

### Profile UI
- [ ] One vouch button (Crown only)
- [ ] Messages navigates to /messages
- [ ] Social shows 3 defaults, + reveals more
- [ ] No "URL" text in headings
- [ ] No green preview text
- [ ] Video: YouTube only with explainer
- [ ] Media Library tab renamed
- [ ] Featured checkbox hidden
- [ ] Upload button matches primary styling

### Auth Protection
- [ ] Homepage redirects to /auth when logged out
- [ ] Shows redirects to /auth when logged out
- [ ] /gigs accessible without login
- [ ] /auth accessible without login
- [ ] Loading spinner shows during auth check

## Success Metrics

### Acquisition
- Number of comedian_lite sign-ups from /gigs
- Time to first sign-up (reduce friction)
- Conversion rate: visitor → sign-up

### Engagement
- Number of events marked available per user
- Percentage of users who mark availability
- Number of manual gigs added
- Calendar subscription adoption rate

### Retention
- Weekly active users (comedian_lite)
- Days until first availability marked
- Feature request submission rate
- Feature upvote engagement

### Feedback Loop
- Feature requests submitted
- Average votes per feature
- Comment engagement
- Time to respond to requests

## Future Enhancements (Post-MVP)

### Short Term (After SSO Perfected)
- Social media scheduler integration
- Messages system for comedian_lite
- Full booking management in Calendar
- Upgrade path: comedian_lite → comedian

### Medium Term
- OAuth calendar push (Google/Apple Calendar API)
- Availability analytics for promoters
- Smart gig recommendations based on availability
- Batch availability import (CSV)

### Long Term
- AI-powered availability suggestions
- Conflict detection and warnings
- Multi-calendar sync (personal + work)
- Team calendar sharing (for agencies)

## Technical Notes

- Uses existing `react-beautiful-dnd` for Feature Roadmap drag-and-drop
- Follows established kanban patterns from CRM (DealKanbanBoard)
- TanStack Query for all data fetching (5min stale, 10min cache)
- Optimistic UI updates for availability selection
- Debounced saves prevent excessive API calls
- All new tables have proper indexes for performance
- RLS policies ensure data isolation and security
- Webcal subscription uses standard iCal format (RFC 5545)

## Design Decisions & Rationale

### Why comedian_lite vs Full Comedian?
Gradual onboarding reduces overwhelm and lets us perfect core workflows before exposing full feature set. Users prove intent by marking availability before unlocking premium features.

### Why Debounced Auto-Save?
Balance between modern auto-save UX and server efficiency. 2-second debounce allows rapid clicking without excessive API calls.

### Why Webcal vs OAuth?
Webcal works universally (Google, Apple, Outlook) with zero OAuth complexity. Gets feature shipped faster. OAuth can be added later for premium users.

### Why Simple Toggle vs Status States?
YAGNI - "available" vs "not available" covers 95% of use cases. Status states (maybe, definitely, etc.) add complexity without clear value. Can add later if users request it.

### Why Current Month for Weekday Selection?
Predictable scope - users can see all affected events on screen. Prevents accidental bulk selection of future months user hasn't reviewed yet.

---

**End of Design Document**
