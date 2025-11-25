# Profile URLs & Routing

## Overview

The Profile URLs & Routing feature provides clean, user-friendly URLs for all profile types on the Stand Up Sydney platform. Instead of generic paths like `/profile/123`, users get semantic, shareable URLs like `/comedian/chillz-skinner/dashboard` that reflect their profile identity.

This feature is designed for:
- **SEO optimization** - Human-readable URLs improve search engine discoverability
- **Social sharing** - Clean URLs are more trustworthy and shareable on social media
- **User experience** - Memorable URLs users can type and remember
- **Multi-profile support** - Each profile type has its own namespace (comedian, manager, organization, venue)
- **Recruitment insights** - 404 tracking identifies popular but missing profiles

## URL Structure

All profile URLs follow this consistent pattern:

```
/{profileType}/{slug}/{page}
```

### Components

- **profileType**: One of `comedian`, `manager`, `photographer`, `videographer`, `organization`, or `venue`
- **slug**: URL-safe identifier (lowercase letters, numbers, hyphens only)
- **page**: Section of the profile (dashboard, settings, gigs, etc.)

### Examples

```
/comedian/chillz-skinner/dashboard
/manager/social-guru/settings
/photographer/jane-photos/portfolio
/videographer/video-pro/showcase
/organization/sydney-comedy/gigs
/venue/comedy-store/events
```

## Features

### 1. URL Slug Management

Every profile has a unique `url_slug` that serves as its URL identifier.

**Slug Generation**:
- Auto-generated from profile name using `slugify()` utility
- Converts to lowercase, replaces spaces with hyphens
- Removes special characters (keeps only a-z, 0-9, -)
- Example: "The Comedy Store" → "the-comedy-store"

**Slug Validation**:
- Must be unique within profile type (enforced by unique index)
- Cannot use reserved keywords (dashboard, settings, admin, etc.)
- Real-time validation via `useSlugValidation()` hook
- Automatic collision detection with helpful error messages

**Reserved Slugs**:
```typescript
const RESERVED_SLUGS = [
  'dashboard', 'settings', 'admin', 'api', 'auth',
  'shows', 'events', 'comedians', 'managers',
  'organizations', 'venues', 'photographers',
  'applications', 'messages', 'notifications',
  'profile', 'crm', 'create-event', 'login', 'signup'
];
```

### 2. 301 Redirects for Slug Changes

When a profile's slug changes, old URLs automatically redirect to the new one.

**How it works**:
1. User updates slug from "old-slug" to "new-slug"
2. `slug_history` table records the change
3. Trigger function creates history entry with old slug
4. Anyone visiting `/comedian/old-slug/dashboard` gets:
   - 301 Permanent Redirect to `/comedian/new-slug/dashboard`
   - Query parameters preserved (`?tab=settings`)
   - SEO link equity maintained

**Database Implementation**:
```sql
-- slug_history table
CREATE TABLE slug_history (
  id uuid PRIMARY KEY,
  profile_type profile_type NOT NULL,
  profile_id uuid NOT NULL,
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  UNIQUE(profile_type, old_slug)
);

-- Automatic history tracking
CREATE TRIGGER track_slug_changes_comedians
  AFTER UPDATE OF url_slug ON comedians
  FOR EACH ROW
  EXECUTE FUNCTION record_slug_change();
```

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

**`comedians`, `photographers`, `videographers`, `organizations`, `venues`** - Added `url_slug` column
- Unique partial index: `WHERE url_slug IS NOT NULL`
- NOT NULL constraint after backfill
- Auto-generated from name via `slugify()` function

**Note:** Photographer and videographer tables added 2025-01-21 with full profile URL support. Previous promoter functionality migrated to organization-based access.

## React Components

### ActiveProfileContext

**Provider:** `<ActiveProfileProvider>`

**Hook:** `useActiveProfile()`

**Interface:**
```typescript
interface ActiveProfile {
  id: string;
  type: 'comedian' | 'manager' | 'photographer' | 'videographer' | 'organization' | 'venue';
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
- `/photographer/:slug/*`
- `/videographer/:slug/*`
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
  profileType: 'comedian' | 'manager' | 'photographer' | 'videographer' | 'organization' | 'venue';
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

## Routing Configuration

### Route Priority (App.tsx)

Routes are ordered by priority to prevent conflicts:

```typescript
<Routes>
  {/* 1. Static routes (highest priority) */}
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/shows" element={<Shows />} />
  <Route path="/comedians" element={<Comedians />} />

  {/* 2. Dynamic profile routes */}
  <Route
    path="/:profileType/:slug/*"
    element={
      <ActiveProfileProvider>
        <Suspense fallback={<LoadingFallback />}>
          <PublicProfile />
        </Suspense>
      </ActiveProfileProvider>
    }
  />

  {/* 3. 404 catch-all (lowest priority) */}
  <Route path="*" element={<NotFoundHandler />} />
</Routes>
```

### Profile Sub-Routes

Each profile type supports nested routes:

```typescript
// Within PublicProfile component
<Routes>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<ProfileDashboard />} />
  <Route path="settings" element={<ProfileSettings />} />
  <Route path="gigs" element={<ProfileGigs />} />
  <Route path="media" element={<ProfileMedia />} />
  <Route path="analytics" element={<ProfileAnalytics />} />
  <Route path="*" element={<NotFoundHandler />} />
</Routes>
```

## Testing

### Unit Tests (17 tests)

Located in `tests/`:
- `slugify.test.ts` - Slug generation (8 tests)
- `useSlugValidation.test.tsx` - Validation hook (9 tests)

**Run tests**:
```bash
npm run test -- slugify
npm run test -- useSlugValidation
```

**Coverage**:
- Slug format validation
- Reserved keyword detection
- Uniqueness checking
- Debouncing behavior
- Error handling

### Integration Tests (12 tests)

Located in `tests/`:
- `ActiveProfileContext.test.tsx` - Context behavior (6 tests)
- `PublicProfile.test.tsx` - Page rendering (3 tests)
- `NotFoundHandler.test.tsx` - 404 handling (3 tests)

**Run tests**:
```bash
npm run test -- ActiveProfileContext
npm run test -- PublicProfile
npm run test -- NotFoundHandler
```

**Coverage**:
- Profile loading from URL
- Ownership validation
- Permission checks
- 404 tracking
- Profile request submission

### E2E Tests (105 scenarios)

Located in `tests/e2e/profile-urls.spec.ts`:

**Test suites**:
1. **Public Access** (2 tests)
   - Load profile by URL
   - Navigate within profile maintaining URL structure

2. **Profile Switching** (2 tests)
   - Switch profiles and update URL
   - Persist active profile in localStorage

3. **Slug Redirects** (2 tests)
   - Redirect from old slug to new slug (301)
   - Preserve query parameters during redirect

4. **404 Handling** (3 tests)
   - Display NotFoundHandler for non-existent profile
   - Submit Instagram handle for profile request
   - Browse all profiles link

5. **Reserved Slug Validation** (2 tests)
   - Prevent creating profile with reserved slug
   - Allow valid slugs

6. **Sidebar Preferences Isolation** (2 tests)
   - Maintain separate preferences per profile
   - Persist preferences in localStorage

7. **URL Validation & Format** (2 tests)
   - Validate URL slug format
   - Maintain URL structure across navigation

**Run tests**:
```bash
npm run test:e2e -- tests/e2e/profile-urls.spec.ts
```

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

### Planned Features

1. **Custom Domains**
   - Allow organizations to use custom domains
   - Example: `https://comedy.org` → maps to `/organization/comedy-org`
   - Requires DNS configuration and SSL certificates

2. **Vanity URLs**
   - Allow premium users to reserve short slugs
   - Example: `/c/dave` → `/comedian/dave-chappelle`
   - Requires vanity URL table and special routing

3. **Slug Analytics**
   - Track profile view counts by slug
   - A/B test different slug formats
   - Identify most shared profiles

4. **Profile Verification**
   - Blue checkmark for verified profiles
   - Requires admin approval and verification process

5. **Social Media Integration**
   - Auto-sync slug from Instagram handle
   - Claim profile via social media verification

### Technical Improvements

- Slug autocomplete with availability suggestions
- Batch slug updates for admins
- Advanced 404 tracking with referrer data
- Profile templates for quick setup
- QR code generation for profile URLs
- Social media meta tags optimization

## Related Documentation

- **Architecture**: `/root/agents/CLAUDE.md` - Overall project structure
- **Database**: Supabase migrations in `/root/agents/supabase/migrations/`
- **Testing**: `/root/agents/tests/` - Unit and integration tests
- **API**: Supabase auto-generated types in `/root/agents/src/integrations/supabase/types`
- **Components**: Component library in `/root/agents/src/components/`

## Support

For questions or issues:
- Create a Linear issue with tag `profile-urls`
- Check troubleshooting section above
- Review test cases for expected behavior
- Consult Supabase logs for database errors

---

**Last Updated**: 2025-01-21
**Version**: 1.1.0
**Status**: ✅ Updated - Photographer & Videographer Support Added
