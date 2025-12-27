# Infinite Request Loop Fixes - November 9, 2025

## Overview
Fixed multiple infinite request loops causing 1000+ requests on the /gigs page, threatening to crash the droplet. The root causes were unstable array/object references and non-memoized hook functions triggering continuous re-renders.

## Problems Identified

### 1. Autosave Request Stacking
**File**: `src/hooks/useAvailabilitySelection.ts`
**Issue**: Multiple mutations starting before previous ones finished, causing progressive slowdown (4.9s → 8.4s → 14.4s → infinite)
**Root Cause**: Debounce timer cleared but didn't check if mutation already running

### 2. ProfileSwitcher Infinite Loop
**File**: `src/components/layout/ProfileSwitcher.tsx`
**Issue**: useEffect triggering on every render due to unstable `availableProfiles` array reference
**Root Cause**: Array dependency with new reference on every render

### 3. ProfileContext Infinite Loop
**File**: `src/contexts/ProfileContext.tsx`
**Issue**: React Query default value `= []` creating new array reference on every render
**Root Cause**: Unstable default empty array triggering dependent useEffects

### 4. OrganizationProfiles Infinite Loop
**File**: `src/hooks/useOrganizationProfiles.ts`
**Issue**: React Query default value `= {}` creating new object reference on every render
**Root Cause**: Unstable default empty object triggering dependent components

### 5. AuthContext Function Reference Instability
**Files**:
- `src/hooks/useAuthOperations.ts`
- `src/hooks/useProfileOperations.ts`
**Issue**: 1000+ requests to `/rest/v1/profiles` and `/rest/v1/user_roles`
**Root Cause**: Hook functions not memoized, creating new references on every render, causing AuthContext value to change constantly

## Fixes Applied

### Fix 1: Prevent Autosave Request Stacking
**File**: `src/hooks/useAvailabilitySelection.ts` (lines 157-163, 202-208)

```typescript
// BEFORE (caused infinite stacking):
if (debounceTimerRef.current) {
  clearTimeout(debounceTimerRef.current);
}
debounceTimerRef.current = setTimeout(() => {
  saveMutation.mutate(); // ALWAYS runs, even if mutation already running
}, 1000);

// AFTER (prevents stacking):
if (debounceTimerRef.current) {
  clearTimeout(debounceTimerRef.current);
}
// CRITICAL FIX: Only start new mutation if not already saving
if (!saveMutation.isPending) {
  debounceTimerRef.current = setTimeout(() => {
    saveMutation.mutate();
  }, 1000);
}
```

**Result**: Only one mutation runs at a time, prevents infinite accumulation

### Fix 2: Stable ProfileSwitcher Array Comparison
**File**: `src/components/layout/ProfileSwitcher.tsx` (lines 70-123)

```typescript
// Added useRef to track previous profiles
const prevProfilesRef = useRef<string>('');

useEffect(() => {
  // Create stable string key from profiles array to prevent infinite loops
  const profilesKey = JSON.stringify([...availableProfiles].sort());

  // Only fetch if profiles actually changed (not just new array reference)
  if (profilesKey === prevProfilesRef.current) {
    return; // ← Prevents infinite loop!
  }

  prevProfilesRef.current = profilesKey;

  // ... fetch profile data ...
}, [user?.id, availableProfiles]);
```

**Result**: Only fetches when profiles content actually changes, not on every render

### Fix 3: Stable Empty Array in ProfileContext
**File**: `src/contexts/ProfileContext.tsx` (lines 74, 85, 89)

```typescript
// BEFORE (creates new array on every render):
const { data: availableProfiles = [], ... } = useQuery({...});

// AFTER (stable reference):
const EMPTY_PROFILES: ProfileTypeValue[] = [];
const { data: availableProfiles = EMPTY_PROFILES, ... } = useQuery({
  queryFn: async () => {
    if (!user) return EMPTY_PROFILES; // ← Stable reference
    // ...
  },
});
```

**Also added critical query options**:
```typescript
refetchOnWindowFocus: false, // CRITICAL: Prevent refetch on window focus
refetchOnMount: false, // CRITICAL: Don't refetch on every mount
refetchOnReconnect: true, // Only refetch on network reconnect
```

**Result**: Query data always has stable reference, preventing infinite re-renders

### Fix 4: Stable Empty Object in OrganizationProfiles
**File**: `src/hooks/useOrganizationProfiles.ts` (lines 9, 45, 54, 61, 72)

```typescript
// BEFORE (creates new object on every render):
const { data: organizations = {}, ... } = useQuery({...});

// AFTER (stable reference):
const EMPTY_ORGANIZATIONS: Record<string, OrganizationProfile> = {};
const { data: organizations = EMPTY_ORGANIZATIONS, ... } = useQuery({
  queryFn: async () => {
    if (!user) return EMPTY_ORGANIZATIONS;
    if (error) return EMPTY_ORGANIZATIONS;
    if (orgIds.length === 0) return EMPTY_ORGANIZATIONS;
    // ...
  },
});
```

**Also added critical query options**:
```typescript
refetchOnWindowFocus: false,
refetchOnMount: false,
refetchOnReconnect: true,
```

**Result**: All returns use same stable reference, preventing infinite loops

### Fix 5: Memoize Auth Hook Functions
**File**: `src/hooks/useAuthOperations.ts`

```typescript
// BEFORE (new functions on every render):
export const useAuthOperations = () => {
  const signIn = async (email: string, password: string) => {...};
  const signUp = async (email: string, password: string, userData?: any) => {...};
  const signOut = async () => {...};
  return { signIn, signUp, signOut };
};

// AFTER (stable function references):
import { useCallback } from 'react';

export const useAuthOperations = () => {
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []); // CRITICAL: Empty deps - function never changes

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: userData } });
    return { error };
  }, []); // CRITICAL: Empty deps - function never changes

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []); // CRITICAL: Empty deps - function never changes

  return { signIn, signUp, signOut };
};
```

**File**: `src/hooks/useProfileOperations.ts`

```typescript
// BEFORE (new functions on every render):
export const useProfileOperations = () => {
  const { toast } = useToast();
  const fetchProfile = async (userId: string) => {...};
  const fetchRoles = async (userId: string) => {...};
  const updateProfile = async (user: User, updates: Partial<Profile>) => {...};
  return { fetchProfile, fetchRoles, updateProfile };
};

// AFTER (stable function references):
import { useCallback } from 'react';

export const useProfileOperations = () => {
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    // ... implementation ...
  }, []); // CRITICAL: Empty deps - function never changes

  const fetchRoles = useCallback(async (userId: string) => {
    // ... implementation ...
  }, []); // CRITICAL: Empty deps - function never changes

  const updateProfile = useCallback(async (user: User, updates: Partial<Profile>) => {
    // ... implementation using toast ...
  }, [toast]); // CRITICAL: Only depends on toast

  return { fetchProfile, fetchRoles, updateProfile };
};
```

**Result**: AuthContext value stable → no infinite re-renders

## Debugging Aids Added

Added comprehensive logging to track query execution:

```typescript
// ProfileContext
console.log('[ProfileContext] Fetching user roles for user:', user?.id);
console.log('[ProfileContext] User roles fetched:', profiles);

// useOrganizationProfiles
console.log('[useOrganizationProfiles] Fetching organizations for user:', user?.id);
console.log('[useOrganizationProfiles] Organizations fetched:', Object.keys(orgMap).length);

// ProfileSwitcher
console.log('[ProfileSwitcher] Fetching profile data for profiles:', availableProfiles);
console.log('[ProfileSwitcher] Profile data fetched:', Object.keys(dataMap));
```

## Key Learnings

### 1. React Query Default Values
**Problem**: `const { data = [] } = useQuery()` creates NEW array on EVERY render
**Solution**: Define stable constant outside component: `const EMPTY = []; ... data = EMPTY`

### 2. Hook Function Stability
**Problem**: Functions in custom hooks create new references on every render
**Solution**: Wrap all returned functions in `useCallback` with stable dependencies

### 3. Array Dependencies in useEffect
**Problem**: Array references change even if content is identical
**Solution**: Compare content (JSON.stringify + sort) instead of reference, or use stable ref

### 4. React Query Refetch Behavior
**Problem**: Default settings refetch on window focus, mount, and reconnect
**Solution**: Explicitly disable unwanted refetch triggers:
```typescript
refetchOnWindowFocus: false,
refetchOnMount: false,
refetchOnReconnect: true, // Only this one
```

### 5. Mutation Stacking
**Problem**: Starting new mutations before previous ones finish causes accumulation
**Solution**: Check `isPending` state before scheduling new mutations

## Performance Impact

**Before Fixes**:
- 1000+ requests accumulating infinitely
- Progressive slowdown: 4.9s → 8.4s → 14.4s per operation
- Risk of crashing the droplet
- User profiles, roles, and organization queries running hundreds of times per second

**After Fixes**:
- Queries run once on page load
- No request accumulation
- Stable performance
- System remains responsive

## Files Modified

1. `/root/agents/src/hooks/useAvailabilitySelection.ts`
2. `/root/agents/src/components/layout/ProfileSwitcher.tsx`
3. `/root/agents/src/contexts/ProfileContext.tsx`
4. `/root/agents/src/hooks/useOrganizationProfiles.ts`
5. `/root/agents/src/hooks/useAuthOperations.ts`
6. `/root/agents/src/hooks/useProfileOperations.ts`

## Testing Checklist

- [x] Browser Network tab shows normal request counts
- [x] Console logs show queries run once on page load
- [x] No progressive slowdown on availability selection
- [x] ProfileSwitcher doesn't trigger infinite fetches
- [x] AuthContext doesn't cause infinite re-renders
- [x] /gigs page loads without request accumulation

## Prevention Guidelines

### For Future Development

1. **Always use stable defaults for React Query**:
   ```typescript
   const EMPTY = [];
   const { data = EMPTY } = useQuery();
   ```

2. **Always memoize custom hook functions**:
   ```typescript
   export const useMyHook = () => {
     const myFunction = useCallback(() => {...}, [deps]);
     return { myFunction };
   };
   ```

3. **Disable unwanted React Query refetches**:
   ```typescript
   useQuery({
     refetchOnWindowFocus: false,
     refetchOnMount: false,
   });
   ```

4. **Check mutation state before scheduling**:
   ```typescript
   if (!mutation.isPending) {
     mutation.mutate();
   }
   ```

5. **Compare array content, not references**:
   ```typescript
   const prevKey = useRef('');
   const key = JSON.stringify(array.sort());
   if (key === prevKey.current) return;
   ```

## Related Issues

- Autosave performance optimization (database side already optimized to <50ms)
- File watcher exhaustion (ENOSPC) - increased to 524288
- comedian_lite role sidebar recognition

## Status

**Completed**: 2025-11-09
**Verified**: Infinite loops resolved, system stable
**Performance**: Normal request patterns restored
