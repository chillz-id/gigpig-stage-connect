# Phase 8: Data Integration - Implementation Plan

**Status:** 📋 DOCUMENTED - Ready to Implement
**Created:** January 19, 2025
**Phase Duration:** 2-3 weeks (estimated)
**Prerequisites:** Phases 1-7 Complete ✅

---

## 🎯 Executive Summary

Phase 8 focuses on making the entire Stand Up Sydney platform **profile-aware** at the data layer. While Phases 1-7 established the profile switching infrastructure and UI, Phase 8 ensures that every data query, filter, notification, and dashboard metric respects the active profile context.

**Core Objectives:**
1. Convert existing data hooks to be profile-aware
2. Implement profile-specific filtering across all pages
3. Add backend queries for Manager, Photographer, and Videographer dashboards
4. Create profile-specific notification system
5. Build customizable dashboard widget system

**What Phase 8 Delivers:**
- Users see only relevant data for their active profile
- Dashboards display profile-specific metrics and KPIs
- Notifications are tailored to each profile type
- Users can customize their dashboard layouts per profile
- Performance optimized with profile-aware caching

**Exclusions:**
- ❌ AI-powered features (deferred to future phases)
- ❌ Machine learning recommendations
- ❌ Automated profile optimization

---

## 📊 Current State Analysis

### What's Already Profile-Aware (Phases 1-7)

✅ **UI Layer:**
- Profile switching mechanism
- Profile-specific sidebars (5 variants)
- Profile-specific dashboards (5 dashboards)
- Profile context badges
- Profile-aware page headers
- Profile management UI

✅ **Database:**
- `user_roles` table (supports all 5 profile types)
- `manager_profiles` table
- `videographer_profiles` table
- `photographer_profiles` table
- RLS policies for profile security

✅ **Context Management:**
- `ProfileContext` provider
- localStorage persistence
- Profile switching logic
- Route guards

### What Needs Profile-Awareness (Phase 8 Scope)

❌ **Data Layer:**
- Data fetching hooks (70+ hooks)
- Query filters and predicates
- Dashboard metrics calculations
- Search and browse logic

❌ **Backend Queries:**
- Manager dashboard data (currently placeholder)
- Photographer dashboard data (currently placeholder)
- Videographer dashboard data (currently placeholder)

❌ **Notifications:**
- Notification preferences per profile
- Profile-specific notification types
- Notification filtering by active profile

❌ **Customization:**
- Dashboard widget arrangement
- Profile-specific preferences
- Layout persistence

---

## 🗂️ Phase 8 Feature Breakdown

### 8A: Profile-Aware Data Hooks

**Objective:** Convert existing hooks to filter data by active profile

**Approach:**
```typescript
// Pattern: Inject profile context into all data hooks
import { useProfile } from '@/contexts/ProfileContext';

export const useProfileAwareData = () => {
  const { activeProfile, hasProfile } = useProfile();

  return useQuery({
    queryKey: ['data', activeProfile],
    queryFn: () => fetchDataForProfile(activeProfile),
    enabled: !!activeProfile,
  });
};
```

**Hooks to Convert (Priority Order):**

**High Priority (Week 1):**
1. `useEvents` - Show different events based on profile
   - Comedian: Events they can apply to
   - Promoter: Events they're organizing
   - Photographer/Videographer: Events needing media coverage
2. `useApplications` - Bidirectional filtering
   - Comedian: Applications they submitted
   - Promoter: Applications they received
3. `useComedianGigs` - Rename to `useGigs`, make profile-aware
4. `useDashboard` - NEW: Generic dashboard data hook

**Medium Priority (Week 2):**
5. `useInvoices` - Filter by profile's financial context
6. `useEarnings` - Calculate earnings per profile
7. `useNotifications` - Profile-specific alerts
8. `useBookings` - Different views per profile
9. `useCalendar` - Profile-filtered events

**Low Priority (Week 3):**
10. `usePhotographers` - Enhanced for photographer profile
11. `useAnalytics` - Profile-specific metrics
12. `useMessages` - Profile context in messaging

**Technical Specifications:**

```typescript
// src/hooks/useProfileAwareEvents.ts
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';

export const useEvents = () => {
  const { activeProfile } = useProfile();

  return useQuery({
    queryKey: ['events', activeProfile],
    queryFn: async () => {
      if (!activeProfile) return [];

      let query = supabase.from('events').select('*');

      // Profile-specific filtering
      switch (activeProfile) {
        case 'comedian':
          // Show events they can apply to (future events, accepting applications)
          query = query
            .gte('event_date', new Date().toISOString())
            .eq('accepting_applications', true)
            .order('event_date', { ascending: true });
          break;

        case 'promoter':
          // Show events they're organizing
          query = query
            .eq('promoter_id', supabase.auth.getUser().id)
            .order('event_date', { ascending: true });
          break;

        case 'photographer':
        case 'videographer':
          // Show events needing media coverage
          query = query
            .gte('event_date', new Date().toISOString())
            .or(`needs_photographer.eq.true,needs_videographer.eq.true`)
            .order('event_date', { ascending: true });
          break;

        case 'manager':
          // Show events where their clients are performing
          const { data: clients } = await supabase
            .from('manager_clients')
            .select('comedian_id')
            .eq('manager_id', supabase.auth.getUser().id);

          const comedianIds = clients?.map(c => c.comedian_id) || [];

          query = query
            .in('comedian_id', comedianIds)
            .order('event_date', { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!activeProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**Performance Considerations:**
- Use profile-aware query keys for proper caching
- Implement stale-while-revalidate strategy
- Add optimistic updates for mutations
- Debounce profile switches to avoid rapid refetching

---

### 8B: Profile-Specific Filtering

**Objective:** Add advanced filtering UI that respects profile context

**Pages to Update:**

**1. Shows/Events Page**
```typescript
// src/pages/Shows.tsx
const { activeProfile } = useProfile();

const filters = useMemo(() => {
  const base = {
    dateRange: true,
    location: true,
    genre: true,
  };

  switch (activeProfile) {
    case 'comedian':
      return { ...base, paymentType: true, audienceSize: true };
    case 'promoter':
      return { ...base, eventStatus: true, ticketSales: true };
    case 'photographer':
      return { ...base, shootType: true, equipmentRequired: true };
    default:
      return base;
  }
}, [activeProfile]);
```

**2. Applications Page**
- Comedian view: Filter by status (pending, accepted, rejected)
- Promoter view: Filter by comedian experience, rating, genre

**3. Browse Pages**
- Profile-specific search parameters
- Profile-aware sorting options
- Profile-based recommendations

**Filter Components to Create:**
- `<ProfileAwareFilters>` - Generic filter wrapper
- `<ComedianEventFilters>` - Comedian-specific filters
- `<PromoterEventFilters>` - Promoter-specific filters
- `<MediaEventFilters>` - Photographer/Videographer filters

---

### 8C: Backend Queries for Manager/Photographer/Videographer

**Objective:** Replace placeholder data with real backend queries

#### Manager Dashboard Data

**Current State:** Placeholder data
**Target State:** Real-time data from database

**Data Requirements:**
1. **Client Roster Metrics**
   - Total clients
   - Active clients (performing this month)
   - Client revenue (total/per client)
   - Client gig count

2. **Upcoming Client Gigs**
   - Next 30 days of client performances
   - Venue details
   - Payment status

3. **Commission Tracking**
   - This month's commissions earned
   - Pending payouts
   - Commission rate per client
   - Payment history

4. **Contract Status**
   - Active contracts
   - Expiring soon (within 30 days)
   - Renewal needed

**Database Schema Additions:**

```sql
-- Manager-Client Relationship
CREATE TABLE IF NOT EXISTS public.manager_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id),
  comedian_id UUID NOT NULL REFERENCES profiles(id),
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, comedian_id)
);

CREATE INDEX idx_manager_clients_manager_id ON public.manager_clients(manager_id);
CREATE INDEX idx_manager_clients_comedian_id ON public.manager_clients(comedian_id);

-- Manager Commission Tracking
CREATE TABLE IF NOT EXISTS public.manager_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id),
  comedian_id UUID NOT NULL REFERENCES profiles(id),
  gig_id UUID REFERENCES calendar_events(id),
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manager_commissions_manager_id ON public.manager_commissions(manager_id);
CREATE INDEX idx_manager_commissions_payment_status ON public.manager_commissions(payment_status);
```

**Hook Implementation:**

```typescript
// src/hooks/useManagerDashboard.ts
export const useManagerDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['manager-dashboard', user?.id],
    queryFn: async () => {
      // Fetch client roster
      const { data: clients } = await supabase
        .from('manager_clients')
        .select(`
          *,
          comedian:comedian_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('manager_id', user?.id)
        .eq('status', 'active');

      // Fetch upcoming client gigs
      const comedianIds = clients?.map(c => c.comedian_id) || [];
      const { data: upcomingGigs } = await supabase
        .from('calendar_events')
        .select('*')
        .in('comedian_id', comedianIds)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      // Calculate commission metrics
      const { data: commissions } = await supabase
        .from('manager_commissions')
        .select('*')
        .eq('manager_id', user?.id)
        .gte('created_at', startOfMonth(new Date()).toISOString());

      const totalCommission = commissions?.reduce(
        (sum, c) => sum + Number(c.commission_amount),
        0
      ) || 0;

      return {
        clients: clients || [],
        totalClients: clients?.length || 0,
        activeClients: clients?.filter(c => c.status === 'active').length || 0,
        upcomingGigs: upcomingGigs || [],
        commissionThisMonth: totalCommission,
        pendingPayouts: commissions?.filter(c => c.payment_status === 'pending').length || 0,
      };
    },
    enabled: !!user?.id,
  });
};
```

#### Photographer Dashboard Data

**Data Requirements:**
1. **Booking Requests**
   - Pending event bookings
   - Confirmed shoots
   - Payment status

2. **Portfolio Metrics**
   - Total shoots completed
   - Average rating
   - Portfolio views

3. **Revenue Tracking**
   - This month's revenue
   - Revenue by event type
   - Payment pending

4. **Equipment Utilization**
   - Equipment inventory
   - Usage frequency
   - Maintenance schedule

**Database Schema Additions:**

```sql
-- Photographer Event Bookings
CREATE TABLE IF NOT EXISTS public.photographer_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES profiles(id),
  event_id UUID NOT NULL REFERENCES events(id),
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  rate_agreed DECIMAL(10,2),
  hours_booked INTEGER,
  shoot_type TEXT[], -- event_coverage, headshots, promotional, etc.
  equipment_used TEXT[],
  deliverables TEXT, -- Description of what will be delivered
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photographer_bookings_photographer_id ON public.photographer_bookings(photographer_id);
CREATE INDEX idx_photographer_bookings_event_id ON public.photographer_bookings(event_id);
CREATE INDEX idx_photographer_bookings_status ON public.photographer_bookings(booking_status);
```

**Hook Implementation:**

```typescript
// src/hooks/usePhotographerDashboard.ts
export const usePhotographerDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['photographer-dashboard', user?.id],
    queryFn: async () => {
      // Fetch bookings
      const { data: bookings } = await supabase
        .from('photographer_bookings')
        .select(`
          *,
          event:event_id (
            id,
            title,
            event_date,
            venue
          )
        `)
        .eq('photographer_id', user?.id)
        .order('created_at', { ascending: false });

      // Calculate metrics
      const pendingBookings = bookings?.filter(b => b.booking_status === 'pending') || [];
      const confirmedBookings = bookings?.filter(b => b.booking_status === 'confirmed') || [];
      const completedBookings = bookings?.filter(b => b.booking_status === 'completed') || [];

      const thisMonthRevenue = bookings
        ?.filter(b =>
          b.payment_status === 'fully_paid' &&
          isThisMonth(new Date(b.payment_date))
        )
        .reduce((sum, b) => sum + Number(b.rate_agreed), 0) || 0;

      return {
        bookings: bookings || [],
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalShoots: completedBookings.length,
        revenueThisMonth: thisMonthRevenue,
        upcomingShootCount: confirmedBookings.filter(b =>
          isFuture(new Date(b.event?.event_date))
        ).length,
      };
    },
    enabled: !!user?.id,
  });
};
```

#### Videographer Dashboard Data

**Similar to photographer with video-specific metrics:**
- Video deliverables tracking
- Turnaround time metrics
- Editing progress
- Reel views and engagement

---

### 8D: Profile-Specific Notifications

**Objective:** Tailor notifications to each profile type

**Notification Types by Profile:**

#### Comedian Notifications
- 🎭 New gig offer received
- ✅ Application accepted
- ❌ Application rejected
- 💰 Payment received for gig
- 📅 Upcoming gig reminder (24h, 2h before)
- 📊 Profile view milestone (100, 500, 1000 views)
- ⭐ New rating/review received

#### Promoter Notifications
- 📝 New application received
- 🎤 Comedian confirmed/declined spot
- 🎟️ Ticket sales milestone (25%, 50%, 75%, 100%)
- 💸 Low ticket sales warning (7 days before event)
- 📸 Media coverage confirmed
- 👥 Event capacity reached
- 📊 Weekly event performance summary

#### Manager Notifications
- 🤝 New client booking request
- 💼 Contract expiring soon (30, 14, 7 days)
- 💰 Commission payment received
- 📅 Client gig confirmed
- ⚠️ Client application rejected (needs attention)
- 📈 Client milestone (10, 25, 50 gigs)

#### Photographer/Videographer Notifications
- 📷 New event booking request
- ✅ Booking confirmed by promoter
- 💰 Payment received
- 📅 Shoot reminder (24h, 2h before)
- ⭐ New review received
- 📊 Portfolio view milestone

**Database Schema:**

```sql
-- Profile Notification Settings
CREATE TABLE IF NOT EXISTS public.profile_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  profile_type TEXT NOT NULL CHECK (profile_type IN ('comedian', 'promoter', 'manager', 'photographer', 'videographer')),
  notification_type TEXT NOT NULL,
  enabled_in_app BOOLEAN DEFAULT true,
  enabled_email BOOLEAN DEFAULT true,
  enabled_push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_type, notification_type)
);

CREATE INDEX idx_profile_notification_settings_user_profile ON public.profile_notification_settings(user_id, profile_type);

-- Insert default notification settings for each profile type
-- (This would be done via migration)
```

**Component Structure:**

```typescript
// src/components/notifications/ProfileNotificationSettings.tsx
export function ProfileNotificationSettings() {
  const { activeProfile } = useProfile();

  // Get notification types for active profile
  const notificationTypes = getNotificationTypesForProfile(activeProfile);

  return (
    <div className="space-y-4">
      <h3>Notification Preferences for {activeProfile}</h3>
      {notificationTypes.map(type => (
        <NotificationToggle
          key={type.id}
          type={type}
          profile={activeProfile}
        />
      ))}
    </div>
  );
}
```

**Hook Implementation:**

```typescript
// src/hooks/useProfileNotifications.ts
export const useProfileNotifications = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  return useQuery({
    queryKey: ['notifications', activeProfile, user?.id],
    queryFn: async () => {
      if (!activeProfile || !user) return [];

      // Fetch notifications for active profile
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_type', activeProfile)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      return data || [];
    },
    enabled: !!activeProfile && !!user,
  });
};
```

---

### 8E: Dashboard Widget Customization

**Objective:** Allow users to customize dashboard layout per profile

**Widget System Architecture:**

**Available Widgets:**

1. **Universal Widgets** (all profiles)
   - Profile Completion
   - Quick Actions
   - Recent Activity
   - Calendar View
   - Messages/Notifications

2. **Comedian Widgets**
   - Upcoming Gigs
   - Application Status
   - Earnings This Month
   - Profile Views

3. **Promoter Widgets**
   - Event Performance
   - Application Queue
   - Ticket Sales Chart
   - Revenue Breakdown

4. **Manager Widgets**
   - Client Roster
   - Commission Tracking
   - Upcoming Client Gigs
   - Contract Expirations

5. **Photographer/Videographer Widgets**
   - Booking Calendar
   - Revenue Chart
   - Portfolio Stats
   - Equipment Utilization

**Widget Configuration:**

```typescript
// src/types/dashboard-widgets.ts
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large'; // Grid sizes: 1x1, 2x1, 2x2
  position: { x: number; y: number };
  profileTypes: ProfileType[]; // Which profiles can use this widget
  refreshInterval?: number; // Auto-refresh in ms
  config?: Record<string, any>; // Widget-specific config
}

export type WidgetType =
  | 'upcoming-gigs'
  | 'application-status'
  | 'revenue-chart'
  | 'quick-actions'
  | 'calendar-view'
  | 'client-roster'
  | 'ticket-sales'
  | 'booking-calendar'
  | 'profile-completion'
  | 'recent-activity';
```

**Widget Layout System:**

```typescript
// src/components/dashboard/WidgetGrid.tsx
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function WidgetGrid() {
  const { activeProfile } = useProfile();
  const [layout, setLayout] = useWidgetLayout(activeProfile);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      onLayoutChange={handleLayoutChange}
    >
      {layout.map(widget => (
        <div key={widget.i} data-grid={widget}>
          <WidgetRenderer widget={widget} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
```

**Widget Persistence:**

```typescript
// src/hooks/useWidgetLayout.ts
export const useWidgetLayout = (profileType: ProfileType) => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<Layout[]>([]);

  // Load layout from localStorage or database
  useEffect(() => {
    const loadLayout = async () => {
      // Try localStorage first
      const localLayout = localStorage.getItem(`widget-layout-${profileType}`);
      if (localLayout) {
        setLayout(JSON.parse(localLayout));
        return;
      }

      // Fall back to database
      const { data } = await supabase
        .from('dashboard_layouts')
        .select('layout')
        .eq('user_id', user?.id)
        .eq('profile_type', profileType)
        .single();

      setLayout(data?.layout || getDefaultLayout(profileType));
    };

    loadLayout();
  }, [profileType, user?.id]);

  // Save layout changes
  const saveLayout = async (newLayout: Layout[]) => {
    setLayout(newLayout);

    // Save to localStorage
    localStorage.setItem(`widget-layout-${profileType}`, JSON.stringify(newLayout));

    // Save to database (debounced)
    await supabase
      .from('dashboard_layouts')
      .upsert({
        user_id: user?.id,
        profile_type: profileType,
        layout: newLayout,
        updated_at: new Date().toISOString(),
      });
  };

  return [layout, saveLayout] as const;
};
```

**Database Schema:**

```sql
-- Dashboard Layout Persistence
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  profile_type TEXT NOT NULL CHECK (profile_type IN ('comedian', 'promoter', 'manager', 'photographer', 'videographer')),
  layout JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_type)
);

CREATE INDEX idx_dashboard_layouts_user_profile ON public.dashboard_layouts(user_id, profile_type);
```

---

## 🗓️ Implementation Roadmap

### Week 1: Core Data Hooks (Sub-phase 8A)

**Days 1-2: Hook Pattern Establishment**
- [ ] Create `useProfileAwareQuery` wrapper hook
- [ ] Document hook conversion pattern
- [ ] Convert `useEvents` as reference implementation
- [ ] Write tests for profile-aware hook pattern

**Days 3-5: High-Priority Hook Conversions**
- [ ] Convert `useApplications` hook
- [ ] Convert `useComedianGigs` → `useGigs`
- [ ] Create `useDashboardData` generic hook
- [ ] Update all dashboard components to use new hooks

**Testing & Validation:**
- [ ] Unit tests for each converted hook
- [ ] Integration tests for profile switching with data
- [ ] Performance benchmarks (cache hit rates)

### Week 2: Backend Queries & Filtering (Sub-phases 8B & 8C)

**Days 1-2: Database Schema Updates**
- [ ] Create `manager_clients` table migration
- [ ] Create `manager_commissions` table migration
- [ ] Create `photographer_bookings` table migration
- [ ] Create `videographer_bookings` table migration
- [ ] Apply migrations to development database

**Days 3-4: Manager Dashboard Implementation**
- [ ] Implement `useManagerDashboard` hook
- [ ] Update `ManagerDashboard` component with real data
- [ ] Add client roster view
- [ ] Add commission tracking
- [ ] Test with sample data

**Day 5: Photographer/Videographer Dashboards**
- [ ] Implement `usePhotographerDashboard` hook
- [ ] Implement `useVideographerDashboard` hook
- [ ] Update dashboard components
- [ ] Test booking flows

**Testing & Validation:**
- [ ] Database migration rollback tests
- [ ] RLS policy verification
- [ ] Dashboard data accuracy tests

### Week 3: Notifications & Widgets (Sub-phases 8D & 8E)

**Days 1-2: Notification System**
- [ ] Create `profile_notification_settings` table
- [ ] Implement `useProfileNotifications` hook
- [ ] Create `<ProfileNotificationSettings>` component
- [ ] Add notification badge to profile switcher
- [ ] Test notification delivery per profile

**Days 3-5: Dashboard Widgets**
- [ ] Install `react-grid-layout` dependency
- [ ] Create widget registry system
- [ ] Implement `<WidgetGrid>` component
- [ ] Create 5 core widgets (1 per profile type)
- [ ] Add widget customization UI
- [ ] Implement layout persistence
- [ ] Test drag-and-drop functionality

**Testing & Validation:**
- [ ] Widget drag-and-drop E2E tests
- [ ] Notification delivery tests
- [ ] Layout persistence tests (localStorage + database)

---

## 🧪 Testing Strategy

### Unit Tests

**New Test Files:**
- `tests/hooks/useProfileAwareQuery.test.ts`
- `tests/hooks/useManagerDashboard.test.ts`
- `tests/hooks/usePhotographerDashboard.test.ts`
- `tests/hooks/useProfileNotifications.test.ts`
- `tests/hooks/useWidgetLayout.test.ts`

**Test Coverage Targets:**
- Profile-aware hooks: 90%+
- Dashboard components: 80%+
- Widget system: 85%+

### Integration Tests

```typescript
// tests/integration/profile-data-fetching.test.ts
describe('Profile-Aware Data Fetching', () => {
  it('shows different events for comedian vs promoter', async () => {
    // Switch to comedian profile
    // Query events
    // Expect: events accepting applications

    // Switch to promoter profile
    // Query events
    // Expect: user's own events
  });

  it('filters applications correctly per profile', async () => {
    // Comedian view: submitted applications
    // Promoter view: received applications
  });
});
```

### E2E Tests

```typescript
// tests/e2e/dashboard-widgets.spec.ts
test('customize dashboard layout per profile', async ({ page }) => {
  await page.goto('/dashboard');

  // Switch to comedian profile
  await page.click('[data-testid="profile-switcher"]');
  await page.click('[data-testid="profile-comedian"]');

  // Drag widget to new position
  await page.dragAndDrop(
    '[data-widget="upcoming-gigs"]',
    '[data-grid-position="2-1"]'
  );

  // Verify layout persisted
  await page.reload();
  await expect(page.locator('[data-widget="upcoming-gigs"]'))
    .toHaveAttribute('data-grid-position', '2-1');
});
```

---

## 📈 Success Metrics

### User Engagement Metrics

**Data Accuracy:**
- ✅ 100% of data queries respect active profile
- ✅ Zero cross-profile data leaks
- ✅ Dashboard metrics match backend calculations

**Performance:**
- ✅ Profile switch with data refetch: <500ms (target: <300ms)
- ✅ Dashboard initial load: <1s
- ✅ Widget customization response time: <100ms
- ✅ Cache hit rate: >70%

**User Adoption:**
- Target: 60% of multi-profile users customize their dashboard within first week
- Target: Average 3 profile switches per session (active multi-profile users)
- Target: 80% notification open rate for profile-specific notifications

### Business Metrics

**Manager Profile Usage:**
- Target: 80% of managers with 3+ clients use commission tracking weekly
- Target: Average 5 client roster views per week
- Target: 90% of contract expirations result in renewal action

**Photographer/Videographer Profile Usage:**
- Target: 70% booking request → confirmation rate
- Target: Average 2 portfolio views per booking request
- Target: 85% payment tracking accuracy

---

## 🚧 Technical Considerations

### Performance Optimization

**Query Optimization:**
- Use indexes on profile_type columns
- Implement query result pagination
- Add Redis caching for frequently accessed profile data
- Use Supabase realtime selectively (critical updates only)

**Bundle Size:**
- Lazy load widget components
- Code-split dashboard by profile type
- Optimize react-grid-layout imports

### Error Handling

**Data Fetch Failures:**
```typescript
export const useProfileAwareQuery = (options) => {
  const { activeProfile } = useProfile();

  return useQuery({
    ...options,
    queryKey: [...options.queryKey, activeProfile],
    retry: (failureCount, error) => {
      // Don't retry on profile mismatch errors
      if (error.code === 'PROFILE_MISMATCH') return false;
      return failureCount < 3;
    },
    onError: (error) => {
      if (error.code === 'PROFILE_MISMATCH') {
        toast({
          title: "Profile Access Error",
          description: "This data is not available for your current profile.",
          variant: "destructive"
        });
      }
    }
  });
};
```

**Profile Switch During Data Fetch:**
- Cancel in-flight queries on profile switch
- Clear profile-specific cache on switch
- Show loading state during transition

### Security

**RLS Policy Template:**
```sql
-- Example: Manager can only see their own clients' data
CREATE POLICY "Managers can view their clients"
  ON public.manager_clients FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can view their client gigs"
  ON public.calendar_events FOR SELECT
  USING (
    comedian_id IN (
      SELECT comedian_id FROM public.manager_clients
      WHERE manager_id = auth.uid()
    )
  );
```

**Frontend Validation:**
- Always verify profile type before sensitive operations
- Validate profile ownership before mutations
- Double-check RLS policies in Supabase dashboard

---

## 🔄 Migration Path

### For Existing Users

**Phase 8A Rollout (Data Hooks):**
1. Deploy hook updates with feature flag
2. Enable for 10% of users (canary)
3. Monitor error rates and performance
4. Gradual rollout to 100% over 3 days

**Phase 8D Rollout (Notifications):**
1. Create default notification settings for all existing users
2. Send email announcement about new profile-specific notifications
3. Encourage users to customize per profile

**Phase 8E Rollout (Widgets):**
1. All users start with default widget layout per profile
2. Show onboarding tooltip on first dashboard visit
3. Track customization adoption rate

### Database Migration Strategy

```bash
# Run migrations in order
supabase migration up 20250120_create_manager_clients
supabase migration up 20250120_create_manager_commissions
supabase migration up 20250120_create_photographer_bookings
supabase migration up 20250120_create_videographer_bookings
supabase migration up 20250120_create_profile_notification_settings
supabase migration up 20250120_create_dashboard_layouts

# Verify RLS policies
supabase db verify-rls

# Seed default notification settings
npm run seed:notification-defaults
```

---

## 📚 Documentation Deliverables

**Created in Phase 8 Planning:**
1. ✅ This document (`PHASE_8_DATA_INTEGRATION_PLAN.md`)
2. `PHASE_8_PROFILE_AWARE_HOOKS.md` - Detailed hook patterns
3. `PHASE_8_DASHBOARD_WIDGETS.md` - Widget system architecture
4. `PHASE_8_NOTIFICATIONS.md` - Notification system spec
5. `PHASE_8_BACKEND_QUERIES.md` - Database query optimization

**To Be Created During Implementation:**
6. Widget API Reference
7. Notification Type Registry
8. Profile-Aware Hook Cookbook

---

## 🎯 Definition of Done

**Phase 8A (Data Hooks) Complete When:**
- [ ] All high-priority hooks converted to profile-aware
- [ ] Test coverage >90% for new hooks
- [ ] No performance regression from Phase 7
- [ ] Documentation updated with examples

**Phase 8B (Filtering) Complete When:**
- [ ] All browse/search pages have profile-specific filters
- [ ] Filter state persists per profile
- [ ] User can clear/reset filters
- [ ] Filter combinations tested

**Phase 8C (Backend Queries) Complete When:**
- [ ] Manager dashboard shows real client data
- [ ] Photographer dashboard shows real booking data
- [ ] Videographer dashboard shows real project data
- [ ] All placeholder data removed

**Phase 8D (Notifications) Complete When:**
- [ ] Users can configure notifications per profile
- [ ] Notification delivery works for all profile types
- [ ] Notification badge shows accurate counts
- [ ] Email notifications respect profile settings

**Phase 8E (Widgets) Complete When:**
- [ ] Users can drag-and-drop widgets
- [ ] Layout persists on page reload
- [ ] Layout syncs across devices (via database)
- [ ] At least 10 widgets available
- [ ] Mobile responsive widget layouts

---

## 🔮 Future Enhancements (Phase 9+)

**Not in Phase 8 Scope:**
- Cross-profile analytics dashboard
- Automated profile recommendations (requires AI)
- Profile collaboration advanced features (multi-user access)
- Profile activity heat maps
- Export/import profile templates
- Profile verification badges (manual review process)
- Profile themes and custom branding
- Profile marketplace (services directory)

---

**Document Version:** 1.0
**Status:** Planning Complete - Ready for Implementation
**Last Updated:** January 19, 2025
**Next Review:** After Sub-phase 8A completion
