# Phase 8: Profile-Aware Hooks - Technical Specification

**Status:** 📋 DOCUMENTED - Ready to Implement
**Created:** January 19, 2025
**Prerequisites:** Phase 8A from Data Integration Plan

---

## 🎯 Overview

This document provides detailed technical specifications for converting existing data hooks to be profile-aware. It includes patterns, examples, and a comprehensive conversion guide for all 70+ hooks in the Stand Up Sydney codebase.

**Goal:** Every data-fetching hook should automatically filter, sort, and present data based on the active profile context.

---

## 🔧 Core Pattern: Profile-Aware Hook

### Base Implementation

```typescript
// src/hooks/useProfileAwareQuery.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';

export function useProfileAwareQuery<TData>(
  baseKey: string[],
  queryFn: (profile: ProfileType) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  const { activeProfile } = useProfile();

  return useQuery({
    queryKey: [...baseKey, activeProfile],
    queryFn: () => {
      if (!activeProfile) {
        throw new Error('No active profile');
      }
      return queryFn(activeProfile);
    },
    ...options,
    enabled: (options?.enabled ?? true) && !!activeProfile,
  });
}
```

### Usage Example

```typescript
// Before (not profile-aware)
export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchAllEvents,
  });
};

// After (profile-aware)
export const useEvents = () => {
  return useProfileAwareQuery(
    ['events'],
    async (profile) => {
      return await fetchEventsForProfile(profile);
    }
  );
};
```

---

## 📋 Hook Conversion Checklist

### High Priority (Week 1)

#### 1. `useEvents` → Profile-Aware Events

**File:** `src/hooks/data/useEvents.ts`

**Current Behavior:**
- Fetches all events from database
- No profile-based filtering
- Shows same data regardless of user role

**Target Behavior:**
- **Comedian:** Events accepting applications (future only)
- **Promoter:** Events user is organizing
- **Manager:** Events where their clients are performing
- **Photographer/Videographer:** Events needing media coverage

**Implementation:**

```typescript
// src/hooks/data/useEvents.ts
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useEvents = () => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['events', activeProfile, user?.id],
    queryFn: async () => {
      if (!activeProfile || !user) return [];

      let query = supabase
        .from('events')
        .select(`
          *,
          profiles:promoter_id (
            id,
            name,
            avatar_url
          )
        `);

      switch (activeProfile) {
        case 'comedian':
          // Show events accepting applications in the future
          query = query
            .gte('event_date', new Date().toISOString())
            .eq('accepting_applications', true)
            .order('event_date', { ascending: true });
          break;

        case 'promoter':
          // Show events user is promoting
          query = query
            .eq('promoter_id', user.id)
            .order('event_date', { ascending: false });
          break;

        case 'manager':
          // Show events where managed clients are performing
          const { data: clients } = await supabase
            .from('manager_clients')
            .select('comedian_id')
            .eq('manager_id', user.id)
            .eq('status', 'active');

          if (!clients || clients.length === 0) return [];

          const comedianIds = clients.map(c => c.comedian_id);

          // Get events with spots filled by these comedians
          const { data: spots } = await supabase
            .from('event_spots')
            .select('event_id')
            .in('comedian_id', comedianIds)
            .eq('is_filled', true);

          if (!spots || spots.length === 0) return [];

          const eventIds = spots.map(s => s.event_id);

          query = query
            .in('id', eventIds)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true });
          break;

        case 'photographer':
        case 'videographer':
          // Show events needing media coverage
          const mediaField = activeProfile === 'photographer'
            ? 'needs_photographer'
            : 'needs_videographer';

          query = query
            .eq(mediaField, true)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true });
          break;

        default:
          return [];
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!activeProfile && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

**Testing:**

```typescript
// tests/hooks/useEvents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from '@/hooks/data/useEvents';

describe('useEvents (profile-aware)', () => {
  it('shows application-ready events for comedian', async () => {
    // Mock activeProfile as 'comedian'
    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const events = result.current.data;
    expect(events).toSatisfy(events =>
      events.every(e =>
        e.accepting_applications === true &&
        new Date(e.event_date) >= new Date()
      )
    );
  });

  it('shows organized events for promoter', async () => {
    // Mock activeProfile as 'promoter'
    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const events = result.current.data;
    expect(events).toSatisfy(events =>
      events.every(e => e.promoter_id === mockUserId)
    );
  });
});
```

---

#### 2. `useApplications` → Bidirectional Applications

**File:** `src/hooks/useApplications.ts`

**Current Behavior:**
- Fetches applications based on user role
- Comedian sees submitted applications
- Promoter sees received applications

**Target Behavior:**
- Same as current but respects active profile instead of role
- Better query optimization
- Profile-aware caching

**Implementation:**

```typescript
// src/hooks/useApplications.ts
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useApplications = (filters?: {
  status?: string;
  eventId?: string;
}) => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['applications', activeProfile, user?.id, filters],
    queryFn: async () => {
      if (!activeProfile || !user) return [];

      let query = supabase
        .from('applications')
        .select(`
          *,
          profiles:comedian_id (
            id,
            name,
            avatar_url
          ),
          events:event_id (
            id,
            title,
            event_date,
            venue
          )
        `);

      // Profile-based filtering
      if (activeProfile === 'comedian') {
        // Comedian sees applications they submitted
        query = query
          .eq('comedian_id', user.id)
          .order('created_at', { ascending: false });
      } else if (activeProfile === 'promoter') {
        // Promoter sees applications for their events
        const { data: events } = await supabase
          .from('events')
          .select('id')
          .eq('promoter_id', user.id);

        if (!events || events.length === 0) return [];

        const eventIds = events.map(e => e.id);

        query = query
          .in('event_id', eventIds)
          .order('created_at', { ascending: false });
      } else if (activeProfile === 'manager') {
        // Manager sees applications for their clients
        const { data: clients } = await supabase
          .from('manager_clients')
          .select('comedian_id')
          .eq('manager_id', user.id)
          .eq('status', 'active');

        if (!clients || clients.length === 0) return [];

        const comedianIds = clients.map(c => c.comedian_id);

        query = query
          .in('comedian_id', comedianIds)
          .order('created_at', { ascending: false });
      } else {
        // Photographer/Videographer don't use applications
        return [];
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.eventId) {
        query = query.eq('event_id', filters.eventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!activeProfile && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

---

#### 3. `useComedianGigs` → `useGigs` (Renamed & Enhanced)

**File:** `src/hooks/useGigs.ts` (renamed from `useComedianGigs.ts`)

**Current Behavior:**
- Only works for comedians
- Fetches gigs from `calendar_events` and `event_spots`
- Hardcoded to current user

**Target Behavior:**
- Works for comedian, manager (client gigs), photographer, videographer
- Profile-aware data structure
- Better type safety

**Implementation:**

```typescript
// src/hooks/useGigs.ts
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Gig {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  event_id?: string;
  performer_id?: string; // Comedian ID
  event?: {
    id: string;
    title: string;
    promoter?: { name: string };
  };
  booking?: {
    // For photographer/videographer
    shoot_type?: string[];
    rate_agreed?: number;
    payment_status?: string;
  };
}

export const useGigs = (targetUserId?: string) => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const userId = targetUserId || user?.id;

  return useQuery({
    queryKey: ['gigs', activeProfile, userId],
    queryFn: async () => {
      if (!activeProfile || !userId) return [];

      switch (activeProfile) {
        case 'comedian':
          return await fetchComedianGigs(userId);

        case 'manager':
          return await fetchManagerClientGigs(userId);

        case 'photographer':
          return await fetchPhotographerBookings(userId);

        case 'videographer':
          return await fetchVideographerBookings(userId);

        default:
          return [];
      }
    },
    enabled: !!activeProfile && !!userId,
    staleTime: 3 * 60 * 1000,
  });
};

async function fetchComedianGigs(userId: string): Promise<Gig[]> {
  // Fetch from calendar_events
  const { data: calendarGigs } = await supabase
    .from('calendar_events')
    .select(`
      *,
      events:event_id (
        id,
        title,
        profiles:promoter_id (name)
      )
    `)
    .eq('comedian_id', userId)
    .order('event_date', { ascending: true });

  // Fetch from event_spots
  const { data: spotGigs } = await supabase
    .from('event_spots')
    .select(`
      *,
      events:event_id (
        id,
        title,
        event_date,
        profiles:promoter_id (name)
      )
    `)
    .eq('comedian_id', userId)
    .eq('is_filled', true);

  // Combine and format
  const allGigs: Gig[] = [
    ...(calendarGigs || []).map(g => ({
      id: g.id,
      title: g.title,
      event_date: g.event_date,
      venue: g.venue,
      status: g.status,
      event_id: g.event_id,
      performer_id: g.comedian_id,
      event: g.events,
    })),
    ...(spotGigs || []).map(s => ({
      id: `spot-${s.id}`,
      title: s.events?.title || 'Performance',
      event_date: s.events?.event_date || new Date().toISOString(),
      venue: s.events?.venue || 'TBA',
      status: 'confirmed' as const,
      event_id: s.event_id,
      performer_id: s.comedian_id,
      event: s.events,
    })),
  ];

  // Deduplicate by event_id
  const uniqueGigs = allGigs.filter((gig, index, self) =>
    index === self.findIndex(g => g.event_id === gig.event_id)
  );

  return uniqueGigs.sort((a, b) =>
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
}

async function fetchManagerClientGigs(managerId: string): Promise<Gig[]> {
  // Get manager's clients
  const { data: clients } = await supabase
    .from('manager_clients')
    .select('comedian_id')
    .eq('manager_id', managerId)
    .eq('status', 'active');

  if (!clients || clients.length === 0) return [];

  const comedianIds = clients.map(c => c.comedian_id);

  // Fetch all gigs for these comedians
  const allGigs: Gig[] = [];

  for (const comedianId of comedianIds) {
    const gigs = await fetchComedianGigs(comedianId);
    allGigs.push(...gigs);
  }

  return allGigs.sort((a, b) =>
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
}

async function fetchPhotographerBookings(photographerId: string): Promise<Gig[]> {
  const { data: bookings } = await supabase
    .from('photographer_bookings')
    .select(`
      *,
      event:event_id (
        id,
        title,
        event_date,
        venue,
        profiles:promoter_id (name)
      )
    `)
    .eq('photographer_id', photographerId)
    .order('created_at', { ascending: false });

  return (bookings || []).map(b => ({
    id: b.id,
    title: b.event?.title || 'Photography Session',
    event_date: b.event?.event_date || new Date().toISOString(),
    venue: b.event?.venue || 'TBA',
    status: b.booking_status as any,
    event_id: b.event_id,
    event: b.event,
    booking: {
      shoot_type: b.shoot_type,
      rate_agreed: b.rate_agreed,
      payment_status: b.payment_status,
    },
  }));
}

async function fetchVideographerBookings(videographerId: string): Promise<Gig[]> {
  // Similar to photographer
  const { data: bookings } = await supabase
    .from('videographer_bookings')
    .select(`
      *,
      event:event_id (
        id,
        title,
        event_date,
        venue,
        profiles:promoter_id (name)
      )
    `)
    .eq('videographer_id', videographerId)
    .order('created_at', { ascending: false });

  return (bookings || []).map(b => ({
    id: b.id,
    title: b.event?.title || 'Video Project',
    event_date: b.event?.event_date || new Date().toISOString(),
    venue: b.event?.venue || 'TBA',
    status: b.booking_status as any,
    event_id: b.event_id,
    event: b.event,
    booking: {
      shoot_type: b.project_type,
      rate_agreed: b.rate_agreed,
      payment_status: b.payment_status,
    },
  }));
}
```

---

### Medium Priority (Week 2)

#### 4. `useInvoices` → Profile-Aware Invoices

**Implementation:**

```typescript
// src/hooks/useInvoices.ts
export const useInvoices = (filters?: InvoiceFilters) => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', activeProfile, user?.id, filters],
    queryFn: async () => {
      if (!activeProfile || !user) return [];

      let query = supabase
        .from('invoices')
        .select('*');

      switch (activeProfile) {
        case 'comedian':
          // Invoices sent to me (for gigs I performed)
          query = query.eq('recipient_id', user.id);
          break;

        case 'promoter':
          // Invoices I issued (to comedians)
          query = query.eq('issuer_id', user.id);
          break;

        case 'manager':
          // Invoices for my clients
          const { data: clients } = await supabase
            .from('manager_clients')
            .select('comedian_id')
            .eq('manager_id', user.id);

          const comedianIds = clients?.map(c => c.comedian_id) || [];

          query = query.in('recipient_id', comedianIds);
          break;

        case 'photographer':
        case 'videographer':
          // Invoices I issued (to event promoters)
          query = query.eq('issuer_id', user.id);
          break;
      }

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return data || [];
    },
    enabled: !!activeProfile && !!user,
  });
};
```

---

#### 5. `useEarnings` → Profile-Specific Earnings

**Implementation:**

```typescript
// src/hooks/useEarnings.ts
export const useEarnings = (dateRange?: { start: Date; end: Date }) => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['earnings', activeProfile, user?.id, dateRange],
    queryFn: async () => {
      if (!activeProfile || !user) return null;

      const start = dateRange?.start || startOfMonth(new Date());
      const end = dateRange?.end || endOfMonth(new Date());

      let totalEarnings = 0;
      let paidEarnings = 0;
      let pendingEarnings = 0;

      switch (activeProfile) {
        case 'comedian':
          // Earnings from gigs
          const { data: gigPayments } = await supabase
            .from('calendar_events')
            .select('payment_amount, payment_status')
            .eq('comedian_id', user.id)
            .gte('event_date', start.toISOString())
            .lte('event_date', end.toISOString());

          gigPayments?.forEach(p => {
            totalEarnings += Number(p.payment_amount || 0);
            if (p.payment_status === 'paid') {
              paidEarnings += Number(p.payment_amount || 0);
            } else {
              pendingEarnings += Number(p.payment_amount || 0);
            }
          });
          break;

        case 'manager':
          // Commission earnings
          const { data: commissions } = await supabase
            .from('manager_commissions')
            .select('commission_amount, payment_status')
            .eq('manager_id', user.id)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

          commissions?.forEach(c => {
            totalEarnings += Number(c.commission_amount || 0);
            if (c.payment_status === 'paid') {
              paidEarnings += Number(c.commission_amount || 0);
            } else {
              pendingEarnings += Number(c.commission_amount || 0);
            }
          });
          break;

        case 'photographer':
          // Photography booking earnings
          const { data: photoBookings } = await supabase
            .from('photographer_bookings')
            .select('rate_agreed, payment_status')
            .eq('photographer_id', user.id)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

          photoBookings?.forEach(b => {
            totalEarnings += Number(b.rate_agreed || 0);
            if (b.payment_status === 'fully_paid') {
              paidEarnings += Number(b.rate_agreed || 0);
            } else {
              pendingEarnings += Number(b.rate_agreed || 0);
            }
          });
          break;

        case 'videographer':
          // Videography booking earnings
          const { data: videoBookings } = await supabase
            .from('videographer_bookings')
            .select('rate_agreed, payment_status')
            .eq('videographer_id', user.id)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

          videoBookings?.forEach(b => {
            totalEarnings += Number(b.rate_agreed || 0);
            if (b.payment_status === 'fully_paid') {
              paidEarnings += Number(b.rate_agreed || 0);
            } else {
              pendingEarnings += Number(b.rate_agreed || 0);
            }
          });
          break;

        case 'promoter':
          // Revenue from ticket sales (opposite of earnings)
          const { data: events } = await supabase
            .from('events')
            .select('id')
            .eq('promoter_id', user.id)
            .gte('event_date', start.toISOString())
            .lte('event_date', end.toISOString());

          if (events && events.length > 0) {
            const eventIds = events.map(e => e.id);

            const { data: tickets } = await supabase
              .from('tickets')
              .select('price, payment_status')
              .in('event_id', eventIds);

            tickets?.forEach(t => {
              totalEarnings += Number(t.price || 0);
              if (t.payment_status === 'completed') {
                paidEarnings += Number(t.price || 0);
              } else {
                pendingEarnings += Number(t.price || 0);
              }
            });
          }
          break;
      }

      return {
        totalEarnings,
        paidEarnings,
        pendingEarnings,
        currency: 'AUD',
        dateRange: { start, end },
      };
    },
    enabled: !!activeProfile && !!user,
    staleTime: 2 * 60 * 1000,
  });
};
```

---

## 📚 Complete Hook Conversion Registry

### By Priority Level

#### High Priority (Week 1) - 4 hooks
1. ✅ `useEvents` - Profile-aware event filtering
2. ✅ `useApplications` - Bidirectional applications
3. ✅ `useGigs` - Renamed, multi-profile support
4. ⏳ `useDashboardData` - NEW: Generic dashboard hook

#### Medium Priority (Week 2) - 8 hooks
5. ✅ `useInvoices` - Profile-specific invoices
6. ✅ `useEarnings` - Profile-specific earnings calculations
7. ⏳ `useNotifications` - Profile-filtered notifications
8. ⏳ `useBookings` - Different views per profile
9. ⏳ `useCalendar` - Profile-filtered calendar events
10. ⏳ `usePhotographers` - Enhanced for photographer profile
11. ⏳ `useAnalytics` - Profile-specific metrics
12. ⏳ `useMessages` - Profile context in messaging

#### Low Priority (Week 3) - 10 hooks
13. ⏳ `useProfileData` - Fetch any profile type data
14. ⏳ `useProfileMetrics` - KPIs per profile
15. ⏳ `useVenues` - Promoter-specific venue management
16. ⏳ `useLineup` - Promoter event lineups
17. ⏳ `useSpots` - Event spot management
18. ⏳ `usePayments` - Payment processing per profile
19. ⏳ `useReviews` - Profile-specific reviews
20. ⏳ `useSearch` - Profile-aware search
21. ⏳ `useBrowse` - Profile-filtered browse
22. ⏳ `useRecommendations` - Profile-based recommendations

---

## 🧪 Testing Patterns

### Unit Test Template

```typescript
// tests/hooks/useProfileAwareHook.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHookName } from '@/hooks/useHookName';

// Mock ProfileContext
jest.mock('@/contexts/ProfileContext', () => ({
  useProfile: jest.fn(),
}));

describe('useHookName (profile-aware)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('fetches data for comedian profile', async () => {
    // Mock active profile
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: 'comedian',
      hasProfile: jest.fn(),
    });

    const { result } = renderHook(() => useHookName(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    // Add specific assertions
  });

  it('returns empty array when no active profile', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: null,
      hasProfile: jest.fn(),
    });

    const { result } = renderHook(() => useHookName(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('refetches when profile changes', async () => {
    const { result, rerender } = renderHook(() => useHookName(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    // Initial: comedian profile
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: 'comedian',
      hasProfile: jest.fn(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const comedianData = result.current.data;

    // Change to promoter profile
    (useProfile as jest.Mock).mockReturnValue({
      activeProfile: 'promoter',
      hasProfile: jest.fn(),
    });

    rerender();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const promoterData = result.current.data;

    // Data should be different
    expect(comedianData).not.toEqual(promoterData);
  });
});
```

---

## ⚡ Performance Optimization

### Query Key Best Practices

```typescript
// ✅ Good: Profile in query key enables proper caching
useQuery({
  queryKey: ['events', activeProfile, userId],
  queryFn: () => fetchEvents(activeProfile, userId),
});

// ❌ Bad: Profile not in query key causes cache misses
useQuery({
  queryKey: ['events', userId],
  queryFn: () => fetchEvents(activeProfile, userId),
});
```

### Stale-While-Revalidate Strategy

```typescript
// Balance freshness with performance
useQuery({
  queryKey: ['events', activeProfile],
  queryFn: fetchEvents,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
});
```

### Profile Switch Optimization

```typescript
// src/contexts/ProfileContext.tsx
const switchProfile = async (newProfile: ProfileType) => {
  // Cancel in-flight queries before switching
  queryClient.cancelQueries();

  // Set new profile
  setActiveProfile(newProfile);

  // Clear stale profile-specific cache
  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey as string[];
      return key.includes(activeProfile) && key[1] !== newProfile;
    },
  });

  // Prefetch critical data for new profile
  await prefetchProfileData(newProfile);
};
```

---

## 🔒 Security Considerations

### RLS Policy Validation

Every profile-aware hook should respect RLS policies:

```sql
-- Example: Ensure comedians can only see their own applications
CREATE POLICY "Comedians can view own applications"
  ON public.applications FOR SELECT
  USING (
    comedian_id = auth.uid()
  );

-- Example: Promoters can only see applications for their events
CREATE POLICY "Promoters can view event applications"
  ON public.applications FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE promoter_id = auth.uid()
    )
  );
```

### Frontend Validation

```typescript
// Always validate profile before mutations
const createApplication = async (eventId: string) => {
  if (activeProfile !== 'comedian') {
    throw new Error('Only comedians can submit applications');
  }

  // Proceed with mutation
};
```

---

## 📖 Migration Guide

### Step-by-Step Hook Conversion

**Step 1: Identify Current Behavior**
```typescript
// Before
export const useMyHook = () => {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: fetchData,
  });
};
```

**Step 2: Add Profile Context**
```typescript
import { useProfile } from '@/contexts/ProfileContext';

export const useMyHook = () => {
  const { activeProfile } = useProfile();

  return useQuery({
    queryKey: ['my-data', activeProfile],
    queryFn: () => fetchDataForProfile(activeProfile),
    enabled: !!activeProfile,
  });
};
```

**Step 3: Implement Profile-Specific Logic**
```typescript
const fetchDataForProfile = async (profile: ProfileType) => {
  switch (profile) {
    case 'comedian':
      return fetchComedianData();
    case 'promoter':
      return fetchPromoterData();
    // ... etc
  }
};
```

**Step 4: Update Components**
```typescript
// Before
const { data } = useMyHook();

// After (no changes needed, profile comes from context!)
const { data } = useMyHook();
```

**Step 5: Add Tests**
```typescript
// See testing patterns above
```

---

## ✅ Completion Checklist

**For Each Hook Conversion:**
- [ ] Profile context injected
- [ ] Query key includes activeProfile
- [ ] Profile-specific logic implemented
- [ ] RLS policies verified
- [ ] Unit tests written
- [ ] Performance tested
- [ ] Documentation updated

---

**Document Version:** 1.0
**Status:** Specification Complete
**Last Updated:** January 19, 2025
**Related:** PHASE_8_DATA_INTEGRATION_PLAN.md
