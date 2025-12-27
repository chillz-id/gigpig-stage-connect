# EventCalendar Humanitix Popup Fix

## Problem
Clicking calendar dates on event pages navigates away to the Humanitix ticket site instead of opening the popup widget. The popup works on the homepage but not on event pages.

## Root Cause
The EventCalendar code component uses `<button>` elements with a `handleDateClick` function that programmatically creates and clicks links. The Humanitix popup.js script only intercepts actual `<a>` tags in the DOM, not programmatically triggered clicks.

## Solution
Replace the `<button>` elements with actual `<a>` tags for dates that have shows. This allows popup.js to intercept the clicks naturally.

## Code File to Update
**EventCalendar** - Code file ID: `yacHBmvIG`

## Changes Required

### 1. Delete the `handleDateClick` function (around lines 369-384)
Remove this entire function:
```javascript
const handleDateClick = (dateObj: Date) => {
    if (isStatic) return
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`
    const session = showDatesMap.get(key)
    if (session?.url_tickets_popup && typeof window !== "undefined") {
        const link = document.createElement("a")
        link.href = session.url_tickets_popup
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.style.display = "none"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
```

### 2. Update FESTIVAL MODE section (around lines 514-556)
Find the `<button>` element inside the festival weeks map and replace it with:

```jsx
{hasShow && showDatesMap.get(key)?.url_tickets_popup ? (
    <a
        href={showDatesMap.get(key)?.url_tickets_popup}
        aria-label={`Book tickets for ${dateObj.toDateString()}`}
        style={{
            ...dayButtonStyle,
            background: showDateColor,
            color: showDateTextColor,
            fontWeight: 700,
            cursor: "pointer",
            opacity: 1,
            textDecoration: "none",
        }}
    >
        {dateObj.getDate()}
    </a>
) : (
    <span
        aria-label={dateObj.toDateString()}
        style={{
            ...dayButtonStyle,
            background: isToday ? todayColor : "transparent",
            color: isToday ? accentColor : textColor,
            fontWeight: isToday ? 700 : 400,
            opacity: inRange ? 0.6 : 0.2,
        }}
    >
        {dateObj.getDate()}
    </span>
)}
```

### 3. Update MONTHLY MODE section (around lines 638-674)
Find the `<button>` element inside the monthly calendarDays map and replace it with:

```jsx
{hasShow && showDatesMap.get(key)?.url_tickets_popup ? (
    <a
        href={showDatesMap.get(key)?.url_tickets_popup}
        aria-label={`Book tickets for ${dateObj.toDateString()}`}
        style={{
            ...dayButtonStyle,
            background: showDateColor,
            color: showDateTextColor,
            fontWeight: 700,
            cursor: "pointer",
            opacity: 1,
            textDecoration: "none",
        }}
    >
        {day}
    </a>
) : (
    <span
        aria-label={dateObj.toDateString()}
        style={{
            ...dayButtonStyle,
            background: isToday ? todayColor : "transparent",
            color: isToday ? accentColor : textColor,
            fontWeight: isToday ? 700 : 400,
            opacity: 0.6,
        }}
    >
        {day}
    </span>
)}
```

## Why This Works
- The Humanitix popup.js script intercepts clicks on `<a>` tags with Humanitix URLs
- It does NOT intercept programmatically created/clicked elements
- By rendering actual `<a>` tags in the DOM, popup.js can intercept them naturally
- This is why the homepage works (regular Framer link elements) but the calendar didn't (code component with buttons)

## Test After Fix
1. Go to `/events/frenchy-the-instigator`
2. Click on an orange highlighted date
3. Should open Humanitix popup widget, NOT navigate away
