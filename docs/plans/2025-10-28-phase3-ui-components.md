# Phase 3: UI Components Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete UI component library for Event Management & Financial System with 27 components, new favourites/hide features, and revenue visibility controls.

**Architecture:** Container/presentational pattern with containers handling React Query hooks and data fetching, presentational components focusing on pure UI rendering using shadcn/ui primitives. Components organized by subdomain (applications/, lineup/, deals/, event-management/) for page-tab driven assembly in Phase 4.

**Tech Stack:** React 18, TypeScript (strict mode), TanStack Query, React Hook Form + Zod, shadcn/ui + Radix UI, Tailwind CSS, lucide-react icons

---

## Prerequisites

**Design Document:** `/root/agents/.worktrees/event-management-system/Plans/Event-Management-UI-Components-20251028.md`

**Existing Hooks (Phase 2B):**
- `src/hooks/useEventDeals.ts` - Deal CRUD and workflow
- `src/hooks/useDealParticipants.ts` - Participant management
- `src/hooks/useApplicationApproval.ts` - Application approval and shortlist
- `src/hooks/useSpotPayments.ts` - Spot payment management

**Build Order:** Page-tab driven
1. Week 3 Day 1-2: Overview + Applications Tab (Tasks 1-8)
2. Week 3 Day 3-4: Lineup Tab (Tasks 9-13)
3. Week 3 Day 5-7: Deals Tab (Tasks 14-22)

---

## Task 1: Database Migrations - User Favourites

**Files:**
- Create: `supabase/migrations/20251028000001_create_user_favourites.sql`

**Step 1: Create migration file**

```sql
-- Migration: Create user_favourites table
-- Description: Store user-level comedian favourites (across all events)

CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comedian_id)
);

-- Index for fast user lookups
CREATE INDEX idx_user_favourites_user ON user_favourites(user_id);

-- Index for checking if comedian is favourited
CREATE INDEX idx_user_favourites_comedian ON user_favourites(comedian_id);

-- RLS policies
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favourites
CREATE POLICY "Users can view own favourites"
  ON user_favourites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their favourites
CREATE POLICY "Users can add favourites"
  ON user_favourites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their favourites
CREATE POLICY "Users can remove favourites"
  ON user_favourites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON user_favourites TO authenticated;
```

**Step 2: Test migration (dry-run)**

Run: `npm run migrate:dry-run`
Expected: Migration validates successfully, shows SQL statements

**Step 3: Commit**

```bash
git add supabase/migrations/20251028000001_create_user_favourites.sql
git commit -m "feat(db): add user_favourites table for comedian favourites

- User-level favourites across all events
- RLS policies for user privacy
- Indexes for performance

Part of Phase 3: UI Components Library"
```

---

## Task 2: Database Migrations - User Hidden Comedians

**Files:**
- Create: `supabase/migrations/20251028000002_create_user_hidden_comedians.sql`

**Step 1: Create migration file**

```sql
-- Migration: Create user_hidden_comedians table
-- Description: Store hidden comedian preferences (event-specific or global)

CREATE TABLE IF NOT EXISTS user_hidden_comedians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('event', 'global')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, comedian_id, scope, event_id),
  CHECK (
    (scope = 'event' AND event_id IS NOT NULL) OR
    (scope = 'global' AND event_id IS NULL)
  )
);

-- Index for user lookups
CREATE INDEX idx_user_hidden_user ON user_hidden_comedians(user_id);

-- Index for event-specific hiding
CREATE INDEX idx_user_hidden_event ON user_hidden_comedians(event_id)
  WHERE scope = 'event';

-- Index for comedian lookups
CREATE INDEX idx_user_hidden_comedian ON user_hidden_comedians(comedian_id);

-- RLS policies
ALTER TABLE user_hidden_comedians ENABLE ROW LEVEL SECURITY;

-- Users can view their own hidden list
CREATE POLICY "Users can view own hidden comedians"
  ON user_hidden_comedians
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to hidden list
CREATE POLICY "Users can add hidden comedians"
  ON user_hidden_comedians
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from hidden list
CREATE POLICY "Users can remove hidden comedians"
  ON user_hidden_comedians
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON user_hidden_comedians TO authenticated;
```

**Step 2: Test migration (dry-run)**

Run: `npm run migrate:dry-run`
Expected: Migration validates successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20251028000002_create_user_hidden_comedians.sql
git commit -m "feat(db): add user_hidden_comedians table

- Event-specific and global hiding
- Scope constraint validation
- RLS policies for user privacy

Part of Phase 3: UI Components Library"
```

---

## Task 3: User Preferences Service

**Files:**
- Create: `src/services/userPreferencesService.ts`

**Step 1: Create service file with types**

```typescript
/**
 * userPreferencesService
 *
 * Service for managing user preferences (favourites, hidden comedians)
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

type UserFavourite = Database['public']['Tables']['user_favourites']['Row'];
type UserHiddenComedian = Database['public']['Tables']['user_hidden_comedians']['Row'];

export interface FavouritedComedian {
  id: string;
  user_id: string;
  comedian_id: string;
  created_at: string;
  comedian: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface HiddenComedian {
  id: string;
  user_id: string;
  comedian_id: string;
  scope: 'event' | 'global';
  event_id?: string;
  created_at: string;
  comedian: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ============================================================================
// FAVOURITES
// ============================================================================

/**
 * Add comedian to user's favourites
 */
export async function addToFavourites(
  userId: string,
  comedianId: string
): Promise<UserFavourite> {
  const { data, error } = await supabase
    .from('user_favourites')
    .insert({
      user_id: userId,
      comedian_id: comedianId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove comedian from user's favourites
 */
export async function removeFromFavourites(
  userId: string,
  comedianId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_favourites')
    .delete()
    .eq('user_id', userId)
    .eq('comedian_id', comedianId);

  if (error) throw error;
}

/**
 * Get all favourited comedians for user
 */
export async function getFavourites(userId: string): Promise<FavouritedComedian[]> {
  const { data, error } = await supabase
    .from('user_favourites')
    .select(`
      id,
      user_id,
      comedian_id,
      created_at,
      comedian:profiles!comedian_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FavouritedComedian[];
}

/**
 * Check if comedian is favourited by user
 */
export async function isFavourited(
  userId: string,
  comedianId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_favourites')
    .select('id')
    .eq('user_id', userId)
    .eq('comedian_id', comedianId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

// ============================================================================
// HIDDEN COMEDIANS
// ============================================================================

/**
 * Hide comedian from user's view
 */
export async function hideComedian(
  userId: string,
  comedianId: string,
  scope: 'event' | 'global',
  eventId?: string
): Promise<UserHiddenComedian> {
  // Validate scope + eventId combination
  if (scope === 'event' && !eventId) {
    throw new Error('event_id required for event scope');
  }
  if (scope === 'global' && eventId) {
    throw new Error('event_id must be null for global scope');
  }

  const { data, error } = await supabase
    .from('user_hidden_comedians')
    .insert({
      user_id: userId,
      comedian_id: comedianId,
      scope,
      event_id: eventId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unhide comedian for user
 */
export async function unhideComedian(
  userId: string,
  comedianId: string,
  eventId?: string
): Promise<void> {
  let query = supabase
    .from('user_hidden_comedians')
    .delete()
    .eq('user_id', userId)
    .eq('comedian_id', comedianId);

  if (eventId) {
    // Remove event-specific hiding
    query = query.eq('scope', 'event').eq('event_id', eventId);
  } else {
    // Remove global hiding
    query = query.eq('scope', 'global');
  }

  const { error } = await query;
  if (error) throw error;
}

/**
 * Get all hidden comedians for user
 */
export async function getHiddenComedians(
  userId: string,
  eventId?: string
): Promise<HiddenComedian[]> {
  let query = supabase
    .from('user_hidden_comedians')
    .select(`
      id,
      user_id,
      comedian_id,
      scope,
      event_id,
      created_at,
      comedian:profiles!comedian_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('user_id', userId);

  if (eventId) {
    // Get both event-specific and global hidden comedians
    query = query.or(`scope.eq.global,and(scope.eq.event,event_id.eq.${eventId})`);
  } else {
    // Only global hidden comedians
    query = query.eq('scope', 'global');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as HiddenComedian[];
}

/**
 * Check if comedian is hidden for user
 */
export async function isHidden(
  userId: string,
  comedianId: string,
  eventId?: string
): Promise<boolean> {
  let query = supabase
    .from('user_hidden_comedians')
    .select('id')
    .eq('user_id', userId)
    .eq('comedian_id', comedianId);

  if (eventId) {
    // Check both event-specific and global
    query = query.or(`scope.eq.global,and(scope.eq.event,event_id.eq.${eventId})`);
  } else {
    // Check only global
    query = query.eq('scope', 'global');
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data !== null;
}
```

**Step 2: Commit**

```bash
git add src/services/userPreferencesService.ts
git commit -m "feat(services): add userPreferencesService for favourites/hide

- addToFavourites, removeFromFavourites, getFavourites, isFavourited
- hideComedian, unhideComedian, getHiddenComedians, isHidden
- Support for event-specific and global hiding
- Full TypeScript types

Part of Phase 3: UI Components Library"
```

---

## Task 4: User Preferences Hook

**Files:**
- Create: `src/hooks/useUserPreferences.ts`

**Step 1: Create hook file**

```typescript
/**
 * useUserPreferences Hook
 *
 * React Query hook for managing user preferences (favourites, hidden comedians)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  addToFavourites,
  removeFromFavourites,
  getFavourites,
  isFavourited,
  hideComedian,
  unhideComedian,
  getHiddenComedians,
  isHidden,
  type FavouritedComedian,
  type HiddenComedian
} from '@/services/userPreferencesService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const userPreferencesKeys = {
  all: ['user-preferences'] as const,
  favourites: (userId: string) => [...userPreferencesKeys.all, 'favourites', userId] as const,
  hidden: (userId: string, eventId?: string) =>
    [...userPreferencesKeys.all, 'hidden', userId, eventId || 'global'] as const
};

// ============================================================================
// FAVOURITES QUERIES
// ============================================================================

/**
 * Fetch user's favourited comedians
 */
export function useFavourites(userId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: userPreferencesKeys.favourites(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return getFavourites(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading favourites',
          description: 'Failed to load favourited comedians. Please try again.'
        });
      }
    }
  });
}

// ============================================================================
// FAVOURITES MUTATIONS
// ============================================================================

/**
 * Add comedian to favourites
 */
export function useAddToFavourites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, comedianId }: { userId: string; comedianId: string }) =>
      addToFavourites(userId, comedianId),
    onMutate: async ({ userId, comedianId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.favourites(userId) });

      const previousFavourites = queryClient.getQueryData<FavouritedComedian[]>(
        userPreferencesKeys.favourites(userId)
      );

      // Optimistically add to favourites
      if (previousFavourites) {
        queryClient.setQueryData(
          userPreferencesKeys.favourites(userId),
          [
            {
              id: 'temp-id',
              user_id: userId,
              comedian_id: comedianId,
              created_at: new Date().toISOString(),
              comedian: { id: comedianId, name: 'Loading...' }
            },
            ...previousFavourites
          ]
        );
      }

      return { previousFavourites };
    },
    onSuccess: (_data, variables) => {
      // Refetch to get full data
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.favourites(variables.userId)
      });
      toast({
        title: 'Added to favourites',
        description: 'Comedian has been added to your favourites.'
      });
    },
    onError: (_error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousFavourites) {
        queryClient.setQueryData(
          userPreferencesKeys.favourites(variables.userId),
          context.previousFavourites
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error adding favourite',
        description: 'Failed to add comedian to favourites. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Remove comedian from favourites
 */
export function useRemoveFromFavourites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, comedianId }: { userId: string; comedianId: string }) =>
      removeFromFavourites(userId, comedianId),
    onMutate: async ({ userId, comedianId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.favourites(userId) });

      const previousFavourites = queryClient.getQueryData<FavouritedComedian[]>(
        userPreferencesKeys.favourites(userId)
      );

      // Optimistically remove from favourites
      if (previousFavourites) {
        queryClient.setQueryData(
          userPreferencesKeys.favourites(userId),
          previousFavourites.filter((fav) => fav.comedian_id !== comedianId)
        );
      }

      return { previousFavourites };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.favourites(variables.userId)
      });
      toast({
        title: 'Removed from favourites',
        description: 'Comedian has been removed from your favourites.'
      });
    },
    onError: (_error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousFavourites) {
        queryClient.setQueryData(
          userPreferencesKeys.favourites(variables.userId),
          context.previousFavourites
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error removing favourite',
        description: 'Failed to remove comedian from favourites. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// HIDDEN COMEDIANS QUERIES
// ============================================================================

/**
 * Fetch user's hidden comedians
 */
export function useHiddenComedians(userId: string | undefined, eventId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: userPreferencesKeys.hidden(userId || '', eventId),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return getHiddenComedians(userId, eventId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes (hide preferences change less frequently)
    gcTime: 5 * 60 * 1000,
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading hidden comedians',
          description: 'Failed to load hidden comedians. Please try again.'
        });
      }
    }
  });
}

// ============================================================================
// HIDDEN COMEDIANS MUTATIONS
// ============================================================================

/**
 * Hide comedian
 */
export function useHideComedian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      comedianId,
      scope,
      eventId
    }: {
      userId: string;
      comedianId: string;
      scope: 'event' | 'global';
      eventId?: string;
    }) => hideComedian(userId, comedianId, scope, eventId),
    onSuccess: (_data, variables) => {
      // Invalidate hidden list
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.hidden(variables.userId, variables.eventId)
      });

      const scopeText = variables.scope === 'event' ? 'this show' : 'all shows';
      toast({
        title: 'Comedian hidden',
        description: `Comedian has been hidden from ${scopeText}.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error hiding comedian',
        description: error.message || 'Failed to hide comedian. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Unhide comedian
 */
export function useUnhideComedian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      comedianId,
      eventId
    }: {
      userId: string;
      comedianId: string;
      eventId?: string;
    }) => unhideComedian(userId, comedianId, eventId),
    onSuccess: (_data, variables) => {
      // Invalidate hidden list
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.hidden(variables.userId, variables.eventId)
      });

      toast({
        title: 'Comedian unhidden',
        description: 'Comedian is now visible again.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error unhiding comedian',
        description: error.message || 'Failed to unhide comedian. Please try again.'
      });
    },
    retry: 1
  });
}
```

**Step 2: Commit**

```bash
git add src/hooks/useUserPreferences.ts
git commit -m "feat(hooks): add useUserPreferences hook

- useFavourites query with optimistic updates
- useAddToFavourites, useRemoveFromFavourites mutations
- useHiddenComedians query
- useHideComedian, useUnhideComedian mutations
- Full error handling and toast notifications

Part of Phase 3: UI Components Library"
```

---

## Task 5-22: Component Implementation

Due to the extensive nature of the remaining tasks (17 presentational components + 10 containers), the detailed step-by-step implementation for each component would make this plan extremely long.

**Recommendation:** Implement components in groups following the page-tab driven order:

### Group 1: Applications Tab (Tasks 5-12)
- Task 5: EventManagementHeader + Container
- Task 6: ApplicationCard + Container
- Task 7: ApplicationList + Container
- Task 8: ShortlistPanel + Container
- Task 9: ApplicationFilters
- Task 10: ApplicationBulkActions

### Group 2: Lineup Tab (Tasks 13-17)
- Task 11: SpotCard + Container
- Task 12: SpotList + Container
- Task 13: SpotPaymentEditor + Container
- Task 14: LineupTimeline
- Task 15: SpotFilters

### Group 3: Deals Tab (Tasks 18-22)
- Task 16: DealCard + Container
- Task 17: DealList + Container
- Task 18: DealBuilder + Container
- Task 19: DealApprovalPanel + Container
- Task 20: ParticipantList, ParticipantCard
- Task 21: SplitCalculator
- Task 22: SettleButton

**Each component task follows the same pattern:**
1. Create presentational component with TypeScript interface
2. Create container component with React Query hooks
3. Write unit tests (optional in this phase)
4. Verify TypeScript compilation
5. Commit

**Reference:** Full component specifications in design document at `Plans/Event-Management-UI-Components-20251028.md`

---

## Testing Strategy

### Manual Testing Checklist (per tab)
- [ ] All components render without errors
- [ ] Loading states display correctly
- [ ] Error states show user-friendly messages
- [ ] Empty states guide user to next action
- [ ] Optimistic updates rollback on error
- [ ] Toast notifications appear for all actions
- [ ] Keyboard navigation works
- [ ] Mobile responsive layout
- [ ] Dark mode styling correct

### TypeScript Compilation
Run: `npm run lint`
Expected: 0 errors (41 pre-existing warnings OK)

### E2E Tests (Optional for Phase 3)
Defer to Phase 4 when tab pages are assembled

---

## Completion Criteria

- [ ] All database migrations applied and tested
- [ ] userPreferencesService created with all CRUD functions
- [ ] useUserPreferences hook created with queries and mutations
- [ ] All 27 component files created (17 presentational + 10 containers)
- [ ] Components organized in subdomain directories
- [ ] TypeScript compilation passing (0 errors)
- [ ] All components use shadcn/ui primitives
- [ ] Container/presentational pattern consistently applied
- [ ] Favourites feature fully functional
- [ ] Hide feature (event + global) fully functional
- [ ] Revenue visibility rules implemented
- [ ] All components committed to git

---

## Next Phase

**Phase 4: Tab Pages & Integration** will assemble these components into:
- `EventOverviewTab.tsx`
- `ApplicationsTab.tsx`
- `LineupTab.tsx`
- `DealsTab.tsx`

Main page `EventManagement.tsx` will wrap tabs with routing at `/events/:eventId/manage`.

---

## Notes

- All components follow strict TypeScript rules (no implicit any, null-check arrays)
- Tailwind class order: layout → spacing → color
- Optimistic updates with rollback on error
- 5-minute stale time for React Query
- Use existing shadcn/ui components from `src/components/ui/`
- Reference design document for complete component specifications
