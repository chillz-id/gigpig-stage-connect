# CRM Refactor Master Plan

This document tracks the detailed roadmap for the CRM refactor initiative. Each task now references its Linear ticket; append progress updates and notes as work proceeds.

---

## Phase 1 – Workflow Foundations

### CRM-101 · Task Manager Decomposition ([Linear BACKEND-58](https://linear.app/sus-gigpig/issue/BACKEND-58/crm-101-·-task-manager-decomposition))
- Extract Task Manager state into `useTaskManagerState`.
  - Move filter, sort, pagination, quick task, template selection, and derived metrics into the hook.
  - Provide memoized values and callbacks (`summary`, `handleStatusChange`, etc.).
- Split UI elements into:
  - `TaskSummary` – renders metric cards.
  - `TaskViewSwitcher` – handles view tabs, template selector, quick-task toggle.
  - `QuickTaskForm` – encapsulates quick task creation form.
- Update `TaskManagerPage` to use the new hook/components.
- Add unit tests for the hook and new components; ensure Playwright CRM tasks spec still passes.

### CRM-102 · Customer Filters Breakdown ([Linear BACKEND-59](https://linear.app/sus-gigpig/issue/BACKEND-59/crm-102-·-customer-filters-breakdown))
- Extract subcomponents:
  - `CustomerSearchBar`
  - `SegmentFilter`
  - `AdvancedFiltersDrawer`
  - `CreateSegmentDialog`
- Introduce `useSegmentManager` for create/update logic with validation and toast handling.
- Update `CustomerListPage` wiring; add unit tests for filter state handling.

### CRM-103 · Column Customizer Cleanup ([Linear BACKEND-60](https://linear.app/sus-gigpig/issue/BACKEND-60/crm-103-·-column-customizer-cleanup))
- Build `useColumnOrdering` helper (normalize order, enforce required columns).
- Split `ColumnCustomizer` into smaller components (visibility list, width controls, alignment selector, template manager/dialog).
- Add Storybook stories and tests for template CRUD and required-column logic.

### CRM-104 · Sidebar Configuration ([Linear BACKEND-61](https://linear.app/sus-gigpig/issue/BACKEND-61/crm-104-·-sidebar-configuration))
- Define sidebar configuration object (`agents/src/config/crmSidebar.ts`).
- Render sidebar by mapping config; share route metadata with router definitions.
- Document duplicate routes (segments, analytics, import/export) for follow-up.

---

## Phase 2 – Performance & UI Consistency

### CRM-105 · Customer Table Performance ([Linear BACKEND-62](https://linear.app/sus-gigpig/issue/BACKEND-62/crm-105-·-customer-table-performance))
- Memoize column metadata and move formatting helpers to `@/utils/crm/customer`.
- Spike virtualization with `@tanstack/react-virtual` under a feature flag.
- Capture React Profiler before/after metrics.

### CRM-106 · Activity Timeline Modularization ([Linear BACKEND-63](https://linear.app/sus-gigpig/issue/BACKEND-63/crm-106-·-activity-timeline-modularization))
- Extract per-activity renderers (`OrderActivity`, `MessageActivity`, etc.).
- Share formatting helpers with customer detail page.
- Add snapshot/unit tests for each activity type.

### CRM-107 · Hook Modularization ([Linear BACKEND-64](https://linear.app/sus-gigpig/issue/BACKEND-64/crm-107-·-hook-modularization))
- Split `useCustomers`, `useDeals`, `useTasks` into `queries` and `mutations` modules.
- Introduce Supabase CRM services (`crmCustomerService`, etc.).
- Update imports progressively and ensure React Query keys remain stable.
- Progress: Added targeted Jest coverage for the event-layer services (`ticketService`, `spotAssignmentService`) under `tests/event` to guard the refactored hook-to-service path; Jest still reports lingering async handles when these suites run alone—follow up by clearing Supabase client timers once the shared factory lands.
- Progress (2025-02-14): Completed the `useCustomers` barrel export migration so downstream callers resolve to the split query/mutation modules without duplicate hook definitions or missing imports.
- Progress (2025-02-14): Extracted Supabase access out of `usePayments` into `paymentService`, consolidating payment record, recurring invoice, and refund logic in the CRM service layer.
- Progress (2025-10-20): Moved `useOrganizations` onto the new `organizationService`, centralizing organization CRUD and shifting the hook onto the Auth context for user resolution.
- Progress (2025-10-20): Shifted photographer marketplace hooks (`usePhotographers`, portfolio, availability, vouches) to `photographerService`, consolidating listing, profile, and RPC access paths.
- Progress (2025-10-20): Routed `useVouches` through `vouchService`, centralizing vouch CRUD, search, and stats retrieval with shared auth checks and toast handling.
- Progress (2025-10-20): Extracted event waitlist reads into `waitlistService` and updated `useWaitlist` to depend on the shared service layer for consistent error handling.
- Progress (2025-10-20): Moved `useFileUpload` onto `storageService`, consolidating storage auth, upload, and deletion into reusable helpers.
- Progress (2025-10-20): Updated `useNotifications` to rely exclusively on `notificationService` for queries, counts, preferences, and realtime subscriptions.
- Progress (2025-10-20): Migrated Xero hooks (`useUserXeroIntegration`, `useXeroIntegration`) onto `xeroIntegrationService`, centralizing integration CRUD, sync, and ledger lookups.

### CRM-108 · Shared Utilities & Types ([Linear BACKEND-65](https://linear.app/sus-gigpig/issue/BACKEND-65/crm-108-·-shared-utilities-and-types))
- Create `@/utils/crm` for badge/formatter/date helpers.
- Add `@/types/crm` barrel for customer/deal/task interfaces.
- Update contributor guide with new conventions.

---

## Phase 3 – UX Polish & Tooling

### CRM-109 · Loading & Empty States ([Linear BACKEND-66](https://linear.app/sus-gigpig/issue/BACKEND-66/crm-109-·-loading-and-empty-states))
- Implement reusable `CRMLoadingState` and `CRMEmptyState`.
- Replace bespoke skeletons/empty states across CRM pages.
- Add Storybook stories and snapshot tests.

### CRM-110 · Route & Navigation Audit ([Linear BACKEND-67](https://linear.app/sus-gigpig/issue/BACKEND-67/crm-110-·-route-and-navigation-audit))
- Review routes like `/crm/segments`, `/crm/customer-analytics`, `/crm/import-export`.
- Decide on redirects vs. dedicated screens vs. removing from sidebar.
- Document decisions with product/design sign-off.

### CRM-111 · Data Service Layer ([Linear BACKEND-68](https://linear.app/sus-gigpig/issue/BACKEND-68/crm-111-·-data-service-layer))
- Build Supabase wrappers (`crmCustomerService`, `crmDealService`, `crmTaskService`) with consistent error handling.
- Refactor hooks to use services.
- Add unit tests mocking Supabase responses.

### CRM-112 · Date & Toast Consistency ([Linear BACKEND-69](https://linear.app/sus-gigpig/issue/BACKEND-69/crm-112-·-date-and-toast-consistency))
- Create `crmDateUtils` and `showCRMToast`.
- Replace direct toast/date usage across CRM.
- Update documentation with new helpers.

---

## Phase 4 – Developer Experience & Performance Follow-Up

### CRM-113 · Storybook / Playground Setup ([Linear BACKEND-70](https://linear.app/sus-gigpig/issue/BACKEND-70/crm-113-·-storybook-playground-setup))
- Configure Storybook (if needed) and add stories for kanban boards, detail components, filters, etc.
- Provide mock data fixtures.
- Integrate Storybook build (or Chromatic) into CI.

### CRM-114 · Lazy Loading & Perf Profiling ([Linear BACKEND-71](https://linear.app/sus-gigpig/issue/BACKEND-71/crm-114-·-lazy-loading-and-perf-profiling))
- Identify heavy CRM routes and wrap in `React.lazy`.
- Add prefetch hints and loading fallbacks.
- Capture Lighthouse/React Profiler before & after; attach results to ticket.

### CRM-115 · Documentation & Process Updates ([Linear BACKEND-72](https://linear.app/sus-gigpig/issue/BACKEND-72/crm-115-·-documentation-and-process-updates))
- Update/create CRM README summarizing architecture and workflow.
- Refresh `AGENTS.md` with new conventions/testing expectations.
- Sync implementation plan (`CRM_DESKTOP_UI_IMPLEMENTATION_PLAN.md`) with reality and cross-link Linear tickets.

---

## Execution Guidelines
- Linear epic “CRM Refactor” (Project [CRM Refactor](https://linear.app/sus-gigpig/project/crm-refactor-8e4b3b9f0f52), ID 8cdfe0b3-1f2f-496b-89ee-47403464a97b) tracks CRM-101 ... CRM-115.
- Reference issues: BACKEND-58 through BACKEND-72 (see Phase sections above).
- Work sequentially or in compatible pairs to minimize merge conflicts.
- After each ticket:
  - Run `npm run lint`.
  - Run focused unit tests + relevant Playwright spec.
  - Attach evidence (screenshots, profiler traces) to the Linear ticket.
- Update this document with progress notes, links to PRs, and date of completion for each ticket.
- Duplicate CRM routes currently share placeholder components: `segments`, `customer-analytics`, and `import-export` reuse the customer list; relationship sub-routes reuse the relationship hub; analytics sub-routes reuse the analytics dashboard. Track follow-up UI work alongside the route metadata in `src/config/crmSidebar.tsx` notes.

## Progress Log
- [BACKEND-58 · Task Manager Decomposition](https://linear.app/sus-gigpig/issue/BACKEND-58/crm-101-·-task-manager-decomposition) — _Status_: In progress — _Notes_: Added unit coverage for hook and UI widgets; Playwright CRM tasks spec still pending.
- [BACKEND-59 · Customer Filters Breakdown](https://linear.app/sus-gigpig/issue/BACKEND-59/crm-102-·-customer-filters-breakdown) — _Status_: In progress — _Notes_: Customer filters decomposed into modular components with `useSegmentManager` hook and unit coverage.
- [BACKEND-60 · Column Customizer Cleanup](https://linear.app/sus-gigpig/issue/BACKEND-60/crm-103-·-column-customizer-cleanup) — _Status_: In progress — _Notes_: Introduced `useColumnOrdering`, modularized column UI/components, added unit coverage and Storybook scaffolding.
- [BACKEND-61 · Sidebar Configuration](https://linear.app/sus-gigpig/issue/BACKEND-61/crm-104-·-sidebar-configuration) — _Status_: In progress — _Notes_: Sidebar now maps shared config from `src/config/crmSidebar.tsx`; router consumes same metadata; duplicated routes logged for follow-up.
- [BACKEND-62 · Customer Table Performance](https://linear.app/sus-gigpig/issue/BACKEND-62/crm-105-·-customer-table-performance) — _Status_: In progress — _Notes_: Memoized column metadata via `buildCustomerColumns`, centralized formatters under `@/utils/crm/customer`, added optional virtualization spike with `@tanstack/react-virtual` flag.
- [BACKEND-63 · Activity Timeline Modularization](https://linear.app/sus-gigpig/issue/BACKEND-63/crm-106-·-activity-timeline-modularization) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-64 · Hook Modularization](https://linear.app/sus-gigpig/issue/BACKEND-64/crm-107-·-hook-modularization) — _Status_: In progress — _Notes_: `useCustomers`/`useDeals` now wrap CRM services via dedicated `queries`/`mutations` modules (re-exported for compatibility); `useTasks` split into CRM submodules (queries, mutations, time tracking, composites, assignee lookup backed by service); customer activity hooks proxy through `customerActivityService`; CRM analytics hook funnels through `crmAnalyticsService`; `useContacts` now calls `contactService`; financial/earnings/ticket-sales/upcoming events/gig/invoice hooks route through `financialService`/`earningsService`/`ticketSalesService`/`eventService`/`gigService`/`invoiceService`; CSV builder shifted into service with Jest locks; shared stats types + deal aggregation tests in place.
- [BACKEND-65 · Shared Utilities & Types](https://linear.app/sus-gigpig/issue/BACKEND-65/crm-108-·-shared-utilities-and-types) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-66 · Loading & Empty States](https://linear.app/sus-gigpig/issue/BACKEND-66/crm-109-·-loading-and-empty-states) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-67 · Route & Navigation Audit](https://linear.app/sus-gigpig/issue/BACKEND-67/crm-110-·-route-and-navigation-audit) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-68 · Data Service Layer](https://linear.app/sus-gigpig/issue/BACKEND-68/crm-111-·-data-service-layer) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-69 · Date & Toast Consistency](https://linear.app/sus-gigpig/issue/BACKEND-69/crm-112-·-date-and-toast-consistency) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-70 · Storybook / Playground Setup](https://linear.app/sus-gigpig/issue/BACKEND-70/crm-113-·-storybook-playground-setup) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-71 · Lazy Loading & Perf Profiling](https://linear.app/sus-gigpig/issue/BACKEND-71/crm-114-·-lazy-loading-and-perf-profiling) — _Status_: Backlog — _Notes_: Pending kickoff.
- [BACKEND-72 · Documentation & Process Updates](https://linear.app/sus-gigpig/issue/BACKEND-72/crm-115-·-documentation-and-process-updates) — _Status_: Backlog — _Notes_: Pending kickoff.

## Recommendations & Findings
- Supabase type errors required casting clients to `any` in services (`customerService`, `dealService`, `taskService`). Consider regenerating typed clients or wrapping the SDK with project-specific interfaces to re-enable static safety.
- Task assignee lookup now lives in `taskService`; evaluate whether other profile-driven selectors (e.g., event owners) should share the same helper to avoid ad-hoc Supabase queries across hooks.
- CRM analytics aggregation currently runs multiple Supabase queries sequentially inside `crmAnalyticsService`. Consider moving heavy aggregation into a Postgres view or RPC to reduce client-side processing and simplify testing.
- Contact service still leaks presentation mapping (display name, stats) into the backend helper. Consider consolidating profile normalisation so list endpoints stay DRY across CRM features.
- Financial and earnings services now rely on chained Supabase queries; investigate moving recurring calculations into SQL views to keep client bundles lean and enable reuse in other surfaces.
- Upcoming events/gig services currently operate on Supabase views with chained filters; consider centralising the view logic or exposing typed helpers to reduce mock complexity in tests.
- Invoice service now feeds `useInvoices`; there’s still significant client-side filtering/mocking in the hook. Evaluate moving heavy filtering and logging into dedicated utilities once service stabilises.
