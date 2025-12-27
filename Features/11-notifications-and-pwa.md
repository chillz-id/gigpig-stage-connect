# Notifications and PWA

## Overview
Notifications cover in-app feed + email + push (via PWA). PWA layer handles install prompts, offline caching, and service worker registration. Notification preferences are user-scoped.

## Data
- `notifications` – payloads (type, title/body, link, read_at, user_id).
- `notification_preferences` – per-user category/channel toggles (email vs push).
- `pwa_subscriptions` – push subscriptions (endpoint/keys) tied to user.

## Frontend entry points
- UI: `src/pages/Notifications.tsx`, `src/components/Notifications.tsx` (feed + mark read), notification badges in `PlatformLayout`.
- Preferences: forms embedded in notifications page/settings; writes to `notification_preferences` via service.
- PWA: `src/components/pwa/PWAInstaller.tsx`, `src/components/pwa/OfflineIndicator.tsx`, `src/pages/PWASettings.tsx`.
- Service worker: `public/sw.js` handles caching and push events; registered via `src/services/pwaService.ts` during app init.

## Services / hooks
- `src/services/notificationService.ts` and `src/services/notifications/*` – fetch, mark read/unread, create notifications, load preferences.
- `src/services/pwaService.ts` – registers SW, handles push subscription lifecycle, logs registration events.

## Flow
1) App boot registers service worker via `pwaService`; prompts user for push permission when needed.
2) Notifications inserted server-side (webhooks/jobs) or client-side (optimistic) → stored in `notifications` table.
3) UI fetches notifications via service, renders feed, and marks read on interaction.
4) Push payloads delivered via SW → displayed even when app closed; actions/deep links handled in SW.

## Known gaps / actions
- Cache errors reported in console (`Cache.put() encountered a network error`) likely from SW trying to cache module responses; audit `sw.js` cache list and remove dynamic `src/pages/*.tsx` entries.
- Ensure notification categories used in code match preference schema; mismatches will bypass user settings.
- When adding new notification types, extend preference model and SW handling accordingly.
