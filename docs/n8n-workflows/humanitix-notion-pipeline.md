# n8n: Humanitix → Notion Sync Pipeline

## Purpose
Synchronise Humanitix events, multi-date sessions, orders, and tickets into the Notion workspace (Humanitix CRM System). Designed as a polling solution because Humanitix exposes only REST endpoints (no native webhook/MCP). Use this when you want the agents to operate through n8n instead of shell scripts.

## Overview
1. **Trigger** – `Cron` node (recommend every 5 minutes; start with manual trigger while testing).
2. **Fetch Events** – `HTTP Request` node hitting `GET https://api.humanitix.com/v1/events?page=<page>&pageSize=100` with the API key in `x-api-key` header. Use a `Function` node to manage pagination flags (`hasMore`, `nextPage`).
3. **Event Loop** – `Split In Batches` (size 1) to process each event.
4. **Fetch Enriched Detail** – optional `HTTP Request` node `GET /v1/events/{id}` to capture venue, schedule, etc.
5. **Session Extraction** – `Function` node to map multi-date schedules (fields like `sessions`, `multiDates`, `timeslots`) into a uniform array for the sessions database.
6. **Orders Pagination** – nested loop: `Function` → `HTTP Request /events/{id}/orders` per page → `Merge (Continue)` to gather all orders.
7. **Tickets** – for each order, extract `order.tickets`/`ticketItems`; optionally fetch event-wide tickets via `GET /events/{id}/tickets`.
8. **Notion Upserts** – dedicated Notion nodes:
   - `Notion > Search` by rich-text property (Humanitix ID) to determine if record exists.
   - `Notion > Update Page` when found, otherwise `Notion > Create Page`.
   - Use separate Notion credentials referencing `NOTION_TOKEN`.
9. **Rate Limiting** – insert `Wait` nodes (250–500ms) between Notion writes to stay under Notion’s API quota (3 requests/sec).
10. **Logging** – optional Slack/Email node for error notifications; or write to a Notion “Sync Log” DB.

## Required Environment / Credentials
- **Humanitix HTTP Header Auth**: `x-api-key: {{ $env.HUMANITIX_API_KEY }}`.
- **Notion credential**: API integration token (`NOTION_TOKEN`).
- Store database IDs in `Environment Variables` or a `Set` node for clarity:
  - `NOTION_EVENTS_DB_ID`
  - `NOTION_SESSIONS_DB_ID` (optional but helpful for multi-date events)
  - `NOTION_ORDERS_DB_ID`
  - `NOTION_TICKETS_DB_ID`

## Suggested Node Layout (in order)
1. `Cron` (or `Manual Trigger`).
2. `Function` – initialise pagination state `{ page: 1, hasMore: true }`.
3. `While` (Execute While node) evaluating `{{$json.hasMore}}`.
   - Inside loop:
     - `HTTP Request` (Events)
     - `Function` (Normalize/Flatten events, compute next `page` & `hasMore`).
     - `Split In Batches` (size 1) to iterate events.
       - `HTTP Request` event detail (optional).
       - `Function` (prepare Notion payload for event + sessions array).
       - `Notion Search` → `Notion Update/Create` for event.
       - `Split In Batches` for sessions (if array non-empty) → `Notion Search` → `Notion Update/Create`.
       - Nested `Function` to set `{ ordersPage: 1, ordersHasMore: true }`.
       - Nested `While` for orders pages → `HTTP Request /events/{id}/orders` → `Function` flatten and normalise.
         - `Split In Batches` (orders) → `Notion Search` → `Notion Update/Create` order.
         - For each order, `Split In Batches` tickets → `Notion Search` → `Notion Update/Create` ticket (link back to order + event).
       - After orders loop, optional `HTTP Request /events/{id}/tickets` → `Split` → Notion upsert for standalone tickets.
4. `Function` – gather any errors from previous nodes.
5. `If` – send alerts (Slack/Email) when errors present.

## Property Mapping Cheat Sheet (default names)
| Concept | Notion Property | Source |
|---------|-----------------|--------|
| Event | `Name` (title) | `event.name`/`title` |
| Event | `Humanitix ID` (rich text) | `event._id` |
| Event | `Status` (select) | `event.status` |
| Event | `Start` (date) | `event.startDateTime` |
| Event | `End` (date) | `event.endDateTime` |
| Event | `Timezone` (rich text) | `event.timezone` |
| Event | `Venue` (rich text) | `event.venue.name` |
| Event | `Event URL` (URL) | `event.url` |
| Event | `Raw Payload` (rich text) | JSON.stringify(event) |

| Session | `Name` (title) | `session.name` or fallback |
| Session | `Session ID` (rich text) | `session._id` |
| Session | `Start` (date) | `session.startDateTime` |
| Session | `End` (date) | `session.endDateTime` |
| Session | `Status` (select) | `session.status` |
| Session | `Event` (relation) | parent event page |
| Session | `Raw Payload` | JSON |

| Order | `Order` (title) | `order._id` |
| Order | `Order ID` | `order._id` |
| Order | `Event` (relation) | parent event |
| Order | `Customer` | `${firstName} ${lastName}` |
| Order | `Email` | `order.email` |
| Order | `Phone` | `order.mobile` |
| Order | `Status` | `order.status` |
| Order | `Gross Amount` | `order.totals.grossSales` |
| Order | `Net Amount` | `order.totals.netSales` |
| Order | `Discount Code` | `order.discounts.discountCode.code` |
| Order | `Discount Amount` | `order.totals.discounts` |
| Order | `Order Date` | `order.completedAt` |
| Order | `Payment Method` | `order.paymentMethod` |
| Order | `Raw Payload` | JSON |

| Ticket | `Ticket` (title) | `ticket.name` |
| Ticket | `Ticket ID` | `ticket._id` or barcode |
| Ticket | `Order` (relation) | parent order |
| Ticket | `Event` (relation) | parent event |
| Ticket | `Ticket Type` | `ticket.ticketType.name` |
| Ticket | `Quantity` | `ticket.quantity` |
| Ticket | `Price` | `ticket.price` |
| Ticket | `Status` | `ticket.status` |
| Ticket | `Barcode` | `ticket.barcode` |
| Ticket | `Raw Payload` | JSON |

## Best Practices
- Use **environment variables** at the workflow level so the same pipeline can run in staging/production.
- Keep an audit log in Notion or Supabase for sync errors (append row with `eventId`, `orderId`, `error`).
- When rate limits bite, add a `Wait` node after each Notion operation.
- For incremental sync, store the last successful `order.updatedAt` in Notion or Supabase and use the Humanitix `since` query parameter.
- Test with a single event by adding an `If` node early (`{{$json._id === "evt_test"}}`) to limit scope.

## Related Resources
- `docs/n8n-workflows/humanitix-historical-import.json` (legacy workflow that fetched all historical data).
- `docs/humanitix-api.yaml` for the full OpenAPI spec.
- Notion integration setup: [https://developers.notion.com/docs/getting-started](https://developers.notion.com/docs/getting-started).

Once built, export the workflow (`.json`) to `docs/n8n-workflows/` or the `n8n-import-ready/` folder so agents can re-import quickly.
