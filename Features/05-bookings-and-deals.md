# Bookings, Deals, and Lineups

## Overview
Bookings let promoters/organizations request comedians; accepted applications can turn into bookings and lineup assignments. Deals capture contract terms between parties. Lineups (`event_spots`) define the running order and timing for shows.

## Data
- `booking_requests` – inbound requests from promoters/consumers (event_date/time/venue/budget/requested_comedian_id, requester_id).
- `booking_inquiries` – lighter-weight inquiries (when implemented).
- `comedian_bookings` – confirmed bookings linking comedians to events and payment terms.
- `event_deals` and `deal_participants` – contract header + parties (payer/payee, amounts, GST flag, status).
- `event_spots` – lineup slots (start/end, spot_type, assigned_comedian_id, status), plus `spot_assignments` helper methods in services.

## Frontend entry points
- Request flows: `src/pages/BookComedian.tsx` and `src/components/BookComedianForm.tsx` (creates `booking_requests`), `src/components/comedian/BookingRequestsSection.tsx` (comedian view of requests), `src/components/promoter/BookingManagementDashboard.tsx` (promoter-side management).
- Deals: `src/pages/DealDetailPage.tsx`, `src/pages/DealPipelinePage.tsx` (top-level) and `src/pages/crm/DealPipelinePage.tsx` (CRM view). Components under `src/components/deals/` handle creation, approvals, and status chips.
- Lineup/spots: lineup widgets inside event detail pages, using `event-lineup-service.ts` and `spot-service.ts`.

## Services / hooks
- `src/services/event/spot-service.ts` – CRUD for spots, assignment helpers, status transitions.
- `src/services/event/event-lineup-service.ts` – combined lineup operations and validation.
- `src/services/eventDealService.ts` and `dealParticipantService.ts` – create/update deals and participants; enforce GST flags and payer/payee roles.
- `src/services/booking` functionality lives inline in components via Supabase client inserts/updates for `booking_requests`.

## Flow
1) Promoter sends booking request → stored in `booking_requests`; comedian sees request in dashboard section and can accept/decline (updates status field).
2) Accepted requests can translate into `comedian_bookings` and optionally a `event_deals` contract; lineup spots can be assigned to booked comedians.
3) Deals capture payment schedules; deal participants connect to profiles for invoicing/analytics.

## Known gaps / actions
- Booking inquiries table exists but UI is minimal; consolidate with booking requests or remove.
- Ensure deal creation is triggered when a booking is confirmed; currently often manual via Deal pages.
- Lineup UI and booking state are loosely coupled—confirm `event_spots.assigned_comedian_id` stays in sync with bookings/deals when editing lineups.
