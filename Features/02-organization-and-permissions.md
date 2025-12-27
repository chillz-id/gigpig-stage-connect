# Organizations, Teams, and Permissions

## Overview
Organizations represent promoters/venues/agencies with optional multi-type support. Team membership controls access to org resources; feature toggles exist but UI does not yet hide disabled features. Permissions layer combines Supabase RLS with client-side role checks.

## Data
- `organization_profiles` – core org record (types array, venue_subtypes array, ABN/ACN, banking/GST fields, enabled_features JSONB, feature-specific settings).
- `organization_team_members` – members with roles `owner|admin|member`; RLS allows owners/admins to manage membership.
- `organization_highlights` – achievements displayed on profile.
- `enabled_features` JSONB – flags for events/roster/bookings/deals/analytics/media/invoices/ticketing/calendar/social/notifications. Currently **not enforced in UI**.

## Frontend entry points
- `src/pages/organization/OrganizationProfile.tsx` and `OrganizationMediaLibrary.tsx` – org workspace shell and media page.
- `src/components/organization/OrganizationProfileTabs.tsx` – tab layout for org sections; currently renders all tabs regardless of `enabled_features`.
- `src/components/organization/BusinessInformation.tsx` – org identity, types, venue subtypes, social/contact info.
- `src/components/organization/FinancialDetails.tsx` – ABN/ACN/banking/GST/payment terms.
- `src/components/organization/CompanyHighlightsManager.tsx` – CRUD for highlights.
- `src/components/organization/OrganizationSettings.tsx` – UI for toggling `enabled_features` (writes to JSONB, no conditional rendering yet).

## Permissions model
- Auth roles (from `user_roles`) gate high-level access; org-specific access is from `organization_team_members` and checked in Supabase policies.
- Client gatekeeping: `ProtectedRoute` + context checks; server gatekeeping: RLS on org tables referencing membership or admin role.

## Known gaps / actions
- Enforce feature toggles: add `useOrganizationFeature(featureName)` hook, hide tabs/sections/navigation when disabled, and wrap feature components.
- Team invites/role changes lack full UX; membership edits happen in settings only.
- When adding new org types/subtypes, update `src/config/organizationTypes.ts` and any validation used in BusinessInformation.
