Platform Performance & UI Consistency Fixes                                                                                                                                         │ │
│ │                                                                                                                                                                                     │ │
│ │ 1. Performance Optimization (Critical)                                                                                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ Profile Page                                                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ - Add staleTime & cacheTime to useProfileData React Query hook (currently missing, causing excessive re-fetches)                                                                    │ │
│ │ - Lazy load profile interests query - only fetch when tab is visible                                                                                                                │ │
│ │ - Add loading skeleton instead of showing nothing during load                                                                                                                       │ │
│ │                                                                                                                                                                                     │ │
│ │ Calendar & Shows                                                                                                                                                                    │ │
│ │                                                                                                                                                                                     │ │
│ │ - Add indexes to database queries (session_complete, events tables)                                                                                                                 │ │
│ │ - Implement pagination for event lists (current: loading all events at once)                                                                                                        │ │
│ │ - Add debounce to search/filter inputs (300ms delay)                                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ Tasks Page                                                                                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ - Remove duplicate queries - TaskStatisticsWidget is being rendered 4 times                                                                                                         │ │
│ │ - Memoize statistics calculations with useMemo                                                                                                                                      │ │
│ │ - Add staleTime to task queries (5 minutes)                                                                                                                                         │ │
│ │                                                                                                                                                                                     │ │
│ │ 2. Tasks Page - Fix Duplicate Statistics                                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ Problem: Statistics widgets repeating 4 times at top of page                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ Fix: Remove duplicate sections in TaskDashboard.tsx:                                                                                                                                │ │
│ │ - Keep ONE statistics grid (lines 191-202)                                                                                                                                          │ │
│ │ - Remove the repeated TaskStatisticsWidget renderings                                                                                                                               │ │
│ │ - Ensure proper task data is passed to single instance                                                                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ 3. UI Consistency - Standardize Buttons                                                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ Current issues:                                                                                                                                                                     │ │
│ │ - Browse Shows: White outlined buttons (Map view, filters)                                                                                                                          │ │
│ │ - Tasks: Mismatched button sizes and styles                                                                                                                                         │ │
│ │ - Inconsistent use of variant="outline" vs variant="default"                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ Standardization:                                                                                                                                                                    │ │
│ │ - Replace all variant="outline" with custom dark background style                                                                                                                   │ │
│ │ - Consistent button heights: h-10 for all filter/action buttons                                                                                                                     │ │
│ │ - Remove white borders: use border-border/50 instead                                                                                                                                │ │
│ │ - Apply to: Shows.tsx, TaskDashboard.tsx, and any other filter UIs                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ 4. Browse Shows Enhancements                                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ Default "Past Events" to Hidden                                                                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ - Change showPastEvents initial state from included to false                                                                                                                        │ │
│ │ - Update button text to show "Hidden" by default                                                                                                                                    │ │
│ │                                                                                                                                                                                     │ │
│ │ Add Calendar View                                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ - Create new <ShowsCalendarView> component                                                                                                                                          │ │
│ │ - Add third view mode: 'grid' | 'map' | 'calendar'                                                                                                                                  │ │
│ │ - Display events in month/week calendar format                                                                                                                                      │ │
│ │ - Match existing calendar pattern from ProfileCalendarView                                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ Fix Button Styling                                                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ - Remove white outline from Map button                                                                                                                                              │ │
│ │ - Standardize all filter button sizes                                                                                                                                               │ │
│ │ - Fix inconsistent field widths in filter row                                                                                                                                       │ │
│ │                                                                                                                                                                                     │ │
│ │ 5. Database Performance                                                                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ Add Indexes                                                                                                                                                                         │ │
│ │                                                                                                                                                                                     │ │
│ │ CREATE INDEX IF NOT EXISTS idx_session_complete_start_local                                                                                                                         │ │
│ │   ON session_financials(session_start_local)                                                                                                                                        │ │
│ │   WHERE session_start_local >= NOW();                                                                                                                                               │ │
│ │                                                                                                                                                                                     │ │
│ │ CREATE INDEX IF NOT EXISTS idx_session_complete_city                                                                                                                                │ │
│ │   ON events_htx(venue_city);                                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ Files to Modify                                                                                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ 1. /root/agents/src/hooks/useProfileData.ts - Add staleTime, cacheTime                                                                                                              │ │
│ │ 2. /root/agents/src/pages/TaskDashboard.tsx - Remove duplicate stats                                                                                                                │ │
│ │ 3. /root/agents/src/hooks/useTasks.ts - Add memoization, staleTime                                                                                                                  │ │
│ │ 4. /root/agents/src/pages/Shows.tsx - Default past events to hidden, add calendar view, standardize buttons                                                                         │ │
│ │ 5. /root/agents/src/components/shows/ShowsCalendarView.tsx - NEW FILE                                                                                                               │ │
│ │ 6. /root/agents/src/components/tasks/TaskStatisticsWidget.tsx - Fix prop interface                                                                                                  │ │
│ │ 7. /root/agents/supabase/migrations/ - Add performance indexes                                                                                                                      │ │
│ │ 8. Global button styles via Tailwind config or component defaults                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ Testing Checklist                                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ - Profile loads under 2 seconds                                                                                                                                                     │ │
│ │ - Calendar switches views without delay                                                                                                                                             │ │
│ │ - Tasks page shows ONE statistics section                                                                                                                                           │ │
│ │ - All buttons have consistent dark background style                                                                                                                                 │ │
│ │ - Past Events defaults to "Hidden"                                                                                                                                                  │ │
│ │ - Calendar View works on Shows page                                                                                                                                                 │ │
│ │ - No white button outlines anywhere

## 6. Button Variant Enforcement System

**Design System Requirement**: Absolutely no `variant="outline"` buttons anywhere in the platform.

### Why This Matters

White button outlines (variant="outline") violate the platform's dark-themed design system and create visual inconsistency. All outline variants have been removed platform-wide and replaced with:
- **`variant="secondary"`** - For alternative actions (filters, toggles, secondary CTAs)
- **`variant="ghost"`** - For cancel/close buttons and subtle interactions

### Multi-Layer Prevention System

To prevent `variant="outline"` from being re-introduced, we've implemented a **four-layer defense**:

#### Layer 1: ESLint Rule (Development Time)
- **Rule**: `design-system/no-outline-variant`
- **Location**: `eslint.config.js`
- **Behavior**: Flags all occurrences of `variant="outline"` as **errors** during development
- **Coverage**:
  - Literal JSX attributes: `<Button variant="outline">`
  - Conditional expressions: `variant={condition ? 'default' : 'outline'}`
  - Default parameters: `variant = 'outline'`
  - Object properties: `{variant: 'outline'}`
- **When it runs**: On save in IDEs with ESLint integration, during `npm run lint`

#### Layer 2: Runtime Component Guard (Production Safety Net)
- **Location**: `src/components/ui/button.tsx`
- **Behavior**: Automatically converts `variant="outline"` to `variant="secondary"` at runtime
- **Console Warning**: Logs detailed deprecation message to console when outline is detected
- **Why**: Catches any outline variants that slip through linting (dynamic imports, third-party components, etc.)

```typescript
// Button component now includes:
if (variant === 'outline') {
  console.warn(
    '[Button] variant="outline" is deprecated and has been automatically converted to variant="secondary". ' +
    'Please update your code to use variant="secondary" or variant="ghost" instead. ' +
    'See /docs/Platform Performance & UI Consistency.md for details.'
  );
  enforcedVariant = 'secondary';
}
```

#### Layer 3: Pre-Commit Hook (Git Level)
- **Location**: `.git/hooks/pre-commit`
- **Behavior**: Scans all staged files for outline variants and **blocks the commit**
- **Pattern Detection**: Catches `variant="outline"`, `variant='outline'`, and object property patterns
- **Error Message**: Shows exact line numbers and suggests replacements
- **When it runs**: Automatically on every `git commit`

```bash
# Blocks commits containing:
variant="outline"
variant='outline'
: "outline"
: 'outline'
```

#### Layer 4: TypeScript Type Safety
- **Location**: `src/components/ui/button.tsx`
- **Behavior**: While 'outline' remains in the TypeScript union type for backward compatibility, it's intercepted at runtime
- **Why kept in types**: Prevents TypeScript errors in existing code while enforcement happens at runtime

### Migration Completed

**Status**: ✅ All outline variants removed platform-wide (November 20, 2025)

**Scope of cleanup**:
- 45+ literal `variant="outline"` instances
- 600+ dynamic/conditional variants
- Both single-quoted `'outline'` and double-quoted `"outline"` patterns
- Affected components: CRM filters, segment buttons, export menus, calendar controls, media library, and 30+ other files

**Files modified**: See `/root/agents/Plans/Remove-Outline-Button-Variants-20251120.md` for complete list

### Developer Guidelines

**When adding new buttons:**

❌ **NEVER use**:
```tsx
<Button variant="outline">Click Me</Button>
```

✅ **Instead use**:
```tsx
// For alternative actions (filters, toggles, secondary CTAs)
<Button variant="secondary">Filter</Button>

// For cancel/close buttons
<Button variant="ghost">Cancel</Button>

// For primary actions
<Button variant="default">Submit</Button>

// For destructive actions
<Button variant="destructive">Delete</Button>
```

### Verification

Run these commands to verify enforcement is working:

```bash
# ESLint check (should find no violations)
npm run lint

# Pre-commit hook test (should block if outline found)
git add .
git commit -m "test"  # Will block if outline detected

# Runtime check (watch browser console for warnings)
npm run dev
```

### Support

If you encounter issues with this enforcement system:
1. Check the console for the automatic conversion warning
2. Update your code to use `variant="secondary"` or `variant="ghost"`
3. Run `npm run lint` to find all instances
4. See examples in recently updated components (MediaLibraryManager.tsx, DealFilters.tsx, SegmentFilter.tsx)  