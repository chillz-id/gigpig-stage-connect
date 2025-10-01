# Repository Guidelines

## Project Structure & Module Organization
Core Vite + React TypeScript code sits in `src/`, with components, hooks, and styles colocated by feature. Shared assets live in `public/`, while `tailwind.config.ts` and `vite.config.ts` define global build and styling rules. Automation scripts belong in `scripts/` or the existing top-level utilities (`*.cjs`/`*.mjs`) so related tasks stay grouped. Tests land in `tests/`, and integration references such as `supabase/`, `docs/`, and gitignored `credentials/` document external systems.

## Build, Test, and Development Commands
- `npm run dev` – start the hot-reloading dev server on port 5173.
- `npm run build` / `npm run build:dev` – output production or dev bundles to `dist/`.
- `npm run preview` – serve the compiled bundle for smoke checks.
- `npm run lint` – apply the shared ESLint rules across TypeScript and React files.
- `npm run test` / `npm run test:unit` – execute the Jest suites.
- `npm run test:e2e` – run Playwright headless; add `:headed` for interactive runs.
- `npm run sitemap:generate` – example pattern for defining additional automation in `scripts/`.

## Coding Style & Naming Conventions
Build features in TypeScript (`.ts`/`.tsx`) with React function components. ESLint enforces 2-space indentation, single quotes, and trailing commas when supported. Keep Tailwind utilities in generator order. Components use PascalCase, hooks start with `use`, and shared utilities stay camelCase. Node helpers remain ES modules with descriptive filenames such as `check-profiles.mjs`.

## Testing Guidelines
Colocate focused unit tests (`Component.test.tsx`) with their sources and use `tests/` for cross-feature scenarios. Regenerate snapshots intentionally and run `npm run test:coverage` when touching core flows. Playwright fixtures belong in `tests/e2e`; document new suites in `README.md` or `docs/` so operators understand the coverage surface. Execute the relevant Jest set plus Playwright before merging workflow or API changes.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`). Keep commits scoped, and ship schema or migration scripts alongside dependent code. Pull requests should summarize intent, list verification commands (`npm run test`, `npm run test:e2e` as needed), and link to Linear or issue-tracker IDs. Provide UI screenshots and flag required environment or credential updates.

## Security & Configuration Tips
Keep secrets in `.env.local` or gitignored `credentials/`. Validate automation touching Humanitix, Notion, or n8n in staging first and respect documented rate limits.
