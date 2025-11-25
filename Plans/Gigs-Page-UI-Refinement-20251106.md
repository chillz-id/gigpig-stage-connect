# Gigs Page UI Refinement Plan
Created: 2025-11-06
Status: Pending

## Overview

Refine the Gigs page (`/gigs`) to improve user experience by:
1. **Removing** FeaturedEventsCarousel (Featured Shows section)
2. **Replacing** QuickSignUpCard with a new horizontal auth component (ProfileHeader-style)
3. **Simplifying** theme to business theme only (no theme switching)

## User Requirements

From user feedback:
- ✅ Remove "Featured Shows" from /gigs completely
- ✅ Replace vertical "Quick Sign Up" with horizontal box across the top
- ✅ New auth prompt should say "Sign In or Sign Up"
- ✅ Include both form (First/Last/Email/Mobile/Password) AND Google Sign Up
- ✅ Design pattern similar to ProfileHeader component
- ✅ **Business theme only** - no pleasure theme

---

## Change 1: Remove Featured Shows

### Files to Modify

**File**: `src/pages/Gigs.tsx`

**Line 6** - Remove import:
```typescript
// DELETE THIS LINE:
import { FeaturedEventsCarousel } from '@/components/FeaturedEventsCarousel';
```

**Lines 242-245** - Remove rendering:
```typescript
// DELETE THESE LINES:
{/* Featured Events Carousel */}
<div className="mb-6 sm:mb-8">
  <FeaturedEventsCarousel />
</div>
```

### Impact
- Featured Shows carousel removed from /gigs page
- Component files remain for potential use elsewhere (`FeaturedEventsCarousel.tsx`, `FeaturedEventCard.tsx`)

---

## Change 2: Create Horizontal Auth Prompt Component

### Component Specification

**Component Name**: `HorizontalAuthPrompt`
**File Path**: `src/components/auth/HorizontalAuthPrompt.tsx`

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Card (bg-gray-800/60, border-gray-600, backdrop-blur)           │
├──────────────────────────────┬──────────────────────────────────┤
│  LEFT SECTION (60%)          │  RIGHT SECTION (40%)             │
│  padding: p-6                │  padding: p-6                    │
├──────────────────────────────┼──────────────────────────────────┤
│  Heading (text-2xl)          │  Form Fields                     │
│  "Sign In or Sign Up"        │  ┌──────────┬──────────┐         │
│  (text-gray-200)             │  │First Name│Last Name │         │
│                              │  └──────────┴──────────┘         │
│  Subtext (text-gray-400)     │  ┌────────────────────┐         │
│  "Join the Sydney comedy     │  │ Email              │         │
│   community"                 │  └────────────────────┘         │
│                              │  ┌────────────────────┐         │
│  Button (text-red-500)       │  │ Mobile (+61...)    │         │
│  "Already have account?      │  └────────────────────┘         │
│   Sign In →"                 │  ┌────────────────────┐         │
│  (navigates to /auth)        │  │ Password           │         │
│                              │  └────────────────────┘         │
│                              │  ┌────────────────────┐         │
│                              │  │ Sign Up →          │         │
│                              │  │ (bg-red-600)       │         │
│                              │  └────────────────────┘         │
│                              │  ────── or ──────                │
│                              │  ┌────────────────────┐         │
│                              │  │ 🔵 Sign up with    │         │
│                              │  │    Google          │         │
│                              │  └────────────────────┘         │
└──────────────────────────────┴──────────────────────────────────┘
```

### Props Interface

```typescript
interface HorizontalAuthPromptProps {
  onSuccess?: () => void; // Optional callback after successful sign up
}
```

### Component Features

**Key Features**:
- Horizontal flex layout (desktop)
- Vertical stack (mobile responsive)
- ProfileHeader-style Card design
- Compact form fields
- Google OAuth integration
- Loading states for both methods
- Toast notifications
- Auto-dismiss after success

**Styling** (Business Theme Only):
```css
/* Card */
bg-gray-800/60 backdrop-blur-md
border border-gray-600
rounded-lg shadow-lg

/* Text */
Heading: text-2xl font-bold text-gray-200
Subtext: text-sm text-gray-400

/* Form Inputs */
bg-gray-700 border-gray-600
text-white placeholder:text-gray-400
focus:border-red-500 focus:ring-red-500

/* Primary Button (Sign Up) */
bg-red-600 hover:bg-red-700
text-white font-medium

/* Secondary Button (Sign In link) */
text-red-500 hover:text-red-400
underline-offset-4 hover:underline

/* Google Button */
bg-white hover:bg-gray-50
text-gray-900 border border-gray-300
```

**Responsive Breakpoints**:
```css
/* Mobile (< 768px) */
flex-col gap-4
Left section: full width
Right section: full width

/* Desktop (≥ 768px) */
flex-row gap-6
Left section: w-[60%]
Right section: w-[40%]
```

### Form Validation Schema

**Zod Schema**:
```typescript
const signUpSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),

  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),

  email: z.string()
    .email("Invalid email address"),

  mobile: z.string()
    .regex(/^\+61\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}$/,
           "Invalid Australian mobile number (format: +61 400 000 000)"),

  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
});
```

### Authentication Logic

**Email/Password Sign Up**:
```typescript
const handleSignUp = async (data: SignUpFormData) => {
  try {
    setIsLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          mobile: data.mobile,
          role: 'comedian_lite'
        }
      }
    });

    if (error) throw error;

    toast.success("Account created! Welcome to Stand Up Sydney");
    onSuccess?.();

  } catch (error) {
    toast.error(error.message || "Failed to create account");
  } finally {
    setIsLoading(false);
  }
};
```

**Google OAuth Sign Up**:
```typescript
const handleGoogleSignUp = async () => {
  try {
    setIsGoogleLoading(true);

    const redirectUrl = import.meta.env.VITE_OAUTH_REDIRECT_URL ||
                       `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;

  } catch (error) {
    toast.error(error.message || "Failed to sign in with Google");
    setIsGoogleLoading(false);
  }
};
```

### Component Dependencies

**Required Imports**:
```typescript
// React
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Form handling
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Supabase
import { supabase } from '@/integrations/supabase/client';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

// Utils
import { toast } from 'sonner';
```

**Reused Components**:
- `GoogleSignInButton` - existing component at `src/components/auth/GoogleSignInButton.tsx`
- shadcn/ui components (Card, Button, Input, Label)
- Sonner toast for notifications

---

## Change 3: Simplify Gigs.tsx Theme Logic

### Remove Theme Switching

**File**: `src/pages/Gigs.tsx`

Since we're **business theme only**, remove all theme-based conditional logic.

**Line 12** - Remove theme import if only used for switching:
```typescript
// ONLY remove if theme is ONLY used for background switching
// Keep if used elsewhere
import { useTheme } from '@/contexts/ThemeContext';
```

**Lines 231-236** - Replace `getBackgroundStyles()` function:
```typescript
// REPLACE:
const getBackgroundStyles = () => {
  if (theme === 'pleasure') {
    return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
  }
  return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
};

// WITH:
const backgroundStyles = 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
```

**Line 239** - Update usage:
```typescript
// REPLACE:
<div className={cn("min-h-screen", getBackgroundStyles())}>

// WITH:
<div className={cn("min-h-screen", backgroundStyles)}>
```

**Lines 206-213** - Update loading state:
```typescript
// REPLACE:
<div className={cn("min-h-screen flex items-center justify-center",
  theme === 'pleasure'
    ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
    : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
)}>

// WITH:
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-red-900">
```

**Lines 218-222** - Update error state:
```typescript
// REPLACE:
<div className={cn("min-h-screen flex items-center justify-center p-4",
  theme === 'pleasure'
    ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
    : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
)}>

// WITH:
<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-800 via-gray-900 to-red-900">
```

**Lines 414-418** - Update empty state card:
```typescript
// REPLACE:
<div className={cn(
  "rounded-2xl p-12 max-w-2xl mx-auto",
  theme === 'pleasure'
    ? 'bg-white/[0.08] backdrop-blur-md border border-white/[0.20]'
    : 'bg-gray-800/60 backdrop-blur-md border border-gray-600'
)}>

// WITH:
<div className="rounded-2xl p-12 max-w-2xl mx-auto bg-gray-800/60 backdrop-blur-md border border-gray-600">
```

**Lines 421-423** - Update empty state heading:
```typescript
// REPLACE:
<h3 className={cn("text-2xl font-bold mb-3",
  theme === 'pleasure' ? 'text-purple-100' : 'text-gray-200'
)}>

// WITH:
<h3 className="text-2xl font-bold mb-3 text-gray-200">
```

**Lines 426-428** - Update empty state text:
```typescript
// REPLACE:
<p className={cn("text-base mb-6 max-w-md mx-auto",
  theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'
)}>

// WITH:
<p className="text-base mb-6 max-w-md mx-auto text-gray-400">
```

**Lines 440-443** - Update clear filters button:
```typescript
// REPLACE:
<button
  onClick={clearFilters}
  className={cn("px-6 py-3 rounded-lg transition-colors font-medium",
    theme === 'pleasure'
      ? 'bg-purple-600 hover:bg-purple-700 text-white'
      : 'bg-red-600 hover:bg-red-700 text-white'
  )}
>

// WITH:
<button
  onClick={clearFilters}
  className="px-6 py-3 rounded-lg transition-colors font-medium bg-red-600 hover:bg-red-700 text-white"
>
```

**Other theme conditionals** - Search for remaining instances:
```bash
# Find all remaining theme conditionals in Gigs.tsx
grep -n "theme ===" src/pages/Gigs.tsx
```

---

## Change 4: Update Gigs.tsx Imports

### Files to Modify

**File**: `src/pages/Gigs.tsx`

**Line 19** - Replace import:
```typescript
// REPLACE:
import { QuickSignUpCard } from '@/components/auth/QuickSignUpCard';

// WITH:
import { HorizontalAuthPrompt } from '@/components/auth/HorizontalAuthPrompt';
```

**Lines 247-252** - Replace component:
```typescript
// REPLACE:
{!user && (
  <div className="mb-6">
    <QuickSignUpCard />
  </div>
)}

// WITH:
{!user && (
  <div className="mb-8">
    <HorizontalAuthPrompt />
  </div>
)}
```

---

## Testing Strategy

### Unit Tests

**New Test File**: `tests/components/auth/HorizontalAuthPrompt.test.tsx`

**Test Cases**:
1. Component renders correctly
2. Form validation works (all fields required)
3. Email validation enforces valid format
4. Mobile validation enforces Australian format (+61)
5. Password validation enforces minimum 8 characters
6. Sign up button calls Supabase API correctly
7. Google sign up button triggers OAuth flow
8. Loading states display correctly
9. Success toast appears on successful sign up
10. Error toast appears on failed sign up
11. Component navigates to /auth when "Sign In" clicked
12. Form resets after successful submission
13. Responsive layout changes on mobile

### E2E Tests

**File to Update**: `tests/e2e/gigs-page-migration.spec.ts`

**Test Updates**:
```typescript
// Update selectors if needed
test('displays horizontal auth prompt for anonymous users', async ({ page }) => {
  // Navigate to /gigs
  await page.goto('/gigs');

  // Should NOT see FeaturedEventsCarousel
  const featuredCarousel = page.locator('text=Featured Shows');
  expect(await featuredCarousel.isVisible().catch(() => false)).toBe(false);

  // Should see HorizontalAuthPrompt
  const authPrompt = page.locator('text=Sign In or Sign Up');
  expect(await authPrompt.isVisible()).toBe(true);

  // Should have form fields
  const firstNameInput = page.locator('input[placeholder*="First" i]');
  expect(await firstNameInput.isVisible()).toBe(true);
});

test('horizontal auth prompt hidden for authenticated users', async ({ page, context }) => {
  // Sign in first
  // ... auth logic ...

  // Navigate to /gigs
  await page.goto('/gigs');

  // Should NOT see auth prompt
  const authPrompt = page.locator('text=Sign In or Sign Up');
  expect(await authPrompt.isVisible().catch(() => false)).toBe(false);
});
```

### Visual Testing Checklist

- [ ] Desktop (1920x1080): Horizontal layout, 60/40 split
- [ ] Tablet (768x1024): Horizontal layout, adjusted spacing
- [ ] Mobile (375x667): Vertical stack, full width
- [ ] Business theme colors consistent across all elements
- [ ] No theme switching UI artifacts
- [ ] FeaturedEventsCarousel completely removed
- [ ] Form fields properly aligned
- [ ] Buttons have correct colors (red accent)
- [ ] Google button has white background
- [ ] Loading states render correctly

---

## Files Summary

### New Files Created
1. `src/components/auth/HorizontalAuthPrompt.tsx` - new component
2. `tests/components/auth/HorizontalAuthPrompt.test.tsx` - unit tests

### Files Modified
1. `src/pages/Gigs.tsx`:
   - Remove FeaturedEventsCarousel import and rendering
   - Replace QuickSignUpCard with HorizontalAuthPrompt
   - Remove theme switching logic (business theme only)
   - Simplify background styles

2. `tests/e2e/gigs-page-migration.spec.ts`:
   - Update selectors for new auth component
   - Add test for absence of FeaturedEventsCarousel

### Files Unchanged (Referenced)
- `src/components/FeaturedEventsCarousel.tsx` - kept for potential use elsewhere
- `src/components/FeaturedEventCard.tsx` - kept for potential use elsewhere
- `src/components/auth/QuickSignUpCard.tsx` - kept for use on other pages
- `src/components/ProfileHeader.tsx` - design pattern reference
- `src/components/auth/GoogleSignInButton.tsx` - reused in new component

---

## Implementation Checklist

### Phase 1: Create HorizontalAuthPrompt Component
- [ ] Create component file
- [ ] Implement form with React Hook Form + Zod
- [ ] Add email/password sign up logic
- [ ] Add Google OAuth sign up logic
- [ ] Implement responsive layout (horizontal/vertical)
- [ ] Add loading states
- [ ] Add toast notifications
- [ ] Style with business theme colors
- [ ] Add "Sign In" navigation link
- [ ] Write unit tests

### Phase 2: Update Gigs.tsx
- [ ] Remove FeaturedEventsCarousel import
- [ ] Remove FeaturedEventsCarousel rendering
- [ ] Replace QuickSignUpCard import with HorizontalAuthPrompt
- [ ] Replace QuickSignUpCard component with HorizontalAuthPrompt
- [ ] Remove theme switching in getBackgroundStyles()
- [ ] Update loading state background (remove theme conditional)
- [ ] Update error state background (remove theme conditional)
- [ ] Update empty state styling (remove theme conditionals)
- [ ] Update button styling (remove theme conditionals)
- [ ] Remove unused theme imports if applicable

### Phase 3: Testing
- [ ] Run unit tests for HorizontalAuthPrompt
- [ ] Update E2E tests for new component
- [ ] Run all E2E tests (verify 12/12 passing)
- [ ] Visual regression testing (desktop/tablet/mobile)
- [ ] Test sign up flow (email/password)
- [ ] Test sign up flow (Google OAuth)
- [ ] Test form validation
- [ ] Test responsive behavior
- [ ] Verify business theme consistency

### Phase 4: Code Review & Deployment
- [ ] Lint code (`npm run lint`)
- [ ] Code review
- [ ] Commit changes with descriptive message
- [ ] Push to feature branch
- [ ] Create/update PR
- [ ] Deploy to Vercel preview
- [ ] Smoke test on preview URL
- [ ] Merge to main (production deployment)

---

## Success Criteria

### Functional Requirements
- ✅ FeaturedEventsCarousel completely removed from /gigs page
- ✅ New HorizontalAuthPrompt displays for anonymous users only
- ✅ Sign up works with all 5 fields (First, Last, Email, Mobile, Password)
- ✅ Google sign up integration works correctly
- ✅ Form validation enforces all required fields
- ✅ Australian mobile format validated (+61 xxx xxx xxx)
- ✅ Password minimum 8 characters enforced
- ✅ "Sign In" link navigates to /auth page
- ✅ Success/error notifications display via toast
- ✅ Component hidden after successful authentication

### Design Requirements
- ✅ Horizontal layout on desktop (60/40 split)
- ✅ Vertical stack on mobile (full width)
- ✅ ProfileHeader-style card design
- ✅ Business theme only (no theme switching)
- ✅ Consistent gray/red color scheme
- ✅ Professional, clean appearance
- ✅ Responsive across all screen sizes

### Technical Requirements
- ✅ All unit tests passing (new HorizontalAuthPrompt tests)
- ✅ All E2E tests passing (12/12)
- ✅ No console errors or warnings
- ✅ Linting passes (`npm run lint`)
- ✅ TypeScript strict mode compliance
- ✅ Component follows existing code patterns
- ✅ Accessibility standards met (ARIA labels, keyboard navigation)

---

## Rollback Plan

If issues arise after deployment:

### Quick Rollback (Vercel)
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. **Time**: < 1 minute

### Code Rollback (Git)
```bash
# Revert the commit
git revert HEAD
git push origin main
```
**Time**: 2-3 minutes

### Manual Rollback (Files)
1. Restore `src/pages/Gigs.tsx` from git history
2. Delete `src/components/auth/HorizontalAuthPrompt.tsx`
3. Commit and push
**Time**: 5-10 minutes

---

## Related Documentation

- **Migration Deployment Plan**: `Plans/Gigs-Migration-Deployment-20251103.md`
- **Auth Components**: `src/components/auth/`
- **ProfileHeader Reference**: `src/components/ProfileHeader.tsx`
- **Gigs Page**: `src/pages/Gigs.tsx`
- **E2E Tests**: `tests/e2e/gigs-page-migration.spec.ts`

---

## Notes

- This plan is a **refinement** of the already-completed Gigs migration (Phases 1-4 from previous plan)
- No database changes required
- Code-only deployment (safe rollback)
- Focus on UX improvement and visual consistency
- Business theme standardization across the application

---

**Next Steps**: Review plan with team, get approval, implement Phase 1-4 checklist.
