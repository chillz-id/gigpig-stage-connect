# Universal Profile Editor System

Created: 2025-11-22
Status: Completed

## Overview

Implemented a **Universal Profile Editor** that provides ONE editor component for ALL profile types (comedian, organization, photographer, videographer, manager). The system uses dynamic text labels, configurable sections, and theme-aware styling.

## Architecture

### Core Principle
Instead of maintaining 5 separate profile editors with duplicated code, we have:
- **One universal editor** that adapts via configuration
- **Central config file** defining sections, labels, tables, and field visibility per type
- **Profile-aware components** that accept `profileType` and `config` props

### Profile Types
```typescript
type ProfileType = 'comedian' | 'organization' | 'photographer' | 'videographer' | 'manager';
```

**Note**: `comedian_lite` is a **ROLE**, not a profile type. It uses the same tables as `comedian`.

## Files Created/Modified

### New Files

1. **`/root/agents/src/utils/profileConfig.ts`**
   - Central configuration for all 5 profile types
   - Defines: sections, labels, tables, fields visibility
   - Export: `getProfileConfig(profileType)` function

2. **`/root/agents/src/types/universalProfile.ts`**
   - TypeScript types for the universal profile system
   - `ProfileType`, `ProfileConfig`, `ProfileLabels`, `ProfileTables`, `ProfileFields`
   - `ProfileAwareProps` interface for components

3. **`/root/agents/src/pages/UniversalProfileEditor.tsx`**
   - Main universal profile editor page
   - Determines profile type from props or user roles
   - Loads data from appropriate table
   - Theme-aware dark styling

4. **`/root/agents/src/components/profile/UniversalProfileTabs.tsx`**
   - Dynamic accordion component for profile sections
   - Maps section keys to components
   - Dark-themed styling (`bg-slate-800/50`)

5. **`/root/agents/src/hooks/useProfileSectionOrder.ts`**
   - Universal hook for drag-and-drop section ordering
   - Maps profile types to their section order tables
   - Handles both `user_id` and `organization_id` columns

### Modified Files

1. **`/root/agents/src/pages/PublicProfile.tsx`**
   - Added lazy import for `UniversalProfileEditor`
   - Fixed named export handling: `.then(m => ({ default: m.UniversalProfileEditor }))`

2. **`/root/agents/src/components/ProfileInformation.tsx`**
   - Made `profileType` and `config` props optional with defaults
   - Uses `Partial<ProfileAwareProps>` for backwards compatibility
   - Removed Card wrapper (content now rendered directly in accordion)
   - Auto-derives config via `getProfileConfig(profileType)`

3. **`/root/agents/src/components/FinancialInformation.tsx`**
   - Removed Card wrapper for cleaner accordion nesting
   - Accepts `ProfileAwareProps` for profile-aware labels

4. **`/root/agents/src/components/ContactInformation.tsx`**
   - Updated to accept `ProfileAwareProps`

5. **`/root/agents/src/pages/Dashboard.tsx`**
   - Removed `PromoterMigrationBanner` (no longer needed)

### Database Migrations

Created section order tables for all profile types:
- `comedian_section_order` (existed)
- `organization_section_order` (new)
- `photographer_section_order` (new)
- `videographer_section_order` (new)
- `manager_section_order` (new)

Each table has:
- `id` (uuid, primary key)
- `user_id` or `organization_id` (foreign key)
- `section_order` (text array)
- `created_at`, `updated_at` timestamps
- RLS policies for owner access

## Configuration Structure

```typescript
// Example from profileConfig.ts
export const profileConfig: ProfileConfigMap = {
  comedian: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      media: 'Media Portfolio',
      primaryName: 'First Name',
      secondaryName: 'Stage Name',
      bio: 'Biography',
      // ...
    },
    tables: {
      main: 'profiles',
      media: 'comedian_media',
      accomplishments: 'comedian_accomplishments',
      // ...
    },
    fields: {
      hasSecondaryName: true,
      hasFinancial: true,
      hasRates: false,
      // ...
    },
  },
  // Similar for organization, photographer, videographer, manager
};
```

## Theme System

The app uses a custom theme context (not CSS dark mode):
- `theme-pleasure`: Purple gradient backgrounds
- `theme-business`: Gray/red gradient backgrounds

**Key styling patterns:**
- Background: `bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900` (pleasure)
- Cards: `bg-slate-800/50 backdrop-blur-sm border-slate-700`
- Text: `text-white`, `text-gray-300`
- Inputs: Theme-aware via `useTheme()` hook

## Key Behaviors

- Universal editor loads at `/org/:slug/edit` and `/comedian/:slug/edit`
- Profile type determined from URL route or user's primary role
- Sections render dynamically based on `config.sections` array
- Components skip rendering if their table doesn't exist in config
- Backwards compatible - components work with or without explicit props

## Removed Components

- `PromoterMigrationBanner` - removed (only user doesn't need migration guidance)
- `src/components/migration/` directory - deleted (empty after banner removal)

## Testing Checklist

- [x] TypeScript compilation passes
- [x] ESLint passes
- [x] Dev server runs on port 8080
- [x] Organization edit page loads (`/org/id-comedy/edit`)
- [x] Comedian edit page loads (`/comedian/chillz-skinner/edit`)
- [x] Dark theme applies consistently
- [x] No nested Card styling conflicts
- [x] Section accordion expands/collapses

## Future Enhancements (Non-blocking)

1. **CustomLinks hooks** - `useCustomLinks` and `useLinkSections` need refactoring to accept dynamic table names instead of hardcoded comedian tables

2. **Media component** - Currently shows "coming soon" placeholder; needs implementation for all profile types

3. **Drag-and-drop sections** - `useProfileSectionOrder` hook is ready; needs integration into UniversalProfileTabs

## Architecture Decisions

1. **Why Partial<ProfileAwareProps>?**
   - Backwards compatibility with existing callers (ProfileTabs.tsx)
   - Components auto-derive config when not provided
   - Gradual migration path

2. **Why remove Card wrappers from ProfileInformation/FinancialInformation?**
   - UniversalProfileTabs provides accordion container with dark styling
   - Nested Cards caused conflicting backgrounds
   - Cleaner DOM structure

3. **Why not use CSS dark mode?**
   - App has custom theme system (pleasure/business)
   - Theme classes applied to body element
   - More control over specific color schemes
