# Calendar and Availability

## Overview
Calendar surfaces personal events, blocked dates, and platform gigs. Availability selection lets comedians mark interest/availability for scraped sessions directly from `/gigs`, saving selections for promoters to view. Google Calendar sync exists for bidirectional import/export.

## Data
- `calendar_events` – user-authored events (title, start/end, type).
- `blocked_dates` – unavailable windows.
- `personal_gigs` – off-platform gigs for context in schedule.
- `availability` (via `availabilityService`) – selections for sessions/events; stored per user with event/session IDs.
- `calendar_integrations` – Google sync tokens/config.

## Frontend entry points
- `src/pages/Calendar.tsx` – main calendar UI with monthly/weekly/list views.
- `src/pages/MyGigs.tsx` – personal gigs view (mix of applications + calendar gigs).
- `src/pages/Gigs.tsx` – availability selection for comedians via `EventAvailabilityCard` and `useAvailabilitySelection`.
- `src/hooks/useAvailabilitySelection.ts` – manages selection state, diffing, debounced save.
- `src/hooks/useSessionCalendar.ts` – data feed (scraped sessions + platform events) for calendar/gigs.

## Services / hooks
- `src/services/availability/availability-service.ts` – read/write user availability, return set of event/session IDs.
- `src/hooks/useGoogleCalendarSync.ts` (check in hooks folder) – OAuth + sync for Google; uses `calendar_integrations`.
- `src/services/calendar/*` – helpers for blocked dates and personal gigs.

## Flow
1) User opens Calendar/MyGigs → fetches `calendar_events`, `personal_gigs`, `blocked_dates` via services/hooks.
2) `/gigs` lets comedians toggle availability per session; `useAvailabilitySelection` saves to availability table with debounce + optimistic updates.
3) Google sync (when configured) pulls remote events into `calendar_events` and pushes platform events outward.

## Known gaps / actions
- Ensure availability table keys align with session vs. internal event IDs; scraped sessions use `session_source_id`.
- Calendar UI currently ignores organization feature toggles; if hiding features per org, gate the calendar tab.
- Verify Google OAuth credentials/env are present before enabling sync in prod; add error messaging when not configured.
