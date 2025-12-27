# MelbourneFestival Component

**Framer Code Component** for the `/melbourne` page on standupsydney.com

**Code File ID:** `p_NPRED`
**Component Name:** `MelbourneFestival_1.tsx`
**Page Node ID:** `DNz5C_gCR` (Melbourne page)
**Instance Node ID:** `JiVmXNNB5`

## Purpose

A festival-specific component that displays Melbourne Comedy Festival (MICF) sessions with:
1. **Artist filter buttons** - Filter by performer
2. **Calendar date filter** - Click dates to filter sessions
3. **Session cards** - Individual sessions (not deduplicated) with Humanitix popup integration

## Key Differences from Other Components

| Feature | SessionList | EventCalendar | MelbourneFestival |
|---------|-------------|---------------|-------------------|
| Deduplication | Yes (by event_name) | N/A | No (shows all sessions) |
| Card size | 16:9 | N/A | 4:3 (smaller) |
| Calendar | No | Yes (opens popup) | Yes (filters cards) |
| Artist filter | No | No | Yes |
| Date filter | No | No | Yes |
| Click action | Popup | Popup | Calendar=filter, Card=popup |

## Filter Logic

```typescript
const FILTERS = [
    { key: "all", label: "All", match: () => true },
    { key: "neel", label: "Neel Kolhatkar", match: (s) => s.event_name.toLowerCase().includes("neel kolhatkar") },
    { key: "rory", label: "Rory Lowe", match: (s) => s.event_name.toLowerCase().includes("rory lowe") },
    { key: "frenchy", label: "Frenchy", match: (s) => s.event_name.toLowerCase().includes("frenchy") },
    { key: "showcase", label: "Showcase", match: (s) => s.event_name.toLowerCase().includes("best of the fest") },
]
```

## Data Source

- **View:** `session_complete`
- **Filter:** `tags @> ARRAY['melbourne']` and `is_past = false`
- **Date Field:** `session_start_local` (NOT `session_start` - avoids timezone issues)
- **Order:** `session_start_local ASC`

### Important: Use `session_start_local`

The `session_start` field is in UTC. Using it directly causes dates to appear wrong due to timezone conversion. Always use `session_start_local` which stores the accurate local Melbourne time.

## User Flow

1. Page loads with "All" filter active, showing all 88 sessions
2. User clicks artist button (e.g., "Neel Kolhatkar")
   - Calendar updates to show only dates with Neel's shows
   - Cards filter to show only Neel's sessions
3. User clicks a date on calendar
   - Cards filter to show only sessions on that date
   - Selected date highlighted (dark background)
   - "Show all dates" button appears
4. User clicks a session card
   - Humanitix popup opens for that specific session

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cityTag` | string | "melbourne" | Tag to filter sessions |
| `supabaseUrl` | string | "" | Supabase project URL |
| `supabaseKey` | string | "" | Supabase anon key |
| `festivalStart` | string | "2026-03-25" | Festival start date (YYYY-MM-DD) |
| `festivalEnd` | string | "2026-04-19" | Festival end date (YYYY-MM-DD) |
| `maxEvents` | number | 100 | Max sessions to fetch |
| `columns` | number | 2 | Grid columns for cards |
| `gap` | number | 16 | Gap between cards |
| `borderRadius` | number | 12 | Card border radius |

### Color Props

| Prop | Default | Description |
|------|---------|-------------|
| `filterBackgroundColor` | #F0F0F0 | Inactive filter button bg |
| `filterActiveColor` | #E11D48 | Active filter button bg |
| `filterTextColor` | #333333 | Inactive filter text |
| `filterActiveTextColor` | #FFFFFF | Active filter text |
| `calendarBackgroundColor` | transparent | Calendar container bg |
| `showDateColor` | #E11D48 | Dates with shows |
| `selectedDateColor` | #333333 | Selected date bg |
| `textColor` | #333333 | Calendar text |
| `showDateTextColor` | #FFFFFF | Show date text |
| `accentColor` | #E11D48 | Weekday headers |
| `cardOverlayColor` | rgba(0,0,0,0.6) | Card gradient overlay |
| `cardTextColor` | #FFFFFF | Card text |
| `cardAccentColor` | #E11D48 | Card date/time text |

## Current Configuration (Melbourne Page)

```
festivalStart: 2026-03-25
festivalEnd: 2026-04-19
maxEvents: 100
columns: 2
calendarBackgroundColor: transparent
showDateColor: rgb(225, 29, 72)  // Site red
```

## Database Sessions Count

As of December 2024, there are **88 sessions** tagged with "melbourne":
- Neel Kolhatkar: Black Belt Comedy
- Rory Lowe: Lowe Key Funny MICF26
- Frenchy: The Instigator (starts April 8)
- Best of the Fest: Showcase Gala

## Related Files

- **EventCalendar.tsx** (`sDnuDhx`) - Single-event calendar, popup on date click
- **SessionList.tsx** - Deduplicated event cards with weekly pinning
- **Melbourne Page** (`DNz5C_gCR`) - Contains this component

## Humanitix Popup Integration

Uses same popup logic as EventCalendar:
```typescript
function tryOpenHumanitixPopup(url: string): boolean {
    // Extracts event slug from URL
    // Tries window.__HX__.popup.open(eventSlug)
    // Returns true if popup opened, false to fallback to link
}
```

Requires Humanitix popup script in site `<head>`:
```html
<script src="https://events.humanitix.com/scripts/widgets/popup.js" type="module"></script>
```

## Maintenance Notes

1. **Adding new artists:** Update the `FILTERS` array with new match logic
2. **Date range changes:** Update `festivalStart` and `festivalEnd` props
3. **More sessions:** Increase `maxEvents` if festival grows beyond 100 sessions
4. **Style changes:** Update color props on the component instance (node `JiVmXNNB5`)

## Created

December 2024 - Built for MICF 2026 Melbourne shows on standupsydney.com
