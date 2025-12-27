# Organization Team Permissions System

**Status**: ✅ Complete
**Last Updated**: 2025-10-20

---

## Overview

The Organization Team Permissions System provides flexible, role-based access control for organization team members with specialized manager roles and granular permissions across 9 different scopes.

### Key Features

- **Hybrid Role Model**: Generic managers + 6 specialized manager roles
- **Template + Override**: Pre-defined permission templates with Owner/Admin customization
- **Granular Permissions**: 9 scopes with view/edit/delete actions per scope
- **Blended View**: Users can choose to see org data in personal dashboard
- **Permission-Based Navigation**: UI automatically adapts based on user permissions

---

## Architecture

### Database Schema

**Tables Modified**:
- `organization_team_members`: Added `manager_type` and `custom_permissions` columns
- `profiles`: Added `show_org_in_personal_view` column

**Functions Created**:
- `get_default_permissions(manager_type, role)`: Returns default permission template
- `get_effective_permissions(organization_id, user_id)`: Returns custom overrides or defaults

**Migration File**: `supabase/migrations/20251020_add_organization_permissions.sql`

### Permission Scopes

| Scope | Description | Example Access |
|-------|-------------|----------------|
| `financial` | Invoices, payments, financial data | View invoices, edit payment terms |
| `team` | Team members, roles, permissions | View members, edit roles |
| `events` | Event creation, editing, management | Create events, edit details |
| `media` | Media library, uploads, gallery | Upload photos, edit captions |
| `social` | Social media scheduling, posts | Schedule posts, edit content |
| `tasks` | Task management, assignments | Create tasks, assign members |
| `messages` | Internal messaging, notifications | Send messages, read inbox |
| `bookings` | Comedian bookings, deals | Accept bookings, manage deals |
| `analytics` | Reports, metrics, analytics | View reports, export data |

### Manager Types

| Type | Template Permissions | Use Case |
|------|---------------------|----------|
| `general` | View most, edit some, full tasks/messages | General-purpose manager |
| `comedian_manager` | Full bookings/messages, edit events/tasks | Manages specific comedians |
| `social_media` | Full media/social, view analytics | Media library + social scheduling |
| `tour_manager` | Full events/tasks/bookings | Tour logistics + event management |
| `booking_manager` | Full bookings/messages, view financial | Deal acceptance + coordination |
| `content_manager` | Full media/social, edit events | Events + media content |
| `financial_manager` | Full financial/analytics | Invoices + financial analytics |

---

## Usage

### For Developers

#### 1. Check User Permissions in Components

```typescript
import { useOrganizationPermissions } from '@/hooks/organization/useOrganizationPermissions';

export function MyComponent() {
  const { canView, canEdit, canDelete, isLoading } = useOrganizationPermissions();

  // Check specific permission
  if (canEdit('events')) {
    return <CreateEventButton />;
  }

  if (canView('financial')) {
    return <InvoicesList />;
  }

  return null;
}
```

#### 2. Require Specific Permissions

```typescript
import { useRequirePermission } from '@/hooks/organization/useOrganizationPermissions';

export function AdminOnlyComponent() {
  // Redirects to dashboard if user lacks permission
  useRequirePermission('team', 'edit');

  return <TeamManagementPanel />;
}
```

#### 3. Conditional Navigation

```typescript
// OrganizationSidebar example
{canView('events') && (
  <SidebarMenuItem>
    <Link to="/events">Events</Link>
  </SidebarMenuItem>
)}

{canEdit('events') && (
  <SidebarMenuItem>
    <Link to="/events/create">Create Event</Link>
  </SidebarMenuItem>
)}
```

### For Organization Owners/Admins

#### Managing Team Permissions

1. **Navigate to Team Page**: `/org/{orgId}/team`
2. **View Team Members**: See all members with their roles and permissions
3. **Edit Permissions**:
   - Click "Edit Permissions" on any member
   - Choose a manager type from dropdown (applies template)
   - Or customize individual permissions using toggles
   - Save changes

#### Manager Type Templates

When selecting a manager type, default permissions are automatically applied:

- **Social Media Manager**: Full access to media and social, view analytics
- **Tour Manager**: Full access to events, tasks, bookings
- **Booking Manager**: Full access to bookings and messages
- **Comedian Manager**: Manage comedian bookings and communications
- **Content Manager**: Manage events and media content
- **Financial Manager**: Full financial and analytics access
- **General Manager**: Balanced access across most features

#### Custom Permissions

Owners and Admins can override template permissions:
1. Edit a team member's permissions
2. Toggle individual permission scopes (view/edit/delete)
3. Custom permissions override the template
4. Set to NULL to revert to template defaults

---

## Blended Personal + Organization View

### User Preference

Users can enable "Show organization data in personal dashboard" from their profile settings.

**How to Enable**:
1. Go to Profile → Settings tab
2. Find "Organization Data in Personal View" card
3. Toggle the switch to enable/disable
4. Personal dashboard will show organization events when enabled

### Implementation

**Components Updated**:
- `src/components/settings/OrgDataPreference.tsx` - Toggle component
- `src/components/AccountSettings.tsx` - Settings integration
- `src/components/dashboard/ComedianDashboard.tsx` - Blended view display

**Visual Design**:
- Purple gradient divider separates personal and org data
- Organization logo/name displayed
- "Organization Data" badge
- Quick navigation to full org dashboard
- Only visible if user has organization memberships

---

## Database Backfill

After applying the migration, run the backfill script to set manager types for existing team members:

```bash
npm run backfill:permissions
```

**What it does**:
- Fetches all organization team members
- Sets `manager_type = 'general'` for all existing manager role members
- Leaves `custom_permissions = NULL` (uses template defaults)
- Reports results

**Script Location**: `scripts/backfill-organization-permissions.ts`

---

## Files Created/Modified

### Database
- ✅ `supabase/migrations/20251020_add_organization_permissions.sql` (309 lines)

### TypeScript Types
- ✅ `src/types/permissions.ts` (421 lines)

### Hooks
- ✅ `src/hooks/organization/useOrganizationPermissions.ts` (191 lines)
- ✅ `src/hooks/useOrganizationProfiles.ts` (updated with permission fields)

### Components
- ✅ `src/components/organization/PermissionEditor.tsx` (246 lines)
- ✅ `src/components/organization/ManagerTypeSelector.tsx` (87 lines)
- ✅ `src/components/organization/PermissionBadges.tsx` (259 lines)
- ✅ `src/components/settings/OrgDataPreference.tsx` (140 lines)
- ✅ `src/components/AccountSettings.tsx` (updated)
- ✅ `src/components/dashboard/ComedianDashboard.tsx` (updated)

### Pages
- ✅ `src/pages/organization/OrganizationTeam.tsx` (updated)

### Layout
- ✅ `src/components/layout/OrganizationSidebar.tsx` (updated)

### Scripts
- ✅ `scripts/backfill-organization-permissions.ts` (142 lines)

### Documentation
- ✅ `docs/IMPLEMENTATION_PLAN.md` (updated)
- ✅ `docs/PERMISSIONS_SYSTEM.md` (this file)

---

## Testing

### Manual Testing Checklist

- [ ] Owner can edit all team member permissions
- [ ] Admin can edit all team member permissions
- [ ] Manager sees only permitted navigation items
- [ ] Manager type selection applies correct template
- [ ] Custom permissions override template
- [ ] Blended view toggle works in settings
- [ ] Organization data appears in personal dashboard when enabled
- [ ] Permission changes reflect immediately in UI
- [ ] Backfill script runs successfully
- [ ] RLS policies prevent unauthorized access

### Test Scenarios

1. **Manager Type Templates**
   - Create manager with "Social Media" type
   - Verify they have full media/social access
   - Verify they cannot see financial data

2. **Custom Permissions**
   - Edit a manager's permissions
   - Toggle specific scopes
   - Save and verify changes persist
   - Set to NULL and verify template is used

3. **Blended View**
   - Enable org data in personal view
   - Verify organization section appears
   - Verify visual distinction (purple theme)
   - Disable and verify section disappears

4. **Permission-Based Navigation**
   - Log in as manager with limited permissions
   - Verify sidebar only shows permitted items
   - Verify restricted pages redirect

---

## Future Enhancements

Possible improvements for future versions:

- [ ] **Audit Logging**: Track permission changes
- [ ] **Permission Groups**: Create reusable permission sets
- [ ] **Time-Based Permissions**: Temporary access grants
- [ ] **Delegation**: Allow managers to grant sub-permissions
- [ ] **Approval Workflows**: Require approval for sensitive actions
- [ ] **Advanced Analytics**: Permission usage reports

---

## Support

For questions or issues with the permissions system:

1. Check this documentation
2. Review implementation plan: `docs/IMPLEMENTATION_PLAN.md`
3. Examine migration file for database schema
4. Review TypeScript types in `src/types/permissions.ts`

---

## Changelog

### 2025-10-20 - Initial Release

- ✅ **Phase 1**: Database schema and migration
- ✅ **Phase 2**: TypeScript types and interfaces
- ✅ **Phase 3**: Permission checking hooks
- ✅ **Phase 4**: Team management UI components
- ✅ **Phase 5**: Route protection and conditional rendering
- ✅ **Phase 6**: Blended personal + organization view
- ✅ **Phase 7**: Migration and data backfill

**Total Implementation Time**: ~14 hours across 7 phases
