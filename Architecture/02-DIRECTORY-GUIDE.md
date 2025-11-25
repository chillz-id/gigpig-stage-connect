# Directory Guide

Annotated directory structure of the Stand Up Sydney codebase with descriptions of each folder's purpose.

---

## Root Structure

```
/root/agents/                    # Main development directory
├── src/                         # Application source code
├── tests/                       # Unit tests (Jest) and E2E tests (Playwright)
├── scripts/                     # Utility scripts
├── public/                      # Static assets
├── Architecture/                # This documentation folder
├── Features/                    # Feature documentation
├── Plans/                       # Implementation plans
├── docs/                        # Additional documentation
├── supabase/                    # Supabase migrations
├── CLAUDE.md                    # Developer guide
├── AGENTS.md                    # Git workflow guide
└── package.json                 # Dependencies
```

---

## Source Directory (`src/`)

### Top-Level Overview

```
src/
├── api/                 # API utilities
├── components/          # React components (605 files)
├── config/              # Environment configuration
├── contexts/            # React Context providers (5)
├── hooks/               # Custom React hooks (70+)
├── integrations/        # Third-party integrations
├── lib/                 # Utility libraries
├── pages/               # Route components (84)
├── scripts/             # Client-side scripts
├── services/            # Business logic services (60+)
├── templates/           # Email templates
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

---

## Components (`src/components/`)

Domain-organized UI components. **Use existing components before creating new ones.**

```
src/components/
├── ui/                      # shadcn/ui base components (Button, Dialog, etc.)
│
├── auth/                    # Authentication components
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── PasswordReset.tsx
│
├── comedian-profile/        # Comedian EPK & dashboard
│   ├── ComedianProfileLayout.tsx    # Layout wrapper
│   ├── ComedianEPKLayout.tsx        # Public EPK view
│   ├── ComedianDashboardTabs.tsx    # Dashboard navigation
│   ├── MediaGallery.tsx             # Portfolio display
│   └── sections/                    # Profile sections
│
├── photographer-profile/    # Photographer profiles
│   └── ...similar structure
│
├── events/                  # Event display components
│   ├── EventCard.tsx
│   ├── EventList.tsx
│   ├── EventFilters.tsx
│   └── EventBanner.tsx
│
├── event-management/        # Event admin components
│   ├── LineupManager.tsx
│   ├── SpotAssignment.tsx
│   ├── ApplicationsList.tsx
│   └── EventSettingsPanel.tsx
│
├── crm/                     # CRM components
│   ├── CRMLayout.tsx
│   ├── CustomerTable.tsx
│   ├── DealPipeline.tsx
│   └── TaskManager.tsx
│
├── invoice/                 # Invoicing components
│   ├── InvoicePreview.tsx
│   ├── InvoiceLineItems.tsx
│   └── PaymentStatusBadge.tsx
│
├── layout/                  # App layout components
│   ├── PlatformLayout.tsx           # Main layout
│   ├── UnifiedSidebar.tsx           # Sidebar navigation
│   ├── ProfileSwitcher.tsx          # Profile dropdown
│   └── MobileNav.tsx
│
├── profile/                 # Profile management
│   ├── ProfileCreationWizard.tsx
│   ├── SlugEditor.tsx
│   └── AvatarUpload.tsx
│
├── forms/                   # Reusable form components
│   ├── FormField.tsx
│   ├── DatePicker.tsx
│   └── LocationPicker.tsx
│
├── pwa/                     # PWA components
│   ├── PWAInstaller.tsx
│   └── OfflineIndicator.tsx
│
└── cards/                   # Card display components
    ├── ComedianCard.tsx
    └── GigCard.tsx
```

### Looking for UI Components?

| Need | Check First |
|------|-------------|
| Button, Input, Dialog, Select | `src/components/ui/` |
| Form fields | `src/components/forms/` |
| Cards | `src/components/cards/` |
| Navigation | `src/components/layout/` |
| Profile editing | `src/components/profile/` |
| Event display | `src/components/events/` |

---

## Contexts (`src/contexts/`)

React Context providers for global state.

```
src/contexts/
├── AuthContext.tsx          # Auth state, user, session, hasRole()
├── UserContext.tsx          # Extended user profile data
├── ProfileContext.tsx       # Multi-profile switching + active profile
├── ThemeContext.tsx         # Dark/light mode
└── OrganizationContext.tsx  # Organization-specific state
```

**Usage:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useActiveProfile } from '@/contexts/ProfileContext';
```

---

## Hooks (`src/hooks/`)

Custom React hooks for reusable logic.

```
src/hooks/
├── use-toast.ts                 # Toast notifications
├── useNotifications.ts          # Push notifications
├── usePWA.ts                    # PWA capabilities
│
├── useSlugValidation.ts         # URL slug validation
├── useProfileData.ts            # Profile fetching
├── useProfileCompletion.ts      # Profile completeness %
│
├── useXeroIntegration.ts        # Xero OAuth & sync
├── useGoogleCalendarSync.ts     # Google Calendar
├── useCalendarSync.ts           # Calendar integration
│
├── useUnifiedGigs.ts            # Combined gig data
├── useComedianStats.ts          # Comedian analytics
├── useComedianBookingsData.ts   # Booking history
│
├── useEventProfitability.ts     # Event financials
├── useFinancialMetrics.ts       # Revenue metrics
├── useCostManagement.ts         # Cost tracking
│
├── crm/                         # CRM-specific hooks
│   ├── useColumnOrdering.ts
│   └── tasks/
│       ├── queries.ts
│       └── mutations.ts
│
├── applications/                # Application hooks
│   └── useApplications.ts
│
└── organization/                # Organization hooks
    └── useOrganizationData.ts
```

---

## Services (`src/services/`)

Business logic and API integrations. **Keep UI logic in components, business logic here.**

```
src/services/
├── invoiceService.ts            # Invoice CRUD & generation
├── bulkInvoiceService.ts        # Batch invoice processing
├── comedianService.ts           # Comedian data operations
├── eventPartnerService.ts       # Event partnerships
├── ticketSyncService.ts         # Ticket platform sync
├── webhookProcessorService.ts   # Webhook handling
├── pwaService.ts                # PWA utilities
├── errorService.ts              # Error handling
│
├── comedian/                    # Comedian-specific services
│   ├── comedian-booking-service.ts
│   ├── comedian-gig-service.ts
│   ├── comedian-spot-service.ts
│   └── comedian-availability-service.ts
│
├── crm/                         # CRM services
│   ├── customer-service.ts
│   ├── contact-service.ts
│   ├── invoice-service.ts
│   ├── event-service.ts
│   ├── payment-service.ts
│   └── segment-service.ts
│
├── profile/                     # Profile services
│   └── profile-service.ts
│
├── api/                         # External API wrappers
│   ├── events.ts
│   └── comedians.ts
│
├── stripe/                      # Stripe integration
│   └── ...
│
├── bugs/                        # Bug tracking
│   └── bug-service.ts
│
├── roadmap/                     # Feature roadmap
│   └── roadmap-service.ts
│
├── settlement/                  # Financial settlement
│   └── ...
│
└── ticketReconciliation/        # Ticket reconciliation
    └── ...
```

---

## Pages (`src/pages/`)

Route components. Each file typically maps to a route.

```
src/pages/
├── Index.tsx                    # Landing page (/)
├── Auth.tsx                     # Login/signup (/auth)
├── AuthCallback.tsx             # OAuth callback
├── Dashboard.tsx                # Main dashboard (/dashboard)
│
├── Gigs.tsx                     # Browse gigs (/gigs)
├── Shows.tsx                    # Browse shows (/shows)
├── Comedians.tsx                # Browse comedians (/comedians)
├── Photographers.tsx            # Browse photographers (/photographers)
│
├── Profile.tsx                  # Profile editing
├── PublicProfile.tsx            # Public profile view
├── ComedianProfile.tsx          # Comedian profile
├── PhotographerProfile.tsx      # Photographer profile
│
├── CreateEvent.tsx              # Create event form
├── EventDetail.tsx              # Admin event detail
├── EventDetailPublic.tsx        # Public event view
├── EditEvent.tsx                # Edit event
├── EventManagement.tsx          # Manage event lineup
├── EventApplicationPage.tsx     # Apply to event
│
├── Applications.tsx             # View applications (promoter)
├── Calendar.tsx                 # Calendar view
├── Messages.tsx                 # Messaging
├── Notifications.tsx            # Notifications
├── Settings.tsx                 # User settings
├── MediaLibrary.tsx             # Media management
│
├── admin/                       # Admin pages
│   ├── TicketSalesTestPage.tsx
│   └── ...
│
├── crm/                         # CRM pages
│   ├── CustomerListPage.tsx
│   ├── CustomerDetailPage.tsx
│   ├── DealPipelinePage.tsx
│   └── TaskManagerPage.tsx
│
└── organization/                # Organization pages
    └── ...
```

---

## Integrations (`src/integrations/`)

Third-party service integrations.

```
src/integrations/
└── supabase/
    ├── client.ts                # Supabase client instance
    └── types/
        ├── index.ts             # Auto-generated types
        └── ...                  # Database table types
```

**Note:** Supabase types are auto-generated. Regenerate after schema changes.

---

## Utils (`src/utils/`)

Utility functions and helpers.

```
src/utils/
├── slugify.ts                   # URL slug generation
├── nameDisplay.ts               # Display name formatting
├── dateFormatters.ts            # Date formatting
├── cdnConfig.ts                 # CDN configuration
├── cn.ts                        # className utility (clsx)
│
├── validation/                  # Validation utilities
│   └── ...
│
├── designSystem/                # Design system utilities
│   └── ...
│
├── seo/                         # SEO utilities
│   └── ...
│
└── crm/                         # CRM utilities
    └── ...
```

---

## Test Directory (`tests/`)

```
tests/
├── setup-react.ts               # Jest setup
├── components/                  # Component tests
│   └── ProfileSwitcher.test.tsx
├── contexts/                    # Context tests
│   └── ActiveProfileContext.test.tsx
├── e2e/                         # Playwright E2E tests
│   ├── global-setup.ts
│   └── ...
└── helpers/                     # Test utilities
```

---

## Documentation Directories

```
/root/agents/
├── Architecture/                # Architecture docs (this folder)
├── Features/                    # Feature documentation (13 files)
│   ├── 01-auth-and-profiles.md
│   ├── 02-events-and-gigs.md
│   └── ...
├── Plans/                       # Implementation plans
│   └── *.md
└── docs/
    ├── features/                # Detailed feature specs
    │   ├── PROFILE_URLS.md
    │   └── PERMISSIONS_SYSTEM.md
    ├── integrations/            # Integration guides
    │   └── ...
    └── archive/                 # Historical docs
```

---

## Quick Lookup: "Looking for X? Check here"

| Looking for... | Check |
|----------------|-------|
| UI primitives | `src/components/ui/` |
| Page component | `src/pages/{Name}.tsx` |
| Reusable logic | `src/hooks/` |
| API calls | `src/services/` |
| Global state | `src/contexts/` |
| Type definitions | `src/types/` or `src/integrations/supabase/types/` |
| Form components | `src/components/forms/` |
| Layout | `src/components/layout/` |
| Profile UI | `src/components/comedian-profile/` or similar |
| Event UI | `src/components/events/` or `src/components/event-management/` |
| CRM | `src/pages/crm/`, `src/components/crm/`, `src/services/crm/` |
| Tests | `tests/` |
| E2E tests | `tests/e2e/` |
| Feature docs | `Features/` |
| Implementation plans | `Plans/` |
