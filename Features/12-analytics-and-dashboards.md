# Analytics and Dashboards

## Overview
Dashboards aggregate sales, bookings, and engagement metrics for admins, organizations, and performers. Some pages are thin wrappers around shared analytics services; others (Ticket Sales) are still prototype-grade.

## Data
- `ticket_sales` – primary revenue source for charts.
- `events`/`event_metrics` – views, applications, conversions.
- `comedian_bookings`, `booking_requests` – booking counts/conversion.
- `agency_analytics` – agency roster metrics (partial).
- `customers_crm_v` – CRM summary for customer analytics.

## Frontend entry points
- `src/pages/AdminDashboard.tsx` – platform metrics (users, events, bookings, revenue tiles, charts).
- `src/pages/Dashboard.tsx` – user-level dashboard shell referencing widgets (UpcomingGigs, earnings, tasks, notifications).
- `src/pages/admin/TicketSalesTestPage.tsx` – admin sales prototype using ticket_sales aggregates.
- `src/components/dashboard/*` and `src/components/analytics/*` – reusable widgets/charts; `UpcomingGigsWidget` defined in docs/PHASE_8_DASHBOARD_WIDGETS.md.
- Organization analytics: `src/pages/organization/OrganizationAnalytics.tsx` (lazy-loaded via PublicProfile routes).

## Services / hooks
- `src/services/analyticsService.ts` – aggregates event views/bookings, returns chart-ready data.
- `src/services/multiPlatformAnalyticsService.ts` – merges ticket platforms.
- `src/hooks/useUpcomingGigs.ts` – drives gig count widget (see 04-applications-and-upcoming-gigs for caveats).

## Flow
1) Pages request metrics via analytics services; services query Supabase views/tables.
2) Results rendered as cards/charts; many components accept config for widget placement.
3) Ticket sales dashboard reads `ticket_sales` grouped by event/platform/date.

## Known gaps / actions
- Ticket sales admin page is stub; build real filters (date range/platform/event) and publish-ready UI.
- Widgets documented in `docs/PHASE_8_DASHBOARD_WIDGETS.md` are not all wired; ensure lazy imports exist and bundle chunks resolve.
- Keep analytics queries aligned with schema changes (e.g., new booking statuses, application statuses) to avoid miscounting.
