# Quick Start Guide for AI Agents

**READ THIS FIRST** - This document provides rapid orientation for AI coding assistants working on Stand Up Sydney.

---

## Platform Summary

Stand Up Sydney is a **React + Supabase** comedy industry platform connecting comedians, photographers, videographers, organizations, and venues. Core features include event management, booking workflows, profile management (EPK - Electronic Press Kit), invoicing, and ticketing integration.

---

## Essential Paths

| What You Need | Where to Find It |
|---------------|------------------|
| **Main app entry** | `src/App.tsx` |
| **Authentication** | `src/contexts/AuthContext.tsx` |
| **Profile system** | `src/contexts/ProfileContext.tsx` |
| **Database types** | `src/integrations/supabase/types/` |
| **UI components** | `src/components/ui/` (shadcn/ui) |
| **Page routes** | `src/App.tsx` (Routes section) |

---

## Where to Find Code by Task

### User Authentication & Profiles
| Task | Location |
|------|----------|
| Login/logout | `src/contexts/AuthContext.tsx` |
| User profile data | `src/contexts/UserContext.tsx` |
| Profile switching | `src/contexts/ProfileContext.tsx` |
| Profile URL routing | `src/pages/PublicProfile.tsx` |
| Comedian profiles | `src/components/comedian-profile/` |
| Photographer profiles | `src/components/photographer-profile/` |

### Events & Booking
| Task | Location |
|------|----------|
| Event creation | `src/pages/CreateEvent.tsx` |
| Event detail | `src/pages/EventDetail.tsx`, `EventDetailPublic.tsx` |
| Event management | `src/pages/EventManagement.tsx` |
| Event spots/slots | `src/components/event-management/` |
| Applications | `src/pages/Applications.tsx`, `EventApplicationPage.tsx` |
| Booking requests | `src/services/comedian/comedian-booking-service.ts` |

### Invoicing & Payments
| Task | Location |
|------|----------|
| Invoice form | `src/components/InvoiceForm.tsx` |
| Invoice service | `src/services/invoiceService.ts` |
| Stripe payments | `src/services/stripe/` |
| Xero integration | `src/hooks/useXeroIntegration.ts` |

### Ticketing Integration
| Task | Location |
|------|----------|
| Humanitix sync | `src/services/humanitix/` |
| Eventbrite sync | Webhook handlers in `scripts/` |
| Ticket reconciliation | `src/services/ticketReconciliation/` |

### CRM
| Task | Location |
|------|----------|
| CRM components | `src/components/crm/` |
| CRM pages | `src/pages/crm/` |
| CRM services | `src/services/crm/` |
| CRM hooks | `src/hooks/crm/` |

---

## Key Concepts

### Profile Types
Users can have multiple roles:
- `comedian` / `comedian_lite` - Performers
- `manager` - Artist managers
- `photographer` / `videographer` - Visual artists
- `organization` - Event organizers (former "promoter")
- `venue` - Venue managers
- `admin` - Platform administrators

### URL Routing Pattern
Profile pages use: `/:profileType/:slug/:page`
- Example: `/comedian/chillz-skinner/dashboard`
- Example: `/org/sydney-comedy/events`

### Database Tables (Key Ones)
- `profiles` - User base data
- `comedians` / `managers` / `photographers` / `videographers` - Profile-specific data
- `events` - Event listings
- `applications` - Comedian applications to events
- `event_spots` - Performance slots in events
- `invoices` / `invoice_items` - Billing
- `organization_profiles` - Organization data

---

## Common Patterns

### Data Fetching
```typescript
// Use TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
});
```

### Form Handling
```typescript
// Use React Hook Form + Zod
const form = useForm<FormSchema>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});
```

### Protected Routes
```tsx
<ProtectedRoute roles={['comedian', 'admin']}>
  <MyPage />
</ProtectedRoute>
```

---

## Quick Checks Before Committing

1. **TypeScript**: `npm run build` (strict mode enabled)
2. **Lint**: `npm run lint`
3. **Tests**: `npm run test`
4. **E2E** (UI changes): `npm run test:e2e`

---

## Related Documentation

- **[01-SYSTEM-MAP.md](./01-SYSTEM-MAP.md)** - Architecture diagrams
- **[02-DIRECTORY-GUIDE.md](./02-DIRECTORY-GUIDE.md)** - Detailed folder structure
- **[03-FEATURE-CONNECTIONS.md](./03-FEATURE-CONNECTIONS.md)** - How features interact
- **[04-DATABASE-OVERVIEW.md](./04-DATABASE-OVERVIEW.md)** - Schema and relationships
- **[05-COMMON-PATTERNS.md](./05-COMMON-PATTERNS.md)** - Code patterns with examples
- **[CLAUDE.md](../CLAUDE.md)** - Full developer guide
- **[Features/](../Features/)** - Feature-specific documentation
