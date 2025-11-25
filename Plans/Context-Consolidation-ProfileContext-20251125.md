# ProfileContext + ActiveProfileContext Consolidation Plan
Created: 2025-11-25
Status: Pending

## Overview
Two contexts manage profile state with overlapping responsibilities. This plan proposes consolidating them into a single unified context to simplify state management and eliminate synchronization issues.

## Current Architecture

### ProfileContext (`src/contexts/ProfileContext.tsx`)
**Purpose**: Manages what profile TYPES the user can access
**State**:
- `activeProfile: ProfileTypeValue | null` - Type identifier (e.g., 'comedian', 'org:uuid')
- `availableProfiles: ProfileTypeValue[]` - List of accessible profile types
- `isLoading`, `error`

**Data Sources**:
- `user_roles` table for base profiles (comedian, manager, photographer, videographer)
- `useOrganizationProfiles()` for organization memberships

**Usage**: 16 files (pages, layout, profile management)

### ActiveProfileContext (`src/contexts/ActiveProfileContext.tsx`)
**Purpose**: Manages which profile ENTITY is currently selected
**State**:
- `activeProfile: ActiveProfile | null` - Full entity (id, type, slug, name, avatarUrl)

**Data Sources**:
- localStorage persistence
- Set manually via `setActiveProfile()`

**Usage**: 5 files (PublicProfile, UnifiedSidebar, ProfileSwitcher, ComedianProfileLayout)

### Key Overlap
`ProfileSwitcher.tsx` imports BOTH contexts and must keep them synchronized:
```typescript
import { useProfile, ... } from '@/contexts/ProfileContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
```

## Problems with Current Design

1. **Dual State Management**: Two separate sources of truth for "active profile"
2. **Manual Synchronization**: ProfileSwitcher must coordinate both contexts
3. **Type vs Entity Mismatch**: ProfileContext stores types, ActiveProfileContext stores entities
4. **Inconsistent Data**: Risk of contexts getting out of sync
5. **Complexity**: Consumers must understand which context to use when

## Proposed Consolidation

### New Unified Context: `ProfileContext`

```typescript
interface ProfileEntity {
  id: string;
  type: 'comedian' | 'comedian_lite' | 'manager' | 'organization' | 'venue' | 'photographer' | 'videographer';
  slug: string;
  name: string;
  avatarUrl?: string;
}

interface UnifiedProfileContextValue {
  // Active profile (full entity)
  activeProfile: ProfileEntity | null;
  setActiveProfile: (profile: ProfileEntity) => void;

  // Available profiles (list of entities)
  availableProfiles: ProfileEntity[];

  // Loading/error state
  isLoading: boolean;
  error: string | null;

  // Helpers (from current contexts)
  hasProfile: (type: string) => boolean;
  getProfileUrl: (page?: string) => string;
  clearActiveProfile: () => void;
}
```

### Data Flow

1. On mount: Fetch all profile entities for authenticated user
   - Query `profiles` + `comedians` for comedian profiles
   - Query `profiles` + `managers` for manager profiles
   - Query `organization_profiles` for org memberships
   - Query `photographers`, `videographers` for media profiles

2. Build `availableProfiles` array with full entity data

3. Restore `activeProfile` from localStorage (by id) or default to first

4. Expose single API for consumers

## Files to Modify

### Phase 1: Create Unified Context
1. **`src/contexts/ProfileContext.tsx`** - Merge ActiveProfileContext logic into ProfileContext
   - Add entity fields to state
   - Add profile entity fetching queries
   - Add localStorage persistence for selected profile id

### Phase 2: Update Consumers
Files currently using ActiveProfileContext:
1. `src/pages/PublicProfile.tsx`
2. `src/components/layout/UnifiedSidebar.tsx`
3. `src/components/layout/ProfileSwitcher.tsx`
4. `src/components/comedian-profile/ComedianProfileLayout.tsx`

Files currently using ProfileContext (minimal changes):
- Update to use entity data instead of just types

### Phase 3: Remove ActiveProfileContext
1. **`src/contexts/ActiveProfileContext.tsx`** - DELETE
2. **`src/App.tsx`** - Remove ActiveProfileProvider wrapper

## Migration Strategy

### Option A: Big Bang (Recommended for small team)
- Make all changes in one PR
- Easier to ensure consistency
- Risk: Large PR, more review overhead

### Option B: Incremental
1. Add entity fields to ProfileContext
2. Deprecate ActiveProfileContext (add warnings)
3. Migrate consumers one at a time
4. Remove ActiveProfileContext
- Risk: Period of dual-context maintenance

## Key Behaviors to Preserve

- localStorage persistence of active profile selection
- Profile URL generation (`getProfileUrl(page)`)
- Screen reader announcements on profile switch
- `comedian_lite` maps to `comedian` routes
- `organization` abbreviates to `org` in URLs
- Support for organization profiles (org:{uuid})

## Testing Checklist
- [ ] Profile switching persists across page reload
- [ ] Profile switching works between base profiles and organizations
- [ ] URL generation works for all profile types
- [ ] Screen reader announcements fire on switch
- [ ] Public profile pages load correct profile data
- [ ] Sidebar shows correct navigation for active profile
- [ ] No infinite loops from state updates

## Risks & Mitigations

1. **Risk**: Breaking profile switching during migration
   **Mitigation**: E2E tests for profile-urls.spec.ts

2. **Risk**: localStorage key changes breaking existing users
   **Mitigation**: Support both old keys during migration, migrate data on load

3. **Risk**: Performance regression from larger context
   **Mitigation**: Use React Query caching, memoize derived values

## Notes
- Consider whether comedian_lite should be a separate profile type or handled via profile.tier field
- Organization profiles use `org:{uuid}` format - this pattern should be preserved
- PROFILE_TYPES constant can remain for UI rendering (icons, labels)
