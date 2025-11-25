# Calendar Design Overhaul: Framer-Embeddable Mini Calendar Component
Created: 2025-10-29
Status: Approved

## Overview
Create a comprehensive calendar design system that works across the Stand Up Sydney platform and external website (standupsydney.com built on Framer). This overhaul will unify calendar experiences with a focus on the mini calendar widget for event discovery.

## Approach: Supabase Edge Function + Framer Code Component

Based on research, the best approach is:

1. **Create a Supabase Edge Function** that returns calendar event data (secure, performant)
2. **Build a Framer Code Component** that fetches from this endpoint and renders the mini calendar
3. **Use shadcn Calendar component logic** as the base for the date picker UI

This approach keeps Supabase credentials secure and makes the component easily reusable across multiple Framer projects (Sydney, Melbourne, etc.).

## Implementation Steps

### 1. Create Supabase Edge Function: `event-calendar-feed`
**File**: `supabase/functions/event-calendar-feed/index.ts`

- Accept query params: `city` (Sydney/Melbourne), `start_date`, `end_date`
- Query `session_complete` view for events matching the city and date range
- Return simplified JSON: `{ dates: { "2025-01-15": [{ name, url_tickets_popup }] } }`
- Enable CORS for Framer domain
- Use anon key (read-only public data)

### 2. Create Standalone Mini Calendar Component
**File**: `src/components/framer/MiniEventCalendar.tsx`

- Compact, sidebar-friendly design
- Based on shadcn Calendar component with custom day rendering
- Shows dots/indicators on dates with events
- Click handler opens `url_tickets_popup` in new window/modal
- Props: `city` (Sydney/Melbourne), `apiUrl` (edge function endpoint)
- Fetches event data on mount and when month changes
- Self-contained with minimal dependencies

### 3. Create Framer-Ready Export Build
**File**: `framer-components/event-calendar.tsx`

- Standalone React component that can be copy-pasted into Framer
- Inlines necessary styles
- Includes Framer property controls for easy configuration:
  - `city`: Enum (Sydney, Melbourne)
  - `supabaseUrl`: String
  - `accentColor`: Color picker
- Bundles all dependencies (date-fns, minimal calendar logic)

### 4. Documentation
**File**: `Plans/Calendar-Design-Overhaul-20251029.md` (this file)

- Copy-paste instructions for Framer
- Configuration guide
- API endpoint details
- Customization options

## Key Features

✅ **City-parameterized**: Reusable for Sydney, Melbourne, future cities
✅ **Secure**: Edge function keeps DB credentials safe
✅ **Performant**: Lightweight, caches event data per month
✅ **Click-to-tickets**: Opens `url_tickets_popup` immediately on date click
✅ **Visual indicators**: Dots on dates with events
✅ **Framer-friendly**: Property controls for easy customization
✅ **Self-contained**: No external dependencies to install in Framer

## Files to Create/Modify

1. **`supabase/functions/event-calendar-feed/index.ts`** - New edge function
2. **`src/components/framer/MiniEventCalendar.tsx`** - React component (for reference)
3. **`framer-components/event-calendar.tsx`** - Framer-ready copy-paste version
4. **`docs/framer-integration.md`** - Integration guide for Framer

## Detailed Implementation

### Edge Function API Design

**Endpoint**: `https://{project}.supabase.co/functions/v1/event-calendar-feed`

**Query Parameters**:
- `city`: string (required) - "Sydney" or "Melbourne"
- `start_date`: ISO date string (optional) - defaults to current month start
- `end_date`: ISO date string (optional) - defaults to current month end

**Response Format**:
```json
{
  "city": "Sydney",
  "month": "2025-01",
  "events": {
    "2025-01-15": [
      {
        "id": "session-123",
        "name": "Comedy Night at The Den",
        "venue": "The Den",
        "url_tickets_popup": "https://events.humanitix.com/...",
        "start_time": "19:00"
      }
    ],
    "2025-01-20": [
      {
        "id": "session-456",
        "name": "Open Mic Thursday",
        "venue": "Laugh Factory",
        "url_tickets_popup": "https://events.humanitix.com/...",
        "start_time": "20:00"
      }
    ]
  }
}
```

### Framer Component Code Structure

```tsx
import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"

export default function EventCalendar(props) {
  const [events, setEvents] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchEvents()
  }, [props.city, currentMonth])

  async function fetchEvents() {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd")
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")

    const response = await fetch(
      `${props.supabaseUrl}/functions/v1/event-calendar-feed?` +
      `city=${props.city}&start_date=${start}&end_date=${end}`
    )
    const data = await response.json()
    setEvents(data.events || {})
  }

  function handleDateClick(date) {
    const dateStr = format(date, "yyyy-MM-dd")
    const dayEvents = events[dateStr]
    if (dayEvents && dayEvents[0]?.url_tickets_popup) {
      window.open(dayEvents[0].url_tickets_popup, "_blank")
    }
  }

  // Render calendar UI with dots on event dates
  // ...
}

addPropertyControls(EventCalendar, {
  city: {
    type: ControlType.Enum,
    options: ["Sydney", "Melbourne"],
    defaultValue: "Sydney",
    title: "City"
  },
  supabaseUrl: {
    type: ControlType.String,
    defaultValue: "https://your-project.supabase.co",
    title: "Supabase URL"
  },
  accentColor: {
    type: ControlType.Color,
    defaultValue: "#8B5CF6",
    title: "Accent Color"
  }
})
```

## Testing Checklist

- [ ] Edge function returns correct events for Sydney
- [ ] Edge function returns correct events for Melbourne
- [ ] CORS headers allow Framer domain
- [ ] Date click opens ticket popup in new window
- [ ] Calendar shows dots on dates with events
- [ ] Month navigation fetches new event data
- [ ] Component works in Framer preview
- [ ] Component works on published Framer site
- [ ] Mobile responsive design
- [ ] Loading states display correctly
- [ ] Error handling for failed API calls

## Future Enhancements

- **Multi-event tooltips**: Show list of events when hovering over dates with multiple events
- **Event filters**: Filter by venue, comedian, or event type
- **Time display**: Show event times on hover
- **Animations**: Smooth transitions when navigating months
- **Dark mode support**: Respect system/site theme preference
- **Accessibility**: Full keyboard navigation and screen reader support

## Notes

- The `session_complete` view already includes `url_tickets_popup` column (added in previous work)
- Edge function uses anon key (public read-only access) - no authentication needed
- Framer components can use `fetch` API directly - no Supabase client library needed
- Consider adding rate limiting to edge function if traffic is high
- Cache event data in component state to reduce API calls during month navigation
4
## Integration Guide for Framer

### Step 1: Create Code Component in Framer
1. Open your Framer project
2. Click the **+** icon in the left sidebar
3. Select **Code** → **New Code Component**
4. Name it "EventCalendar"

### Step 2: Copy Component Code
1. Copy the entire contents of `framer-components/event-calendar.tsx`
2. Paste into the Framer code editor

### Step 3: Configure Properties
1. Select the component on the canvas
2. In the properties panel on the right, set:
   - **City**: Choose "Sydney" or "Melbourne"
   - **Supabase URL**: Enter your Supabase project URL
   - **Accent Color**: Choose your brand color

### Step 4: Deploy Edge Function
1. Ensure the `event-calendar-feed` edge function is deployed:
   ```bash
   npx supabase functions deploy event-calendar-feed
   ```

### Step 5: Test
1. Preview your Framer site
2. Click on dates with event dots
3. Verify ticket popups open correctly

## API Security Notes

- Edge function uses **anon key** (safe for public access)
- Data from `session_complete` view only exposes public event info
- No user authentication required
- CORS configured to allow Framer domain
- Consider adding rate limiting if needed
