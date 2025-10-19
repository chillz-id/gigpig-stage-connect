# Multi-Profile Switching System - Design Plan

**Status:** Design Phase Complete - Ready for Implementation
**Created:** 2025-01-18
**Last Updated:** 2025-01-18

## Overview

This document outlines the comprehensive design and implementation plan for a multi-profile switching system that allows users to maintain multiple profile types (Comedian, Promoter, Manager, Photographer, Videographer) under a single account and switch between them seamlessly.

## Problem Statement

Currently, users with multiple roles see a single sidebar based on their primary role. However, the platform needs to support users who want to operate in different capacities. For example:
- A user who is both a promoter and a manager
- A comedian who also works as a photographer
- A promoter who manages other comedians

Users need the ability to explicitly switch between their profile contexts, with each profile having its own appropriate navigation and features.

## Current State

### Completed Work
- ✅ Platform-wide sidebar navigation system implemented
- ✅ ComedianSidebar with Manager Features section
- ✅ PromoterSidebar with role-based access
- ✅ PlatformLayout with role-based sidebar selection
- ✅ Mobile responsive navigation (bottom sheet)
- ✅ CRM route detection to avoid layout conflicts

### Database Architecture (Already Supports Multi-Profile)
- `profiles` - Base user profile table
- `user_roles` - Many-to-many role assignments
- `photographer_profiles` - Photographer-specific data
- `promoter_stats`, `promoter_venues`, etc. - Promoter ecosystem
- Pattern extends naturally to manager, videographer profiles

## Design Decisions

### 1. Profile Switcher Placement
**Decision:** Place above Dashboard option in sidebar
**Rationale:**
- Most prominent placement for frequent use
- Users see it immediately upon opening sidebar
- Establishes context before navigating to features
- Follows mental model: "Who am I?" → "Where do I go?"

### 2. Profile Switching Pattern
**Decision:** Instant context switching without page reload
**Rationale:**
- Better UX than full page reload
- Preserves application state where possible
- Feels like native profile switching
- Minimizes loading states

### 3. Database Schema
**Decision:** No changes to existing schema, only add new profile tables
**Rationale:**
- Existing architecture already supports multi-profile pattern
- Only need to add `manager_profiles` and `videographer_profiles`
- Maintains consistency with existing photographer/promoter patterns

## Architecture Design

### 1. ProfileContext Provider

**Location:** `src/contexts/ProfileContext.tsx`

**Interface:**
```typescript
interface ProfileType {
  type: 'comedian' | 'promoter' | 'manager' | 'photographer' | 'videographer';
  label: string;
  icon: LucideIcon;
}

interface ProfileContextValue {
  activeProfile: ProfileType['type'] | null;
  availableProfiles: ProfileType['type'][];
  switchProfile: (type: ProfileType['type']) => void;
  isLoading: boolean;
  hasProfile: (type: ProfileType['type']) => boolean;
}
```

**Features:**
- Manages active profile state across the app
- Persists selection to localStorage (`active-profile-type`)
- Fetches available profiles from `user_roles` table
- Provides seamless profile switching
- Validates profile availability before switching

**Provider Hierarchy:**
```
ErrorBoundary
  → HelmetProvider
    → QueryClientProvider
      → ThemeProvider
        → AuthProvider
          → UserProvider
            → ProfileProvider (NEW)
              → DesignSystemInitializer
                → Router
```

### 2. Profile Switcher Component

**Location:** `src/components/layout/ProfileSwitcher.tsx`

**Desktop (Expanded Sidebar):**
```
┌─────────────────────────────┐
│  [Logo] Stand Up Sydney [≡] │
├─────────────────────────────┤
│  👤 Active: Promoter        │
│     Switch Profile ▼        │
├─────────────────────────────┤
│  📊 Dashboard               │
│  📅 Events                  │
│  ...                        │
```

**Desktop (Collapsed Sidebar):**
```
┌──────┐
│ [≡]  │
├──────┤
│ 👤▼  │ ← Shows icon + dropdown indicator
├──────┤
│ 📊   │
│ 📅   │
```

**Dropdown Menu:**
```
┌─────────────────────────────┐
│ ✓ Promoter Profile          │  ← Active (checkmark)
│   Comedian Profile          │
│   Manager Profile           │
│   Photographer Profile      │
├─────────────────────────────┤
│ + Create New Profile        │
└─────────────────────────────┘
```

**Visual Specifications:**
- Background: `bg-gray-800/60` (slightly lighter than sidebar bg)
- Hover: `hover:bg-gray-700`
- Active profile indicator: Purple accent (`text-purple-400`)
- Icon size: `h-5 w-5`
- Padding: `p-3` (matches other menu items)
- Uses shadcn/ui `DropdownMenu` component
- Max height: `max-h-[400px]` with scroll
- Disabled profiles: Gray out if profile incomplete

### 3. Sidebar Variants

#### ComedianSidebar ✅ (Already Exists)
**Sections:**
- Dashboard
- Opportunities (Browse Shows, Comedians, Photographers)
- My Work (Applications, Calendar, Add Gig)
- Business (Invoices, Earnings)
- Manager Features* (conditional: Agency, CRM, Analytics)
- Account (Profile, Messages, Notifications, Settings)

#### PromoterSidebar ✅ (Already Exists)
**Sections:**
- Dashboard
- Events (All Shows, Create Event, My Events)
- Talent (Browse Comedians, Book Comedian, Applications, Photographers)
- Business (CRM, Agency, Invoices)
- Account (Profile, Messages, Notifications, Admin)

#### ManagerSidebar (New)
**Sections:**
- Dashboard
- Clients (comedian roster management)
- Events (all client events)
- Bookings (booking requests/negotiations)
- Business
  - Agency Management
  - CRM
  - Contracts
  - Financials
- Account (Profile, Messages, Notifications, Settings)

#### PhotographerSidebar (New)
**Sections:**
- Dashboard
- Browse Events (events needing photographers)
- My Bookings
- Portfolio
- Business
  - Invoices
  - Earnings
  - Equipment
- Account (Profile, Messages, Notifications, Settings)

#### VideographerSidebar (New)
**Sections:**
- Dashboard
- Browse Events (events needing videographers)
- My Bookings
- Portfolio (video reel)
- Business
  - Invoices
  - Earnings
  - Equipment
- Account (Profile, Messages, Notifications, Settings)

### 4. Profile Creation Workflow

#### Entry Points
1. **During Onboarding:** After sign-up, prompt "What type of profile do you want to create?"
2. **From Profile Switcher:** "+ Create New Profile" option in dropdown
3. **From Settings:** "Manage Profiles" section

#### Profile Creation Flow

**Step 1: Select Profile Type**
```
What type of profile do you want to create?

[🎭 Comedian]     [🎪 Promoter]     [💼 Manager]
[📸 Photographer] [🎥 Videographer]
```

**Step 2: Profile-Specific Form**

**Comedian Profile:**
- Stage name
- Bio/description
- Experience level
- Comedy styles (stand-up, improv, sketch, etc.)
- Performance preferences
- Social links
- Video/demo links

**Promoter Profile:**
- Organization name
- Venue affiliations
- Event types produced
- Capacity range
- Business registration details
- ABN/GST (for invoicing)

**Manager Profile:**
- Agency name
- Represented comedians
- Contact preferences
- Commission structure
- Business details

**Photographer Profile:**
- Specialties (live performance, headshots, event coverage)
- Equipment list
- Portfolio URL
- Rate structure (hourly/per event)
- Experience years
- Coverage area/availability

**Videographer Profile:**
- Specialties (live performance, promos, showreels)
- Equipment list
- Portfolio/reel URL
- Rate structure (hourly/per event)
- Experience years
- Coverage area/availability

**Step 3: Verification (if applicable)**
- Email verification for business profiles
- ABN/GST verification for invoicing capabilities
- Portfolio review for photographer/videographer (optional)

### 5. Route Protection & Profile Context

#### Updated ProtectedRoute Component
```typescript
interface ProtectedRouteProps {
  roles?: string[];
  requiredProfile?: ProfileType['type']; // NEW
  children: ReactNode;
}

const ProtectedRoute = ({ roles, requiredProfile, children }: ProtectedRouteProps) => {
  const { hasRole } = useAuth();
  const { activeProfile } = useProfile(); // NEW

  // Check if specific profile type is required for this route
  if (requiredProfile && activeProfile !== requiredProfile) {
    // Show profile mismatch warning and redirect
    return <ProfileMismatchGuard requiredProfile={requiredProfile} />;
  }

  // Existing role-based checks
  if (roles && !roles.some(role => hasRole(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

#### Profile-Specific Routes
- `/dashboard/comedian` - Comedian dashboard view
- `/dashboard/promoter` - Promoter dashboard view
- `/dashboard/manager` - Manager dashboard view
- `/dashboard/photographer` - Photographer dashboard view
- `/dashboard/videographer` - Videographer dashboard view

#### Profile Switching Logic
```typescript
// In ProfileContext
const switchProfile = (type: ProfileType['type']) => {
  setActiveProfile(type);
  localStorage.setItem('active-profile-type', type);

  // Validate current route is accessible with new profile
  const currentPath = location.pathname;
  if (!isRouteAccessible(currentPath, type)) {
    navigate('/dashboard');
  }
};
```

## Database Schema

### New Tables Required

#### manager_profiles
```sql
CREATE TABLE IF NOT EXISTS public.manager_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  bio TEXT,
  commission_rate DECIMAL(5,2),
  client_roster TEXT[], -- Array of comedian profile IDs
  business_registration TEXT,
  abn TEXT,
  gst_registered BOOLEAN DEFAULT false,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manager_profiles_agency_name ON public.manager_profiles(agency_name);
CREATE INDEX idx_manager_profiles_created_at ON public.manager_profiles(created_at);
```

#### videographer_profiles
```sql
CREATE TABLE IF NOT EXISTS public.videographer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialties TEXT[] DEFAULT '{}', -- live_performance, promos, showreels, etc.
  experience_years INTEGER,
  equipment TEXT,
  portfolio_url TEXT,
  demo_reel_url TEXT,
  rate_per_hour DECIMAL(10,2),
  rate_per_event DECIMAL(10,2),
  coverage_area TEXT,
  availability_notes TEXT,
  turnaround_time_days INTEGER,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videographer_profiles_specialties ON public.videographer_profiles USING GIN(specialties);
CREATE INDEX idx_videographer_profiles_created_at ON public.videographer_profiles(created_at);
```

### RLS Policies
```sql
-- manager_profiles RLS
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own manager profile"
  ON public.manager_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own manager profile"
  ON public.manager_profiles FOR UPDATE
  USING (auth.uid() = id);

-- videographer_profiles RLS (similar to photographer_profiles)
ALTER TABLE public.videographer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view videographer profiles"
  ON public.videographer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own videographer profile"
  ON public.videographer_profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Implementation Roadmap

### Phase 1: Core Profile Context (Week 1)
**Epic:** Profile Context & Switching Infrastructure

**Tasks:**
1. Create `ProfileContext.tsx` provider
   - Define ProfileType interface
   - Implement localStorage persistence
   - Fetch available profiles from user_roles
   - Add loading and error states

2. Create `ProfileSwitcher.tsx` component
   - Design dropdown UI with shadcn/ui
   - Show active profile with checkmark
   - Handle profile switching
   - Add "+ Create New Profile" option

3. Update `PlatformLayout.tsx`
   - Replace role-based logic with profile context
   - Render correct sidebar based on activeProfile
   - Add smooth transition animations

4. Add ProfileProvider to App.tsx
   - Insert below UserProvider
   - Ensure proper provider hierarchy

5. Update route guards
   - Modify ProtectedRoute to support requiredProfile
   - Create ProfileMismatchGuard component

**Acceptance Criteria:**
- Users can see profile switcher above Dashboard
- Profile selection persists across page reloads
- Sidebar updates instantly when switching profiles
- Only available profiles show in dropdown

---

### Phase 2: Additional Sidebar Variants (Week 1-2)
**Epic:** Profile-Specific Navigation

**Tasks:**
1. Create `ManagerSidebar.tsx`
   - Dashboard, Clients, Events, Bookings sections
   - Business section (Agency, CRM, Contracts, Financials)
   - Account section

2. Create `PhotographerSidebar.tsx`
   - Dashboard, Browse Events, My Bookings, Portfolio sections
   - Business section (Invoices, Earnings, Equipment)
   - Account section

3. Create `VideographerSidebar.tsx`
   - Similar to PhotographerSidebar
   - Video-specific terminology and features
   - Portfolio becomes "Video Reel"

4. Update PlatformLayout sidebar rendering
   - Switch statement based on activeProfile
   - Handle profile transitions smoothly
   - Add fallback for null activeProfile

5. Test all sidebar variants
   - Verify navigation links work correctly
   - Test collapsed/expanded states
   - Verify mobile bottom sheet behavior

**Acceptance Criteria:**
- All 5 sidebar variants render correctly
- Navigation items appropriate for each profile type
- Smooth transitions between sidebars
- Mobile navigation works for all profiles

---

### Phase 3: Database & Profile Management (Week 2)
**Epic:** Profile Creation & Management

**Tasks:**
1. Create database migration for manager_profiles
   - Table structure with all fields
   - RLS policies for security
   - Indexes for performance

2. Create database migration for videographer_profiles
   - Similar structure to photographer_profiles
   - Video-specific fields (demo_reel_url, turnaround_time)
   - RLS policies

3. Generate TypeScript types
   - Run Supabase type generation
   - Update imports in components

4. Create profile creation wizard
   - Profile type selection screen
   - Profile-specific form components
   - Validation with Zod schemas

5. Build ProfileManagement page
   - View all user's profiles
   - Edit existing profiles
   - Create new profiles
   - Delete profiles (with confirmation)

6. Add profile completion checks
   - Track profile completion status
   - Show "Profile Incomplete" badges
   - Redirect to complete profile form

**Acceptance Criteria:**
- Database migrations run successfully
- Users can create new profiles via wizard
- Profile forms validate correctly
- Users can manage profiles in Settings
- Incomplete profiles marked clearly

---

### Phase 4: Profile-Specific Features (Week 2-3)
**Epic:** Profile Context Integration

**Tasks:**
1. Create profile-specific dashboard views
   - ComedianDashboard component
   - PromoterDashboard component
   - ManagerDashboard component
   - PhotographerDashboard component
   - VideographerDashboard component

2. Update existing pages to use profile context
   - Applications page (comedian vs promoter view)
   - Events pages (create/edit based on profile)
   - Booking pages (context-aware)

3. Implement profile-aware data fetching
   - Filter queries by active profile
   - Show profile-relevant data only
   - Handle profile switching in queries

4. Add profile context to navigation
   - Update breadcrumbs with profile context
   - Show profile indicator in page headers
   - Add profile-specific quick actions

5. Handle incomplete profile scenarios
   - Redirect to profile completion
   - Show feature restrictions
   - Provide clear guidance

**Acceptance Criteria:**
- Dashboard shows profile-specific content
- Data fetching respects active profile
- Users can't access features without complete profiles
- Clear messaging for profile requirements

---

### Phase 5: Testing & Polish (Week 3)
**Epic:** Quality Assurance & Refinement

**Tasks:**
1. Write unit tests
   - ProfileContext provider tests
   - ProfileSwitcher component tests
   - Profile-specific hooks tests

2. Write integration tests
   - Profile switching flows
   - Profile creation workflows
   - Route protection with profiles

3. Write E2E tests
   - Full profile switching journey
   - Create multiple profiles
   - Switch and navigate
   - Mobile profile switching

4. Performance optimization
   - Minimize re-renders on profile switch
   - Optimize profile data fetching
   - Add loading skeletons

5. Accessibility audit
   - Keyboard navigation for profile switcher
   - Screen reader announcements
   - Focus management on switch
   - ARIA labels and roles

6. User testing & feedback
   - Test with real users
   - Gather feedback on UX
   - Iterate on pain points

**Acceptance Criteria:**
- 80%+ test coverage for new code
- All E2E tests pass
- No accessibility violations
- Performance metrics within targets
- User feedback incorporated

---

## Technical Considerations

### State Management
- ProfileContext wraps entire app (below AuthProvider, above Router)
- Active profile stored in localStorage: `active-profile-type`
- Available profiles fetched from user_roles on auth change
- Profile switcher disabled during loading/switching

### Performance
- Memoize sidebar components to prevent unnecessary re-renders
- Use React.lazy for profile-specific dashboard views
- Cache profile data with TanStack Query
- Debounce profile switching if multiple rapid switches

### Error Handling
- Handle profile fetch failures gracefully
- Show error state in profile switcher
- Fallback to first available profile if saved profile invalid
- Clear localStorage if profile data corrupted

### Accessibility
- Profile switcher keyboard navigable (Space/Enter to open, Arrow keys to select)
- Announce profile switches to screen readers
- Focus management when opening/closing dropdown
- High contrast mode support

### Mobile Considerations
- Profile switcher in mobile bottom sheet
- Swipe gestures for profile switching (optional)
- Larger touch targets for mobile
- Consider profile switcher in mobile header as well

### Browser Support
- localStorage fallback if not available
- sessionStorage as backup
- Cookie-based persistence for older browsers

## Migration Strategy

### For Existing Users
1. On first load after deployment, detect users with multiple roles
2. Show onboarding modal explaining new profile system
3. Auto-create profiles for existing roles
4. Guide user through profile completion
5. Set default active profile based on most recent activity

### Data Migration
- No data migration needed - existing tables remain unchanged
- Only need to add new profile tables for manager/videographer
- Existing photographer_profiles data remains intact

## Success Metrics

### User Adoption
- % of users with multiple profiles
- Frequency of profile switching
- Time spent in each profile context

### User Satisfaction
- NPS score for multi-profile feature
- Support tickets related to profile confusion (should decrease)
- User feedback survey responses

### Performance
- Profile switch time < 200ms
- No performance degradation with profile context
- Sidebar render time < 50ms

### Engagement
- Increased feature usage across profile types
- More complete profiles
- Higher retention for multi-role users

## Future Enhancements

### ✅ Phase 6: Profile-Specific Dashboards (COMPLETE)
**Status:** Completed January 19, 2025
**Documentation:** [PHASE_6_PROFILE_DASHBOARDS.md](PHASE_6_PROFILE_DASHBOARDS.md)

- [x] ComedianDashboard with real data integration
- [x] PromoterDashboard with real data integration
- [x] ManagerDashboard (placeholder, ready for backend)
- [x] PhotographerDashboard (placeholder, ready for backend)
- [x] VideographerDashboard (placeholder, ready for backend)
- [x] Profile-aware routing in Dashboard.tsx
- [x] Profile-specific metrics and KPIs
- [x] Theme support across all dashboards

---

### ✅ Phase 7: Advanced Features (COMPLETE)
**Status:** Completed January 19, 2025
**Documentation:** [PHASE_7_ADVANCED_FEATURES.md](PHASE_7_ADVANCED_FEATURES.md)

- [x] ProfileContextBadge component
- [x] ProfileContextIndicator component
- [x] PageHeader reusable component
- [x] Applications page with profile context
- [x] Shows page with profile-aware titles
- [x] Profile-specific colors (red, purple, blue, orange, teal)

---

### 📋 Phase 8: Data Integration (DOCUMENTED - Ready to Implement)
**Status:** Documented January 19, 2025
**Duration:** 2-3 weeks (estimated)
**Documentation:** [PHASE_8_DATA_INTEGRATION_PLAN.md](PHASE_8_DATA_INTEGRATION_PLAN.md)

**Sub-phase 8A: Profile-Aware Data Hooks (Week 1)**
- [ ] Convert existing hooks to profile-aware pattern
- [ ] Implement `useProfileAwareQuery` wrapper
- [ ] Convert high-priority hooks: `useEvents`, `useApplications`, `useGigs`
- [ ] Update dashboard components to use new hooks
- [ ] Documentation: [PHASE_8_PROFILE_AWARE_HOOKS.md](PHASE_8_PROFILE_AWARE_HOOKS.md)

**Sub-phase 8B: Profile-Specific Filtering (Week 1-2)**
- [ ] Add profile-aware filters to Shows/Events page
- [ ] Add profile-aware filters to Applications page
- [ ] Add profile-aware filters to Browse pages
- [ ] Profile-specific search parameters and sorting

**Sub-phase 8C: Backend Queries (Week 2)**
- [ ] Manager dashboard: Real client roster data
- [ ] Manager dashboard: Commission tracking
- [ ] Photographer dashboard: Booking overview
- [ ] Videographer dashboard: Project tracking
- [ ] Database schema additions (manager_clients, photographer_bookings, etc.)
- [ ] Optimized database functions and indexes
- [ ] Documentation: [PHASE_8_NOTIFICATIONS_AND_QUERIES.md](PHASE_8_NOTIFICATIONS_AND_QUERIES.md)

**Sub-phase 8D: Profile-Specific Notifications (Week 2-3)**
- [ ] Create profile notification settings table
- [ ] Implement notification types per profile
- [ ] Create NotificationCenter component
- [ ] Create NotificationSettings component
- [ ] Email notification templates
- [ ] PWA push notification support
- [ ] Documentation: [PHASE_8_NOTIFICATIONS_AND_QUERIES.md](PHASE_8_NOTIFICATIONS_AND_QUERIES.md)

**Sub-phase 8E: Dashboard Widget Customization (Week 3)**
- [ ] Install react-grid-layout
- [ ] Create widget registry system
- [ ] Implement WidgetGrid component
- [ ] Create 15-20 widgets (5 universal, 3-4 per profile)
- [ ] Widget library modal
- [ ] Layout persistence (localStorage + database)
- [ ] Mobile responsive widgets
- [ ] Documentation: [PHASE_8_DASHBOARD_WIDGETS.md](PHASE_8_DASHBOARD_WIDGETS.md)

**Phase 8 Success Metrics:**
- 100% of data queries respect active profile
- Dashboard load time: <1s
- Profile switch with data refetch: <500ms
- 60% of multi-profile users customize dashboard within first week
- Zero cross-profile data leaks

---

### Phase 9+: Future Enhancements (Not Yet Planned)
- Profile analytics and usage tracking
- Profile collaboration (manager → comedian access with permissions)
- Profile verification/badges system
- Quick profile switch keyboard shortcut (Cmd+Shift+P)
- Profile themes and custom branding
- Profile presets/templates
- Cross-profile insights dashboard
- Profile activity heat maps
- Export/import profile templates
- Profile marketplace (services directory)

## Appendix

### Related Documentation
- `/root/agents/CLAUDE.md` - Project overview and conventions
- `/root/agents/AGENTS.md` - Contributor workflow
- `/root/agents/docs/crm/` - CRM integration documentation
- Sidebar components in `/root/agents/src/components/layout/`

### Key Files Modified
- `src/App.tsx` - Add ProfileProvider
- `src/contexts/ProfileContext.tsx` - NEW
- `src/components/layout/ProfileSwitcher.tsx` - NEW
- `src/components/layout/PlatformLayout.tsx` - Update to use profile context
- `src/components/layout/ManagerSidebar.tsx` - NEW
- `src/components/layout/PhotographerSidebar.tsx` - NEW
- `src/components/layout/VideographerSidebar.tsx` - NEW
- `src/components/ProtectedRoute.tsx` - Add profile-based guards

### Dependencies
- All existing dependencies sufficient
- No new npm packages required

---

**Document Version:** 1.0
**Next Review:** After Phase 1 completion
**Owner:** Development Team
