# Stand Up Sydney - Implementation Plan

**Last Updated**: 2025-10-22
**Status**: Active Planning Phase

---

## Overview

This document tracks ongoing feature development, bug fixes, and system improvements for the Stand Up Sydney platform. Tasks are organized by priority and complexity.

---

## Current Issues & Features

### -2. **Organization Team Permissions System** ✅ COMPLETE (Phase 1-7)
**Goal**: Implement flexible, role-based permissions for organization team members with specialized manager roles and granular access control.

**Requirements**:
- **Hybrid Role Model**: Generic managers + Specialized manager roles (Social Media, Tour, Booking, etc.)
- **Template + Override**: Pre-defined permission templates with Owner/Admin customization
- **Granular Permissions**: Financial, Team, Events, Media, Social, Tasks, Messages, Bookings, Analytics
- **Configurable View**: Users can choose to see org data in personal profile or keep separate

**Current State** (Updated 2025-10-20):
- ✅ **Phase 1 COMPLETE**: Database Schema & Permissions Model
  - Migration file: `supabase/migrations/20251020_add_organization_permissions.sql`
  - Added `manager_type` and `custom_permissions` columns
  - Created `get_default_permissions()` and `get_effective_permissions()` functions
  - Added RLS policies for permission management

- ✅ **Phase 2 COMPLETE**: TypeScript Types & Interfaces
  - File: `src/types/permissions.ts` (421 lines)
  - Defined all permission types, scopes, and manager types
  - Created permission templates and helper functions
  - Full type safety for permission system

- ✅ **Phase 3 COMPLETE**: Permission Checking Hooks
  - File: `src/hooks/organization/useOrganizationPermissions.ts` (191 lines)
  - Hook: `useOrganizationPermissions()` with permission checking functions
  - Variants: `useRequireOrganizationMembership()`, `useRequirePermission()`
  - Updated: `src/hooks/useOrganizationProfiles.ts` with permission fields

- ✅ **Phase 4 COMPLETE**: Team Management UI Components
  - Created `src/components/organization/PermissionEditor.tsx` (246 lines)
  - Created `src/components/organization/ManagerTypeSelector.tsx` (87 lines)
  - Created `src/components/organization/PermissionBadges.tsx` (259 lines)

- ✅ **Phase 5 COMPLETE**: Route Protection & Conditional Rendering
  - Updated `src/pages/organization/OrganizationTeam.tsx` - Full permission management integration
  - Updated `src/components/layout/OrganizationSidebar.tsx` - Permission-based navigation

- ✅ **Phase 6 COMPLETE**: Blended Personal + Organization View
  - Created `src/components/settings/OrgDataPreference.tsx` (140 lines) - User preference toggle
  - Updated `src/components/AccountSettings.tsx` - Integrated preference toggle
  - Updated `src/components/dashboard/ComedianDashboard.tsx` - Blended view implementation
  - Features: Purple-themed org section, visual separation, quick nav to org dashboard

- ✅ **Phase 7 COMPLETE**: Migration & Data Backfill
  - Created `scripts/backfill-organization-permissions.ts` (142 lines) - Backfill script
  - Added NPM script: `npm run backfill:permissions`
  - Sets manager_type = 'general' for existing manager role members
  - Maintains NULL custom_permissions (uses template defaults)

**Implementation Details**:

**Phase 1: Database Schema (2 hours)**

1.1 Update `organization_team_members` table:
```sql
ALTER TABLE organization_team_members
  ADD COLUMN manager_type TEXT CHECK (manager_type IN (
    'general',           -- Generic manager (broad access)
    'comedian_manager',  -- Manages specific comedians
    'social_media',      -- Media library + social scheduling
    'tour_manager',      -- Tour logistics + event management
    'booking_manager',   -- Deal acceptance + booking coordination
    'content_manager',   -- Events + media content
    'financial_manager'  -- Invoices + financial analytics
  )),
  ADD COLUMN custom_permissions JSONB DEFAULT '{
    "financial": {"view": true, "edit": false, "delete": false},
    "team": {"view": true, "edit": false, "delete": false},
    "events": {"view": true, "edit": false, "delete": false},
    "media": {"view": true, "edit": false, "delete": false},
    "social": {"view": true, "edit": false, "delete": false},
    "tasks": {"view": true, "edit": false, "delete": false},
    "messages": {"view": true, "edit": false, "delete": false},
    "bookings": {"view": true, "edit": false, "delete": false},
    "analytics": {"view": true, "edit": false, "delete": false}
  }'::jsonb;
```

1.2 Add user preference for blended view:
```sql
ALTER TABLE profiles
  ADD COLUMN show_org_in_personal_view BOOLEAN DEFAULT false;
```

1.3 Create permission template function for each manager type:
- Social Media Manager: media.edit, social.edit, events.view, analytics.view
- Tour Manager: events.edit, tasks.edit, bookings.edit, financial.view
- Booking Manager: bookings.edit, messages.edit, events.view, financial.view
- Comedian Manager: events.view, tasks.edit, messages.edit
- Content Manager: events.edit, media.edit, tasks.edit
- Financial Manager: financial.edit, analytics.view, bookings.view
- General Manager: Customizable (no template)

**Phase 2: TypeScript Types (1 hour)**

Files to create:
- `/root/agents/src/types/permissions.ts` - Permission type definitions

Key types:
```typescript
type PermissionScope = 'financial' | 'team' | 'events' | 'media'
  | 'social' | 'tasks' | 'messages' | 'bookings' | 'analytics';
type PermissionAction = 'view' | 'edit' | 'delete';
type PermissionSet = { view: boolean; edit: boolean; delete: boolean; };
type OrganizationPermissions = Record<PermissionScope, PermissionSet>;
type ManagerType = 'general' | 'comedian_manager' | 'social_media'
  | 'tour_manager' | 'booking_manager' | 'content_manager' | 'financial_manager';
```

**Phase 3: Permission Hooks (1 hour)**

Files to create:
- `/root/agents/src/hooks/organization/useOrganizationPermissions.ts`

Hook features:
- `hasPermission(scope, action)` - Check specific permission
- Auto-grant all permissions to Owner and Admin
- Return helper booleans: `canViewFinancials`, `canManageTeam`, `canAcceptBookings`, etc.
- Return current member's `manager_type` and `custom_permissions`

**Phase 4: Team Management UI (3 hours)**

Files to create:
- `/root/agents/src/components/organization/PermissionEditor.tsx` - Grid UI for editing permissions
- `/root/agents/src/components/organization/PermissionBadges.tsx` - Visual permission indicators
- `/root/agents/src/components/organization/ManagerTypeSelector.tsx` - Dropdown for manager types

Files to update:
- `/root/agents/src/pages/organization/OrganizationTeam.tsx` - Add manager type selection and permission editing

Features:
- When assigning 'manager' role, show manager type dropdown
- Auto-populate permissions from template based on manager type
- "Customize Permissions" button for Owner/Admin to override template
- Show permission badges next to each team member
- Highlight permissions that differ from template

**Phase 5: Route Protection (2 hours)**

Files to update:
- `/root/agents/src/components/route-protection/OrganizationRoute.tsx` - Add permission checks
- `/root/agents/src/pages/organization/OrganizationInvoices.tsx` - Require `financial.view`
- `/root/agents/src/pages/organization/OrganizationMediaLibrary.tsx` - Require `media.view`
- `/root/agents/src/pages/organization/OrganizationMessages.tsx` - Require `messages.view`
- `/root/agents/src/pages/organization/OrganizationAnalytics.tsx` - Require `analytics.view`
- `/root/agents/src/pages/organization/OrganizationBookComedian.tsx` - Require `bookings.edit`
- `/root/agents/src/components/layout/OrganizationSidebar.tsx` - Conditionally render nav items

Route protection pattern:
```typescript
<OrganizationRoute
  path="/org/:orgId/invoices"
  requiredPermission={{ scope: 'financial', action: 'view' }}
/>
```

**Phase 6: Blended Personal + Organization View (2 hours)**

Files to create:
- `/root/agents/src/components/settings/OrgDataPreference.tsx` - Toggle component

Files to update:
- `/root/agents/src/pages/Dashboard.tsx` - Fetch and merge personal + org data when enabled
- `/root/agents/src/pages/Profile.tsx` - Add preference toggle in settings

Features:
- User preference toggle: "Show organization data in personal dashboard"
- When enabled, personal dashboard shows both user events and org events
- Clear visual distinction between personal and organization data
- Separate cards/sections: "My Personal Events" vs "Organization Events (iD Comedy)"

**Phase 7: Migration & Backfill (1 hour)**

Migration file: `/root/agents/supabase/migrations/20250120_add_organization_permissions.sql`

Tasks:
- Add `manager_type` and `custom_permissions` columns
- Backfill existing managers with `manager_type = 'general'`
- Apply default permissions based on role (admin = all, member = view-only)
- Create permission template function
- Update RLS policies if needed

**Files Summary**:

**New Files** (8):
1. `/root/agents/src/types/permissions.ts`
2. `/root/agents/src/hooks/organization/useOrganizationPermissions.ts`
3. `/root/agents/src/components/organization/PermissionEditor.tsx`
4. `/root/agents/src/components/organization/PermissionBadges.tsx`
5. `/root/agents/src/components/organization/ManagerTypeSelector.tsx`
6. `/root/agents/src/services/organization-permissions.ts`
7. `/root/agents/supabase/migrations/20250120_add_organization_permissions.sql`
8. `/root/agents/src/components/settings/OrgDataPreference.tsx`

**Updated Files** (12):
1. `/root/agents/src/pages/organization/OrganizationTeam.tsx`
2. `/root/agents/src/contexts/OrganizationContext.tsx`
3. `/root/agents/src/components/route-protection/OrganizationRoute.tsx`
4. `/root/agents/src/pages/organization/OrganizationInvoices.tsx`
5. `/root/agents/src/pages/organization/OrganizationMediaLibrary.tsx`
6. `/root/agents/src/pages/organization/OrganizationMessages.tsx`
7. `/root/agents/src/pages/organization/OrganizationAnalytics.tsx`
8. `/root/agents/src/pages/Dashboard.tsx`
9. `/root/agents/src/pages/Profile.tsx`
10. `/root/agents/src/hooks/useOrganizationProfiles.ts`
11. `/root/agents/src/pages/organization/OrganizationBookComedian.tsx`
12. `/root/agents/src/components/layout/OrganizationSidebar.tsx`

**Estimated Effort**: ~11 hours total

**Priority**: HIGH - Required for proper organization team collaboration

---

## Current Issues & Features

### -1. **Organization Profile Separation Architecture** ✅ COMPLETED (2025-10-20)
**Problem**: When users switch to organization profile, they see user-specific data instead of organization-specific data. Organization profiles need complete separation from user profiles with their own:
- Routes (`/org/:orgId/*`)
- Pages (Dashboard, Events, Profile, etc.)
- Data queries (scoped to organization_id)
- Workflows (event creation, team management, invoices)

**Final State** (Completed 2025-10-20):
- ✅ **Phase 1 COMPLETE**: Database migration applied successfully
  - ✅ Added organization_id to events, invoices, messages tables
  - ✅ Created organization_tasks, organization_media, organization_vouches tables
  - ✅ RLS policies configured with SECURITY DEFINER functions
  - ✅ organization_events_view and get_organization_stats() created
- ✅ **Phase 2 COMPLETE**: Context & Routing
  - ✅ OrganizationContext provider created (provides orgId, organization, permissions)
  - ✅ OrganizationRoute protection component created
  - ✅ 12 organization routes added to App.tsx under /org/:orgId/*
- ✅ **Phase 3 COMPLETE**: Organization Hooks (5/5 complete)
  - ✅ useOrganizationEvents (all/upcoming/past events)
  - ✅ useOrganizationTasks (full CRUD)
  - ✅ useOrganizationInvoices (list with filters)
  - ✅ useOrganizationMedia (all/images/videos)
  - ✅ useOrganizationAnalytics (stats, event, task, team analytics)
- ✅ **Phase 4 COMPLETE**: Core organization pages (4 pages)
  - ✅ OrganizationDashboard.tsx (319 lines) - Overview with stats, recent events/tasks, quick actions
  - ✅ OrganizationEvents.tsx (178 lines) - Event listing with all/upcoming/past tabs
  - ✅ OrganizationProfile.tsx (280 lines) - Organization profile editor with all fields
  - ✅ OrganizationTeam.tsx (328 lines) - Team member management with role controls
- ✅ **Phase 5 COMPLETE**: Additional organization pages (8 pages)
  - ✅ OrganizationTasks.tsx (361 lines) - Full task management with CRUD, assignment, filtering
  - ✅ OrganizationMediaLibrary.tsx (94 lines) - Media grid with type filtering
  - ✅ OrganizationInvoices.tsx (26 lines) - Placeholder for invoice management
  - ✅ OrganizationAnalytics.tsx (129 lines) - Analytics dashboard with event/task breakdowns
  - ✅ OrganizationMessages.tsx (26 lines) - Placeholder for org messaging
  - ✅ OrganizationVouches.tsx (26 lines) - Placeholder for org vouches
  - ✅ CreateOrganizationEvent.tsx (37 lines) - Placeholder for event creation form
  - ✅ OrganizationBookComedian.tsx (37 lines) - Placeholder for comedian booking
- ✅ **Phase 6 COMPLETE**: OrganizationSidebar updated to use /org/:orgId/* routes
  - ✅ All navigation links now use organization-scoped routes
  - ✅ Added Tasks and Book Comedian menu items
  - ✅ Reorganized sections (Dashboard, Events, Team, Business, Settings)
  - ✅ Removed user-specific links (Notifications)

**Architecture Requirements**:

**1. Route Structure**:
```
/org/:orgId/dashboard       - Organization overview, metrics, recent activity
/org/:orgId/events          - Events owned/managed by organization
/org/:orgId/events/create   - Create event as organization
/org/:orgId/events/:eventId - Organization event detail
/org/:orgId/events/:eventId/edit - Edit organization event
/org/:orgId/profile         - Organization profile settings
/org/:orgId/team            - Team members management
/org/:orgId/invoices        - Organization invoices (sent & received)
/org/:orgId/analytics       - Organization analytics dashboard
/org/:orgId/messages        - Organization messages (org context)
/org/:orgId/notifications   - Organization notifications
/org/:orgId/vouches         - Vouches given/received as organization
/org/:orgId/media-library   - Organization media library
/org/:orgId/tasks           - Organization tasks (assignable to team)
/org/:orgId/book-comedian   - Book comedian as organization
```

**2. Data Separation**:
- **Events**: `events` table needs `organization_id` column (nullable)
  - User events: `organization_id = NULL`, `created_by = user_id`
  - Org events: `organization_id = org_id`, `created_by = owner_id`
- **Invoices**: Add `organization_id` to `invoices` table
- **Messages**: Scope messages by `organization_id` for org context
- **Tasks**: Add `organization_id`, `assigned_to` columns
- **Media**: Organization media library separate from user media
- **Vouches**: Organizations can give/receive vouches

**3. Database Schema Changes Needed**:
```sql
-- Add organization_id to events
ALTER TABLE events ADD COLUMN organization_id UUID REFERENCES organization_profiles(id);
CREATE INDEX idx_events_organization ON events(organization_id);

-- Add organization_id to invoices
ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organization_profiles(id);
CREATE INDEX idx_invoices_organization ON invoices(organization_id);

-- Create organization_events view (events where org is involved)
CREATE VIEW organization_events AS
SELECT e.*, op.organization_name, op.logo_url as org_logo
FROM events e
LEFT JOIN organization_profiles op ON e.organization_id = op.id;

-- Add RLS policies for organization-scoped data
CREATE POLICY "Organization members can view org events" ON events
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND (
      is_organization_owner(organization_id, auth.uid())
      OR is_organization_member(organization_id, auth.uid())
    )
  );
```

**4. React Hooks Needed**:
```typescript
// Organization-scoped data hooks
useOrganizationEvents(orgId: string)
useOrganizationInvoices(orgId: string)
useOrganizationTeam(orgId: string)
useOrganizationAnalytics(orgId: string)
useOrganizationMessages(orgId: string)
useOrganizationTasks(orgId: string)
useOrganizationMedia(orgId: string)
useOrganizationVouches(orgId: string)
```

**5. Pages to Create**:
- `/root/agents/src/pages/organization/OrganizationDashboard.tsx`
- `/root/agents/src/pages/organization/OrganizationEvents.tsx`
- `/root/agents/src/pages/organization/OrganizationProfile.tsx`
- `/root/agents/src/pages/organization/OrganizationTeam.tsx`
- `/root/agents/src/pages/organization/OrganizationInvoices.tsx`
- `/root/agents/src/pages/organization/OrganizationAnalytics.tsx`
- `/root/agents/src/pages/organization/OrganizationMessages.tsx`
- `/root/agents/src/pages/organization/OrganizationTasks.tsx`
- `/root/agents/src/pages/organization/OrganizationMediaLibrary.tsx`
- `/root/agents/src/pages/organization/CreateOrganizationEvent.tsx`

**6. Components to Update**:
- `OrganizationSidebar.tsx` - Update all links to use `/org/:orgId/*` routes
- `CreateEvent.tsx` - Support organization context (create event as org)
- `EventDetail.tsx` - Show organization branding when event is org-owned
- `InvoiceForm.tsx` - Support creating invoices as organization

**Implementation Plan - Full Breakdown**:

**Phase 1: Database Foundation** ⏳
- Task 1.1: Apply migration `20250120000006_add_organization_support_to_core_tables.sql`
  - Adds `organization_id` to events, invoices, messages
  - Creates organization_tasks, organization_media, organization_vouches tables
  - Adds RLS policies for all organization data
  - Creates organization_events_view and get_organization_stats() function
- Task 1.2: Verify migration success and test RLS policies
- Task 1.3: Update Supabase types: `npm run supabase:types`

**Phase 2: Organization Context & Routing** ⏳
- Task 2.1: Create OrganizationContext provider
  - File: `/root/agents/src/contexts/OrganizationContext.tsx`
  - Provides current organization ID from URL params
  - Provides organization data (from useOrganizationProfiles)
  - Provides permission helpers (isOwner, isAdmin, isMember)
- Task 2.2: Add organization routes to App.tsx
  - All routes under `/org/:orgId/*`
  - Protected by new `<OrganizationRoute />` wrapper
  - Lazy load all organization pages
- Task 2.3: Create OrganizationRoute protection component
  - Verifies user has access to organization
  - Redirects to dashboard if no access

**Phase 3: Organization-Scoped Data Hooks** ⏳
- Task 3.1: Create `src/hooks/organization/` directory
- Task 3.2: Create hooks:
  ```
  useOrganizationEvents(orgId: string)
  useOrganizationInvoices(orgId: string)
  useOrganizationTeam(orgId: string)
  useOrganizationAnalytics(orgId: string)
  useOrganizationMessages(orgId: string)
  useOrganizationTasks(orgId: string)
  useOrganizationMedia(orgId: string)
  useOrganizationVouches(orgId: string)
  useOrganizationStats(orgId: string)
  ```
- Task 3.3: Each hook queries with organization_id filter
- Task 3.4: Add optimistic updates for create/update/delete

**Phase 4: Core Organization Pages** ⏳
- Task 4.1: OrganizationDashboard
  - File: `/root/agents/src/pages/organization/OrganizationDashboard.tsx`
  - Shows stats cards (events, tasks, team, media)
  - Recent activity feed
  - Quick actions (create event, add task, invite member)
- Task 4.2: OrganizationEvents
  - File: `/root/agents/src/pages/organization/OrganizationEvents.tsx`
  - Lists all organization events
  - Filter by status (upcoming, past, draft)
  - Create event button → CreateOrganizationEvent
- Task 4.3: OrganizationProfile
  - File: `/root/agents/src/pages/organization/OrganizationProfile.tsx`
  - Edit organization details (name, logo, bio, socials)
  - Business info (ABN, address, bank details)
  - Verification status
- Task 4.4: OrganizationTeam
  - File: `/root/agents/src/pages/organization/OrganizationTeam.tsx`
  - List team members with roles
  - Invite new members
  - Update member roles (admin, manager, member)
  - Remove members

**Phase 5: Additional Organization Pages** ⏳
- Task 5.1: OrganizationInvoices
  - File: `/root/agents/src/pages/organization/OrganizationInvoices.tsx`
  - Lists invoices sent/received as organization
  - Create invoice as organization
  - Filter by status (paid, pending, overdue)
- Task 5.2: OrganizationAnalytics
  - File: `/root/agents/src/pages/organization/OrganizationAnalytics.tsx`
  - Event attendance metrics
  - Revenue charts
  - Team performance
  - Comedian booking trends
- Task 5.3: OrganizationMessages
  - File: `/root/agents/src/pages/organization/OrganizationMessages.tsx`
  - Messages scoped to organization
  - Team can view/send
- Task 5.4: OrganizationTasks
  - File: `/root/agents/src/pages/organization/OrganizationTasks.tsx`
  - Kanban board (todo, in progress, completed)
  - Assign tasks to team members
  - Filter by assignee, status, due date
  - Link tasks to events/invoices
- Task 5.5: OrganizationMediaLibrary
  - File: `/root/agents/src/pages/organization/OrganizationMediaLibrary.tsx`
  - Upload/manage org photos/videos
  - Drag & drop reordering
  - Feature images for profiles/events
- Task 5.6: OrganizationVouches
  - File: `/root/agents/src/pages/organization/OrganizationVouches.tsx`
  - Vouches given/received as organization
  - Give vouch to comedians/other orgs
- Task 5.7: CreateOrganizationEvent
  - File: `/root/agents/src/pages/organization/CreateOrganizationEvent.tsx`
  - Event creation form with organization_id
  - Pre-fill org details (venue name, contact)
  - Team member assignment
- Task 5.8: OrganizationBookComedian
  - File: `/root/agents/src/pages/organization/OrganizationBookComedian.tsx`
  - Book comedians as organization
  - Create booking requests
  - Manage comedian roster

**Phase 6: Component Updates** ⏳
- Task 6.1: Update OrganizationSidebar links
  - Change `/dashboard` → `/org/:orgId/dashboard`
  - Change `/shows` → `/org/:orgId/events`
  - Change `/profile` → `/org/:orgId/profile`
  - All links use current orgId from context
- Task 6.2: Update CreateEvent component
  - Add organization_id when creating as org
  - Show organization branding in form
- Task 6.3: Update EventDetail component
  - Display organization logo/name when org-owned
  - Show team members involved
- Task 6.4: Update InvoiceForm component
  - Support creating invoices as organization
  - Pre-fill org business details

**Phase 7: Testing & Polish** ⏳
- Task 7.1: Test profile switching: user → org → user
  - Verify sidebar changes
  - Verify routes update
  - Verify data scoping
- Task 7.2: Test organization permissions
  - Owner can do everything
  - Admin can manage (not delete org)
  - Member can view only
- Task 7.3: Test organization data isolation
  - User events don't show in org context
  - Org events don't show in user context
- Task 7.4: Performance testing
  - Ensure queries use indexes
  - Check N+1 query issues
- Task 7.5: Error handling
  - Invalid orgId in URL
  - User doesn't have access
  - Missing organization data

**Files to Create** (Total: ~20 files):
```
/root/agents/src/contexts/OrganizationContext.tsx
/root/agents/src/components/route-protection/OrganizationRoute.tsx
/root/agents/src/hooks/organization/useOrganizationEvents.ts
/root/agents/src/hooks/organization/useOrganizationInvoices.ts
/root/agents/src/hooks/organization/useOrganizationTeam.ts
/root/agents/src/hooks/organization/useOrganizationAnalytics.ts
/root/agents/src/hooks/organization/useOrganizationMessages.ts
/root/agents/src/hooks/organization/useOrganizationTasks.ts
/root/agents/src/hooks/organization/useOrganizationMedia.ts
/root/agents/src/hooks/organization/useOrganizationVouches.ts
/root/agents/src/hooks/organization/useOrganizationStats.ts
/root/agents/src/pages/organization/OrganizationDashboard.tsx
/root/agents/src/pages/organization/OrganizationEvents.tsx
/root/agents/src/pages/organization/OrganizationProfile.tsx
/root/agents/src/pages/organization/OrganizationTeam.tsx
/root/agents/src/pages/organization/OrganizationInvoices.tsx
/root/agents/src/pages/organization/OrganizationAnalytics.tsx
/root/agents/src/pages/organization/OrganizationMessages.tsx
/root/agents/src/pages/organization/OrganizationTasks.tsx
/root/agents/src/pages/organization/OrganizationMediaLibrary.tsx
/root/agents/src/pages/organization/OrganizationVouches.tsx
/root/agents/src/pages/organization/CreateOrganizationEvent.tsx
/root/agents/src/pages/organization/OrganizationBookComedian.tsx
```

**Files to Update** (Total: ~6 files):
```
/root/agents/src/App.tsx - Add org routes
/root/agents/src/components/layout/OrganizationSidebar.tsx - Update links
/root/agents/src/pages/CreateEvent.tsx - Add org context support
/root/agents/src/pages/EventDetail.tsx - Show org branding
/root/agents/src/components/InvoiceForm.tsx - Add org context support
/root/agents/supabase/migrations/20250120000006_add_organization_support_to_core_tables.sql - Already created
```

**Estimated Effort**:
- Phase 1 (Database): 30 minutes
- Phase 2 (Context & Routing): 1 hour
- Phase 3 (Hooks): 2 hours
- Phase 4 (Core Pages): 3 hours
- Phase 5 (Additional Pages): 4 hours
- Phase 6 (Component Updates): 1 hour
- Phase 7 (Testing): 1.5 hours
- **Total: ~13 hours**

**Implementation Summary** (Completed 2025-10-20):
1. ✅ Database migration applied successfully
2. ✅ OrganizationContext provider created
3. ✅ OrganizationRoute protection component created
4. ✅ 5 organization-scoped hooks created (events, tasks, invoices, media, analytics)
5. ✅ 12 organization pages created (4 complete implementations, 8 with placeholders)
6. ✅ 12 organization routes added to App.tsx
7. ✅ OrganizationSidebar links updated to use /org/:orgId/* routes
8. ✅ OrganizationSidebar component already existed from previous work
9. ✅ PlatformLayout already renders OrganizationSidebar when in organization context

**Files Created** (14 files):
- `/root/agents/src/hooks/organization/useOrganizationAnalytics.ts` (221 lines)
- `/root/agents/src/pages/organization/OrganizationDashboard.tsx` (319 lines)
- `/root/agents/src/pages/organization/OrganizationEvents.tsx` (178 lines)
- `/root/agents/src/pages/organization/OrganizationProfile.tsx` (280 lines)
- `/root/agents/src/pages/organization/OrganizationTeam.tsx` (328 lines)
- `/root/agents/src/pages/organization/OrganizationTasks.tsx` (361 lines)
- `/root/agents/src/pages/organization/OrganizationMediaLibrary.tsx` (94 lines)
- `/root/agents/src/pages/organization/OrganizationInvoices.tsx` (26 lines)
- `/root/agents/src/pages/organization/OrganizationAnalytics.tsx` (129 lines)
- `/root/agents/src/pages/organization/OrganizationMessages.tsx` (26 lines)
- `/root/agents/src/pages/organization/OrganizationVouches.tsx` (26 lines)
- `/root/agents/src/pages/organization/CreateOrganizationEvent.tsx` (37 lines)
- `/root/agents/src/pages/organization/OrganizationBookComedian.tsx` (37 lines)

**Files Updated** (1 file):
- `/root/agents/src/components/layout/OrganizationSidebar.tsx` - Updated all navigation links

**Additional Fixes Completed (2025-10-20)**:
- ✅ **CRITICAL FIX**: Added `<Outlet />` to PlatformLayout - Fixed all organization pages not rendering
- ✅ Fixed infinite re-render in OrganizationContext using `useMemo`
- ✅ Fixed form initialization in OrganizationProfile using `useEffect`
- ✅ Created OrganizationLogoUpload component (199 lines) with full file upload support
- ✅ Created organization-media Supabase Storage bucket with RLS policies
- ✅ Fixed events table schema errors (removed invalid foreign keys, updated column names)
- ✅ Fixed SelectItem empty value errors in 4 components (Radix UI compliance)
- ✅ Added missing React Query hooks:
  - `useUpdateOrganizationProfile` - Update organization profile
  - `useOrganizationTeamMembers` - Fetch team members with user data
  - `useUpdateTeamMemberRole` - Update member roles and permissions
  - `useRemoveTeamMember` - Remove team members
- ✅ Fixed event analytics hook to use `status` column instead of `is_published`
- ✅ All 12 organization pages verified working (4 complete, 8 placeholders)

**Files Modified (14 total)**:
1. PlatformLayout.tsx - Added Outlet for nested routes (CRITICAL)
2. OrganizationContext.tsx - Added useMemo for performance
3. OrganizationProfile.tsx - Added useEffect for form initialization
4. OrganizationLogoUpload.tsx - NEW component (199 lines)
5. useOrganizationProfiles.ts - Added 4 new hooks (172 lines)
6. useOrganizationEvents.ts - Fixed foreign key queries
7. useOrganizationTasks.ts - Fixed column names
8. OrganizationDashboard.tsx - Fixed event name/status references
9. Shows.tsx - Fixed SelectItem empty value
10. EventFilters.tsx - Fixed SelectItem empty values (2 instances)
11. MarketingCostForm.tsx - Fixed SelectItem empty value
12. TaskViewSwitcher.tsx - Fixed SelectItem empty value
13. useOrganizationAnalytics.ts - Fixed is_published → status

**Database Changes**:
- ✅ Applied RLS policies migration (lines 251-308)
- ✅ Fixed get_user_organizations function (SQL DISTINCT/ORDER BY)
- ✅ Added user as team member (INSERT into organization_team_members)
- ✅ Created organization-media storage bucket with policies

**Next Steps** (Future Work):
- Implement placeholder pages (Invoices, Messages, Vouches, Create Event, Book Comedian)
- Add comprehensive error handling and loading states
- Implement organization event creation workflow
- Build organization invoice management system
- Expand analytics dashboard with charts and visualizations
- Add task notifications and reminders
- Implement file upload for organization media library
- Build messaging system for organization context

**Priority**: ✅ FULLY OPERATIONAL
**Status**: Core architecture complete, all pages verified working, ready for feature expansion

---

### 0. **Database Schema Mismatches & RLS Infinite Recursion** ✅ COMPLETED
**Problem**: Console showed multiple 400/500 errors on database calls
**Root Causes**:
1. **Missing `custom_organization_type` column** in `organization_profiles` table
2. **400 error on `get_user_organizations` RPC** - SQL syntax error: `SELECT DISTINCT` with `ORDER BY` on non-selected column
3. **400 error on `comedian_media` query** - Missing `user_id` and `display_order` columns
4. **500 error on `organization_profiles` with infinite recursion** - RLS policies created circular dependency

**Critical Bugs Found**:

**Bug 1: get_user_organizations() RPC**
```
ERROR: for SELECT DISTINCT, ORDER BY expressions must appear in select list
```
The function used `SELECT DISTINCT ... ORDER BY op.created_at` but `created_at` wasn't in the SELECT list.

**Bug 2: comedian_media Schema Mismatch**
Hook expected `user_id` and `display_order` columns but table only had `comedian_id`.

**Bug 3: RLS Circular Dependency (CRITICAL)**
```
ERROR: 42P17: infinite recursion detected in policy for relation "organization_profiles"
```
Two tables had RLS policies that queried each other:
- `organization_profiles` policies checked `organization_team_members`
- `organization_team_members` policies checked `organization_profiles`
- Created infinite loop during RLS evaluation

**Bug 4: Ambiguous Column References in RLS Helper Functions**
Parameter names conflicted with table column names (e.g., `user_id` parameter vs `user_id` column).

**Solution Implemented**:
1. ✅ Created migration `add_custom_organization_type_to_organization_profiles.sql`
2. ✅ Updated `useOrganizationProfiles` hook interface to include `custom_organization_type` and `tiktok_url`
3. ✅ Updated mapping logic in hook to include new fields
4. ✅ Verified ProfileContext has proper auth null checks (already existed)
5. ✅ **Fixed `get_user_organizations()` function** - Removed `DISTINCT` to allow `ORDER BY created_at`
6. ✅ **Fixed `comedian_media` table** - Added `user_id` and `display_order` columns
7. ✅ **Fixed RLS circular dependency** - Created `SECURITY DEFINER` helper functions to break recursion
8. ✅ **Fixed ambiguous column references** - Used fully qualified names in helper functions

**Migrations Created**:
- ✅ `add_custom_organization_type_to_organization_profiles.sql`
- ✅ `fix_get_user_organizations_order_by.sql` (RPC function fix)
- ✅ `fix_comedian_media_schema.sql` (Added user_id and display_order columns)
- ✅ `fix_organization_profiles_rls_recursion.sql` (First attempt at fixing recursion)
- ✅ `fix_rls_circular_dependency.sql` (Complete fix with SECURITY DEFINER functions)

**Helper Functions Created**:
- ✅ `is_organization_owner(org_id, user_id)` - Checks ownership without RLS
- ✅ `is_organization_member(org_id, user_id)` - Checks membership without RLS
- ✅ `is_organization_admin(org_id, user_id)` - Checks admin status without RLS

**Files Updated**:
- ✅ `/root/agents/src/hooks/useOrganizationProfiles.ts` - Added fields to OrganizationProfile interface
- ✅ `/root/agents/src/contexts/ProfileContext.tsx` - Verified auth null checks exist

**Outcome**:
- ✅ No more 400 errors on `get_user_organizations` RPC calls
- ✅ No more 400 errors on `comedian_media` queries
- ✅ No more 500 errors on `organization_profiles` queries with infinite recursion
- ✅ Organization profiles can be created with custom organization type
- ✅ Comedian media queries work with user_id and display_order
- ✅ All RPC functions execute successfully without SQL errors
- ✅ RLS policies work correctly using SECURITY DEFINER helper functions
- ✅ All database queries tested and verified working

---

### 1. **Vouch System - Crown Icon Implementation** ✅ COMPLETED
**Problem**: When giving a vouch, the UI shows "Rating (0-5 stars)" instead of crown icons
**Expected Behavior**:
- Display gold crown icon (same as tab icon)
- Crown should be **white outline** (unfilled) by default
- Crown fills with **gold color** when user starts typing their comment
- Remove all references to "Rating" and "stars" language

**Files Updated**:
- ✅ `/root/agents/src/components/VouchSystem.tsx` - Removed star rating, added crown in title
- ✅ `/root/agents/src/components/VouchSystemEnhanced.tsx` - Removed star rating completely
- ✅ `/root/agents/src/components/VouchCard.tsx` - Replaced stars with single crown icon
- ✅ `/root/agents/src/components/ProfileHeader.tsx` - Changed Award icon to Crown

**Implementation Completed**:
- ✅ Uses `<Crown />` from lucide-react
- ✅ Styling: `text-white stroke-2` for outline, `text-yellow-500 fill-yellow-500` for filled
- ✅ Crown in card title fills gold dynamically as user types
- ✅ Removed "Start typing to fill the crown..." instruction section
- ✅ Changed title from "+ Give a Vouch" to "Give a Vouch" with crown icon
- ✅ All star rating references removed across all vouch components

---

### 2. **Task Management System** ✅ COMPLETE (2025-10-20)
**Solution**: Leveraged existing comprehensive task infrastructure and added universal sidebar integration
**Scope**: Universal task system for all user roles

**Current State**:
- ✅ **Database Schema**: Already exists with comprehensive `tasks` and `task_links` tables
- ✅ **UI Components**: Existing TaskDashboard with list/kanban/calendar views
- ✅ **Route Added**: `/tasks` route accessible to all authenticated users
- ✅ **Sidebar Integration Complete**: Tasks link added to all role-based sidebars

**Core Requirements** (All Met):
- ✅ Every user can create, track, and manage their own tasks
- ✅ Tasks can be linked to:
  - Events, Gigs, Messages, Notifications, Customers, Organizations
- ✅ Task status tracking (pending, in_progress, completed, cancelled)
- ✅ Due dates and priority levels (low, medium, high, urgent)

**Sidebar Integration** (Complete):
- ✅ **CRM Sidebar**: Already present (CRM tasks page)
- ✅ **Promoter Sidebar**: Added in Business section (after Agency, before Invoices)
- ✅ **Manager Sidebar**: Added in Business section (after Agency, before Invoices)
- ✅ **Organization Sidebar**: Already present in Team section (with permissions)
- ✅ **Comedian Sidebar**: Added in My Work section (after "+ Add Gig")
- ✅ **Photographer Sidebar**: Added in Business section (after Equipment)
- ✅ **Videographer Sidebar**: Added in Business section (after Equipment)

**Implementation Summary**:
- **Existing Database Schema** (Already Present):
  - `tasks` table with creator_id, assignee_id, status, priority, due_date, etc.
  - `task_links` table for polymorphic relationships
  - `task_comments`, `task_reminders`, `task_templates`, `task_template_items`
  - RLS policies allowing users to view/edit tasks they created or are assigned to

- **Existing UI Components** (Already Present):
  - `/root/agents/src/pages/TaskDashboard.tsx` - Comprehensive task management with list/kanban/calendar views
  - `/root/agents/src/components/tasks/TaskList.tsx` - Task list view
  - `/root/agents/src/components/tasks/TaskCard.tsx` - Individual task cards
  - `/root/agents/src/hooks/useTaskDashboard.ts` - Task management hooks
  - Full CRUD functionality, filters, search, and templates

- **Files Modified** (2025-10-20):
  - `/root/agents/src/App.tsx` - Added `/tasks` route with lazy-loaded TaskDashboard
  - `/root/agents/src/components/layout/ComedianSidebar.tsx` - Added Tasks link in "My Work" section
  - `/root/agents/src/components/layout/PromoterSidebar.tsx` - Added Tasks link in "Business" section
  - `/root/agents/src/components/layout/ManagerSidebar.tsx` - Added Tasks link in "Business" section
  - `/root/agents/src/components/layout/PhotographerSidebar.tsx` - Added Tasks link in "Business" section
  - `/root/agents/src/components/layout/VideographerSidebar.tsx` - Added Tasks link in "Business" section
  - `/root/agents/src/components/layout/OrganizationSidebar.tsx` - Already had Tasks link

---

### 3. **Media Library - Bucket & Folder System** ✅ COMPLETE (2025-10-20)
**Solution**: Created comprehensive media library infrastructure with storage bucket, folder management, and auto-folder creation
**Scope**: Full media library system with folder organization and database tracking

**Current State**:
- ✅ **Storage Bucket**: Created 'media-library' bucket (100MB limit, public access)
- ✅ **Database Schema**: media_folders and media_files tables with RLS policies
- ✅ **Auto-Folder Creation**: Triggers create "Headshots" and "Performances" folders for comedians
- ✅ **UI Integration**: MediaLibraryManager updated with folder selector and database sync
- ✅ **Helper Functions**: get_folder_stats() and get_user_storage_usage()

**Implementation Details**:

**Database Infrastructure** (Migration: `20251020_create_media_library_bucket.sql`):
- **Storage Bucket**: 100MB file limit, supports images/videos/audio/PDF
- **media_folders Table**: User-owned folders with name, description, is_default flag
- **media_files Table**: Tracks storage_path, file_name, file_type, file_size, public_url, tags
- **RLS Policies**: User-specific access for folders and files
- **Storage Policies**: User can upload/update/delete own files, public read access
- **Auto-Creation Trigger**: Creates "Headshots" and "Performances" folders for comedian profiles

**UI Updates** (`/root/agents/src/components/MediaLibraryManager.tsx`):
- Added folder selection dropdown with real-time folder fetching
- Integrated database tracking for all uploads (media_files table)
- Display folder context in file listings
- Loading states for folders and files
- Updated upload flow: Storage → Database → UI update

**Features**:
- Folder selector shows all user folders with (Default) indicator
- Files tracked in database with folder association
- Public URLs stored for easy access
- Tag support for advanced organization
- Real-time folder stats available via helper functions

**Files Created/Modified**:
- `/root/agents/supabase/migrations/20251020_create_media_library_bucket.sql` - Complete infrastructure
- `/root/agents/src/components/MediaLibraryManager.tsx` - Full folder integration

**Testing**: Ready for manual testing via /media-library route

---

### 4. **Organization Creation Issues** 🟡 DEBUGGING IN PROGRESS
**Problem**: "It's still having a hard time creating an organization"
**Status**: Enhanced error logging added to identify root cause

**Investigation Completed** ✅:
- ✅ Database schema verified - all fields correctly defined
- ✅ RLS policies confirmed working - INSERT policy: `auth.uid() = promoter_id`
- ✅ Service layer correctly passes `user.id` as `promoter_id`
- ✅ Form validation requires organization name
- ✅ No blocking foreign key constraints found

**Enhanced Error Handling Added**:
- Added detailed console logging in `useOrganizations.ts`
- Added service-level logging in `organization-service.ts`
- Specific error messages for common failures:
  - `PGRST301`: Permission denied (role issue)
  - `23505`: Duplicate organization name
  - RLS policy violations
- Better user feedback with actionable error messages

**Next Steps**:
- User needs to attempt organization creation with browser console open
- Check console logs for specific error details
- Common issues to check:
  - User is authenticated (`user?.id` exists)
  - User has active session
  - RLS policy allows authenticated user to insert

**Files Updated**:
- `/root/agents/src/hooks/useOrganizations.ts` - Enhanced error messages and logging
- `/root/agents/src/services/crm/organization-service.ts` - Added debug logging

---

### 5. **Sidebar Ordering - Calendar Before Applications** ✅ QUICK WIN
**Problem**: Applications appears before Calendar in "My Work" section
**Solution**: Swap order of SidebarMenuItem blocks

**Files**: `/root/agents/src/components/layout/ComedianSidebar.tsx` (lines 195-246)
**Change**: Move Calendar block (lines 230-246) before Applications block (lines 208-227)

---

### 6. **Standardize Sign In Prompts** ✅ QUICK WIN
**Problem**: 18 files have inconsistent Sign In prompt styles
**Preferred Style** (from Dashboard.tsx):
```typescript
<Card className="max-w-md w-full mx-4">
  <CardContent className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
    <p className="text-muted-foreground mb-6">You need to be logged in to access [page name].</p>
    <Button onClick={() => navigate('/auth')} className="w-full">Sign In</Button>
  </CardContent>
</Card>
```

**Files to Update** (18 total):
- Profile.tsx
- Messages.tsx
- Notifications.tsx
- Organizer.tsx
- EventApplicationPage.tsx
- CreateEvent.tsx
- EventEdit.tsx
- EventsPage.tsx
- PhotosPage.tsx
- SearchResults.tsx
- TermsOfService.tsx
- Application.tsx
- ConfirmSpot.tsx
- ComedianRoster.tsx
- PartnerNetworkDirectory.tsx
- VenueDirectory.tsx
- AdminTicketSales.tsx
- AdminDashboard.tsx

---

### 7. **Calendar Navigation Bug** ✅ COMPLETED
**Problem**: "When I'm in vouches and click Calendar on the sidebar, it doesn't change now?"
**Root Cause**: Profile.tsx useEffect had empty dependency array, so it only ran on initial mount and didn't react to URL parameter changes

**Solution Implemented**:
- Changed useEffect dependency from `[]` (mount only) to `[location.search]` (listen to URL changes)
- Now properly syncs active tab whenever URL search parameter changes
- Calendar navigation from vouches tab (or any tab) now works correctly

**Files Updated**:
- ✅ `/root/agents/src/pages/Profile.tsx` (lines 51-63) - Fixed tab URL synchronization

---

## Execution Priority (USER-DEFINED ORDER)

### **Sprint 1: Quick Wins + Critical UX Fixes** ⚡ COMPLETED ✅
1. ✅ **COMPLETED** - Fix vouch system crown icons (Rating → Crown with fill interaction)
   - VouchSystem.tsx, VouchSystemEnhanced.tsx, VouchCard.tsx, ProfileHeader.tsx
   - Crown dynamically fills gold when typing
   - All star rating references removed
2. ✅ **COMPLETED** - Reorder sidebar (Calendar before Applications)
3. ✅ **COMPLETED** - Standardize Sign In prompts across 18 files (Dashboard Card style)
4. ✅ **COMPLETED** - Enhanced organization creation debugging (logging added, waiting for user test)
5. ✅ **COMPLETED** - Fixed Calendar navigation bug (useEffect now listens to URL changes)

### **Sprint 2: Media Library Infrastructure** 🏗️ NEXT
6. ✅ Create 'media-library' Supabase Storage bucket
7. 🏗️ Implement folder functionality in media library
8. ✅ Create default 'Headshots' folder for every comedian's media library

### **Sprint 3: Social Media Scheduling (Postiz)** ✅ PHASE 1-2 COMPLETE, 🚧 SSO IN PROGRESS (2025-10-22)
10. ✅ **RESEARCH COMPLETE** (2025-10-20) - Comprehensive Postiz integration analysis
    - **Document Created**: `/root/agents/docs/postiz-integration-comparison.md` (19 pages)
    - **Self-Hosted Approach**: Documented Docker setup, PostgreSQL, Redis, subdomain config
    - **Hybrid Integration Approach**: Custom UI + NodeJS SDK with Supabase integration
    - **Technical Analysis**: API limits, costs, timelines, pros/cons comparison
    - **Recommendation**: Hybrid Integration (better UX, lower cost, seamless design)
11. ✅ **DECISION MADE: HYBRID INTEGRATION** (2025-10-20)
    - User selected Hybrid Integration approach
    - Custom UI + @postiz/node SDK backend
    - Zero infrastructure cost, seamless design integration
12. ✅ **PHASE 1 IMPLEMENTATION COMPLETE** (2025-10-20) - Foundation laid
    - ✅ **SDK**: Installed @postiz/node package (v1.0.8)
    - ✅ **Database**: Created comprehensive schema with 4 tables
      - `social_channels` - Connected platforms (Instagram, Twitter, Facebook, etc.)
      - `social_posts` - Scheduled content with status tracking
      - `social_post_templates` - Reusable templates with {{variables}}
      - `social_post_analytics` - Engagement metrics (views, likes, comments, shares)
      - **Helper Functions**: get_user_active_channels, get_upcoming_posts, get_user_social_analytics
      - **RLS Policies**: User-scoped access control on all tables
      - **Auto-templates**: Default templates created on user signup
    - ✅ **Service Layer**: Built `/root/agents/src/services/social/postiz-service.ts`
      - PostizService class with complete API wrapper
      - Methods: connectChannel, schedulePost, getUserPosts, getAnalytics, etc.
      - Template variable substitution with {{placeholder}} support
    - ✅ **React Hooks**: Created `/root/agents/src/hooks/useSocialMedia.ts`
      - useSocialChannels (connect, disconnect, list)
      - useSocialPosts (schedule, update, cancel)
      - useSocialTemplates (list, apply)
      - useSocialAnalytics (user stats, post metrics)
    - ✅ **UI Components**: Complete social scheduler interface
      - `SocialScheduler.tsx` - Main scheduling interface with tabs
      - `ConnectedChannels.tsx` - Platform connection management
      - `ScheduledPosts.tsx` - Upcoming and past posts view
      - `SocialAnalytics.tsx` - Performance dashboard
    - ✅ **Route**: Added `/social-media` protected route in App.tsx
    - ✅ **Page**: Created `/root/agents/src/pages/SocialMedia.tsx`
13. ✅ **PHASE 2 IMPLEMENTATION COMPLETE** (2025-10-20) - Postiz API Integration
    - ✅ **Environment Variables**: Added to `.env.example`
      - `VITE_POSTIZ_API_KEY` - API key from Postiz settings
      - `VITE_POSTIZ_API_URL` - API endpoint (defaults to https://api.postiz.com/public/v1)
      - `VITE_POSTIZ_INSTANCE_URL` - Optional self-hosted instance URL
    - ✅ **Postiz SDK Integration**: Updated PostizService class
      - Imported @postiz/node SDK
      - Initialized Postiz client with API key and instance URL
      - Added `isConfigured()` method to check API availability
    - ✅ **Channel Management**: Real API integration
      - `getUserChannels()` now fetches from Postiz API
      - Auto-syncs integrations with local database
      - Graceful fallback to cached data if API fails
    - ✅ **Post Scheduling**: Complete API implementation
      - `schedulePost()` calls Postiz API with proper payload
      - Supports media uploads via media library integration
      - Hashtags automatically appended to content
      - Platform-specific settings support (Instagram, Twitter, etc.)
      - Graceful degradation to draft mode if API fails
    - ✅ **Post Deletion**: API-backed cancellation
      - `cancelPost()` deletes from Postiz API first
      - Updates local database status to 'cancelled'
      - Handles both Postiz-backed and local-only posts
    - ✅ **Media Integration**: Full media library support
      - `schedulePost()` fetches media from media_files table
      - Converts media_file_ids to public URLs
      - Prepares media objects for Postiz API format
      - Added `uploadMedia()` method for direct Postiz uploads
    - ✅ **Additional Methods**:
      - `getPostizScheduledPosts()` - Fetch posts from Postiz API
      - `uploadMedia()` - Upload files directly to Postiz
      - Error handling and logging throughout
    - ✅ **Sidebar Integration**: Added to navigation
      - ComedianSidebar: Social Media link added
      - PromoterSidebar: Social Media link added
      - OrganizationSidebar: Social Media link added
      - All use Share2 icon, consistent styling
14. ⏳ **PHASE 3: PLATFORM OAUTH FLOW** (Future Enhancement)
    - ⏳ Implement OAuth callback routes for social platform connections (Instagram, Twitter, etc.)
    - ⏳ Add platform-specific OAuth configurations
    - ⏳ Create OAuth connection UI flow
    - ⏳ Handle OAuth token refresh and expiration
15. 🚧 **PHASE 4: SSO INTEGRATION** (In Progress - Started 2025-10-22)
    **Goal**: Enable seamless single sign-on between Stand Up Sydney and Postiz self-hosted instance
    **Status**: Implementation plan documented, ready to begin execution
    **Approach**: Separate tab (Phase 1), then embedded iframe (Phase 2 - future)

    **Technical Foundation**:
    - ✅ Postiz has built-in `Provider.GENERIC` for custom OAuth/OIDC
    - ✅ Supabase has beta OAuth 2.1 server capabilities
    - ✅ Postiz already deployed at https://social.gigpigs.app
    - ✅ Custom branding applied (ID Comedy / Stand Up Sydney logo)
    - ✅ Shared media library mounted
    - ✅ Persistent user sessions and database

    **Architecture**:
    ```
    User logged into Stand Up Sydney
    → Clicks "Social Media" in sidebar
    → Stand Up Sydney initiates OAuth with Postiz
    → Postiz redirects to Supabase OAuth endpoint
    → Supabase validates session (already logged in)
    → Returns auth code to Postiz
    → Postiz exchanges code for access token
    → Creates/logs in user with Supabase JWT
    → Opens in new tab (current) or embedded iframe (future)
    ```

    **Implementation Steps**:

    **Step 4.1: Enable Supabase as OAuth Provider** (30 mins)
    - Access Supabase dashboard for project `pdikjpfulhhpqpxzpgtu`
    - Navigate to Authentication → Settings → OAuth (Beta)
    - Enable OAuth 2.1 server
    - Create OAuth application: "GigPigs Postiz Integration"
    - Redirect URIs:
      - `https://social.gigpigs.app/settings`
      - `https://social.gigpigs.app/auth/callback`
    - Scopes: `openid profile email`
    - Copy Client ID and Client Secret

    **Step 4.2: Configure Postiz OAuth** (15 mins)
    - Edit `/root/postiz/postiz.env`:
    ```bash
    # Supabase OAuth Integration
    POSTIZ_OAUTH_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co
    POSTIZ_OAUTH_AUTH_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/oauth/authorize
    POSTIZ_OAUTH_TOKEN_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/oauth/token
    POSTIZ_OAUTH_USERINFO_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/userinfo
    POSTIZ_OAUTH_CLIENT_ID=[from step 4.1]
    POSTIZ_OAUTH_CLIENT_SECRET=[from step 4.1]
    ```
    - Restart Postiz: `cd /root/postiz && docker compose restart postiz-app`

    **Step 4.3: Create Postiz SSO Component** (30 mins)
    - Create `src/components/postiz/PostizSSO.tsx`:
      - Button component with ExternalLink icon
      - Opens Postiz with OAuth flow
      - URL: `https://social.gigpigs.app/auth/sso?provider=GENERIC`
    - Create `src/pages/SocialMedia.tsx`:
      - Card with PostizSSO button
      - Description of social media management
      - Protected by role check

    **Step 4.4: Update Sidebar Navigation** (15 mins)
    - Add to `src/components/layout/Sidebar.tsx` (or role-specific sidebars):
      - Menu item: "Social Media"
      - Icon: Share2
      - Path: `/social-media`
      - Roles: `['comedian', 'promoter', 'admin']`

    **Step 4.5: Add Route** (5 mins)
    - Edit `src/App.tsx`:
      - Lazy load: `const SocialMedia = lazy(() => import('@/pages/SocialMedia'))`
      - Route: `/social-media` with ProtectedRoute wrapper

    **Step 4.6: Create Supabase Edge Function** (30 mins)
    - File: `supabase/functions/oauth-userinfo/index.ts`
    - Validates OAuth token from Authorization header
    - Fetches user profile from Supabase
    - Returns OIDC-formatted userinfo response:
      ```json
      {
        "sub": "user-id",
        "email": "user@example.com",
        "name": "User Name",
        "picture": "avatar-url",
        "email_verified": true
      }
      ```
    - Deploy: `supabase functions deploy oauth-userinfo`
    - Update Postiz env: `POSTIZ_OAUTH_USERINFO_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/oauth-userinfo`

    **Step 4.7: Profile Picture Sync** (30 mins - optional)
    - Modify Postiz OAuth handler to store user avatar
    - Sync profile pictures from Supabase to Postiz
    - Replace "P" logo with user's actual profile picture

    **Testing Checklist**:
    - [ ] Supabase OAuth endpoints respond correctly
    - [ ] Postiz recognizes GENERIC provider
    - [ ] OAuth authorization flow redirects properly
    - [ ] Token exchange succeeds
    - [ ] Userinfo returns correct data
    - [ ] User automatically logged into Postiz
    - [ ] Profile picture displays (if implemented)
    - [ ] Sessions persist independently
    - [ ] Error handling for failed OAuth

    **Timeline**: 2.5-3 hours for Phase 1 (separate tab approach)

    **Future Enhancement (Phase 2)**:
    - Embed Postiz via iframe within Stand Up Sydney
    - Use postMessage for secure communication
    - Configure CORS and CSP headers
    - Single-window user experience
    - **Additional Time**: 2-3 hours

    **Documentation**:
    - `/root/postiz/CUSTOM_BRANDING.md` - Branding & media library setup
    - `/root/postiz/SETUP_FACEBOOK_INSTAGRAM.md` - Social platform OAuth
    - `/root/postiz/TEST_FACEBOOK_BUSINESS_API.md` - Facebook API testing

16. 🚧 **PHASE 5: ENHANCED SSO WITH PROFILE SYNCING** (Planned - 2025-10-22)
    **Goal**: Auto-login + sync profile photo/organization logo from GigPigs to Postiz
    **Status**: Research complete, awaiting Supabase OAuth enablement
    **Approach**: OAuth 2.0/OIDC with userinfo endpoint for profile data sync

    **Available Profile Data**:
    - **Personal Profiles** (`profiles` table):
      - `name`, `first_name`, `last_name`, `display_name`
      - `avatar_url` - Personal profile photo
      - `email`, `phone`, `bio`, `location`
      - Social links: Instagram, Twitter, YouTube, Facebook, TikTok

    - **Organization Profiles** (`organization_profiles` table):
      - `organization_name`, `display_name`
      - `logo_url` - Organization/brand logo
      - `bio`, `website_url`
      - `contact_email`, `contact_phone`
      - Social links: Instagram, Facebook, Twitter, YouTube, TikTok, LinkedIn

    **Enhanced SSO Flow**:
    ```
    User logged into gigpigs.app
    → Clicks "Social Media" in sidebar
    → PostizSSO component fetches user/org profile
    → Initiates OAuth with profile metadata
    → Supabase OAuth validates session
    → Returns auth code + userinfo claims
    → Postiz exchanges code for access token
    → Fetches userinfo with profile photo/logo
    → Creates/updates Postiz user with synced data
    → User sees their actual photo/logo in Postiz
    ```

    **Implementation Plan**:

    **Phase 5.1: Update Documentation & Frontend (1 hour)**
    - Update `/root/postiz/SSO_SETUP_GUIDE.md`
      - Replace all `standupysydney.au` → `gigpigs.app`
      - Add profile syncing configuration section
      - Document userinfo endpoint claims mapping
    - Update `PostizSSO.tsx` component
      - Fetch user/org profile before OAuth redirect
      - Determine if user or organization context
      - Prepare profile metadata for OAuth flow
    - Update `SocialMedia.tsx` page
      - Correct branding to "GigPigs"
      - Update domain references

    **Phase 5.2: Configure Supabase OAuth (Manual Dashboard - 30 mins)**
    - Enable OAuth 2.1 Server (Beta) in Supabase dashboard
    - Create OAuth application:
      - Name: "Postiz Social Manager"
      - Redirect URI: `https://social.gigpigs.app/auth/callback`
    - Configure userinfo claims mapping:
      - `name` → `profiles.display_name` OR `organization_profiles.display_name`
      - `picture` → `profiles.avatar_url` OR `organization_profiles.logo_url`
      - `email` → `profiles.email` OR `organization_profiles.contact_email`
    - Copy Client ID and Secret

    **Phase 5.3: Configure Postiz Environment (15 mins)**
    - Update `/root/postiz/postiz.env`:
    ```bash
    # === GigPigs SSO Integration ===
    POSTIZ_GENERIC_OAUTH=true
    NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME="GigPigs"
    NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL="https://gigpigs.app/logo.png"

    # Supabase OAuth Endpoints
    POSTIZ_OAUTH_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co
    POSTIZ_OAUTH_AUTH_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/oauth/authorize
    POSTIZ_OAUTH_TOKEN_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/oauth/token
    POSTIZ_OAUTH_USERINFO_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/userinfo

    # OAuth Credentials (from Phase 5.2)
    POSTIZ_OAUTH_CLIENT_ID=[CLIENT_ID_FROM_SUPABASE]
    POSTIZ_OAUTH_CLIENT_SECRET=[CLIENT_SECRET_FROM_SUPABASE]

    # Profile Syncing (map OAuth claims to Postiz fields)
    POSTIZ_OAUTH_NAME_CLAIM="name"
    POSTIZ_OAUTH_EMAIL_CLAIM="email"
    POSTIZ_OAUTH_PICTURE_CLAIM="picture"
    ```

    **Phase 5.4: Enhance PostizSSO Component (1 hour)**
    - Fetch user profile before OAuth redirect
    - Determine context: personal vs organization
    - Query appropriate profile table
    - Extract profile data:
      ```typescript
      const profile = user.organization_id
        ? await fetchOrganizationProfile(user.organization_id)
        : await fetchUserProfile(user.id);

      const profileData = {
        name: profile.display_name,
        email: profile.email || profile.contact_email,
        picture: profile.avatar_url || profile.logo_url
      };
      ```
    - Include metadata in OAuth state/claims
    - Build authorization URL with proper scopes:
      ```typescript
      const authUrl = new URL(POSTIZ_OAUTH_AUTH_URL);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', POSTIZ_OAUTH_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', 'https://social.gigpigs.app/auth/callback');
      authUrl.searchParams.set('scope', 'openid profile email');
      ```

    **Phase 5.5: Test & Verify (30 mins)**
    - Restart Postiz: `cd /root/postiz && docker compose restart postiz-app`
    - Login to gigpigs.app
    - Click "Social Media" in sidebar
    - Verify:
      - ✅ Redirects to Postiz auth page
      - ✅ Auto-login succeeds
      - ✅ Profile photo/logo syncs correctly
      - ✅ Organization name displays (if org context)
      - ✅ Email matches user account
    - Test both contexts:
      - Personal profile → avatar_url syncs
      - Organization profile → logo_url syncs

    **Key Benefits**:
    - Users don't manually upload logo again in Postiz
    - Consistent branding across GigPigs + Postiz
    - One-click seamless experience
    - Organization logo automatically appears as "P" icon replacement

    **Blockers**:
    - Supabase OAuth 2.1 Server enablement (manual dashboard step)
    - Profile syncing depends on userinfo endpoint capabilities
    - May require Supabase Pro plan for OAuth features (needs verification)

    **Estimated Time**: 3-3.5 hours total
    **Priority**: HIGH - Critical for seamless user experience
    **Dependencies**: Phase 4 (SSO foundation) must be complete first

#### Postiz SSO Completion Checklist (Updated 2025-10-22)

**Task 1 – Update SSO Documentation** ✅  
File: `/root/postiz/SSO_SETUP_GUIDE.md`

- Replace the "⚠️ Requires Custom Implementation" banner with "✅ Complete – N8N Implementation"
- Document the N8N-based flow: workflow ID `gigpigs-postiz-sso`, webhook endpoint `/auth/gigpigs-sso`, token validation diagram, and redirect behaviour
- Update Step 1 to reference the automation-first approach instead of modifying the Postiz backend
- Add troubleshooting guidance for workflow failures and highlight the current redirect flow once authentication succeeds

**Task 2 – Test SSO End-to-End** 🧪  
Goal: confirm the live flow from GigPigs → Postiz runs without regressions.

1. Sign in at `gigpigs.app` with a test account.
2. Click **Social Media** in the sidebar to launch the SSO.
3. Verify the redirect hits `https://social.gigpigs.app/auth/gigpigs-sso?...`.
4. Watch the `gigpigs-postiz-sso` workflow in n8n:
   - Workflow triggers
   - Token validation succeeds
   - Redirect occurs back to dashboard
5. Confirm the Postiz dashboard loads with expected query params and capture the current behaviour for documentation.

**Task 3 – Investigate Postiz Session Handling** 🔍  
Objective: decide whether additional automation or UI work is required after the redirect.

- Check whether Postiz automatically consumes `sso=success` or other query parameters.
- Search the Postiz codebase for its session creation endpoints (`/api/auth/session` and related handlers).
- Map out the current auth flow and determine if an API call is required to finalise the session.
- Evaluate follow-up options:
  - Option A: extend the n8n workflow to call a Postiz session API.
  - Option B: add a lightweight Postiz frontend handler to consume the SSO payload.
  - Option C: leverage the Postiz public API to mint the session programmatically.

**Deliverable**: Document findings (decision + follow-up tasks) in this plan and the SSO guide.

### **Sprint 4: Task Management System** 🏗️ MAJOR FEATURE
15. 🏗️ Database schema and migrations
16. 🏗️ Core CRUD operations and service layer
17. 🏗️ UI components (list, form, filters, cards, link selector)
18. 🏗️ Sidebar integration for all user roles
19. 🏗️ Task linking to events/gigs/messages/customers
20. 🏗️ Route setup and role-based protection

---

## Notes

- **Automation Dependency**: Headshots folder structure is critical for marketing content automation pipeline (confirmed lineups → Canva templates → auto-scheduling)
- **File Upload**: Success/failure notifications already exist, no progress bar needed
- **File Size Limits**: Will be documented with per-user allowance text in future update
- **Task System**: Universal feature - every user regardless of role should have access
- **Organization Issues**: Specific error details needed for debugging

---

## Completed Tasks

### Recent Completions (2025-10-20)
- ✅ **Vouch System Crown Icons** - Complete overhaul of vouch system UI
  - Removed all star rating components (VouchSystem.tsx, VouchSystemEnhanced.tsx, VouchCard.tsx)
  - Implemented crown icon with dynamic gold fill animation
  - Updated ProfileHeader vouch button from Award (ribbon) to Crown icon
  - Removed "Start typing to fill the crown..." instruction section
  - Changed title to "Give a Vouch" with crown icon in header
  - Crown fills from white outline to gold as user types message

- ✅ **Calendar Navigation Fix** - Fixed tab navigation bug
  - Profile.tsx now listens to URL search parameter changes
  - Changed useEffect dependency from `[]` to `[location.search]`
  - Calendar link in sidebar now properly switches tabs from any starting tab

- ✅ **Organization Profile Form Enhancements** - Added custom type and TikTok field
  - Added conditional custom organization type input (appears when "Other" selected)
  - Added TikTok social media field to form (alongside Twitter, under Facebook)
  - Updated OrganizationProfileFormData interface with new fields

### Previous Completions
- ✅ Fixed profile loading issue (ProfileContext refactor to use service layer)
- ✅ Fixed Sign In button navigation in Profile.tsx
- ✅ Cleaned up multiple dev servers (now running on single port)
- ✅ Added ProfileSwitcher to CRM sidebar
- ✅ Reorder sidebar (Calendar before Applications)
- ✅ Standardize Sign In prompts across 18 files (Dashboard Card style)

---

---

## 10. **Social Media Scheduling Integration** ✅ RESEARCH COMPLETE - DECISION PENDING

**Goal**: Integrate social media scheduling capabilities into Stand Up Sydney platform
**Status**: Comprehensive technical analysis complete, awaiting user decision on approach

### Option 1: Postiz Integration (Recommended - Initially Explored)

**Postiz Overview**:
- Open-source social media scheduling tool (AGPL-3.0 license)
- Supports 14+ platforms: Instagram, X/Twitter, Facebook, LinkedIn, TikTok, YouTube, Reddit, Pinterest, Threads, Bluesky, Discord, Slack, Mastodon, Dribbble
- AI-powered content features
- Team collaboration and analytics
- Tech Stack: NX Monorepo, NextJS, NestJS, Prisma (PostgreSQL), Redis (BullMQ), Resend

**Integration Approaches**:

1. **Self-Hosted Deployment** (Most Control):
   - Deploy Postiz as separate service alongside Stand Up Sydney
   - Use Postiz's Public API for integration
   - NodeJS SDK available: `@postiz/node`
   - N8N custom node available (already using N8N!)
   - Requires: Node 22+, PostgreSQL, Redis
   - **Pros**: Full control, customize UI/features, no recurring costs
   - **Cons**: Additional infrastructure, maintenance overhead

2. **Public API Integration** (Easiest):
   - Use Postiz hosted service + Public API
   - Embed scheduling UI via iframe/components
   - **Pros**: No infrastructure, maintained by Postiz team
   - **Cons**: Recurring costs, less customization, external dependency

3. **Hybrid Approach** (Recommended):
   - Use Postiz's NodeJS SDK with our existing infrastructure
   - Build custom UI matching Stand Up Sydney design system
   - Store scheduling data in our Supabase database
   - Use Postiz API for actual posting to social platforms
   - **Pros**: Best of both worlds, seamless UX, leverages Postiz's platform integrations
   - **Cons**: More development work upfront

**Compatibility Analysis**:

✅ **Compatible Technologies**:
- Both use React (Postiz: NextJS, Us: Vite+React)
- Both use PostgreSQL (Postiz: Prisma, Us: Supabase)
- Both use TypeScript
- Postiz has NodeJS SDK - perfect for our backend
- Postiz has N8N node - we already use N8N for automation!

⚠️ **Considerations**:
- Postiz requires Node 22+ (we use Node version per package.json)
- Postiz uses Redis for queue management (we don't currently use Redis)
- AGPL-3.0 license requires derivative works to be open-source if distributed

### Integration Plan (Phase 1 - Research):

1. **Evaluate Self-Hosting Requirements**:
   - Redis infrastructure setup
   - Node version compatibility check
   - PostgreSQL schema conflicts/coexistence
   - Resource requirements (CPU, memory, storage)

2. **Test Postiz API & SDK**:
   - Install `@postiz/node` in test environment
   - Test authentication flow
   - Test scheduling API endpoints
   - Measure API response times and reliability

3. **Prototype Integration Options**:
   - Option A: Embedded iframe approach
   - Option B: Custom UI with SDK backend
   - Option C: N8N workflow automation approach

4. **Design UX/UI Mockups**:
   - Social media scheduler integrated into Stand Up Sydney
   - Comedian workflow: Share gig announcements
   - Promoter workflow: Auto-schedule event marketing
   - Venue workflow: Promote upcoming shows

### Use Cases for Stand Up Sydney:

**Comedians**:
- Share upcoming gigs to social media
- Cross-post to multiple platforms
- Schedule content during off-peak hours
- Auto-announce confirmed lineups

**Promoters**:
- Schedule event announcements
- Create marketing campaigns for shows
- Auto-post lineup graphics (from Canva automation)
- Share ticket sales updates

**Venues**:
- Promote weekly comedy nights
- Share highlight reels and photos
- Announce special events

**Future Automation Vision**:
- Confirmed lineup → Pull headshots from Media Library → Generate templates → **Auto-schedule via Postiz** → Post to social media
- Full automation pipeline will be built once platform is stable

### Next Steps (Post Sprint 2):

**User Requirement**: Show both Self-Hosted and Hybrid approaches on test servers for comparison
- **Branding**: Remove all "Postiz" branding
- **Styling**: Customize colors, fonts, styles to match Stand Up Sydney design system
- **Comparison**: Deploy both on test servers for user evaluation

**Phase A - Self-Hosted Test Instance**:
1. Deploy Postiz on separate subdomain (e.g., `social.standupsydney.com`)
2. Set up Redis infrastructure
3. Verify Node 22+ compatibility
4. Configure OAuth for social platforms
5. Apply Stand Up Sydney branding/theme
6. Test full scheduling workflow

**Phase B - Hybrid Integration Prototype**:
1. Install `@postiz/node` SDK in Stand Up Sydney codebase
2. Build custom UI components matching our design system
3. Create API wrapper service (`postiz-service.ts`)
4. Store scheduling data in Supabase
5. Test scheduling via SDK
6. Build minimal working prototype

**Comparison Criteria**:
- ✅ UX/UI customization freedom
- ✅ Maintenance overhead
- ✅ Performance and reliability
- ✅ Cost (infrastructure vs development time)
- ✅ Future scalability

**User Decision Point**: After testing both, choose final approach for production build

**Dependencies**:
- Headshots folder structure (Sprint 2, Task #8)
- Redis infrastructure (if self-hosting)

**Note**: Full automation pipeline (headshots → templates → scheduling → posting) will be built once platform is stable.

**Files to Create**:
- `/root/agents/src/services/social/postiz-service.ts` - API wrapper
- `/root/agents/src/components/social/SocialScheduler.tsx` - Main UI component
- `/root/agents/src/pages/SocialMedia.tsx` - Dedicated scheduling page
- Integration with Media Library for selecting content
- Integration with Events for auto-scheduling announcements

---

### 11. **Email Management & Post-Show Thank You System** 🆕 PLANNED

**Goal**: Implement Resend-powered email system with automated post-show "Thank You & Review" emails that increase customer engagement and comedian audience growth.

**Business Value**:
- Increase Google/TripAdvisor review volume by 40-60%
- Build comedian mailing lists organically via audience opt-ins
- Improve customer retention through personalized follow-up
- Track review conversion rates per show/venue
- Enable direct comedian-to-fan communication

---

#### Core Features

**1. Post-Show Thank You Emails**
- Automated trigger when event status changes to "completed"
- Professional "Thank you for attending!" template
- Review request links for Google and TripAdvisor
- Event lineup with comedian social media links
- Per-comedian opt-in checkboxes for mailing lists
- Venue information and next show announcements

**2. Universal CRM Architecture**
- Every profile type gets their own CRM: Comedian, Promoter, Organization, Photographer, Videographer, Agency
- Customers stored in centralized GigPigs database
- Hierarchical visibility model:
  - Promoters/Organizations see their ticket buyers
  - Managers see their comedians' audiences + organization audiences
  - Comedians see their own opted-in fans
  - Photographers/Videographers see their clients

**3. Opt-In Consent Management**
- Checkbox per comedian in lineup
- GDPR-compliant double opt-in (optional)
- Consent timestamp and source tracking
- Easy unsubscribe links in all emails
- Opt-in rate tracking per show/comedian

**4. Review Request Tracking**
- Unique tracking links for Google/TripAdvisor
- Conversion tracking (clicked → reviewed)
- Per-show review conversion metrics
- Venue-specific review link generation
- Review reminder emails (if not clicked in 7 days)

**5. Email Template System**
- Handlebars-based templates with variables
- Template preview with sample data
- A/B testing support (future)
- Mobile-responsive design
- Customizable branding per organization

---

#### Database Schema

**email_templates**
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'post_show_thanks', 'review_reminder', 'custom'
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL, -- Handlebars template
  variables JSONB NOT NULL, -- {event, lineup, venue, customer}
  organization_id UUID REFERENCES organization_profiles(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
```

**email_sends**
```sql
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resend_id TEXT UNIQUE, -- Resend API email ID
  template_id UUID REFERENCES email_templates(id),
  event_id UUID REFERENCES events(id),
  customer_id UUID REFERENCES customers(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  error_message TEXT,
  metadata JSONB -- Event/lineup data snapshot
);

CREATE INDEX idx_email_sends_event ON email_sends(event_id);
CREATE INDEX idx_email_sends_customer ON email_sends(customer_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
```

**crm_contacts** (Universal CRM)
```sql
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID, -- Comedian, Photographer, Videographer, etc.
  organization_id UUID REFERENCES organization_profiles(id),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  source TEXT NOT NULL, -- 'post_show_optin', 'manual_add', 'event_booking', 'website_signup'
  source_event_id UUID REFERENCES events(id),
  consent_given_at TIMESTAMPTZ NOT NULL,
  consent_ip_address INET,
  opted_in BOOLEAN DEFAULT true,
  opted_out_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_owner CHECK (profile_id IS NOT NULL OR organization_id IS NOT NULL)
);

CREATE INDEX idx_crm_contacts_profile ON crm_contacts(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_crm_contacts_org ON crm_contacts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_crm_contacts_customer ON crm_contacts(customer_id);
CREATE INDEX idx_crm_contacts_source ON crm_contacts(source);
```

**review_requests**
```sql
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_send_id UUID REFERENCES email_sends(id),
  event_id UUID REFERENCES events(id) NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  venue_id UUID REFERENCES venues(id),
  platform TEXT NOT NULL, -- 'google', 'tripadvisor', 'facebook'
  tracking_url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ, -- Updated manually or via API webhook
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_review_requests_event ON review_requests(event_id);
CREATE INDEX idx_review_requests_platform ON review_requests(platform);
```

---

#### Implementation Phases

**Phase 1: Resend Setup & Configuration** (2 hours)
- Install Resend npm package: `npm install resend`
- Create Resend account and obtain API key
- Add `VITE_RESEND_API_KEY` to environment variables
- Create `src/services/email/resend-service.ts`:
  - `sendEmail(to, subject, html, metadata)` wrapper
  - Webhook handler for delivery/open/click events
  - Error handling and retry logic
- Test basic email sending

**Phase 2: Database Schema & Migrations** (1.5 hours)
- Create Supabase migrations for 4 new tables
- Set up Row Level Security (RLS) policies:
  - `email_templates`: Org admins can CRUD their templates
  - `email_sends`: Users can view their own send history
  - `crm_contacts`: Profile owners see their contacts, managers see downstream
  - `review_requests`: Event organizers see their review requests
- Generate TypeScript types
- Create database indexes for performance

**Phase 3: Post-Show Email Automation** (3 hours)
- Create N8N workflow: "Post-Show Thank You Automation"
  - Trigger: Event status changes to "completed"
  - Fetch event details, lineup, venue, ticket buyers
  - For each ticket buyer:
    - Generate personalized email with Handlebars
    - Create review tracking links
    - Send via Resend API
    - Log to `email_sends` table
- Create email template:
  - Subject: "Thank you for attending {event_name}! 🎤"
  - Body: Lineup grid with photos + social links
  - Review buttons for Google/TripAdvisor
  - Opt-in checkboxes (one per comedian)
  - Footer with unsubscribe link
- Test with sample event data

**Phase 4: CRM Contact Management** (2.5 hours)
- Create `src/hooks/useCRMContacts.ts`:
  - `useComedianContacts(profileId)` - Fetch comedian's opted-in fans
  - `useOrganizationContacts(orgId)` - Fetch org's customers
  - `useManagerContacts(userId)` - Hierarchical view
- Create `src/components/crm/ContactsList.tsx`:
  - Table with filters (source, tags, opt-in date)
  - Export to CSV functionality
  - Bulk actions (add tags, send email)
- Create `src/pages/CRMContacts.tsx`:
  - Role-based contact view
  - Search and filtering
  - Opt-in rate statistics

**Phase 5: Email Tracking & Analytics** (2 hours)
- Create Resend webhook endpoint: `src/services/email/resend-webhook-handler.ts`
  - Handle: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`
  - Update `email_sends` table with event timestamps
- Create `src/components/analytics/EmailMetrics.tsx`:
  - Open rate, click rate, bounce rate charts
  - Per-event review conversion metrics
  - Comedian opt-in performance
- Add to dashboard: Email performance summary widget

---

#### Email Template Structure

**Post-Show Thank You Template** (Handlebars):
```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - {{event.name}}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #7C3AED;">Thank you for attending {{event.name}}! 🎤</h1>

  <p>Hi {{customer.first_name}},</p>

  <p>We hope you had a fantastic time at <strong>{{event.name}}</strong> on {{event.date}}!</p>

  <h2>Help Us Grow</h2>
  <p>If you enjoyed the show, we'd love if you could leave us a review:</p>

  <div style="margin: 20px 0;">
    <a href="{{review_links.google}}" style="background: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">Review on Google</a>
    <a href="{{review_links.tripadvisor}}" style="background: #00AF87; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">Review on TripAdvisor</a>
  </div>

  <h2>Tonight's Lineup</h2>
  <p>Meet the comedians who made you laugh:</p>

  {{#each lineup}}
  <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin: 10px 0;">
    <img src="{{this.profile.avatar_url}}" alt="{{this.profile.name}}" style="width: 80px; height: 80px; border-radius: 50%; float: left; margin-right: 15px;">
    <h3 style="margin: 0;">{{this.profile.name}}</h3>
    <p style="color: #6B7280; margin: 5px 0;">{{this.bio}}</p>

    <div style="margin-top: 10px;">
      {{#if this.social.instagram}}
      <a href="https://instagram.com/{{this.social.instagram}}" style="color: #E4405F; text-decoration: none; margin-right: 10px;">📷 Instagram</a>
      {{/if}}
      {{#if this.social.tiktok}}
      <a href="https://tiktok.com/@{{this.social.tiktok}}" style="color: #000; text-decoration: none; margin-right: 10px;">🎵 TikTok</a>
      {{/if}}
    </div>

    <div style="margin-top: 10px; clear: both;">
      <label style="display: block;">
        <input type="checkbox" name="optin_{{this.profile.id}}" value="true" style="margin-right: 5px;">
        Get updates directly from {{this.profile.name}}
      </label>
    </div>
  </div>
  {{/each}}

  <h2>See You Again Soon!</h2>
  <p>Our next show is on {{next_event.date}} at {{next_event.venue.name}}. <a href="{{next_event.booking_url}}">Get tickets now!</a></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">

  <p style="font-size: 12px; color: #6B7280;">
    You received this email because you attended {{event.name}}.<br>
    <a href="{{unsubscribe_url}}" style="color: #6B7280;">Unsubscribe from all emails</a>
  </p>
</body>
</html>
```

---

#### Data Flow

**Post-Show Email Automation**:
```
Event Status → "Completed"
      ↓
N8N Workflow Triggered
      ↓
Fetch: Event, Lineup, Venue, Ticket Buyers
      ↓
For Each Ticket Buyer:
  - Generate review tracking URLs
  - Render email template with Handlebars
  - Send via Resend API
  - Create email_sends record
  - Create review_requests records (Google + TripAdvisor)
      ↓
Resend Delivers Email
      ↓
Webhook Updates: delivered_at, opened_at, clicked_at
      ↓
Customer Clicks Review Link
      ↓
Review Request Tracking: clicked_at updated
```

**Opt-In Processing** (Future Phase):
```
Customer Checks Comedian Opt-In Checkbox
      ↓
Form Submit → Backend API
      ↓
Create crm_contacts Record:
  - profile_id: Comedian's UUID
  - customer_id: Customer UUID
  - source: 'post_show_optin'
  - source_event_id: Event UUID
  - consent_given_at: NOW()
  - consent_ip_address: Customer IP
      ↓
Customer Added to Comedian's CRM
      ↓
Manager Sees Contact in Hierarchical View
```

---

#### Files to Create

**Services**:
- `/root/agents/src/services/email/resend-service.ts` - Resend API wrapper
- `/root/agents/src/services/email/template-renderer.ts` - Handlebars template engine
- `/root/agents/src/services/email/resend-webhook-handler.ts` - Delivery tracking
- `/root/agents/src/services/crm/contacts-service.ts` - CRM contact management

**Components**:
- `/root/agents/src/components/email/EmailTemplateEditor.tsx` - Template CRUD
- `/root/agents/src/components/email/EmailPreview.tsx` - Preview with sample data
- `/root/agents/src/components/crm/ContactsList.tsx` - CRM contacts table
- `/root/agents/src/components/crm/OptInStats.tsx` - Opt-in conversion metrics
- `/root/agents/src/components/analytics/EmailMetrics.tsx` - Email performance charts

**Pages**:
- `/root/agents/src/pages/EmailTemplates.tsx` - Template management
- `/root/agents/src/pages/CRMContacts.tsx` - Contact list and filters
- `/root/agents/src/pages/ReviewTracking.tsx` - Review request analytics

**Hooks**:
- `/root/agents/src/hooks/useEmailTemplates.ts` - Template CRUD hooks
- `/root/agents/src/hooks/useCRMContacts.ts` - CRM contact hooks
- `/root/agents/src/hooks/useEmailSends.ts` - Send history hooks
- `/root/agents/src/hooks/useReviewRequests.ts` - Review tracking hooks

**Database**:
- `/root/agents/supabase/migrations/{timestamp}_create_email_templates.sql`
- `/root/agents/supabase/migrations/{timestamp}_create_email_sends.sql`
- `/root/agents/supabase/migrations/{timestamp}_create_crm_contacts.sql`
- `/root/agents/supabase/migrations/{timestamp}_create_review_requests.sql`

**N8N Workflows**:
- `/root/.n8n/post_show_thank_you_automation.json` - Main email workflow
- `/root/.n8n/review_reminder_workflow.json` - 7-day reminder for non-clickers

**Environment Variables**:
```bash
# Resend API
VITE_RESEND_API_KEY=re_xxx
VITE_RESEND_WEBHOOK_SECRET=whsec_xxx

# Review Links
VITE_GOOGLE_REVIEW_BASE_URL=https://g.page/r/{place_id}/review
VITE_TRIPADVISOR_REVIEW_BASE_URL=https://www.tripadvisor.com/UserReview-g{geo_id}-d{location_id}
```

---

#### Testing Plan

**Unit Tests**:
- Template rendering with Handlebars
- Email metadata extraction
- Tracking URL generation
- Opt-in consent validation

**Integration Tests**:
- Send test email via Resend API
- Webhook delivery event processing
- Review link click tracking
- CRM contact creation with opt-in

**E2E Tests**:
1. Complete event → Email sent to attendees
2. Customer opens email → `opened_at` updated
3. Customer clicks review link → `clicked_at` updated
4. Customer checks comedian opt-in → CRM record created
5. Manager views hierarchical contacts → Sees opted-in fans

---

#### Success Metrics

**Email Performance**:
- Open rate: Target 40%+ (industry average: 21%)
- Click-through rate: Target 15%+ (industry average: 2.6%)
- Review conversion rate: Target 5%+ (excellent)
- Bounce rate: Target <2%

**CRM Growth**:
- Opt-in rate per comedian: Target 20%+ per show
- Average contacts per comedian after 10 shows: 100+
- Manager engagement: Weekly contact list views

**Review Generation**:
- Reviews per show: Target 5-10 new reviews
- Time to first review: <24 hours after email sent
- Platforms: 60% Google, 30% TripAdvisor, 10% Facebook

---

#### Future Enhancements (Email System)

**Phase 6: Email Campaigns** (Future)
- Send custom emails to CRM contacts
- Segment by tags, event attendance, location
- Drip campaigns for new comedian followers
- Event announcement broadcasts

**Phase 7: SMS Integration** (Future)
- Post-show SMS thank you (via Twilio)
- Review request via SMS (higher open rates)
- Opt-in via SMS keyword (e.g., "TEXT GIGPIGS to 12345")

**Phase 8: Review Incentives** (Future)
- Discount codes for reviewers (10% off next ticket)
- Entry into monthly prize draw for reviewers
- "Reviewer of the Month" feature on website

---

**Total Development Effort**: 11 hours (5 phases)
- Phase 1: Resend Setup (2h)
- Phase 2: Database Schema (1.5h)
- Phase 3: Post-Show Automation (3h)
- Phase 4: CRM Management (2.5h)
- Phase 5: Email Tracking (2h)

**Dependencies**:
- Resend account (Free tier: 100 emails/day, $20/mo for 50k emails)
- Event completion trigger implemented
- Customer data in `customers` table
- Venue Google/TripAdvisor IDs stored

---

### 12. **Platform Performance & UI Consistency Fixes** 🆕 PLANNED

**Goal**: Stabilise key UX flows by reducing unnecessary queries, tightening UI polish, and improving perceived performance across profile, calendar, shows, and tasks experiences.

#### 12.1 Performance Optimisations (Critical)

**Profile Page**
- Add `staleTime` and `cacheTime` to `useProfileData` to prevent redundant refetches.
- Lazy-load profile interests so the query fires only when the tab is visible.
- Introduce loading skeletons to avoid blank states during fetches.

**Calendar & Shows**
- Add targeted indexes for `session_complete` and `events` queries to remove full-table scans.
- Implement pagination within event lists; stop loading the entire dataset in one request.
- Debounce search and filter inputs (300 ms) to minimise re-render churn.

**Tasks Page**
- Remove duplicate queries caused by rendering `TaskStatisticsWidget` four times.
- Memoise expensive statistics calculations with `useMemo`.
- Apply a 5-minute `staleTime` to task queries to limit polling.

#### 12.2 Tasks Page – Deduplicate Statistics

- Root cause: statistics grids render four times at the top of the page.
- Fix: keep a single statistics grid (current lines ~191–202 in `TaskDashboard.tsx`) and delete the repeated `TaskStatisticsWidget` instances.
- Ensure the surviving widget receives the consolidated dataset.

#### 12.3 UI Consistency – Standardise Buttons

- Current issues: outlined buttons on Browse Shows, inconsistent sizing on Tasks, mixed use of `variant="outline"`.
- Standardise on dark-background buttons with consistent `h-10` height and `border-border/50`.
- Remove white borders entirely; update shared filter/action buttons across Shows and Tasks.

#### 12.4 Browse Shows Enhancements

- **Default past events to hidden**: initialise `showPastEvents` to `false` and make the button label reflect the hidden state.
- **Calendar view**: add a `ShowsCalendarView` component and extend view modes to `grid | map | calendar`, mirroring `ProfileCalendarView`.
- **Button styling cleanup**: remove white outline from the Map toggle, align filter button sizing, and fix inconsistent input widths.

#### 12.5 Database Performance

Add the following indexes to Supabase:

```sql
CREATE INDEX IF NOT EXISTS idx_session_complete_start_local
ON session_financials(session_start_local)
WHERE session_start_local >= NOW();

CREATE INDEX IF NOT EXISTS idx_session_complete_city
ON events_htx(venue_city);
```

#### 12.6 Files to Modify

1. `src/hooks/useProfileData.ts` – cache configuration.
2. `src/pages/TaskDashboard.tsx` – deduplicate statistics grid.
3. `src/hooks/useTasks.ts` – memoisation and stale timings.
4. `src/pages/Shows.tsx` – default past events to hidden, add calendar view, restyle buttons.
5. `src/components/shows/ShowsCalendarView.tsx` – new calendar view component.
6. `src/components/tasks/TaskStatisticsWidget.tsx` – adjust props after deduplication.
7. `supabase/migrations/` – add performance indexes.
8. Tailwind theme or shared button component – enforce consistent styling.

#### 12.7 Testing Checklist

- Profile loads in <2 s with cached data.
- Calendar switches views without noticeable delay.
- Tasks page renders a single statistics section.
- All buttons share the dark style (no white outlines).
- Past events toggle defaults to hidden and persists state.
- Calendar view renders correctly on the Shows page.

---

## Future Enhancements (Backlog)

- Media library file size limits and quota system
- Upload progress tracking (deferred - not critical)
- Nested folder organization (if needed beyond single-level)
- Task notifications and reminders
- Task collaboration features
- Task templates for common workflows
- Social media analytics dashboard
- Multi-account social media management
- Content calendar view for scheduled posts

---

**Document Status**: Living document - updated as features are completed and new requirements emerge
