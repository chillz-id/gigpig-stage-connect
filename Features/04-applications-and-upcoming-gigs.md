# Applications and Upcoming Gigs

## Overview
Comedians apply to perform at events from `/gigs`. Promoters review/manage applications from event detail routes. The "Upcoming Gigs" sidebar/widget surfaces accepted applications for the signed-in comedian. **Source of truth is the `applications` table**; an older `event_applications` table exists but is not used by current hooks.

## Data
- Primary table: `applications` (event_id, comedian_id, status, message, spot_type, availability_confirmed, requirements_acknowledged, applied_at, responded_at, session_source_id).
- Legacy table: `event_applications` (created in migrations but unused in services). Tests reference migrating to it; current code still reads/writes `applications`.
- Views/indices: FK to `events` and `profiles` for joined selects.

## Frontend entry points
- Browse/apply: `src/pages/Gigs.tsx` with `ApplicationForm` and `useBrowseLogic`.
- Review: `src/pages/Applications.tsx` (global list), `src/pages/EventApplicationPage.tsx` (per-event review).
- Sidebar/dashboard: `src/hooks/useUpcomingGigs.ts` (counts + next gig), `src/components/dashboard/ComedianDashboard.tsx`, `src/components/layout/UnifiedSidebar.tsx`.
- Profile widgets: `src/components/comedian-profile/ComedianUpcomingShows.tsx` combines calendar gigs + applications.

## Services / hooks
- `src/hooks/useEventApplications.ts` → uses `eventApplicationService` (reads/writes `applications`).
- `src/services/event/application-service.ts` → listByEvent, listForComedian, apply, approve, shortlist, bulk update, notification helpers (all `applications`).
- `src/hooks/useUpcomingGigs.ts` → queries `applications` joined to `events`, filters `status = accepted` and future event_date.

## Flow
1) Comedian clicks Apply on Gigs → `useBrowseLogic.handleApply` shows `ApplicationForm`.
2) Submit → `useEventApplications.applyToEvent` inserts into `applications` with status `pending` and optional `session_source_id` (for scraped sessions).
3) Promoter reviews in Applications/EventApplicationPage → accepts/shortlists via `eventApplicationService` updates.
4) Once accepted, `useUpcomingGigs` surfaces the gig in sidebar/dashboard.

## Known gaps / actions
- Table mismatch: hooks/services use `applications`, but tests/docs mention migrating to `event_applications`. If we standardize on `applications`, drop/ignore the legacy table or create a compatibility view (name `event_applications`) pointing to `applications` with expected columns.
- UpcomingGigs currently only counts `status = accepted`; if we add confirmed bookings/spot assignments, update `useUpcomingGigs` mapping.
- `session_source_id` handling: ensure scraped session applications use this field so promoters can map them back to the event when importing.
