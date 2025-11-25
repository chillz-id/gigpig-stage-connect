# Ticketing (Humanitix, Eventbrite) and Imports

## Overview
Ticketing integrations ingest orders from Humanitix and Eventbrite, hydrate `ticket_sales`, and feed dashboards plus the session calendar (`session_complete` view) used on the Gigs page. Imports run via webhooks plus on-demand sync scripts.

## Data
- `ticket_sales` – unified ticket transactions (event_id, platform, order_id, quantity, gross/net, fees, currency, purchaser info).
- Platform-specific: `humanitix_orders`, `eventbrite_orders`, `ticket_platforms` (credentials/config), `ticket_reconciliation` tables for cross-checks.
- `session_complete` view – merged session data from ticket platforms; drives `useSessionCalendar`.

## Frontend entry points
- Dashboards: `src/pages/admin/TicketSalesTestPage.tsx` (admin analytics view), `src/components/analytics/*` charts use sales data.
- Public browse: `src/pages/Gigs.tsx` uses session data for event cards and ticket links (`handleBuyTickets`).

## Services / hooks
- `src/services/humanitixApiService.ts` – REST client for Humanitix (orders, events, attendees). Used by sync jobs.
- `src/services/eventbriteApiService.ts` – Eventbrite OAuth + API access.
- `src/services/ticketSyncService.ts` – normalizes platform data into `ticket_sales`; triggered by jobs or webhooks.
- `src/services/ticketReconciliationService.ts` – compares platform totals vs. stored sales.
- Webhook/test scripts under `scripts/` (`test-humanitix-api`, `test-eventbrite-api`, etc.) for manual checks.

## Flow
1) OAuth/keys stored in `ticket_platforms`; platform-specific jobs fetch events/orders.
2) Webhooks (n8n/Supabase edge) receive order events → call `ticketSyncService` to upsert into `ticket_sales` and platform tables.
3) Session ingest populates `session_complete` for browse/analytics.
4) Dashboards read from `ticket_sales` for counts/revenue; session calendar uses session view for gigs listing.

## Known gaps / actions
- Ensure webhook secrets are set in env and n8n flows; missing keys will silently drop orders.
- Session view schema changes require updating `event-browse-service` select list to avoid runtime errors.
- TicketSales admin page is minimal; build production dashboard for promoters/admins using `ticket_sales` aggregations.
