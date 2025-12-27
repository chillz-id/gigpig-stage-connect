# Design System and Branding

## Overview
Global design system manages theming (colors, spacing, typography) and persists user/org presets. Components rely on ThemeProvider; using UI primitives outside the provider triggers fallback styling (see console warnings in logs).

## Data
- `design_system_presets` – saved themes (name, tokens, org_id/user_id scope).
- `user_preferences` (check service) – stores selected preset and sidebar/theme toggles.

## Frontend entry points
- `src/pages/DesignSystem.tsx` – main UI for editing theme tokens and saving presets.
- `src/hooks/useGlobalDesignSystem.ts` – loads active settings, applies CSS variables to `document.documentElement`.
- `src/hooks/useDesignSystemPersistence.ts` – fetch/save presets to DB.
- `src/contexts/ThemeContext.tsx` – ThemeProvider + mode toggles; wraps app in `App.tsx`.
- `src/components/ui/*` – shadcn-based primitives styled by theme variables.

## Flow
1) App boot: `useGlobalDesignSystem` initializes, fetches design settings (org/user), applies CSS variables.
2) ThemeContext exposes toggles and current theme to components; providers wrap router in `App.tsx`.
3) Design System page lets admins adjust tokens and save to `design_system_presets` for reuse.

## Known gaps / actions
- Console errors `Button component used outside ThemeProvider` indicate components rendered before provider or outside tree; ensure all layouts wrap with ThemeContext.
- When adding new primitives, map them to CSS variables defined by design system to avoid hardcoded colors.
- Keep theme persistence in sync with profile switching—different profiles may want different presets; confirm scope logic in `useDesignSystemPersistence`.
