# Events and Gigs

## Overview
Events are the core show objects (date/time/location, payout, lineup). Promoters/managers create and edit events; comedians browse gigs and view public event pages. External ticketing data (Humanitix/Eventbrite) is exposed via the session calendar for the `/gigs` browse experience.

## Data
- Tables: `events` (master), `event_spots` (lineup slots), `event_templates` (reusable configs), `event_subscriptions` (followers), `event_attendees` (basic attendee info), `event_budgets/profitability` (financials), `session_complete` view (scraped ticketing sessions for browsing), `event_metrics` (analytics), `event_deals` + `deal_participants` (contracts; see 05-bookings-and-deals for detail).
- Key fields: `event_date`, `start_time`, `end_time`, `promoter_id`, `pay_per_comedian`, `is_recurring`, `session_source_id` (ties to scraped sessions), `status` (draft/published/archived).

## Frontend entry points
- Creation/editing: `src/pages/CreateEvent.tsx`, `src/pages/EditEvent.tsx`, `src/pages/EventManagement.tsx` (bulk tooling). Uses `event-management-service.ts` and `event-template-service.ts`.
- Public detail: `src/pages/EventDetailPublic.tsx` (shareable), `src/pages/EventDetail.tsx` (authenticated detail), `src/pages/EventApplicationPage.tsx` (application mgmt view for promoters), `src/pages/EventDetails.tsx` (legacy alias).
- Gigs browse: `src/pages/Gigs.tsx` with `useSessionCalendar` (scraped feed from `eventBrowseService`) and `useBrowseLogic` for apply/buy/interested flows; renders `ShowCard`, `EventFilters`, `MonthFilter`, `EventAvailabilityCard`, `CalendarGridView`.
- My events: `src/pages/MyGigs.tsx`, `src/pages/EventManagement.tsx`, `src/pages/Shows.tsx` (legacy naming), `src/pages/Organizer.tsx` (promoter dashboard shell).

## Services / hooks
- `src/hooks/useSessionCalendar.ts` – fetches events from `session_complete` view with date range/timezone filtering.
- `src/services/event/event-management-service.ts` – CRUD for events, uses Supabase client (tables: `events`, `event_spots`).
- `src/services/event/event-browse-service.ts` – session calendar feed (external sessions + internal events), applies timezone and role-aware filtering.
- `src/services/event/spot-service.ts` and `event-lineup-service.ts` – add/update/remove lineup spots and assignments.
- `src/services/event/event-dashboard-service.ts` – aggregates counts, used by dashboards.

## Flows
1) Promoter creates event → record stored in `events`; optional lineup spots created in `event_spots`.
2) Event can be published, generating public detail route and enabling applications/bookings.
3) `/gigs` fetches from `session_complete` (scraped) plus any platform-created events within date range.
4) Comedians can apply via ApplicationForm (see 04-applications-and-upcoming-gigs).
5) Promoters manage lineup/assignments via `event_spots` and booking flows.

## Known gaps / actions
- Ensure new event fields added to `EventDetailPublic` and `ShowCard` stay aligned with Supabase select list in `event-browse-service`.
- Scraped sessions use `session_source_id`; when creating platform-native events, ensure this is null so browse logic does not treat them as external.
- Feature toggles for organizations do not hide event tabs yet; coordinate with 02-organization-and-permissions when enforcing.
