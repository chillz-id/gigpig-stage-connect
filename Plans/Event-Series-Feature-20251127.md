# Event Series Feature (Future)

Created: 2025-11-27
Status: Idea - Not Started
Priority: Later (after customer-facing launch)

## Overview

Allow organizations to create custom Series that group related events together, providing a unified landing page for recurring shows.

## Use Case Example

iD Comedy creates Series: "Magic Mic Comedy"
- Adds all "Magic Mic Comedy - Wednesday" events to it
- Series page shows mini calendar with event dates
- Customers browse series, select date, buy tickets

## Feature Requirements

### Series Management
- Create custom series with name, slug, description, banner
- Add events to series (synced OR platform-created)
- Remove events from series
- Reorder events within series

### Series Page
- URL: `/org/{org-slug}/series/{series-slug}`
- Mini calendar showing dates with events (lit up/highlighted)
- Click date → shows event details for that date
- Buy tickets button → links to ticketing platform

### UI Location
- Organization "My Events" page
- New "Series" tab (next to List view)
- Series management interface

### Data Model

```sql
-- Series table
CREATE TABLE event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Junction table for events in series
CREATE TABLE event_series_events (
  series_id UUID REFERENCES event_series(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (series_id, event_id)
);
```

## Dependencies

- Events Unification (events table must include synced data)
- Customer-facing platform launch

## Notes

- Series can contain mix of synced and platform-created events
- Calendar UI component needed
- Consider SEO for series pages
