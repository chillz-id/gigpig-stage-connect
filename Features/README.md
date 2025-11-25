# Features Index

Purpose: give coding agents a single place to understand every major feature, the data it uses, and the React/Supabase touchpoints. Each file below is a living page—update it when you ship, refactor, or deprecate anything that affects the feature.

## How to use
- Before editing code, skim the relevant feature page to see dependent components, tables, and known gaps.
- After making changes, add a short "Recent changes" bullet to the feature page with date + summary.
- Keep links to source files up to date so other agents can jump straight to the code.

## Feature files
- [01-auth-and-profiles.md](01-auth-and-profiles.md)
- [02-organization-and-permissions.md](02-organization-and-permissions.md)
- [03-events-and-gigs.md](03-events-and-gigs.md)
- [04-applications-and-upcoming-gigs.md](04-applications-and-upcoming-gigs.md)
- [05-bookings-and-deals.md](05-bookings-and-deals.md)
- [06-ticketing-and-imports.md](06-ticketing-and-imports.md)
- [07-invoicing-and-payments.md](07-invoicing-and-payments.md)
- [08-media-library-and-filestash.md](08-media-library-and-filestash.md)
- [09-calendar-and-availability.md](09-calendar-and-availability.md)
- [10-crm-and-relationships.md](10-crm-and-relationships.md)
- [11-notifications-and-pwa.md](11-notifications-and-pwa.md)
- [12-analytics-and-dashboards.md](12-analytics-and-dashboards.md)
- [13-design-system-and-branding.md](13-design-system-and-branding.md)

## Maintenance
- Keep one source of truth per feature; if you touch an older doc (e.g., docs/features/PLATFORM_FEATURES.md), mirror any meaningful changes back here.
- Add new files if we ship new surface areas; avoid bloating existing pages with unrelated scopes.
- If you sunset a feature, mark it in the relevant file and link to cleanup PR/issue.
