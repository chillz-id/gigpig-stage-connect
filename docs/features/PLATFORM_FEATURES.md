# Stand Up Sydney - Platform Features Documentation

**Last Updated:** 2025-11-24
**Purpose:** Comprehensive inventory of all implemented features in the Stand Up Sydney comedy platform

---

## Table of Contents

1. [Fully Implemented Features](#fully-implemented-features)
2. [Partially Implemented Features](#partially-implemented-features)
3. [Feature Toggles (Config Only)](#feature-toggles-config-only)
4. [Database Schema Reference](#database-schema-reference)
5. [Implementation Phases](#implementation-phases)

---

## Fully Implemented Features

These features are production-ready with complete UI and backend implementation.

### Event Management

**Status:** ✅ Fully Implemented
**Description:** Complete event lifecycle from creation to publishing

**Capabilities:**
- Create and edit comedy events with full details (title, description, venue, date/time, pricing)
- Event lineup management with time slots and comedian assignments
- Draft → Published workflow with validation
- Event applications - comedians can apply to perform
- Event spots - manage lineup positions and timing
- Event deals - contract system between promoters and comedians
- Event visibility controls (public/private)
- GST-inclusive pricing support

**Database Tables:**
- `events` - Core event data
- `event_deals` - Contracts and agreements
- `deal_participants` - Parties involved in deals
- `comedian_bookings` - Confirmed performer bookings
- `event_spots` - Lineup time slots
- `event_applications` - Comedian applications to perform

**Key Files:**
- `src/pages/CreateEvent.tsx` - Event creation
- `src/pages/EditEvent.tsx` - Event editing
- `src/pages/EventDetail.tsx` - Event details view
- `src/pages/Applications.tsx` - Application management

---

### Booking System

**Status:** ✅ Fully Implemented
**Description:** Two-way booking communication between promoters and comedians

**Capabilities:**
- Booking requests - promoters request comedians for specific events
- Booking inquiries - exploratory booking conversations
- Accept/decline workflow with notifications
- Booking confirmation tracking
- Booking history and status management
- Integration with event deals system

**Database Tables:**
- `booking_requests` - Formal booking requests
- `booking_inquiries` - Exploratory inquiries
- `comedian_bookings` - Confirmed bookings
- `event_deals` - Related contracts

**Key Files:**
- `src/components/BookingRequestForm.tsx` - Request creation
- `src/hooks/useBookings.ts` - Booking data management

---

### Ticketing Integration

**Status:** ✅ Fully Implemented
**Description:** Real-time ticket sales tracking from multiple platforms

**Capabilities:**
- **Humanitix Integration:**
  - Webhook sync for order events (created, updated, cancelled)
  - Real-time ticket sales tracking
  - Customer data capture
  - Automatic event linking
- **Eventbrite Integration:**
  - OAuth authentication
  - Event import from Eventbrite
  - Webhook sync for orders
  - Attendee data sync
- Revenue analytics and reporting
- Multi-platform ticket sales aggregation

**Database Tables:**
- `ticket_sales` - All ticket transactions
- `ticket_platforms` - Platform configurations
- `humanitix_orders` - Humanitix-specific data
- `eventbrite_orders` - Eventbrite-specific data

**Key Files:**
- `src/services/humanitixService.ts` - Humanitix integration
- `src/services/eventbriteService.ts` - Eventbrite integration
- `scripts/test-webhook-humanitix.sh` - Webhook testing
- `scripts/test-webhook-eventbrite.sh` - Webhook testing

---

### Invoicing & Payments

**Status:** ✅ Fully Implemented
**Description:** Invoice generation and payment processing

**Capabilities:**
- **Invoice Generation:**
  - Create invoices with multiple line items
  - GST calculation and tracking
  - Due date management
  - PDF generation
  - Invoice tracking (draft, sent, paid, overdue)
- **Xero Integration:**
  - OAuth authentication
  - Automatic invoice creation in Xero
  - Contact sync
  - Payment status sync
- **Stripe Integration:**
  - Payment processing
  - Invoice payment links
  - Payment confirmation

**Database Tables:**
- `invoices` - Invoice headers
- `invoice_items` - Line items
- `xero_tokens` - Xero OAuth tokens
- `stripe_payments` - Payment records

**Key Files:**
- `src/components/InvoiceForm.tsx` - Invoice creation
- `src/services/invoiceService.ts` - Invoice logic
- `src/integrations/xero/` - Xero integration

---

### Media Library

**Status:** ✅ Fully Implemented
**Description:** File storage and organization system

**Capabilities:**
- Upload images, videos, documents
- Organize files in folders
- Browse media gallery
- File metadata (name, size, type, upload date)
- Delete and manage files
- CDN-optimized delivery

**Database Tables:**
- `media_folders` - Folder organization
- `media_files` - File metadata and storage

**Key Files:**
- `src/pages/organization/OrganizationMediaLibrary.tsx` - Media UI
- `src/components/MediaGallery.tsx` - Gallery view

---

### Calendar System

**Status:** ✅ Fully Implemented
**Description:** Comprehensive schedule and availability management

**Capabilities:**
- **Calendar Events:**
  - Create personal calendar entries
  - Mark blocked/unavailable dates
  - Track external gigs (non-platform shows)
  - Multiple view modes (monthly, weekly, list)
- **Google Calendar Sync:**
  - Two-way sync with Google Calendar
  - OAuth authentication
  - Import events from Google
  - Export events to Google
- **Availability Management:**
  - Block specific dates/times
  - Track confirmed bookings
  - Show personal gigs
- **Export:**
  - .ics file generation for Apple Calendar

**Database Tables:**
- `calendar_events` - Personal events
- `calendar_integrations` - Google sync config
- `blocked_dates` - Unavailable periods
- `personal_gigs` - External shows

**Key Files:**
- `src/components/ProfileCalendarView.tsx` - Main calendar UI
- `src/hooks/useGoogleCalendarSync.ts` - Google integration
- `src/hooks/usePersonalGigs.ts` - Gig management
- `src/hooks/useBlockedDates.ts` - Availability management

---

### Notifications

**Status:** ✅ Fully Implemented
**Description:** Multi-channel notification system

**Capabilities:**
- **In-App Notifications:**
  - Real-time notification feed
  - Read/unread status
  - Notification categories
  - Action links (view event, respond to booking)
- **Email Notifications:**
  - Automated event emails
  - Booking request emails
  - Application status updates
- **Push Notifications:**
  - PWA push notification support
  - Browser permission management
- **Preferences:**
  - User-configurable notification settings
  - Per-category enable/disable
  - Email vs push preferences

**Database Tables:**
- `notifications` - All notifications
- `notification_preferences` - User settings

**Key Files:**
- `src/components/Notifications.tsx` - Notification UI
- `src/hooks/useNotifications.ts` - Notification management

---

### Analytics & Reporting

**Status:** ✅ Fully Implemented (Dashboard) / 🟡 Partial (Dedicated UI)
**Description:** Performance metrics and business intelligence

**Capabilities:**
- **Event Analytics:**
  - Event views and engagement
  - Application counts
  - Ticket sales tracking
  - Revenue per event
- **Ticket Sales Dashboard:**
  - Admin-level sales metrics
  - Platform-wide revenue
  - Sales by event/venue
  - Time-based analysis
- **Organization Analytics:**
  - Basic org-level stats (hooks exist)
  - Performance tracking
- **Comedian Performance:**
  - Show count tracking
  - Booking history

**Database Tables:**
- `ticket_sales` - Sales data
- `events` - Event metrics
- `comedian_bookings` - Performance history
- `agency_analytics` - Agency metrics

**Key Files:**
- `src/pages/admin/TicketSalesDashboard.tsx` - Admin analytics
- `src/hooks/useOrganizationAnalytics.ts` - Org analytics hook
- `src/pages/organization/OrganizationAnalytics.tsx` - Org analytics page

---

### User & Profile Management

**Status:** ✅ Fully Implemented
**Description:** Multi-role user system with public profiles

**Capabilities:**
- **Multi-Role System:**
  - Comedian / Comedian Lite
  - Promoter
  - Photographer
  - Agency Manager
  - Venue Manager
  - Admin
  - Users can have multiple roles simultaneously
- **Profile URLs:**
  - SEO-friendly slugs (`/comedian/john-doe`, `/organization/sydney-comedy`)
  - Auto-generated from names
  - Unique per profile type
  - 301 redirects when slugs change via `slug_history` table
- **Public Profiles:**
  - Comedian profiles with bio, photos, highlights
  - Manager profiles
  - Organization profiles (multi-type support)
  - Venue profiles
- **Vouch System:**
  - Endorsements between users
  - Vouch history (given/received)
  - Crown icon display for vouched users

**Database Tables:**
- `profiles` - User accounts
- `comedians` - Comedian profiles
- `manager_profiles` - Manager profiles
- `organization_profiles` - Organization profiles
- `venues` - Venue profiles
- `vouches` - Endorsements
- `slug_history` - URL redirect tracking
- `requested_profiles` - 404 tracking for recruitment

**Key Files:**
- `src/pages/PublicProfile.tsx` - Profile routing
- `src/contexts/ActiveProfileContext.tsx` - Profile state
- `src/components/VouchHistory.tsx` - Vouch display
- `docs/features/PROFILE_URLS.md` - Profile URL documentation

---

### Organization Features

**Status:** ✅ Fully Implemented
**Description:** Multi-type organization profiles with teams and highlights

**Capabilities:**
- **Multi-Type Organizations:**
  - Event Promoter
  - Artist Agency
  - Venue
  - Multiple types per organization (e.g., Agency + Promoter)
- **Venue Subtypes (NEW):**
  - Comedy Club, Pub, Theatre, Bar, Hotel, Cafe, Restaurant
  - Function Centre, Arts Centre, Other
  - Multiple subtypes per venue
- **Organization Teams:**
  - Team member management
  - Roles: Owner, Admin, Member
  - Permission-based access control
- **Company Highlights:**
  - Achievements and milestones
  - Categories: Event, Partnership, Award, Milestone
  - Date tracking
  - Public display
- **Financial Details:**
  - ABN (11 digits, required for Australian businesses)
  - ACN (9 digits, optional)
  - Banking information (BSB, account number)
  - GST registration status
  - Payment terms
- **Feature Toggles:**
  - Enable/disable 11 organizational features
  - Customizable per organization
  - Settings UI for admin/owner control

**Database Tables:**
- `organization_profiles` - Organization data
- `organization_team_members` - Team members
- `organization_highlights` - Achievements
- `organization_type` (array) - Multi-type support
- `venue_subtypes` (array) - Venue categorization
- `enabled_features` (JSONB) - Feature toggles

**Key Files:**
- `src/components/organization/OrganizationProfileTabs.tsx` - Main profile UI
- `src/components/organization/BusinessInformation.tsx` - Org info + multi-type
- `src/components/organization/FinancialDetails.tsx` - ABN/ACN/banking
- `src/components/organization/CompanyHighlightsManager.tsx` - Highlights CRUD
- `src/components/organization/OrganizationSettings.tsx` - Feature toggles
- `src/config/organizationTypes.ts` - Type/feature configuration

---

### Social & Communication

**Status:** ✅ Social Links / 🟡 Messaging
**Description:** Social media profiles and communication

**Capabilities:**
- **Social Links:**
  - Instagram, Facebook, Twitter/X, TikTok
  - URL validation
  - Display on public profiles
- **Contact Information:**
  - Email, phone, website
  - Physical address (address, suburb, state, postcode)
  - Public/private visibility controls
- **Messaging:**
  - Internal messaging system (basic implementation)

**Database Tables:**
- `promoter_social_links` - Social media URLs
- `organization_profiles` - Contact info
- `messages` - Internal messaging (exists but may be minimal)

**Key Files:**
- `src/components/organization/BusinessInformation.tsx` - Social links UI
- `src/pages/Messages.tsx` - Messaging interface

---

### Admin Features

**Status:** ✅ Fully Implemented
**Description:** Platform administration and management

**Capabilities:**
- **Admin Dashboard:**
  - Platform-wide metrics
  - User management
  - Event oversight
  - System health monitoring
- **CRM System:**
  - Customer relationship management
  - Lead tracking
  - Communication history
  - **Customer Import/Export:**
    - CSV import with column auto-detection
    - Multi-step import wizard (upload → map → validate → import)
    - Email-based customer matching (upsert logic)
    - Batch processing with progress tracking
    - Export all customers to CSV
- **Design System:**
  - Global theming
  - Color customization
  - Component library management
- **Meta Pixel Integration:**
  - Facebook pixel tracking
  - Event tracking
  - Conversion optimization
- **Sitemap Tools:**
  - Automatic sitemap generation
  - Search engine submission
  - SEO optimization

**Database Tables:**
- `admin_settings` - System configuration
- `customer_profiles` - CRM customer data
- `customer_emails` - Customer email addresses (multi-email support)
- `customer_phones` - Customer phone numbers (E.164 format)
- `customer_engagement_metrics` - Customer analytics
- `customers_crm_v` - Consolidated CRM view
- `design_system_presets` - Theme presets

**Key Files:**
- `src/pages/AdminDashboard.tsx` - Admin dashboard
- `src/components/admin/` - Admin components
- `src/pages/crm/ImportExportPage.tsx` - CRM import/export
- `src/services/crm/import-service.ts` - CSV import logic
- `scripts/sitemap-generate.js` - Sitemap generation

---

### PWA Features

**Status:** ✅ Fully Implemented
**Description:** Progressive Web App capabilities

**Capabilities:**
- **Installable App:**
  - Add to home screen
  - Standalone app experience
  - App icon and splash screen
- **Offline Mode:**
  - Service worker caching
  - Offline indicator
  - Background sync
- **PWA Settings:**
  - Configure notification permissions
  - Manage installation status
  - Share functionality

**Database Tables:**
- `pwa_subscriptions` - Push notification subscriptions

**Key Files:**
- `src/components/pwa/PWAInstaller.tsx` - Installation UI
- `src/components/pwa/OfflineIndicator.tsx` - Connection status
- `src/pages/PWASettings.tsx` - PWA configuration
- `public/service-worker.js` - Service worker

---

## Partially Implemented Features

These features have database structure or hooks but lack complete UI implementation.

### Roster Management (Agency Feature)

**Status:** 🟡 Partially Implemented
**What Exists:**
- `agency_analytics` table references artists
- Data structure for tracking agency rosters
- Hooks reference roster data

**What's Missing:**
- Dedicated roster management UI
- Add/remove artists interface
- Artist performance tracking view
- Commission management interface

**Priority:** Medium - Core agency feature

---

### Social Media Integration

**Status:** 🟡 Partially Implemented
**What Exists:**
- Social media URLs stored in database
- Links displayed on profiles

**What's Missing:**
- Actual integration with social platforms
- Post scheduling
- Analytics from social accounts
- Cross-posting functionality

**Priority:** Low - Links are sufficient for MVP

---

### Team Management

**Status:** 🟡 Partially Implemented
**What Exists:**
- `organization_team_members` table tracks members
- Role-based permissions (owner, admin, member)
- Basic team context

**What's Missing:**
- Advanced team management UI
- Invite team members workflow
- Permission configuration interface
- Activity logging for team actions

**Priority:** Medium - Important for multi-user organizations

---

## Feature Toggles (Config Only)

These 11 "organization features" exist as toggles in settings but **do not currently control** what UI is displayed. All features are shown regardless of toggle state.

### Current Feature Toggles

1. **events** - Event Management
2. **roster** - Artist Roster
3. **bookings** - Bookings
4. **deals** - Deals & Contracts
5. **analytics** - Analytics
6. **media** - Media Library
7. **invoices** - Invoicing
8. **ticketing** - Ticket Sales
9. **calendar** - Calendar
10. **social** - Social Media
11. **notifications** - Notifications

### Implementation Status

**What Works:**
- ✅ Toggles can be enabled/disabled in OrganizationSettings
- ✅ Settings saved to `enabled_features` JSONB column
- ✅ Default features assigned based on organization type

**What Doesn't Work:**
- ❌ UI components don't check `enabled_features` before rendering
- ❌ Navigation doesn't hide disabled features
- ❌ Dashboard doesn't conditionally show sections
- ❌ OrganizationProfileTabs shows all tabs regardless of settings

### Enforcement Needed (Phase 2)

To make feature toggles functional:
1. Create `useOrganizationFeature(featureName)` hook to check if feature enabled
2. Wrap feature-specific UI in conditional rendering
3. Update OrganizationProfileTabs to hide disabled tabs
4. Update OrganizationDashboard to hide disabled sections
5. Update navigation to hide disabled quick actions

---

## Database Schema Reference

### Event & Booking Tables
- `events` - Event master records
- `event_deals` - Contracts between parties
- `deal_participants` - GST-inclusive deal tracking
- `comedian_bookings` - Confirmed bookings
- `booking_requests` - Formal booking requests
- `booking_inquiries` - Exploratory inquiries
- `event_spots` - Lineup time slots
- `event_applications` - Performer applications

### Ticketing Tables
- `ticket_sales` - All ticket transactions
- `ticket_platforms` - Platform configurations
- `humanitix_orders` - Humanitix-specific data
- `eventbrite_orders` - Eventbrite-specific data

### Financial Tables
- `invoices` - Invoice headers
- `invoice_items` - Invoice line items
- `xero_tokens` - Xero integration tokens
- `stripe_payments` - Payment records

### Media Tables
- `media_folders` - Folder organization
- `media_files` - File metadata

### Calendar Tables
- `calendar_events` - Personal events
- `calendar_integrations` - Google Calendar sync
- `blocked_dates` - Unavailable periods
- `personal_gigs` - External shows

### User & Profile Tables
- `profiles` - Core user accounts
- `comedians` - Comedian profiles
- `manager_profiles` - Manager profiles
- `organization_profiles` - Organization profiles
- `venues` - Venue profiles
- `vouches` - User endorsements
- `slug_history` - URL redirects
- `requested_profiles` - 404 tracking

### Organization Tables
- `organization_profiles` - Organization data
- `organization_team_members` - Team members
- `organization_highlights` - Achievements
- `organization_type` (column) - Multi-type array
- `venue_subtypes` (column) - Venue type array
- `enabled_features` (column) - Feature toggle JSONB

### Notification Tables
- `notifications` - All notifications
- `notification_preferences` - User settings

### Analytics Tables
- `agency_analytics` - Agency metrics
- `ticket_sales` - Sales analytics source

### CRM Tables
- `customer_profiles` - Core customer data (name, DOB, marketing prefs)
- `customer_emails` - Multi-email per customer with source tracking
- `customer_phones` - Phone numbers in E.164 format
- `customer_engagement_metrics` - Analytics per customer
- `customers_crm_v` - Consolidated view joining all customer tables

---

## Implementation Phases

### Phase 1: Fix Distribution (Completed)
✅ Create organization profile redesign
✅ Add venue subtypes
✅ Update default features in config
✅ Create comprehensive feature documentation (this file)

### Phase 2: Enforce Features (Next Priority)
- [ ] Create `useOrganizationFeature(featureName)` hook
- [ ] Update OrganizationProfileTabs to hide disabled tabs
- [ ] Update OrganizationDashboard to conditionally render sections
- [ ] Update navigation to hide disabled quick actions
- [ ] Add feature checks to all organization-specific UI
- [ ] Create migration to update existing orgs with logical defaults

### Phase 3: Build Missing UI (Medium-term)
- [ ] Build roster management UI for agencies
- [ ] Create dedicated analytics insights page
- [ ] Enhance team management with invite workflow
- [ ] Add social media integration (posting/scheduling)
- [ ] Build advanced permission management UI

### Phase 4: Analytics & Optimization (Long-term)
- [ ] Track feature usage per organization
- [ ] Analytics on which features drive engagement
- [ ] Optimize feature recommendations
- [ ] A/B test feature defaults for new organizations

---

## Recommendations

### Organization Type Default Features

Based on feature implementation status and industry needs:

**Event Promoter** (Running comedy shows):
- ✅ events, ticketing, bookings, media, invoices, calendar, analytics, notifications

**Artist Agency** (Managing comedian careers):
- ✅ roster, bookings, deals, invoices, analytics, calendar, media, notifications

**Venue** (Physical locations):
- ✅ events, bookings, calendar, media, invoices, analytics, notifications

### Feature Usage Strategy

1. **Universal Features** (all org types should have):
   - notifications
   - calendar
   - analytics

2. **Type-Specific Core Features**:
   - Event Promoters: events, ticketing, bookings
   - Artist Agencies: roster, bookings, deals
   - Venues: events, bookings

3. **Optional Features** (enable based on needs):
   - media (most should have)
   - invoices (most should have)
   - social (nice-to-have)

---

**Document Maintenance:**
- Update when new features are implemented
- Mark features as deprecated if removed
- Add implementation notes for complex features
- Keep database schema reference current
