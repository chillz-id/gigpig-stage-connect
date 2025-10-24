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