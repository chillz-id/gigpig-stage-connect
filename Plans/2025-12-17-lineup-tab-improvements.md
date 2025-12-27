# Lineup Tab Improvements

**Date**: 2025-12-17
**Status**: Completed

## Overview

Major UX improvements to the Event Management Lineup tab, including UI cleanup, dynamic time calculation, and support for break items (Doors, Intermission, Custom).

## Changes Made

### 1. UI Cleanup

**Files Modified:**
- `src/pages/event-management/LineupTab.tsx`
- `src/components/lineup/SpotList.tsx`
- `src/components/lineup/SpotCard.tsx`

**Changes:**
- Removed "Filters & Display" section (not needed for MVP)
- Moved "Lineup Statistics" card to top of page (right after info alert)
- Removed purple gradient timeline decorations (dots, connector line, time markers)
- Simplified spot cards with clean layout:
  - Drag handle (GripVertical icon)
  - Position number in rounded box
  - Calculated start time display
  - Type/Status/Duration badges

### 2. Dynamic Start Time Calculation

**Files Modified:**
- `src/components/lineup/SpotListContainer.tsx`
- `src/types/spot.ts`

**How It Works:**
1. Fetches event's `start_time` from the `events` table
2. Sorts spots by `spot_order`
3. Calculates each spot's start time as: `event_start + sum(previous_durations)`
4. Times automatically recalculate when spots are reordered

**Example:**
```
Event Start: 7:00 PM
- Doors (30 min)     → 7:00 PM
- Spot 1 (10 min)    → 7:30 PM
- Intermission (15 min) → 7:40 PM
- Spot 2 (10 min)    → 7:55 PM
```

### 3. Break/Intermission Support

**Database Migration:**
```sql
-- Added spot_category column
ALTER TABLE event_spots
ADD COLUMN IF NOT EXISTS spot_category text DEFAULT 'act';
```

**New Types (`src/types/spot.ts`):**
```typescript
export type SpotCategory = 'act' | 'doors' | 'intermission' | 'custom';

export interface SpotData {
  // ... existing fields
  category: SpotCategory;
  label?: string;  // For custom break names
  start_time?: string;  // Calculated dynamically
}
```

**New Components:**
- `src/components/lineup/AddBreakDialog.tsx` - Dialog for creating breaks

**LineupTab Header Buttons:**
- "Add Break" dropdown with:
  - Doors Open (default 30 min)
  - Intermission (default 15 min)
  - Custom Break... (user enters label/duration)
- "Add Spot" button (existing)

### 4. SpotCard Visual Differentiation

**Act Spots:**
- Solid border
- Shows type badge (MC, Feature, Headliner, Guest)
- Shows status badge (available, assigned, confirmed, cancelled)
- Shows "Assign" button

**Break Items:**
- Dashed border with muted background
- Shows category badge with icon:
  - Doors: Orange with DoorOpen icon
  - Intermission: Cyan with Coffee icon
  - Custom: Pink with Sparkles icon
- Hides "Assign" button (no comedian needed)

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/types/spot.ts` | Modified | Added SpotCategory type, start_time, category, label fields |
| `src/pages/event-management/LineupTab.tsx` | Modified | Removed filters, added Add Break dropdown |
| `src/components/lineup/SpotList.tsx` | Modified | Removed timeline decorations |
| `src/components/lineup/SpotCard.tsx` | Modified | Added time display, break styling, conditional assign button |
| `src/components/lineup/SpotListContainer.tsx` | Modified | Added time calculation logic |
| `src/components/lineup/AddBreakDialog.tsx` | Created | Dialog for adding breaks |

## Database Changes

**Migration Applied:** `add_spot_category_to_event_spots`
- Added `spot_category` column (text, default 'act')

## Testing Notes

- All TypeScript checks pass
- All ESLint checks pass on modified files
- Manual testing needed for:
  - Creating breaks via Add Break dropdown
  - Verifying time calculations match expected values
  - Drag-and-drop reordering (TODO: implement mutation)

## Future Improvements

1. **Drag-and-Drop Reordering**: Currently logs to console, needs mutation implementation
2. **Comedian Name Display**: SpotCard shows "Not assigned" but could show comedian name when assigned (needs join query)
3. **Time Display Format**: Consider showing end time as well (start - end)
4. **Reorder Time Recalculation**: When drag-drop is implemented, times should recalculate automatically
