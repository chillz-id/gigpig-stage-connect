# CRM and Relationships

## Overview
Built-in CRM tracks customers/leads, tasks, relationships, and deals for promoters/agencies. Import/export flows support CSV ingest with column mapping. Deal pipeline ties to bookings/deals for revenue tracking.

## Data
- `customer_profiles` – master customer record (name, dob, marketing prefs, notes).
- `customer_emails`, `customer_phones` – multi-contact with source and primary flags.
- `customer_engagement_metrics` – touchpoints/metrics.
- `customers_crm_v` – consolidated view for list/search.
- Deals/tasks: `crm_tasks`, `crm_task_assignments` (check types), `deal_pipeline` tables aligned with deal components.

## Frontend entry points
- List/detail: `src/pages/crm/CustomerListPage.tsx`, `CustomerDetailPage.tsx` (tabs for contact info, engagement, tasks).
- Import/export: `src/pages/crm/ImportExportPage.tsx` with multi-step wizard; uses CSV mapping UI.
- Deals: `src/pages/crm/DealPipelinePage.tsx` (board view) and shared components under `src/components/deals/`.
- Relationships/tasks: `src/pages/crm/RelationshipsPage.tsx`, `TaskManagerPage.tsx`, `TaskDetailPage.tsx`.

## Services / hooks
- `src/services/crm/import-service.ts` – validates/mappings CSV columns, deduplicates by email, upserts into customer tables.
- `src/services/crm/*` – helpers for customers, tasks, relationships, analytics (see folder for specific modules).
- `src/services/exportService.ts` – CSV export for CRM lists.

## Flow
1) Import CSV → mapping step → validation → upsert into customer tables; duplicates handled by email match.
2) Customer list reads from `customers_crm_v`, with filters/search.
3) Deals pipeline pulls from `event_deals/deal_participants` where relevant; board status updates write back to deal tables.
4) Tasks attach to customers or deals; assignments stored in task tables.

## Known gaps / actions
- Ensure CRM list queries stay in sync with new columns added to customer tables; update `customers_crm_v` if schema changes.
- Deal pipeline duplication: there is also a non-CRM DealPipeline page; keep statuses consistent with booking/deal flows (see 05-bookings-and-deals).
- Import wizard should validate phone format (E.164) and email; confirm hooks enforce this before insert.
