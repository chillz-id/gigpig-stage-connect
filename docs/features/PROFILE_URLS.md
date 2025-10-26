# Profile URLs & Routing

## Overview

Stand Up Sydney supports user-friendly profile URLs that allow direct access to specific profiles via clean URL patterns.

## URL Structure

```
/{profileType}/{slug}/{page}
```

**Profile Types:**
- `comedian` - Comedian profiles (table: `comedians`)
- `manager` - Manager profiles (table: `managers`)
- `organization` - Organization profiles (table: `organizations`)
- `venue` - Venue profiles (table: `venues`)

**Examples:**
- `/comedian/chillz-skinner/dashboard`
- `/manager/social-guru/settings`
- `/organization/sydney-comedy/gigs`
- `/venue/comedy-store/calendar`

## Features

### 1. URL Slug Management

**Slugification Rules:**
- Lowercase letters, numbers, and hyphens only
- Minimum 3 characters
- Auto-generated from profile name on creation
- Manually editable in profile settings
- Uniqueness enforced per profile type

**Reserved Slugs:**
The following slugs are reserved and cannot be used:
`dashboard`, `settings`, `admin`, `api`, `auth`, `create-event`, `messages`, `notifications`, `profile`, `shows`, `gigs`, `comedians`, `organizations`, `venues`, `managers`, `about`, `contact`, `privacy`, `terms`, `applications`, `invoices`, `earnings`, `tasks`, `crm`, `media-library`, `vouches`

### 2. 301 Redirects

When a user changes their profile slug:
1. Old slug → new slug mapping saved to `slug_history` table
2. Accessing old URL triggers 301 permanent redirect to new URL
3. SEO value preserved through proper HTTP status code

**Example:**
- Original URL: `/comedian/john-doe/dashboard`
- User changes slug to `johnny-d`
- New URL: `/comedian/johnny-d/dashboard`
- Old URL redirects permanently to new URL

### 3. 404 Tracking

When a user accesses a non-existent profile:
1. `NotFoundHandler` component displays
2. User can optionally provide Instagram handle
3. Request logged to `requested_profiles` table
4. Analytics track which profiles are in-demand
5. Admins can use data to recruit high-demand comedians

**Database Function:**
```sql
record_profile_request(
  p_profile_type TEXT,
  p_slug TEXT,
  p_instagram_handle TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
```

### 4. Per-Profile State Management

**Active Profile Context:**
- Tracks currently active profile (type, slug, name, avatar)
- Persists to localStorage for session continuity
- Provides `getProfileUrl(page)` helper for navigation

**Sidebar Preferences:**
- Scoped to `(user_id, profile_type, profile_id)`
- Each profile maintains independent sidebar state
- Comedian profile can hide "Vouches", manager profile still shows it

## Database Schema

### New Tables

**`managers`** - Manager profile data
- `url_slug` (TEXT, UNIQUE, NOT NULL)
- `manager_type` (social_media, tour, booking, comedian, content, financial, general, venue)
- RLS policies for public read, owner write

**`slug_history`** - 301 redirect tracking
- `old_slug`, `new_slug` mapping
- `profile_type` and `profile_id` for lookup
- Public read policy for redirect functionality

**`requested_profiles`** - 404 analytics
- `slug_attempted`, `request_count`
- `instagram_handle` for outreach
- `requested_by` array tracking user IDs

**`sidebar_preferences`** - Per-profile UI state
- Composite unique key: `(user_id, profile_type, profile_id)`
- `hidden_items` and `item_order` arrays
- Backward compatible with legacy preferences (NULL, NULL)

### Modified Tables

**`comedians`, `organizations`, `venues`** - Added `url_slug` column
- Unique partial index: `WHERE url_slug IS NOT NULL`
- NOT NULL constraint after backfill
- Auto-generated from name via `slugify()` function

## React Components

### ActiveProfileContext

**Provider:** `<ActiveProfileProvider>`

**Hook:** `useActiveProfile()`

**Interface:**
```typescript
interface ActiveProfile {
  id: string;
  type: 'comedian' | 'manager' | 'organization' | 'venue';
  slug: string;
  name: string;
  avatarUrl?: string;
}

interface ActiveProfileContextType {
  activeProfile: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile) => void;
  clearActiveProfile: () => void;
  getProfileUrl: (page?: string) => string;
}
```

**Usage:**
```typescript
const { activeProfile, setActiveProfile, getProfileUrl } = useActiveProfile();

// Set active profile
setActiveProfile({
  id: 'profile-uuid',
  type: 'comedian',
  slug: 'chillz-skinner',
  name: 'Chillz Skinner',
  avatarUrl: 'https://...'
});

// Navigate to profile page
navigate(getProfileUrl('settings')); // -> /comedian/chillz-skinner/settings
```

### PublicProfile Page

**Path:** `/src/pages/PublicProfile.tsx`

**Route patterns:**
- `/comedian/:slug/*`
- `/manager/:slug/*`
- `/organization/:slug/*`
- `/venue/:slug/*`

**Functionality:**
- Extracts `:slug` from URL params
- Fetches profile data from appropriate table
- Checks `slug_history` for 301 redirects
- Tracks 404s via `record_profile_request()`
- Sets active profile in context on load
- Renders nested routes for dashboard, settings, etc.

### NotFoundHandler Component

**Path:** `/src/components/profile/NotFoundHandler.tsx`

**Props:**
```typescript
interface NotFoundHandlerProps {
  profileType: 'comedian' | 'manager' | 'organization' | 'venue';
  attemptedSlug: string;
}
```

**Features:**
- Friendly 404 message
- Optional Instagram handle input
- "Request Profile" button
- Browse link to all profiles of type
- Success toast after recording request

### ProfileSwitcher Component

**Path:** `/src/components/layout/ProfileSwitcher.tsx`

**Updates:**
- Integrated with `ActiveProfileContext`
- Fetches profile slugs from database
- Navigation via `getProfileUrl()` instead of `/dashboard`
- Highlights active profile from context
- Preserves all existing functionality

## Utilities & Hooks

### slugify.ts

**Functions:**
```typescript
slugify(text: string): string
isReservedSlug(slug: string): boolean
validateSlug(slug: string): { valid: boolean; error?: string }
```

**Constants:**
```typescript
RESERVED_SLUGS: string[]
```

### useSlugValidation Hook

**Signature:**
```typescript
useSlugValidation(
  slug: string,
  profileType: ProfileType,
  currentProfileId?: string
): {
  isValid: boolean;
  error: string | undefined;
  isChecking: boolean;
}
```

**Features:**
- Real-time validation with 300ms debounce
- Format validation before DB check
- Uniqueness check per profile type
- Excludes current profile when editing

### useSidebarPreferences Hook

**Signature:**
```typescript
useSidebarPreferences(
  profileId?: string,
  profileType?: ProfileType
): {
  preferences: SidebarPreferences;
  isItemHidden: (itemId: string) => boolean;
  getItemOrder: () => string[];
  hideItem: (itemId: string) => Promise<void>;
  showItem: (itemId: string) => Promise<void>;
  setItemOrder: (order: string[]) => Promise<void>;
}
```

**Features:**
- Per-profile preferences when `profileId` and `profileType` provided
- Legacy global preferences when parameters omitted
- React Query caching with optimistic updates

## Migration Guide

### For Existing Users

**Automatic Slug Generation:**
- All existing profiles auto-assigned slugs based on name
- Slugs are lowercase with hyphens
- Duplicates get numeric suffix (e.g., `john-doe`, `john-doe-2`)

**Sidebar Preferences Migration:**
- Existing preferences migrated from `notification_preferences.ui_preferences` JSONB
- Migrated as global preferences (NULL profile_type/profile_id)
- Per-profile preferences created on first profile switch

### For New Features

**Adding New Profile Types:**
1. Create table with `url_slug` column
2. Add to `ActiveProfile` type union
3. Add route pattern in `App.tsx`
4. Add to `PROFILE_TABLE_MAP` in hooks
5. Update validation and reserved slugs

**Adding New Pages:**
1. Add route to nested routes in `PublicProfile`
2. Update `getProfileUrl()` page parameter type
3. Add page to sidebar menu items
4. Test navigation flow

## Testing

**Unit Tests:**
- `tests/utils/slugify.test.ts` - 14 tests for slug utilities
- `tests/hooks/useSlugValidation.test.tsx` - 3 tests for validation hook
- `tests/contexts/ActiveProfileContext.test.tsx` - 12 tests for context

**E2E Tests:**
- `tests/e2e/profile-urls.spec.ts` - 6 scenarios covering full flow

**Coverage:** 100% for all new utilities and hooks

## Deployment Checklist

- [ ] Run `npm run test` - all tests passing
- [ ] Run `npm run test:e2e` - all E2E tests passing
- [ ] Run `npm run build` - production build succeeds
- [ ] Verify migrations applied to production database
- [ ] Regenerate TypeScript types: `npm run types:generate`
- [ ] Test 301 redirects in production
- [ ] Verify 404 tracking in `requested_profiles` table
- [ ] Monitor Sentry for any URL-related errors

## Troubleshooting

**Issue: Slug already taken**
- Check uniqueness in appropriate table
- Try adding numeric suffix
- Verify profile type matches table

**Issue: 301 redirect not working**
- Verify `slug_history` entry exists
- Check `old_slug` matches attempted URL
- Ensure RLS policy allows public SELECT

**Issue: 404 not tracked**
- Verify `record_profile_request()` function exists
- Check function permissions (SECURITY DEFINER)
- Inspect `requested_profiles` table

**Issue: Sidebar preferences not persisting**
- Check composite key: (user_id, profile_type, profile_id)
- Verify `activeProfile` context is set
- Check RLS policies on `sidebar_preferences`

## Future Enhancements

- [ ] Custom domains for organizations (e.g., `sydney-comedy.gigpigs.app`)
- [ ] Vanity URLs for verified comedians (e.g., `/verified/chillz`)
- [ ] QR code generation for profile URLs
- [ ] Social media meta tags for profile sharing
- [ ] Analytics dashboard for profile visits
