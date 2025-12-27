# Browse Events ("/shows") Enhancement Plan

## Objectives
- Surface upcoming events directly from Supabase with accurate session metadata (dates, times, venue geodata, availability, application counts).
- Provide a toggle between Weekly and Monthly calendar views with a supporting date picker.
- Offer a Google Maps view whose markers reflect the events visible in the selected timeframe (and update when the timeframe changes).
- Allow comedians to “heart” or bookmark shows persistently.
- Reuse existing Event/Show card UI where possible while integrating new interactions (apply, map hover, etc.).

## Data & Services
1. **Event Listing Query**
   - Extend `eventsApi.getEventsForListing` (or add `eventBrowseService`) to accept:
     - `range: 'weekly' | 'monthly'`
     - `start_date` / `end_date` (ISO date strings)
     - `include_geodata` flag to join `venues` table and pull `latitude`, `longitude`, `address_line1`, `city`, `state`.
   - Return computed metadata: `available_spots`, `applications_count`, `is_favorited` (if user is comedian), `is_past`.
   - Ensure Supabase query uses a dedicated view or RPC if performance drops (consider indexes on `event_date`, `status`).

2. **Favorites Persistence**
   - Confirm existing table (e.g. `event_favorites`, `comedian_favorites`). If absent, create `comedian_event_favorites` (columns: `comedian_id`, `event_id`, `created_at`).
   - Implement `favoriteService` with methods: `listByUser`, `toggleFavorite`, `isFavorited`.
   - Update `useBrowseLogic` (or new hook) to read/write favorites via service, not local `Set`.

3. **Application Status**
   - Ensure event records include `applications_count` and `has_applied` flags via join/CTE tied to signed-in comedian.
   - Optionally add supabase RPC `get_events_for_browse(p_user_id, p_start, p_end)` to reduce client data munging.

## UI Components
1. **Shows Page Layout**
   - Split main view into `CalendarView` (monthly/weekly toggle) + `MapView` + `EventGrid`.
   - Use responsive layout: Map on right for desktop, stacked tabs for mobile.

2. **Calendar View**
   - Reuse logic from `ProfileCalendarView` for week/month toggles.
   - Expose callbacks `onDateRangeChange(start: Date, end: Date)` to trigger data refetch.
   - Add mini date picker for quick navigation (e.g., `DateRangePicker` from shadcn).

3. **Map View**
   - Utilize existing `GoogleMapsComponent` with new `EventMap` wrapper:
     - Accepts events array, highlights markers for current range.
     - Tooltip on hover: title, date, venue, “Apply” button.
     - Sync map bounds with calendar selection (week vs month).
   - Add control to switch between “Grid / Map” for mobile.

4. **Event Cards**
   - Reuse `ShowCard` but extend props:
     - `onFavoriteToggle`, `isFavorited`.
     - `startTime`, `city`, `availableSpots`, `applicationsCount`.
   - Show badges: `Open`, `Full`, `Verified Only`, etc.
   - Provide quick actions: `Apply`, `Details`, `Directions`.

5. **Filtering & Sorting**
   - Enhance filters panel:
     - Search by title/venue/city.
     - Filter by event type (`Open Mic`, `Showcase`, etc.), verification requirement, paid/unpaid.
     - Toggle: “Shows I’ve applied to”, “Favorites only”, “Past shows”.
   - Sorting options: date ascending/descending, spots remaining, popularity.

## Hooks & State
1. **useShowsData**
   - Abstracts fetching + caching of events based on current calendar context and filters.
   - Manages loading states for grid and map simultaneously.

2. **useFavorites**
   - Provides `favorites`, `toggleFavorite`, `isFavorited` using `favoriteService`.

3. **useMapInteractions**
   - Handles syncing selected event between map and card list (hover/selection).
   - Stores `selectedEventId` to highlight in both views.

4. **useCalendarRange**
   - Exposes derived date ranges for weekly/monthly selection.
   - Converts `selectedDate` to `[startOfWeek, endOfWeek]` or `[startOfMonth, endOfMonth]`.

## Supabase Considerations
1. **Indexes**
   - Ensure `events (event_date)` has index.
   - If favorites table added, index `(comedian_id, event_id)` unique.

2. **Row-Level Security**
   - Permissions for favorites table: comedians can insert/delete their own records.
   - Event listing RPC should respect published/draft visibility.

3. **Views / RPCs**
   - Option A: create view `events_browse_v` joining venues and aggregations.
   - Option B: RPC `get_events_for_browse` returning JSON with necessary fields (including favorites flag).
   - Evaluate caching needs (Materialized view?) if query heavy.

## UX Notes
1. **Map Behavior**
   - Auto-fit map bounds to visible events each time the dataset changes.
   - Provide legend / indicator for event status (colors or icons).

2. **Weekly vs Monthly**
   - Weekly view: horizontal scroll of days, show event chips.
   - Monthly view: highlight days with events, clicking day scrolls event list to those events.

3. **Accessibility**
   - Ensure map controls and cards are keyboard accessible.
   - Provide ARIA live region for filter changes (“Showing 12 shows in October”).

4. **Performance**
   - Debounce search inputs.
  - Use virtualization for event list if > 50 results.

## Implementation Sequence
1. Data Layer
   - Extend Supabase query/service to return enriched event data & favorites.
   - Create `useShowsData` hook.
2. Favorites
   - Implement service, table (if needed), and integrate with browse logic.
3. Calendar Range
   - Build `useCalendarRange` + update `MonthFilter` or create new component.
4. Map View
   - Create `EventMap` component; wire up pointer interactions.
5. UI Integration
   - Refactor `Shows.tsx` to use new hooks/components (weekly/monthly toggle, map view).
6. QA & Regression
   - Test filters (date, location), map interactions, favorites persistence.
   - Verify application workflow from card still works.
   - Run accessibility check (e.g., Lighthouse).
