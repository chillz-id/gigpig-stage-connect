# Applications Tab Fixes & Performance Improvements

**Date**: 2025-12-17
**Status**: Completed

## Overview

Bug fixes and performance improvements for the Event Management Applications tab, including fixing the N+1 query problem, theme color issues, and shortlist-to-confirmed flow.

## Issues Fixed

### 1. N+1 Query Performance Issue

**Problem:** Each `ApplicationCardContainer` was making 2 separate queries per card:
- `useIsFavourited(comedianId)`
- `useIsHidden(comedianId, eventId)`

With 20 applications, this meant 40+ queries on page load.

**Solution:** Lifted queries to `ApplicationListContainer` level with batch fetching.

**Files Modified:**
- `src/components/applications/ApplicationListContainer.tsx`
- `src/components/applications/ApplicationCardContainer.tsx`

**Implementation:**
```typescript
// ApplicationListContainer.tsx
// Fetch favourites and hidden lists ONCE for all cards
const { data: favouritedComedianIds = [] } = useUserFavourites(userId);
const { data: hiddenComedianIdsFromDb = [] } = useHiddenComedians(userId, eventId);

// Create Sets for O(1) lookups
const favouritedSet = useMemo(() => new Set(favouritedComedianIds), [favouritedComedianIds]);
const hiddenSet = useMemo(() => new Set([...hiddenComedianIds, ...hiddenComedianIdsFromDb]), [...]);

// Pass pre-computed values as props
<ApplicationCardContainer
  isFavourited={favouritedSet.has(app.comedian_id)}
  isHidden={hiddenSet.has(app.comedian_id)}
/>
```

**Result:** Reduced from 40+ queries to just 2 queries.

### 2. Theme Color Issues

**Problem:** Hardcoded gray colors didn't work properly in dark mode.

**Files Modified:**
- `src/components/applications/ApplicationCard.tsx`
- `src/components/applications/ShortlistPanelContainer.tsx`

**Changes:**
```typescript
// Before (hardcoded)
<h3 className="text-gray-900 dark:text-gray-100">

// After (theme variables)
<h3 className="text-foreground">

// Other fixes:
// text-gray-500 dark:text-gray-400 → text-muted-foreground
// bg-gray-50 dark:bg-gray-800 → bg-muted
// border-gray-200 dark:border-gray-700 → border-border
```

### 3. Shortlist to Confirmed Flow

**Problem:** When a comedian was confirmed from the shortlist, they weren't moving to the Confirmed section.

**Solution:** Filter shortlist to exclude already-confirmed applications.

**File Modified:** `src/components/applications/ShortlistPanelContainer.tsx`

**Implementation:**
```typescript
// Fetch confirmed applications (status = 'accepted')
const { data: confirmedApplications } = useApplicationsByEvent(eventId, 'accepted');

// Filter shortlist to exclude already-confirmed applications
const filteredShortlist = useMemo(() => {
  if (!shortlistedApplications) return [];
  const confirmedIds = new Set((confirmedApplications || []).map(app => app.id));
  return shortlistedApplications.filter(app => !confirmedIds.has(app.id));
}, [shortlistedApplications, confirmedApplications]);
```

### 4. Shortlist Count Not Updating

**Problem:** The shortlist count in stats didn't update when a comedian was confirmed.

**Two Fixes Applied:**

**a) Stats Logic (`src/hooks/useApplicationStats.ts`):**
```typescript
// Before: counted all shortlisted regardless of status
const shortlisted = apps.filter(app => app.is_shortlisted).length;

// After: only count pending shortlisted (not yet confirmed)
const shortlisted = apps.filter(
  app => app.is_shortlisted && app.status === 'pending'
).length;
```

**b) Cache Invalidation (`src/hooks/useApplicationApproval.ts`):**
```typescript
onSuccess: (eventId) => {
  queryClient.invalidateQueries({ queryKey: applicationsKeys.byEvent(eventId) });
  queryClient.invalidateQueries({ queryKey: applicationsKeys.shortlisted(eventId) });
  queryClient.invalidateQueries({ queryKey: applicationsKeys.shortlistStats(eventId) });
  queryClient.invalidateQueries({ queryKey: ['application-stats', eventId] });
}
```

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/components/applications/ApplicationListContainer.tsx` | Batch fetch favourites/hidden |
| `src/components/applications/ApplicationCardContainer.tsx` | Accept pre-fetched props |
| `src/components/applications/ApplicationCard.tsx` | Theme color fixes |
| `src/components/applications/ShortlistPanelContainer.tsx` | Filter confirmed from shortlist, theme fixes |
| `src/hooks/useApplicationApproval.ts` | Cache invalidation for stats |
| `src/hooks/useApplicationStats.ts` | Fixed shortlist count logic |

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Queries per page load | 40+ | 2 |
| Query pattern | N+1 | Batch |
| Lookup complexity | O(n) per card | O(1) per card |

## Testing Notes

- All TypeScript checks pass
- Theme colors verified in both light and dark mode
- Shortlist → Confirmed flow working correctly
- Stats update reactively when applications are approved
