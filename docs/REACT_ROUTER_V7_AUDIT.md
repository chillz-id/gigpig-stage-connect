# React Router v7 Migration Audit

This document captures the current routing patterns in the app and the concrete actions we need to take before upgrading to the React Router v7 “future” channel. Treat each row as a checklist item so we can track work during the migration.

## Router Composition

| Location | Current Pattern | v7 Impact | Required Action |
| --- | --- | --- | --- |
| `src/App.tsx` | Uses `<BrowserRouter>` (aliased as `Router`), `<Routes>`, `<Route>` JSX tree rendered inside `<Suspense>` | v7 deprecates the JSX router tree; relative resolution semantics change | Replace with `createBrowserRouter` + `RouterProvider`. Convert route tree into `RouteObject[]`, move Suspense fallback into `createRoutesFromElements` or loaders. |
| `src/App.tsx` | Global redirects via `<Navigate>` (`/browse`, `/invoices/*`, CRM index) | `Navigate` remains, but needs to live inside data routes | When defining route objects, use `{ loader: () => redirect(...) }` where appropriate or wrap `Navigate` in route element components. |

## Route Path Inventory

| Route | Definition Site | Current Path | Notes / Action |
| --- | --- | --- | --- |
| Root index | `App.tsx` | `/` | Becomes `{ path: '/', element: <Index /> }` in router config. |
| Auth callbacks | `App.tsx` | `/auth`, `/auth/callback`, `/auth/google-calendar-callback`, `/auth/xero-callback` | No implicit relatives; copy directly into data router. |
| Dashboard & navigation pages | `App.tsx` | `/dashboard`, `/shows`, `/comedians`, `/book-comedian`, `/photographers`, `/photographers/:id`, `/messages`, `/notifications`, `/media-library`, `/profile`, `/create-event`, `/applications`, `/agency`, `/dashboard/gigs/add`, `/design-system`, `/test-events`, `/settings/pwa`, `/settings/profiles` | All absolute paths; drop-in replacements. Verify loaders/actions once data router adopted. |
| Invoice redirects | `App.tsx` | `/invoices/new`, `/invoices/:invoiceId/payment-success`, `/invoices/:invoiceId/payment-cancelled`, `/invoices`, `/invoices/*` | Replace redirect-only routes with dedicated redirect loaders. Ensure wildcard redirect is replicated with a catch-all child (`{ path: 'invoices/*', loader: ... }`). |
| Admin routes | `App.tsx` | `/admin`, `/admin/ticket-sales`, `/admin/events/:eventId` | All absolute; port as-is. Add loaders/actions if we start data-fetching via router. |
| Event routes | `App.tsx` | `/events/:id/edit`, `/events/:eventId/apply`, `/events/:eventId/confirm-spot`, `/events/:eventId`, `/spots/:spotId/confirm`, `/comedian/:slug` | All absolute; double-check sibling `/events/:eventId` definitions order so data router fall-through is correct. |
| CRM layout | `App.tsx` + `config/crmSidebar.tsx` | Parent `/crm`; children defined in config as `'customers'`, `'customers/:id'`, `'segments'`, `'customer-analytics'`, `'import-export'`, `'deals'`, `'deals/:dealId'`, `'negotiations'`, `'booking-requests'`, `'contact-requests'`, etc. | Relative child paths stay valid. When migrating, convert CRM layout to a route module with `children: [{ index: true, loader: () => redirect('/crm/customers') }, …]`. Check for any child referencing `*` (none). Ensure new data router uses `handle` for nav metadata. |
| CRM index redirect | `App.tsx` | `<Route index element={<Navigate to="/crm/customers" replace />} />` | Swap for index route loader `redirect('/crm/customers')` or inline element component. |
| CRM tabs defined via `CRM_ROUTE_CONFIG` | `config/crmSidebar.tsx` | Relative path strings | Confirm there are no empty strings; ensure future config includes explicit `'./'` or `'../'` when necessary. |
| Catch-all | `App.tsx` | `<Route path="*" element={<Navigate to="/" replace />} />` | Data router catch-all uses `{ path: '*', loader: () => redirect('/') }` or dedicated boundary element. |

## Supporting APIs to Review

| Area | Current Usage | v7 Considerations | Notes |
| --- | --- | --- | --- |
| Navigation helpers | `useNavigate`, `<Navigate>`, `navigate('/path', { replace: true })` scattered across components | v7 keeps API but underlying router becomes async-first | Audit components invoking `useNavigate` with relative paths (search for `navigate('../`)—none found during initial pass; re-run after conversion. |
| Links | `<Link to="/...">` across the UI | No change if absolute paths | Spot-check CRM sidebar links produced from `CRM_ROUTE_CONFIG` to ensure they re-base correctly once routes are data-driven. |
| Loaders / actions | Currently handled via TanStack Query + effects | Data router encourages moving to loaders | Decide whether to migrate page-level data fetching into route loaders for better suspense integration. Track separately. |
| Error boundaries | Global `ErrorBoundary` in `App.tsx` | Data router supports per-route errorElement | Plan to split error handling once routes converted. |

## Next Steps

1. Convert `App.tsx` route tree into a `createBrowserRouter` configuration (commit to a single router entry and remove `<Routes>` from JSX).
2. Wrap CRM routes in the new router definition, ensuring each config path remains relative and that we express the index redirect via a loader.
3. Replace JSX redirects (`<Navigate>`) with loader-based `redirect()` helpers wherever possible for clarity.
4. After conversion, run a repo-wide search for `supabase` usage in route loaders/actions to wire data fetching to the new model.
5. Execute the regression suite (`npm run lint`, `npm run test`, `npm run test:e2e`) to verify routing changes do not break existing flows.
