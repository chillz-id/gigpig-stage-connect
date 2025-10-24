# Supabase Hook Refactor Tracker

This tracker captures every hook that still talks to the Supabase client directly, alongside the ones we have already moved onto dedicated services. Use it to plan refactors, pair them with Linear tickets, and confirm when callers are decoupled from the SDK.

## Status Legend
- **Pending** – Hook still calls `supabase` directly; extract a service.
- **Planned** – Shared service/interface identified; refactor scheduled.
- **In Progress** – Refactor underway.
- **Completed** – Hook now delegates to a service or reusable data layer.
- **Keep (Auth/Core)** – Direct Supabase access is intentional (e.g., auth flows).

## Recently Completed
| Hook | Domain | Service Layer | Notes |
| --- | --- | --- | --- |
| `useCustomers` | CRM | `customerService` | Split into queries/mutations modules. |
| `useDeals` | CRM | `dealService` | CRM deal hooks now routed through service. |
| `useTasks` / `useTaskAssignees` | CRM Tasks | `taskService` | Hook modularisation plus React Query updates. |
| `useCustomerActivity` | CRM Timeline | `customerActivityService` | Timeline variants share service helpers. |
| `useInvoices` | CRM Billing | `invoiceService` | Export + refresh logic handled in service. |
| `usePayments` | CRM Billing | `paymentService` | New service consolidates payment, recurring invoice, refund RPCs. |
| `useFinancialMetrics` | CRM Analytics | `financialService` | Metrics + chart data retrieved via service helpers. |
| `useEarnings` | Performer Earnings | `earningsService` | Async comparisons handled in service. |
| `useContacts` | CRM Contacts | `contactService` | Shared contact state lives in service now. |
| `useSpotAssignment` | Event Ops | `spotAssignmentService` | Delegates matching logic to service layer; no direct Supabase calls. |
| `useEventData` | Events Dashboard | `eventDashboardService` | Dashboard fetch refactored to shared service. |
| `useCustomizationData` | Design System | `designSystemService` | Active theme + saved themes fetched via new customization service. |
| `useDesignSystemPersistence` | Design System | `designSystemService` | Save/load flows now centralised with CSS variable apply. |
| `useThemeOperations` | Design System | `designSystemService` | Theme CRUD delegates to service with consistent toasts. |
| `useComedianGigs` | Performer Bookings | `comedianGigService` | Calendar and spot data combined via new performer gig service. |
| `useComedianBookingsData` | Performer Bookings | `comedianBookingService` | Event booking fetches now go through performer booking service. |
| `useComedianAvailability` | Availability | `comedianAvailabilityService` | Availability + blocked dates now wrapped with shared service helpers. |
| `useSpotConfirmations` / `useSpotConfirmation` | Event Ops | `comedianSpotService` | Spot confirmation fetch/update logic routed through performer spot service. |
| `useLineupData` | Event Ops | `eventLineupService` | Lineup bookings and revenue pulled via shared event service. |
| `useLineupActions` | Event Ops | `eventLineupService` | Selection, invoicing, and payment updates routed through lineup service. |
| `useCostManagement` | Finance | `financialService` | Venue, marketing, and comedian costs fetched via financial service helpers. |
| `usePhotographers` | Marketplace | `photographerService` | Marketplace listing, profile, and vouch lookups run through service layer. |
| `useOrganizations` | CRM Org | `organizationService` | CRUD helpers moved into CRM service layer; hook now uses Auth context. |
| `useVouches` | Social Proof | `vouchService` | Vouch CRUD, search, and stats delegated to shared service with Auth guard. |
| `useWaitlist` | Event Waitlist | `waitlistService` | Event waitlist reads routed through event service with inclusive toasts. |
| `useFileUpload` | Media | `storageService` | Storage auth, upload, and cleanup handled via shared storage service. |
| `useNotifications` | Notifications | `notificationService` | Hook now relies on manager/service for queries, counts, and realtime updates. |
| `useUserXeroIntegration` | Accounting | `xeroIntegrationService` | User-scoped Xero connection, sync, and disconnect handled via service. |
| `useXeroIntegration` | Accounting | `xeroIntegrationService` | Admin Xero dashboards pull integration, invoices, and bills through service. |

## Backlog Candidates
| Hook | Domain | Current Supabase Touchpoint | Suggested Service | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `useComedianApplications` / `useSubmitApplication` | Applications | `applications`, `profiles` | `applicationService` | Pending | Align with new CRM application workflows. |
| `useApplications` | Applications | Mixed Supabase usage | `applicationService` | In Progress | Partially migrated; finish splitting read/write paths. |
| `useUserBranding` | Profiles | `profiles` branding fields | `profileService` | Pending | Consolidate with profile editing hooks. |
| `useProfileOperations` | Profiles | Supabase updates across profile tables | `profileService` | In Progress | Large surface area; break into focused services. |
| `useProfileData` | Profiles | `profiles` fetch | `profileService` | Pending | Share cache keys with CRM profile pages. |
| `useComedianProfile` | Profiles | `profiles` + media joins | `profileService` | Pending | Align with branding/profile services. |
| `useNotificationCenter` | Notifications | (if Supabase) | Review | Planned | Verify after notification service lands. |
| `useComedianMedia` | Media | `comedian_media` bucket + table | `mediaService` | Pending | Pair with `useFileUpload`. |
| `useGoogleMaps` | Integrations | Stores places in Supabase | `mapsIntegrationService` | Pending | Review necessity; may stay direct if minor. |
| `useAutoSave` | Editor | `events` table updates | `eventDraftService` | Pending | Combine with event management service. |
| `useCreateEventForm` | Events | `events`, `profiles` checks | `eventService` | Pending | Should lean on existing CRM event services. |
| `useAdminAnalytics` | Admin | `analytics_*` tables | `adminAnalyticsService` | Pending | Likely new service. |
| `useAuthOperations` | Auth | Supabase auth client | Keep (Auth/Core) | Keep | Direct auth handling stays close to SDK. |

> Update this table whenever a refactor lands (e.g., move rows to **Completed**, adjust notes, or split large hooks into multiple service-backed hooks). Include status changes in `CRM_REFRACTOR_MASTER_PLAN.md` so both documents stay aligned.
