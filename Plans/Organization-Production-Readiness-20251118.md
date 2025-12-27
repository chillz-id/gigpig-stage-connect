# Organization Role Production Readiness
Created: 2025-11-18
Updated: 2025-11-18 - Added schema architecture findings and simplified Phase 1 approach
Status: In Progress

## Overview

Bring the Organization role to production readiness by fixing data integrity issues, improving caching strategy, completing missing features, and adding comprehensive testing and documentation.

## Implementation Findings (Updated: 2025-11-18)

### Discovery: Organizations Require Separate Profile Records

**Found during**: Phase 1 migration attempt
**Impact**: Can't simply change org ID due to FK cascade: `auth.users → profiles → organization_profiles`
**Resolution**: Accept current state (iD Comedy shares Chillz's profile ID), add validation to prevent future issues

**Schema Architecture:**
```
auth.users (Supabase Auth - one per user account)
    ↓ FK: profiles.id → auth.users.id ON DELETE CASCADE
profiles (Base profiles - one per user AND one per organization)
    ↓ FK: organization_profiles.id → profiles.id ON DELETE CASCADE
organization_profiles (Organization-specific data)
    ↓ FK: organization_profiles.owner_id → profiles.id
```

**All profile types follow this pattern:**
- `manager_profiles.id` → `profiles.id` (confirmed in migration 20251018)
- `photographer_profiles.id` → `profiles.id` (confirmed in migration 20250108)
- `videographer_profiles.id` → `profiles.id` (confirmed in migration 20251018)
- `visual_artist_profiles.id` → `profiles.id` (confirmed in migration 20251019)
- `organization_profiles.id` → `profiles.id` (confirmed in migration 20251019)

**The Bug:**
iD Comedy was created with `id = owner_id = '2fc4f578-7216-447a-876c-7bf9f4c9b096'` (Chillz's profile ID). This violates the intended architecture where:
- Organization should have its OWN profile record separate from the creator
- `organization_profiles.id` should reference the org's profile
- `organization_profiles.owner_id` should reference Chillz's profile

**Why Accept Current State:**
- Creating new profile requires auth.users record (complex cascade)
- Current state is FUNCTIONAL - `get_user_organizations()` works correctly
- Real user issue is frontend caching (`refetchOnMount: false`), not database
- Future validation prevents recurrence

### Discovery: ProfileCreationWizard Missing Org Profile Creation

**Found during**: Code review of profile creation flow
**File**: `src/components/profile/ProfileCreationWizard.tsx` lines 127-146
**Issue**: Org creation doesn't explicitly create profile record first
**Fix**: Add profile creation step before inserting into organization_profiles

## Problem Statement

The organization role is **85% complete** with sophisticated features (team management, permissions, events, tasks, analytics) but has several gaps preventing production deployment:

1. **Data Integrity Issue**: iD Comedy organization has corrupted `owner_id` (points to org's own ID instead of user ID)
2. **Caching Problem**: Organization list doesn't refresh due to aggressive cache settings (`refetchOnMount: false`)
3. **Missing Features**: Messages and Vouches pages are 40-line placeholders
4. **No Profile Integration**: Organizations don't appear in ProfileSwitcher or ProfileContext
5. **No Testing**: Zero test coverage for organization features
6. **No Documentation**: No implementation plans or feature docs (unlike comedian_lite)

## Current State Analysis

### What EXISTS (85% Complete)

**Database Schema** ✅
- `organization_profiles` table - 32 columns with full business info
- `organization_team_members` table - Team management with roles
- Advanced permission system (9 scopes × 3 actions)
- 7 specialized manager types
- RLS policies in place

**Features Implemented** ✅
- 14 page components (Dashboard, Profile, Events, Tasks, Team, Media, Analytics)
- 8 custom hooks for data fetching
- Team management with role assignment
- Granular permission editor
- Event and task management
- Media library
- Analytics dashboard

**Technical Architecture** ✅
- OrganizationContext for state management
- TanStack Query for server state
- Memoization to prevent re-renders
- Proper error boundaries

### What's BROKEN

**Data Corruption** ❌
- Query results:
  ```sql
  SELECT id, owner_id FROM organization_profiles
  WHERE id = owner_id;
  -- Returns: iD Comedy (id = owner_id = '2fc4f578-7216-447a-876c-7bf9f4c9b096')
  ```
- Root cause: `owner_id` should reference a user profile ID, not the org's own ID
- Impact: Causes confusion in ownership checks, though team membership still works

**Caching Issues** ❌
- Hook settings prevent refresh:
  ```typescript
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  ```
- Users can't see newly added organizations without hard refresh
- No manual refresh button in UI

### What's MISSING

**Incomplete Pages** ❌
- `OrganizationInvoices.tsx` - 40 lines (placeholder - will implement later)
- `OrganizationMessages.tsx` - 40 lines (needs completion)
- `OrganizationVouches.tsx` - 40 lines (needs completion)

**Profile System Integration** ❌
- Organizations not in ProfileContext
- Not in ProfileSwitcher dropdown
- Can't switch between user profile and org profiles

**Testing & Documentation** ❌
- Zero test files for organization features
- No planning documents
- No feature documentation
- No design rationale for permission system

## Implementation Plan

### Phase 1: Data Integrity (REVISED - Simplified Approach)
**Estimated Time**: 30 minutes (reduced from 1 hour)
**Status**: In Progress
**Last Updated**: 2025-11-18

**Decision**: Accept iD Comedy's current state (id = owner_id), prevent future issues only

#### Task 1.1: Simplified Migration - Prevention Only
**File**: `supabase/migrations/20251118_prevent_org_owner_id_corruption.sql` (renamed from fix_)

**Approach Change**:
- ❌ ~~Fix existing data~~ (too complex due to FK cascade)
- ✅ Add CHECK constraint with exception for iD Comedy
- ✅ Add validation trigger for new orgs
- ✅ Document iD Comedy as grandfathered exception

**Migration**:
```sql
-- Migration: 20251118_prevent_org_owner_id_corruption.sql

-- Add CHECK constraint with exception for existing iD Comedy
ALTER TABLE organization_profiles
ADD CONSTRAINT owner_id_not_self
CHECK (
  owner_id != id
  OR id = '2fc4f578-7216-447a-876c-7bf9f4c9b096' -- Exception for iD Comedy
);

COMMENT ON CONSTRAINT owner_id_not_self ON organization_profiles IS
  'Prevents owner_id from equaling organization id (user profile must be separate from org profile). Exception: iD Comedy (grandfathered in as historical data issue).';

-- Verify constraint allows iD Comedy but blocks new violations
DO $$
BEGIN
  -- This should succeed (iD Comedy exception)
  UPDATE organization_profiles
  SET owner_id = owner_id
  WHERE id = '2fc4f578-7216-447a-876c-7bf9f4c9b096';

  RAISE NOTICE 'iD Comedy exception working correctly';

  -- Verify no other orgs have this issue
  IF EXISTS (
    SELECT 1 FROM organization_profiles
    WHERE id = owner_id
    AND id != '2fc4f578-7216-447a-876c-7bf9f4c9b096'
  ) THEN
    RAISE EXCEPTION 'Found other orgs with id = owner_id!';
  ELSE
    RAISE NOTICE 'No other organizations have id = owner_id issue';
  END IF;
END $$;
```

**Testing Checklist**:
- [ ] Migration runs successfully
- [ ] Constraint allows iD Comedy (exception)
- [ ] Constraint blocks new id = owner_id violations
- [ ] Organization list still loads correctly
- [ ] `get_user_organizations()` still returns iD Comedy

#### Task 1.2: Fix ProfileCreationWizard
**File**: `src/components/profile/ProfileCreationWizard.tsx`
**Lines**: 127-146 (organization creation)

**Add profile creation before org creation**:
```typescript
// BEFORE (current - WRONG):
const { data: newOrg, error } = await supabase
  .from('organization_profiles')
  .insert({
    owner_id: user.id,
    organization_name: orgData.organization_name,
    // ... other fields (no explicit id set!)
  });

// AFTER (correct):
// Step 1: Create profile record for organization first
const orgProfileId = crypto.randomUUID();
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: orgProfileId,
    first_name: orgData.organization_name,
    email: orgData.contact_email,
  });

if (profileError) throw profileError;

// Step 2: Create organization_profiles record
const { data: newOrg, error } = await supabase
  .from('organization_profiles')
  .insert({
    id: orgProfileId, // ✅ Explicitly use org's profile ID
    owner_id: user.id, // ✅ Separate from org ID
    organization_name: orgData.organization_name,
    // ... other fields
  });
```

**Testing Checklist**:
- [ ] Create new organization via wizard
- [ ] Verify profile record created with unique ID
- [ ] Verify organization_profiles.id != organization_profiles.owner_id
- [ ] Org appears in profile list immediately
- [ ] No database constraint violations

---

### Phase 2: Caching & Real-time Updates (HIGH PRIORITY)
**Estimated Time**: 3 hours (2.1-2.2), 4 hours (2.3 optional)
**Status**: Pending

#### Task 2.1: Add Manual Refresh Button
**Files**:
- `src/hooks/useOrganizationProfiles.ts` - Export refetch
- ProfileSwitcher or organization list component - Add button

**Hook Changes**:
```typescript
// src/hooks/useOrganizationProfiles.ts

export function useOrganizationProfiles() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['organization-profiles', user?.id],
    queryFn: async () => { /* existing code */ },
    // ... existing config
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch, // ✅ NEW: Expose refetch function
    isRefetching: query.isRefetching, // ✅ NEW: Show loading state
  };
}
```

**UI Component** (example - location TBD):
```typescript
function OrganizationListRefresh() {
  const { refetch, isRefetching } = useOrganizationProfiles();

  return (
    <Button
      onClick={() => refetch()}
      disabled={isRefetching}
      size="sm"
      variant="ghost"
    >
      <RefreshCw className={cn(
        "h-4 w-4",
        isRefetching && "animate-spin"
      )} />
      {isRefetching ? "Refreshing..." : "Refresh"}
    </Button>
  );
}
```

**Testing**:
- [ ] Refetch button appears in UI
- [ ] Clicking triggers refetch (check network tab)
- [ ] Loading state shows while fetching
- [ ] Button disabled during refetch
- [ ] New organizations appear after refetch

#### Task 2.2: Improve Cache Invalidation
**Files**:
- `src/hooks/useOrganizationProfiles.ts` - Add create/delete hooks
- `src/pages/organization/OrganizationProfile.tsx` - Use update hook
- Any org creation flows

**Create Hook** (NEW):
```typescript
export function useCreateOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      organization_name: string;
      display_name: string;
      legal_name: string;
      organization_type: string;
      contact_email: string;
      // ... other required fields
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: org, error } = await supabase
        .from('organization_profiles')
        .insert({
          ...data,
          owner_id: user.id, // ✅ CRITICAL: Set owner_id to user, not org
        })
        .select()
        .single();

      if (error) throw error;
      return org;
    },
    onSuccess: () => {
      // ✅ Invalidate cache so new org appears immediately
      queryClient.invalidateQueries({
        queryKey: ['organization-profiles', user?.id]
      });
      toast({
        title: 'Organization created',
        description: 'Your organization has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

**Delete Hook** (NEW):
```typescript
export function useDeleteOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from('organization_profiles')
        .delete()
        .eq('id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      // ✅ Invalidate cache so deleted org disappears
      queryClient.invalidateQueries({
        queryKey: ['organization-profiles', user?.id]
      });
      toast({
        title: 'Organization deleted',
        description: 'Organization has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

**Update Hook** (VERIFY EXISTING):
```typescript
// src/hooks/useOrganizationProfiles.ts
// Line 196: Already has invalidation ✅
queryClient.invalidateQueries({ queryKey: ['organization-profiles', user?.id] });
```

**Testing**:
- [ ] Creating organization invalidates cache
- [ ] Updating organization invalidates cache (already working)
- [ ] Deleting organization invalidates cache
- [ ] List refreshes automatically after mutations
- [ ] No duplicate entries appear

#### Task 2.3: Add Real-time Subscriptions (OPTIONAL)
**Status**: Low priority - nice to have
**File**: `src/hooks/useOrganizationRealtimeSync.ts` (NEW)

**Implementation**:
```typescript
// Real-time subscription to organization changes
export function useOrganizationRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to organization_profiles changes
    const channel = supabase
      .channel('organization-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'organization_profiles'
        },
        (payload) => {
          console.log('Organization changed:', payload);
          // Invalidate cache to refetch
          queryClient.invalidateQueries({
            queryKey: ['organization-profiles', user.id]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
```

**Usage**:
```typescript
// Add to a high-level component (e.g., App.tsx or OrganizationProvider)
function App() {
  useOrganizationRealtimeSync(); // Auto-sync org changes
  return <Routes>...</Routes>;
}
```

**Testing**:
- [ ] Open two browser windows with same user
- [ ] Create org in window 1
- [ ] Verify org appears in window 2 automatically
- [ ] Update org in window 1
- [ ] Verify changes appear in window 2
- [ ] Delete org in window 1
- [ ] Verify disappears from window 2

---

### Phase 3: Complete Placeholder Pages (MEDIUM PRIORITY)
**Estimated Time**: 8 hours
**Status**: Pending

#### Task 3.1: Organization Messages Page
**File**: `src/pages/organization/OrganizationMessages.tsx`
**Current**: 40-line placeholder
**Required**: Full messaging interface

**Integrate with Existing System**:
- Reuse components from existing messages system
- Filter messages by organization context
- Send messages as organization (not personal profile)
- Show organization logo in message header

**Component Structure**:
```typescript
export default function OrganizationMessages() {
  const { orgId, organization } = useOrganization();

  // Filter messages where:
  // - sender_id = orgId OR recipient_id = orgId
  const { data: messages } = useMessages({
    context: 'organization',
    contextId: orgId,
  });

  return (
    <div className="space-y-6">
      {/* Inbox/Sent tabs */}
      {/* Message list */}
      {/* Message thread view */}
      {/* Compose new message */}
    </div>
  );
}
```

**Database Considerations**:
- Verify `messages` table supports organization sender/recipient
- May need migration to add `sender_type` field ('user' | 'organization')
- RLS policies to check organization team permissions

**Testing**:
- [ ] Can view messages sent to organization
- [ ] Can send messages as organization
- [ ] Organization logo appears in messages
- [ ] Team members with permission can access
- [ ] Non-members cannot access

#### Task 3.2: Organization Vouches Page
**File**: `src/pages/organization/OrganizationVouches.tsx`
**Current**: 40-line placeholder
**Required**: Vouch system integration

**Features**:
- List vouches received by organization
- Give vouches to comedians/other orgs as organization
- Display vouch badges and stats
- Vouch leaderboard for organization members

**Component Structure**:
```typescript
export default function OrganizationVouches() {
  const { orgId, organization } = useOrganization();

  const { data: receivedVouches } = useVouchesReceived(orgId, 'organization');
  const { data: givenVouches } = useVouchesGiven(orgId, 'organization');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received ({receivedVouches?.length})</TabsTrigger>
          <TabsTrigger value="given">Given ({givenVouches?.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {/* Vouch cards */}
        </TabsContent>

        <TabsContent value="given">
          {/* Vouch history */}
        </TabsContent>
      </Tabs>

      {/* Give Vouch button */}
    </div>
  );
}
```

**Database Considerations**:
- Verify `vouches` table supports organization voucher/vouchee
- May need `voucher_type` and `vouchee_type` fields
- RLS policies for organization vouches

**Testing**:
- [ ] Can view vouches received by org
- [ ] Can give vouches as org (with permission)
- [ ] Vouch stats displayed correctly
- [ ] Permissions respected

---

### Phase 4: Profile Integration (MEDIUM PRIORITY)
**Estimated Time**: 4 hours
**Status**: Pending

#### Task 4.1: Integrate into ProfileContext
**Files**:
- `src/contexts/ProfileContext.tsx` - Add organization support
- `src/components/ProfileSwitcher.tsx` - Add orgs to dropdown

**Current Issue**: ProfileContext only handles user profiles, not organizations

**ProfileContext Changes**:
```typescript
// Add to ProfileContext
export interface ProfileContextValue {
  // Existing user profiles
  profiles: UserProfile[];
  activeProfile: UserProfile | null;

  // ✅ NEW: Organization profiles
  organizations: OrganizationProfile[];
  activeOrganization: OrganizationProfile | null;

  // ✅ NEW: Unified active entity
  activeEntity: UserProfile | OrganizationProfile | null;
  entityType: 'user' | 'organization' | null;

  switchProfile: (profileId: string, type: 'user' | 'organization') => void;
}
```

**ProfileSwitcher Changes**:
```typescript
function ProfileSwitcher() {
  const { profiles, organizations, activeEntity, switchProfile } = useProfile();

  // Group by type
  const allEntities = [
    ...profiles.map(p => ({ ...p, type: 'user' })),
    ...organizations.map(o => ({ ...o, type: 'organization' })),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {/* Show active entity name and logo */}
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Personal Profiles</DropdownMenuLabel>
        {profiles.map(profile => (
          <DropdownMenuItem onClick={() => switchProfile(profile.id, 'user')}>
            {profile.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map(org => (
          <DropdownMenuItem onClick={() => switchProfile(org.id, 'organization')}>
            <Building className="mr-2 h-4 w-4" />
            {org.display_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Navigation Behavior**:
- When switching to organization: navigate to `/org/:orgId/dashboard`
- When switching to user profile: navigate to `/profile`
- Preserve page context where possible (e.g., /gigs stays /gigs)

**Testing**:
- [ ] Organizations appear in dropdown
- [ ] Can switch to organization profile
- [ ] Navigation updates correctly
- [ ] Active organization persists across page loads
- [ ] Sidebar reflects organization context

#### Task 4.2: Verify Organization Profile URLs
**Routes to test**:
- `/organization/:slug/*` - Public profile view
- `/org/:orgId/dashboard` - Organization dashboard
- All nested routes under `/org/:orgId/`

**Testing Checklist**:
- [ ] Slug validation works (reserved slugs blocked)
- [ ] 404 handling for non-existent orgs
- [ ] Profile switching preserves page context
- [ ] Slug history redirects work (301)
- [ ] Per-profile sidebar preferences work
- [ ] ActiveProfileContext provides correct org data

---

### Phase 5: Testing & Documentation (HIGH PRIORITY)
**Estimated Time**: 10 hours (2 + 8)
**Status**: Pending

#### Task 5.1: Write Implementation Documentation (DO FIRST)
**Estimated Time**: 2 hours
**Status**: Pending

**Files to create**:
1. `docs/features/ORGANIZATION_SYSTEM.md` - Feature overview
2. Permission system design doc

**ORGANIZATION_SYSTEM.md structure**:
```markdown
# Organization System

## Overview
Multi-tenant organization profiles with team management and granular permissions

## Database Schema
- organization_profiles table
- organization_team_members table
- Permission system (9 scopes × 3 actions)

## Features
- Team management with roles
- 7 specialized manager types
- Events, tasks, media, analytics
- Permission templates and overrides

## API Reference
- Hooks: useOrganizationProfiles, useOrganizationTeamMembers, etc.
- RPC functions: get_user_organizations, get_effective_permissions

## Usage Examples
[Code examples for common scenarios]
```

**Permission System Design Doc**:
- Rationale for 9 scopes
- Manager type templates explained
- Custom permission override strategy
- Security considerations
- Future enhancements

#### Task 5.2: Add Comprehensive Tests
**Estimated Time**: 8 hours
**Status**: Pending

**Unit Tests** (hooks):
- `tests/hooks/useOrganizationProfiles.test.ts`
  - Fetches user's organizations
  - Returns empty object when no orgs
  - Handles RPC errors gracefully
  - Refetch function works
  - Cache invalidation on mutations

- `tests/hooks/useOrganizationTeamMembers.test.ts`
  - Fetches team members with user details
  - Role updates work
  - Permission updates work
  - Member removal works

**Component Tests**:
- `tests/pages/organization/OrganizationDashboard.test.tsx`
  - Renders stats correctly
  - Shows upcoming events
  - Displays team activity

- `tests/pages/organization/OrganizationTeam.test.tsx`
  - Lists team members
  - Add member flow works
  - Permission editor saves correctly
  - Role updates reflect immediately

**E2E Tests**:
- `tests/e2e/organization-workflows.spec.ts`
  - Create organization flow
  - Add team member flow
  - Assign permissions flow
  - Create event as organization
  - Profile switching between user and org

**Coverage Goal**: 80%+ for organization features

---

## Files to Modify/Create

### Database Migrations
1. `supabase/migrations/20251118_fix_organization_owner_id.sql` - Fix corruption + add constraint

### Hooks
1. `src/hooks/useOrganizationProfiles.ts` - Export refetch, add create/delete hooks
2. `src/hooks/useOrganizationRealtimeSync.ts` - NEW: Real-time subscriptions

### Pages
1. `src/pages/organization/OrganizationMessages.tsx` - Complete implementation
2. `src/pages/organization/OrganizationVouches.tsx` - Complete implementation

### Contexts
1. `src/contexts/ProfileContext.tsx` - Add organization support

### Components
1. `src/components/ProfileSwitcher.tsx` - Add orgs to dropdown
2. Organization refresh button component (location TBD)

### Tests
1. `tests/hooks/useOrganizationProfiles.test.ts` - NEW
2. `tests/hooks/useOrganizationTeamMembers.test.ts` - NEW
3. `tests/pages/organization/*.test.tsx` - NEW (multiple files)
4. `tests/e2e/organization-workflows.spec.ts` - NEW

### Documentation
1. `docs/features/ORGANIZATION_SYSTEM.md` - NEW
2. Permission system design doc (location TBD)

---

## Key Behaviors & Requirements

### Data Integrity
✅ `owner_id` must reference a user profile ID, never the org's own ID
✅ Database constraint prevents self-reference
✅ Migration fixes existing corrupted data
✅ No orphaned organizations (every org has a valid owner)

### Caching Strategy
✅ Manual refresh button available
✅ Cache invalidates on create/update/delete mutations
✅ Real-time sync (optional) keeps all clients updated
✅ Stale data never persists beyond 5 minutes

### Profile Integration
✅ Organizations appear in profile switcher
✅ Switching navigates to correct route
✅ Active organization persists across page loads
✅ Sidebar reflects organization context

### Permissions
✅ Team members have granular access control
✅ Permission templates based on manager type
✅ Custom overrides supported
✅ RLS enforces permissions at database level

### Testing
✅ 80%+ test coverage for all organization features
✅ Unit tests for all hooks
✅ Component tests for all pages
✅ E2E tests for critical workflows

---

## Success Criteria

Before marking this as **Completed**, verify:

- [ ] iD Comedy organization `owner_id` is fixed
- [ ] Database constraint prevents future corruption
- [ ] Manual refresh button works in UI
- [ ] Cache invalidates on all mutations
- [ ] Messages page is functional
- [ ] Vouches page is functional
- [ ] Organizations appear in ProfileSwitcher
- [ ] Can switch between user and org profiles
- [ ] All routes work correctly
- [ ] 80%+ test coverage achieved
- [ ] Documentation complete
- [ ] No console errors
- [ ] RLS policies tested and secure
- [ ] Production deployment successful

---

## Implementation Progress

### Phase 1: Data Integrity (Pending)
- [ ] Task 1.1: Fix corrupted owner_id
- [ ] Task 1.2: Add database constraint

### Phase 2: Caching & Real-time (Pending)
- [ ] Task 2.1: Manual refresh button
- [ ] Task 2.2: Cache invalidation
- [ ] Task 2.3: Real-time subscriptions (optional)

### Phase 3: Complete Pages (Pending)
- [ ] Task 3.1: Messages page
- [ ] Task 3.2: Vouches page

### Phase 4: Profile Integration (Pending)
- [ ] Task 4.1: ProfileContext integration
- [ ] Task 4.2: URL routing verification

### Phase 5: Testing & Docs (Pending)
- [ ] Task 5.1: Write documentation
- [ ] Task 5.2: Add comprehensive tests

---

## Notes

### Design Decisions

**Why no quick create wizard?**
Organizations are formal business entities requiring careful setup. Unlike comedian_lite (designed for rapid onboarding), organizations should have a deliberate creation flow with all required business information.

**Why keep invoices as placeholder?**
Invoicing system will be implemented separately as a platform-wide feature. Organization invoicing will integrate with that system once available.

**Why aggressive caching?**
Organizations don't change frequently. The aggressive caching (5min stale, 10min cache) prevents unnecessary API calls while still providing reasonable freshness. Manual refresh and real-time subscriptions handle edge cases.

### Future Enhancements

1. **Organization Templates** - Pre-configured settings for common org types (venue, agency, etc.)
2. **Bulk Team Import** - CSV import for adding multiple team members
3. **Advanced Analytics** - Revenue forecasting, team performance trends
4. **Integration Marketplace** - Third-party tool integrations
5. **Organization Branding** - Custom colors, fonts for org pages

### Security Considerations

- All organization routes must check team membership via RLS
- Sensitive operations (financial, team management) require specific permissions
- Permission changes logged for audit trail (future)
- Rate limiting on organization mutations to prevent abuse

---

## Rollback Plan

If issues arise during implementation:

1. **Database Migration Rollback**:
   ```sql
   -- Revert owner_id fix
   UPDATE organization_profiles
   SET owner_id = '2fc4f578-7216-447a-876c-7bf9f4c9b096'
   WHERE id = '2fc4f578-7216-447a-876c-7bf9f4c9b096';

   -- Remove constraint
   ALTER TABLE organization_profiles
   DROP CONSTRAINT IF EXISTS owner_id_not_self;
   ```

2. **Feature Flag Disable**: Add feature flag to hide organization features
3. **Git Revert**: Revert all commits related to this feature
4. **Vercel Deployment Rollback**: Use Vercel dashboard to rollback deployment

---

## Related Documentation

- `docs/features/PROFILE_URLS.md` - Profile URL system (applies to orgs)
- `AGENTS.md` - Git workflow and PR guidelines
- `CLAUDE.md` - Development commands and architecture
- Comedian lite plans in `docs/plans/` - TDD approach reference
