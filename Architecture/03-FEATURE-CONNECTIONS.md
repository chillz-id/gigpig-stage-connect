# Feature Connections

How features interact with each other, data flows between systems, and key integration points.

---

## Feature Dependency Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FEATURE MAP                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐                                                     │
│   │     Auth     │                                                     │
│   │  (Required)  │                                                     │
│   └──────┬───────┘                                                     │
│          │                                                             │
│   ┌──────┴───────┐                                                     │
│   │   Profiles   │ ◄────────────────────────────────────┐             │
│   │   (Base)     │                                      │             │
│   └──────┬───────┘                                      │             │
│          │                                              │             │
│   ┌──────┴────────────────────────────────────────────┐│             │
│   │                                                   ││             │
│   ▼                    ▼                ▼             ▼│             │
│ ┌─────────┐     ┌───────────┐    ┌──────────┐   ┌─────────┐         │
│ │ Events  │────►│ Bookings  │───►│ Invoices │──►│ Payments│         │
│ │         │     │           │    │          │   │         │         │
│ └────┬────┘     └─────┬─────┘    └────┬─────┘   └────┬────┘         │
│      │                │               │              │               │
│      ▼                ▼               ▼              ▼               │
│ ┌─────────┐     ┌───────────┐    ┌──────────┐   ┌─────────┐         │
│ │Ticketing│     │ Calendar  │    │   Xero   │   │ Stripe  │         │
│ │(HTX/EB) │     │  (Google) │    │  Sync    │   │ Connect │         │
│ └─────────┘     └───────────┘    └──────────┘   └─────────┘         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Data Flows

### 1. Authentication → Profile → Dashboard Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Auth as AuthContext
    participant User as UserContext
    participant Profile as ProfileContext
    participant DB as Supabase

    U->>Auth: Login
    Auth->>DB: supabase.auth.signIn()
    DB-->>Auth: Session + User
    Auth->>Auth: Set user, session

    Auth->>User: Trigger profile fetch
    User->>DB: Query profiles table
    DB-->>User: Profile data

    User->>Profile: Trigger available profiles
    Profile->>DB: Query user_roles + comedian + manager + orgs
    DB-->>Profile: Available profiles
    Profile->>Profile: Set availableProfiles
    Profile->>Profile: Restore activeProfile from localStorage

    Profile-->>U: Redirect to dashboard
```

**Key Files:**
- `src/contexts/AuthContext.tsx` - Auth state
- `src/contexts/UserContext.tsx` - Profile data
- `src/contexts/ProfileContext.tsx` - Profile switching
- `src/pages/Dashboard.tsx` - Dashboard view

---

### 2. Event Creation → Ticketing → Sync Flow

```mermaid
flowchart LR
    subgraph Create["Event Creation"]
        CE[CreateEvent.tsx]
        EF[EventForm]
    end

    subgraph DB["Database"]
        Events[(events)]
        Sessions[(sessions)]
        Orders[(orders)]
    end

    subgraph External["External Platforms"]
        HTX[Humanitix]
        EB[Eventbrite]
    end

    subgraph Sync["Webhook Sync"]
        WH[Edge Functions]
        Processor[webhookProcessor]
    end

    CE --> EF
    EF --> Events
    Events --> |Optional| HTX
    Events --> |Optional| EB

    HTX --> |Webhook| WH
    EB --> |Webhook| WH
    WH --> Processor
    Processor --> Sessions
    Processor --> Orders
```

**Key Files:**
- `src/pages/CreateEvent.tsx` - Event creation
- `src/services/humanitix/` - Humanitix integration
- `src/services/webhookProcessorService.ts` - Webhook handling
- Supabase Edge Functions - Webhook endpoints

---

### 3. Comedian Application → Spot Assignment Flow

```mermaid
sequenceDiagram
    participant C as Comedian
    participant App as EventApplicationPage
    participant DB as Database
    participant P as Promoter/Org
    participant Mgmt as EventManagement

    C->>App: Submit application
    App->>DB: Insert applications record
    DB-->>App: Application created

    Note over DB: status='pending'

    P->>Mgmt: View applications
    Mgmt->>DB: Query applications WHERE event_id
    DB-->>Mgmt: Applications list

    P->>Mgmt: Accept application
    Mgmt->>DB: Update application status='accepted'
    Mgmt->>DB: Insert/Update event_spots
    DB-->>Mgmt: Spot assigned

    Note over DB: Notification sent to comedian
```

**Key Files:**
- `src/pages/EventApplicationPage.tsx` - Application form
- `src/pages/EventManagement.tsx` - Manage lineup
- `src/components/event-management/` - Management UI
- `src/services/comedian/comedian-spot-service.ts` - Spot operations

---

### 4. Invoice → Stripe → Xero Sync Flow

```mermaid
flowchart TB
    subgraph Create["Invoice Creation"]
        IF[InvoiceForm.tsx]
        IS[invoiceService.ts]
    end

    subgraph DB["Database"]
        Invoices[(invoices)]
        Items[(invoice_items)]
    end

    subgraph Stripe["Stripe"]
        SC[Stripe Connect]
        PI[Payment Intent]
    end

    subgraph Xero["Xero"]
        XI[Xero Integration]
        XInv[Xero Invoice]
    end

    IF --> IS
    IS --> Invoices
    IS --> Items

    IS --> |Create Payment Link| SC
    SC --> PI
    PI --> |Webhook| IS
    IS --> |Update Status| Invoices

    IS --> |Optional Sync| XI
    XI --> XInv
    XInv --> |Sync Status| Invoices
```

**Key Files:**
- `src/components/InvoiceForm.tsx` - Invoice UI
- `src/services/invoiceService.ts` - Invoice logic
- `src/hooks/useXeroIntegration.ts` - Xero OAuth
- `src/pages/InvoicePaymentSuccess.tsx` - Payment callback

---

### 5. Profile Switching → URL Routing Flow

```mermaid
flowchart LR
    subgraph Switcher["ProfileSwitcher"]
        PS[ProfileSwitcher.tsx]
        PC[ProfileContext]
    end

    subgraph State["State Updates"]
        LS[localStorage]
        AP[activeProfile]
    end

    subgraph Routing["URL Routing"]
        RR[React Router]
        PP[PublicProfile.tsx]
    end

    subgraph Display["Profile Display"]
        CPL[ComedianProfileLayout]
        MPL[ManagerProfile]
        OPL[OrgProfile]
    end

    PS --> |setActiveProfile| PC
    PC --> LS
    PC --> AP

    PS --> |navigate| RR
    RR --> PP

    PP --> |type=comedian| CPL
    PP --> |type=manager| MPL
    PP --> |type=organization| OPL
```

**Key Files:**
- `src/components/layout/ProfileSwitcher.tsx` - Switching UI
- `src/contexts/ProfileContext.tsx` - Profile state
- `src/pages/PublicProfile.tsx` - Profile routing
- `src/components/comedian-profile/ComedianProfileLayout.tsx` - Layout

---

## Feature Integration Points

### Shared Contexts

| Context | Used By | Purpose |
|---------|---------|---------|
| `AuthContext` | All protected features | User auth state |
| `ProfileContext` | Dashboard, Profile pages, Sidebar | Active profile |
| `UserContext` | Profile display, Settings | Extended user data |
| `ThemeContext` | All components | Dark/light mode |

### Shared Hooks

| Hook | Used By | Purpose |
|------|---------|---------|
| `useSlugValidation` | Profile forms, URL handling | Validate slugs |
| `useProfileData` | Profile pages | Fetch profile |
| `useNotifications` | Notification bell, Push | Manage notifications |
| `useXeroIntegration` | Invoices, Settings | Xero sync |

### Shared Services

| Service | Called By | Operations |
|---------|-----------|------------|
| `invoiceService` | InvoiceForm, Dashboard | Invoice CRUD |
| `comedianService` | ComedianProfile, Browse | Comedian queries |
| `ticketSyncService` | Event pages, Webhooks | Ticket sync |

---

## Feature Dependencies Matrix

| Feature | Depends On | Provides To |
|---------|-----------|-------------|
| **Auth** | - | All features |
| **Profiles** | Auth | Events, Bookings, CRM |
| **Events** | Auth, Profiles | Bookings, Ticketing |
| **Bookings** | Events, Profiles | Invoices, Calendar |
| **Invoices** | Bookings, Profiles | Payments, Xero |
| **Payments** | Invoices | Reporting |
| **Ticketing** | Events | Orders, Revenue |
| **CRM** | Profiles, Events | Reporting |
| **Calendar** | Bookings, Events | - |

---

## Cross-Feature Data Queries

### Events with Full Context
```typescript
// Get event with bookings, spots, and applications
const eventWithContext = await supabase
  .from('events')
  .select(`
    *,
    event_spots(*),
    applications(*),
    comedian_bookings(*, profiles(*))
  `)
  .eq('id', eventId)
  .single();
```

### Profile with All Roles
```typescript
// Get user with all profile types
const profileWithRoles = await supabase
  .from('profiles')
  .select(`
    *,
    user_roles(*),
    comedians(*),
    managers(*),
    photographers(*),
    videographers(*)
  `)
  .eq('id', userId)
  .single();
```

### Invoice with Full Details
```typescript
// Get invoice with items and recipients
const invoiceDetails = await supabase
  .from('invoices')
  .select(`
    *,
    invoice_items(*),
    invoice_recipients(*),
    invoice_payments(*)
  `)
  .eq('id', invoiceId)
  .single();
```

---

## Integration Event Chains

### When Event is Created
1. `events` table insert
2. Default `event_spots` created
3. Optional Humanitix event link
4. Optional Eventbrite event link
5. Calendar sync trigger

### When Application is Accepted
1. `applications` status updated
2. `event_spots` comedian_id set
3. Notification created
4. Calendar event added
5. Optional invoice generated

### When Payment Received
1. Stripe webhook received
2. `invoice_payments` record created
3. `invoices` status updated
4. Optional Xero sync
5. Email notification sent

---

## Related Documentation

- **[01-SYSTEM-MAP.md](./01-SYSTEM-MAP.md)** - Architecture overview
- **[04-DATABASE-OVERVIEW.md](./04-DATABASE-OVERVIEW.md)** - Schema details
- **[Features/](../Features/)** - Individual feature docs
