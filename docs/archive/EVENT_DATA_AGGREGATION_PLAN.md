# Event Data Aggregation & Browse Integration Plan

This plan captures the work required to unify Humanitix and Eventbrite session data into a single Supabase view/materialized view and wire it into the platform (starting with the `/shows` page).

## Current Status & Guidance

- `event_sessions_overview_v` now ships as a **standard view**. Earlier attempts to index it triggered Postgres errors and automatic drops because regular views cannot own indexes; keep any supporting indexes on the source tables (`session_financials`, `sessions`, `events`, etc.).
- The view now exposes `stable_event_id`/`stable_session_id` alongside the raw UUIDs so downstream code can fall back to canonical provider identifiers when Supabase rows are missing IDs.
- The SQL still follows the earlier performance plan—if the workload grows, we can revisit a materialized view, but for now we prefer the simpler live view.
- Recent SQL updates added lineup and waitlist JSON, along with event URLs and banner metadata so `/shows` can filter against `available_spots` and render confirmed performers immediately.
- Dev server is live on port `8080`; exercise the new fields via the data layer and `/shows` route to confirm the browse UI reflects the view.
- **Next steps for QA:**
  1. Query the view through `eventBrowseService` and make sure the UI sees `event_url`, banners, and lineup JSON.
  2. If any filter over `event_name`, `session_start_local`, `venue_city`, or `available_spots` feels slow, add precise indexes to the underlying tables and ping the data team so we can fold them into migrations.

When documenting or debugging query performance, call out the underlying table name that would receive the index (e.g., composite `(canonical_session_source_id, session_start_local)` on `session_financials`).

## 1. Existing Supabase Footprint (to verify)

- **Raw / Ingestion Tables** (confirmed via Supabase MCP):
  - Humanitix imports land in `events_htx`, `sessions_htx`, `orders_htx`, `tickets_htx`, `customers_htx` with helper views `events_htx_view`, `orders_htx_view`, and `tickets_htx_view`.
  - Eventbrite imports currently flow through `orders_eventbrite` and `tickets_eventbrite`; session metadata is reconciled via the canonical mapping in `session_sources` (`canonical_source`, `canonical_session_source_id`, `source`, `source_session_id`).
  - There are no standalone `*_discounts` tables—discount usage lives inside the provider order/ticket payloads for now.
- **Aggregates / Views already present**:
  - `session_financials` (canonical session metrics in dollars, keyed by `canonical_session_source_id`)
  - `session_financials_agg` (combined Humanitix + Eventbrite metrics in integer cents)
  - Any existing `*_summary_v` or `*_analytics_v` views (confirm via Supabase console)
- **Other references**:
  - `session_sources` (provider canonicalisation bridge feeding both `session_financials` tables)
  - `events` (legacy mock data – to be deprecated for browse purposes)
  - `venues` (contains lat/lng)
  - `event_applications`, `event_spots`, etc. (CRM-side hooks – decide later if they fold into the view)

> To-Do: Run `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public';` to confirm the exact table/view names and column sets.

## 2. Target Supabase Aggregation

Create a new view (or materialized view) `event_sessions_overview_v` that denormalizes:

| Category | Fields / Source |
| --- | --- |
| Identification | session_id, event_id, provider (`session_financials` joined via `session_sources`) |
| Metadata | session name, event title, promoter, recurrence info (`sessions_htx`, `events_htx_view`, legacy `events` as fallback) |
| Scheduling | session_date, start_time, end_time, timezone |
| Venue | venue_id, name, address, city, state, lat, lng (`venues`) |
| Provider Metrics | orders, tickets, gross, net, fees, tax for Eventbrite and Humanitix (`session_financials`, `session_financials_agg`, provider tables) |
| Combined Totals | total_orders, total_tickets, total_gross/net/fees/tax (`session_financials_agg`) |
| Discounts | per-code usage summary (json aggregate from provider order/ticket payloads) |
| Customers | sample customers (json aggregate from orders) |
| Applications/Status | optional counts from `event_applications`, `event_spots` |
| Lineup | confirmed performers with profile metadata (json aggregate from `event_spots` + `profiles`) |
| Refresh Timestamp | `NOW()` or metadata table join |

Implementation notes:
- Use `session_sources` as the canonical bridge when joining provider-specific tables so the view stays agnostic to Humanitix/Eventbrite ID formats.
- Prefer a **materialized view** if the SQL is heavy; otherwise, a standard view is fine.
- If materialized, schedule `REFRESH MATERIALIZED VIEW CONCURRENTLY event_sessions_overview_v;` after ingestion runs.
- Add indexes on key columns to support browse filters (`event_name`, `session_start_local`, `venue_city`, `available_spots`).
- Optionally add helper functions: `get_event_sessions(event_id uuid)`, `get_event_financials(session_id uuid)` if more convenient for the API layer.

## 3. Migration Tasks

1. **Inventory & Documentation**
   - Export current schema (Supabase console or `psql`) to confirm table/view names and columns.
   - Document raw tables, aggregated tables, and ingestion cadence.
2. **Write SQL migration**
   - `CREATE MATERIALIZED VIEW event_sessions_overview_v AS ...` (or `CREATE VIEW` if light enough).
   - Include `CREATE INDEX` statements (e.g., on `(session_date)`, `(event_id)`, `(session_id)`).
   - Add comments describing the view for future maintainers.
   - If using a materialized view, create a helper function or cron job to refresh (e.g., `EVENT_SESSIONS_OVERVIEW_REFRESH()`).
3. **Test migration locally**
   - Run `supabase db reset` + migration to validate SQL syntax.
   - Populate staging tables with sample data to ensure the view returns rows.
4. **Deploy migration**
   - Apply to staging/prod via `supabase db push` or CI pipeline.

## 4. Platform Integration Plan (Starting with `/shows`)

1. **Data Layer**
   - Update `eventBrowseService` to query `event_sessions_overview_v` instead of the legacy `events` table.
   - Extend the TypeScript types (`BrowseEvent`) to include the new financial and venue fields.
   - Provide filter params for provider status (e.g., show/hide Eventbrite-only sessions).
2. **Hooks**
   - Adjust `useShowsData` to surface the new metrics.
   - Update insights hooks (finance pages) to query the same view.
3. **UI**
   - Show aggregated ticket/financial info on `/shows` cards (optionally behind toggles).
   - Add export buttons that call a new endpoint (e.g., Supabase RPC returning CSV from `event_sessions_overview_v`).
   - For settlement/finance screens, reuse the view and display provider breakdowns.
4. **Testing**
   - Validate monthly/weekly filters return expected counts.
   - Cross-check sample events against manual Humanitix/Eventbrite reports.
   - Ensure map pins use lat/lng from the view.
5. **Rollout**
   - Dark launch behind a feature flag if desired.
   - Monitor performance (Supabase query execution time) and add indexes as needed.

## 5. Follow-up / Extensions

- Add additional provider support (e.g., Ticketek) by extending the ingestion pipeline and the view.
- Create per-promoter dashboards by adding filters or additional views.
- Consider caching the materialized view refresh timestamp in a `refresh_status` table to expose via API/UI.

---

**Next Action Items**
1. Confirm actual table/view names in Supabase (run schema introspection).
2. Draft SQL for `event_sessions_overview_v` (+ indexes) in a migration file. See `sql/event_sessions_overview_v.sql` for the current working draft.
3. Update `eventBrowseService` + hooks to use the new view once deployed.
4. QA `/shows` & finance screens with real data.
