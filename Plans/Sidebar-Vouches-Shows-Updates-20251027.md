# Sidebar, Vouches & Shows/Gigs Updates
Created: 2025-10-27
Updated: 2025-10-27 - Tasks 1, 2 & 3 completed (Sidebar + Vouches Crown + Shows→Gigs)
Status: In Progress - Tasks 4 & 5 remaining

## Overview
Implement UI/UX improvements from "BIG Updates Required 261025.txt" lines 1-12 and 49-53.

## Priority Order

### High Priority (Lines 1-6): Sidebar Navigation Restructuring
**Current Structure**:
```
- Dashboard
- Shows
- Gigs
- Messages
- Notifications
- Settings
- Vouches
```

**Required Structure**:
```
- Dashboard
- Shows (new functionality)
- Gigs (renamed from Shows)
- Profile
  ├─ Messages (moved under Profile)
  ├─ Vouches (moved under Profile → Messages)
  └─ Settings (moved under Profile → Vouches)
      ├─ Notification Settings
      ├─ Sidebar Customization
      └─ Privacy
          ├─ Profile Visibility
          ├─ Data & Privacy
          └─ Messages Privacy
- Social Media Manager (link to social.gigpigs.app)
```

### High Priority (Lines 49-53): Vouches UI Updates
**Current**: 5-star rating system
**Required**:
- Single crown icon that fills/goes gold when typing
- Remove 1-5 star rating (can lead to negativity)
- Allow profiles to give/remove vouches freely
- Add crown icon to profile (top right, above Sign Out)
- Submit Vouch button: Subtle style matching usual buttons (not white outline)

### Medium Priority (Lines 8-11): Shows/Gigs Restructuring
**Current**:
- `/shows` - General events page

**Required**:
- `/gigs` - Renamed from `/shows`, for comedians to find spots (events created by organizations)
- `/shows` - NEW page for comedian shows + organization shows
  - Search function: Filter by comedian names
  - Show type filter: Showcase / Solo / Live Podcast / Other
  - Over/Under 18 toggle
- Both pages need:
  - Show type filter (Showcase / Solo / Live Podcast / Other)
  - Over/Under 18 toggle

## Implementation Tasks

### Task 1: Sidebar Navigation Restructuring (4-5 hours)
**Files to modify**:
- `src/config/sidebarMenuItems.tsx` - Update menu structure
- `src/components/layout/UnifiedSidebar.tsx` - Add nested menu support if needed
- `src/App.tsx` - Ensure routes match new structure

**Changes**:
1. Add "Social Media Manager" link (external: `https://social.gigpigs.app`)
2. Move Messages under Profile
3. Move Vouches under Profile → Messages hierarchy
4. Move Settings under Profile → Vouches hierarchy
5. Update icons and labels

### Task 2: Vouches Crown UI (2-3 hours)
**Files to modify**:
- `src/components/VouchSystemEnhanced.tsx` - Replace star rating with crown
- `src/pages/Vouches.tsx` - Update UI components
- `src/pages/Profile.tsx` - Add crown icon above Sign Out

**Changes**:
1. Replace 5-star rating with single crown icon
2. Crown fills/goes gold on hover or when typing
3. Add crown to profile header (top right, above Sign Out)
4. Update Submit Vouch button style
5. Remove any negative rating UI

### Task 3: Shows → Gigs Rename (1-2 hours)
**Files to modify**:
- `src/App.tsx` - Rename route from `/shows` to `/gigs`
- `src/pages/Shows.tsx` - Rename file to `Gigs.tsx`
- `src/config/sidebarMenuItems.tsx` - Update menu item
- Database: Update any `show_type` or related fields

**Changes**:
1. Rename `/shows` route to `/gigs`
2. Update all internal references
3. Add redirect from old `/shows` to `/gigs` for backward compatibility
4. Update sidebar menu item

### Task 4: New Shows Page (4-5 hours)
**Files to create**:
- `src/pages/Shows.tsx` - NEW file for comedian + organization shows
- `src/components/shows/ShowTypeFilter.tsx` - Filter component
- `src/components/shows/AgeRestrictionToggle.tsx` - Over/Under 18 toggle
- `src/components/shows/ComedianSearchFilter.tsx` - Search by comedian

**Changes**:
1. Create new Shows page with search functionality
2. Add show type filter dropdown (Showcase, Solo, Live Podcast, Other)
3. Add Over/Under 18 toggle
4. Implement comedian name search/filter
5. Display both comedian shows and organization shows

### Task 5: Add Filters to Gigs Page (2 hours)
**Files to modify**:
- `src/pages/Gigs.tsx` (renamed from Shows.tsx)
- Add same filter components as Shows page

**Changes**:
1. Add show type filter
2. Add Over/Under 18 toggle
3. Maintain existing organization spot functionality

## Database Changes

### New Fields Needed:
```sql
-- Add to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_type TEXT CHECK (show_type IN ('showcase', 'solo', 'live_podcast', 'other'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS age_restriction TEXT CHECK (age_restriction IN ('over_18', 'under_18', 'all_ages'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_comedian_show BOOLEAN DEFAULT FALSE;
```

## Testing Checklist
### Task 1: Sidebar Navigation (COMPLETED)
- [x] Sidebar navigation renders correctly
- [x] Profile → Messages → Vouches → Settings hierarchy works
- [x] Social Media Manager link opens external site
- [x] Nested menu items support (children)
- [x] External link support (opens in new tab)
- [x] Expand/collapse indicators (ChevronDown/ChevronRight)
- [x] Active state highlighting for nested items
- [x] TypeScript compilation passes
- [x] Production build succeeds

### Task 2: Vouches UI (COMPLETED)
- [x] Crown icon displays on Vouches page
- [x] Crown fills/goes gold appropriately (on hover, click, and typing)
- [x] Crown icon shows in profile header (above Sign Out)
- [x] Submit Vouch button styled correctly (standard styling)
- [x] Removed 1-5 star rating system
- [x] Backend compatibility maintained (crown = 5 stars)

### Task 3: Shows → Gigs Rename (COMPLETED)
- [x] `/gigs` route works (renamed from `/shows`)
- [x] Old `/shows` URL redirects to `/gigs`
- [x] Shows.tsx renamed to Gigs.tsx (98% similarity)
- [x] All navigation components updated
- [x] Navigation types updated (added 'gigs' and 'shows')

### Task 4: New Shows Page (PENDING)
- [ ] New `/shows` page displays correctly
- [ ] Show type filter works on Shows page
- [ ] Age restriction toggle works on Shows page
- [ ] Comedian search works on Shows page

### Task 5: Gigs Page Filters (PENDING)
- [ ] Show type filter works on Gigs page
- [ ] Age restriction toggle works on Gigs page

## Rollback Plan
1. Git revert commit(s)
2. Clear browser localStorage (sidebar preferences)
3. Database rollback: Remove new columns if needed

## Dependencies
- Profile URLs PR (#10) should be merged first (provides profile structure)
- Phase 2 Week 2 PR (#11) should be reviewed

## Time Estimate
**Total**: 13-17 hours
- Sidebar Navigation: 4-5 hours
- Vouches Crown UI: 2-3 hours
- Shows → Gigs Rename: 1-2 hours
- New Shows Page: 4-5 hours
- Gigs Page Filters: 2 hours

## Notes
- Sidebar navigation restructuring is most complex (nested menus)
- Crown icon should be subtle and positive (no negative ratings)
- Shows/Gigs pages need clear distinction in UI

