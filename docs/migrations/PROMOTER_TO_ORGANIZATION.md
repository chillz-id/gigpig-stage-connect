# Promoter to Organization Migration Guide

## Overview

**Effective Date**: 2025-01-21
**Status**: Active Migration
**Impact**: Users with `promoter` role

The promoter role has been deprecated in favor of **organization-based access**. This change provides better team collaboration, clearer event ownership, and improved permission management.

## What Changed

### Before (Promoter Role)
- Individual users had `promoter` role
- Events tied to personal profile
- Limited team collaboration
- Single-user event management

### After (Organization Profiles)
- Teams create organization profiles
- Events belong to organizations
- Multi-user collaboration
- Role-based team permissions

## For Existing Promoter Users

### Automatic Migration

✅ **No data loss** - Your existing events and data are preserved
✅ **Account access** - You can still log in and access all features
✅ **Migration banner** - Guidance displayed on dashboard

### Migration Steps

**1. Create Organization Profile**

When you log in, you'll see a migration banner with two options:

**Option A: Create Organization Profile**
- Click "Create Organization Profile" button
- Navigate to Profile Management
- Fill in organization details:
  - Organization name (e.g., "Sydney Comedy Events")
  - Description
  - Location
  - Contact information
  - Logo (optional)
- Click "Create Profile"

**Option B: Join Existing Organization**
- Ask organization admin to send you an invite
- Check your email for invitation link
- Click link to join organization
- Admin assigns you appropriate role (admin, manager, etc.)

**2. Transfer Event Ownership (Optional)**

If you have existing events as a promoter:

```sql
-- Admins can run this to transfer events to organization
UPDATE events
SET organization_id = '<your-organization-id>'
WHERE created_by = '<your-user-id>'
  AND organization_id IS NULL;
```

**Note**: Contact support to help with bulk event transfers.

**3. Update Workflows**

- **Creating Events**: Use organization profile instead of personal profile
- **Managing Applications**: Access via organization dashboard
- **Team Collaboration**: Invite team members to organization
- **CRM Access**: Now organization-scoped

## For New Users

**Promoter functionality is now organization-based:**

1. **Create Organization Profile** (not promoter role)
2. **Invite Team Members** to your organization
3. **Assign Roles** (admin, manager, viewer)
4. **Create Events** via organization profile
5. **Manage Bookings** with team collaboration

## Technical Changes

### Profile Types

**Removed:**
- `promoter` profile type

**Added:**
- `photographer` profile type (with URL-based routing)
- `videographer` profile type (with URL-based routing)

**Retained:**
- `comedian`
- `manager`
- `organization`
- `venue`

### Role-Based Access Control

**Old (Deprecated):**
```typescript
<ProtectedRoute roles={['promoter']} />
```

**New (Organization-Based):**
```typescript
<ProtectedRoute
  requireOrganization={true}
  organizationRoles={['admin', 'manager']}
/>
```

### Database Schema

**No breaking changes** - Existing `user_roles` table still contains `promoter` entries for backward compatibility.

**Migration path**:
- `promoter` role → Create organization profile
- Legacy data remains accessible
- New features require organization membership

## User Interface Changes

### Migration Banner

Displayed to all users with `promoter` role:

**Banner Message:**
> "Promoter Profiles Have Moved to Organizations. Organizations provide team-based collaboration, event management, and booking workflows."

**Actions:**
- Create Organization Profile (redirects to `/profile-management`)
- Browse Organizations (redirects to `/organizations`)
- Dismiss (hides banner for session)

**Location:** Dashboard (top of page, above all other content)

**Component:** `PromoterMigrationBanner` (`src/components/migration/PromoterMigrationBanner.tsx`)

### Profile Switcher

**Removed:**
- Promoter profile option

**Added:**
- Photographer profile switching
- Videographer profile switching

**Organizations:**
- Display organization profiles user is member of
- Switch to organization context for event management

### Navigation Changes

**Old Promoter Routes:**
- `/create-event` (required promoter role)
- `/applications` (promoter-specific)
- `/events/:id/edit` (promoter-owned events)

**New Organization Routes:**
- `/create-event` (requires organization membership)
- `/applications` (organization-scoped)
- `/events/:id/edit` (organization-owned events)
- `/organization/:slug/dashboard` (organization profile page)

## CRM Access

**Old:**
- CRM restricted to `admin`, `agency_manager`, `promoter`, `venue_manager` roles

**New:**
- CRM restricted to `admin`, `agency_manager`, `organization admins`, `venue_manager`
- Organization membership required for event/contact management
- Permissions scoped to organization data

## FAQs

### Will I lose access to my events?

**No.** All your existing events remain accessible. You can view and manage them after creating/joining an organization.

### Do I need to create a new account?

**No.** Your existing user account remains unchanged. You just need to create or join an organization profile.

### Can I be part of multiple organizations?

**Yes.** You can be a member of multiple organizations with different roles in each.

### What happens to my promoter role?

Your account still has the `promoter` role in the database for backward compatibility, but new features require organization membership. The role no longer grants access to event creation features.

### How do I invite team members?

1. Go to your organization dashboard
2. Click "Team" or "Members" tab
3. Click "Invite Member"
4. Enter email address
5. Select role (admin, manager, viewer)
6. Send invitation

### Can I switch back to promoter?

No. The promoter role is deprecated and no longer supported for new features. Organization profiles provide better collaboration and permission management.

### What if I don't want to create an organization?

You can still use the platform for:
- Viewing shows
- Browsing comedians/photographers/venues
- Managing your personal profile
- Messaging and notifications

However, **creating events** and **CRM access** require organization membership.

## Support Resources

### Getting Help

- **Documentation**: `/root/agents/docs/features/PROFILE_URLS.md`
- **Support Email**: support@standupsydney.com
- **Linear Issues**: Tag with `promoter-migration`
- **User Guide**: See "Organization Management" in help center

### Related Documentation

- [Profile URLs & Routing](/root/agents/docs/features/PROFILE_URLS.md)
- [Multi-Profile System Guide](/root/agents/docs/MULTI_PROFILE_DEVELOPER_GUIDE.md)
- [Permissions System](/root/agents/docs/PERMISSIONS_SYSTEM.md)

## Timeline

- **2025-01-21**: Migration banner deployed to production
- **2025-02-01**: Email notification sent to all promoter users
- **2025-03-01**: Promoter-specific routes begin showing organization requirement
- **2025-06-01**: Full deprecation of promoter role (6-month notice)

## Technical Implementation

### Components Modified

1. **`src/components/migration/PromoterMigrationBanner.tsx`** (new)
   - Migration banner component
   - Dismissible alert with CTA buttons
   - Only visible to `hasRole('promoter')` users

2. **`src/pages/Dashboard.tsx`**
   - Integrated migration banner at top of dashboard
   - Shows for all profile types (comedian, manager, photographer, etc.)

3. **`src/contexts/ProfileContext.tsx`**
   - Removed `promoter` from `PROFILE_TYPES` constant
   - Added `photographer` and `videographer`
   - Updated profile type union

4. **`src/contexts/ActiveProfileContext.tsx`**
   - Added photographer/videographer support
   - URL generation for new profile types
   - Profile validation for new types

5. **`src/components/layout/ProfileSwitcher.tsx`**
   - Removed promoter from available profiles
   - Added photographer/videographer switching
   - Organization profile display

### Testing Coverage

**Unit Tests (47 tests):**
- `tests/contexts/ProfileContext.test.ts` (16 tests)
- `tests/contexts/ActiveProfileContext.test.tsx` (14 tests)
- `tests/components/ProfileSwitcher.test.tsx` (8 tests)
- `tests/services/photographer-service.test.ts` (9 tests)

**Key Test Scenarios:**
- ✅ Promoter NOT in PROFILE_TYPES
- ✅ Photographer in PROFILE_TYPES
- ✅ Videographer in PROFILE_TYPES
- ✅ ProfileSwitcher excludes promoter
- ✅ URL generation for photographer/videographer
- ✅ Organization profile switching
- ✅ Migration banner visibility logic

### Database Migration

**No destructive operations** - Data preserved:

```sql
-- Promoter role remains in user_roles table
SELECT * FROM user_roles WHERE role = 'promoter';
-- Returns existing promoter users (not deleted)

-- Events remain accessible
SELECT * FROM events WHERE created_by IN (
  SELECT user_id FROM user_roles WHERE role = 'promoter'
);
-- Returns all promoter-created events

-- No cascade deletes or data loss
```

### Rollback Plan

See `/root/agents/docs/operations/ROLLBACK_PROMOTER_REMOVAL.md` for complete rollback procedures.

---

**Last Updated**: 2025-01-21
**Version**: 1.0.0
**Author**: Stand Up Sydney Platform Team
