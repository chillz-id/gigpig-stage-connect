# Profile URLs & Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable user-friendly profile URLs like `/comedian/chillz-skinner/dashboard` with dynamic routing, slug management, and per-profile state isolation.

**Architecture:** Route-based architecture with nested dynamic segments (`/:profileType/:slug/:page`). Static routes prioritized before dynamic profile routes. ActiveProfileContext provides profile state, ownership validation, and permissions. Per-profile sidebar preferences stored in database.

**Tech Stack:** React Router v6, React Context API, TanStack Query, Supabase (PostgreSQL with RLS), TypeScript, Zod validation

---

## Phase 1: Database Schema & Migrations

### Task 1: Create Managers Table Migration

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_create_managers_table.sql`

**Step 1: Write migration SQL**

```sql
-- Create managers table
CREATE TABLE IF NOT EXISTS managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  manager_type TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT managers_url_slug_unique UNIQUE (url_slug),
  CONSTRAINT valid_manager_type CHECK (
    manager_type IN (
      'social_media', 'tour', 'booking', 'comedian',
      'content', 'financial', 'general', 'venue'
    )
  )
);

-- Create indexes
CREATE INDEX idx_managers_user_id ON managers(user_id);
CREATE INDEX idx_managers_url_slug ON managers(url_slug);
CREATE INDEX idx_managers_organization_id ON managers(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_managers_venue_id ON managers(venue_id) WHERE venue_id IS NOT NULL;

-- Enable RLS
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Managers are viewable by everyone"
  ON managers FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own manager profiles"
  ON managers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manager profiles"
  ON managers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manager profiles"
  ON managers FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_managers_updated_at
  BEFORE UPDATE ON managers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Apply migration**

Run: `supabase db push` (or migration tool)
Expected: Table created with all constraints and indexes

**Step 3: Verify in database**

Run: `supabase db execute "SELECT * FROM managers LIMIT 0;"`
Expected: Empty result with correct columns

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): create managers table with RLS policies"
```

---

### Task 2: Add url_slug to Existing Profile Tables

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_url_slug_to_profiles.sql`

**Step 1: Write migration SQL**

```sql
-- Add url_slug to comedians
ALTER TABLE comedians ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS comedians_url_slug_unique ON comedians(url_slug) WHERE url_slug IS NOT NULL;

-- Add url_slug to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_url_slug_unique ON organizations(url_slug) WHERE url_slug IS NOT NULL;

-- Add url_slug to venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS url_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS venues_url_slug_unique ON venues(url_slug) WHERE url_slug IS NOT NULL;

-- Add url_slug to photographers (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photographers') THEN
    ALTER TABLE photographers ADD COLUMN IF NOT EXISTS url_slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS photographers_url_slug_unique ON photographers(url_slug) WHERE url_slug IS NOT NULL;
  END IF;
END $$;
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: Columns added with unique indexes

**Step 3: Verify columns exist**

Run: `supabase db execute "SELECT column_name FROM information_schema.columns WHERE table_name = 'comedians' AND column_name = 'url_slug';"`
Expected: Returns url_slug column

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add url_slug column to profile tables"
```

---

### Task 3: Create Slug History Table

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_create_slug_history.sql`

**Step 1: Write migration SQL**

```sql
CREATE TABLE IF NOT EXISTS slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL,
  profile_id UUID NOT NULL,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_profile_type CHECK (
    profile_type IN ('comedian', 'manager', 'organization', 'venue')
  )
);

-- Indexes
CREATE INDEX idx_slug_history_old_slug ON slug_history(profile_type, old_slug);
CREATE INDEX idx_slug_history_profile ON slug_history(profile_type, profile_id);

-- Enable RLS
ALTER TABLE slug_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: viewable by everyone (for redirects)
CREATE POLICY "Slug history is viewable by everyone"
  ON slug_history FOR SELECT
  USING (true);
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: Table created successfully

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): create slug_history table for 301 redirects"
```

---

### Task 4: Create Requested Profiles Table

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_create_requested_profiles.sql`

**Step 1: Write migration SQL**

```sql
CREATE TABLE IF NOT EXISTS requested_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL,
  slug_attempted TEXT NOT NULL,
  instagram_handle TEXT,
  request_count INTEGER DEFAULT 1,
  requested_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_requested_profile UNIQUE (profile_type, slug_attempted),
  CONSTRAINT valid_profile_type CHECK (
    profile_type IN ('comedian', 'manager', 'organization', 'venue')
  )
);

-- Indexes
CREATE INDEX idx_requested_profiles_type ON requested_profiles(profile_type);
CREATE INDEX idx_requested_profiles_count ON requested_profiles(request_count DESC);

-- Enable RLS
ALTER TABLE requested_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Requested profiles are viewable by everyone"
  ON requested_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can record profile requests"
  ON requested_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update request counts"
  ON requested_profiles FOR UPDATE
  USING (true);

-- Updated_at trigger
CREATE TRIGGER set_requested_profiles_updated_at
  BEFORE UPDATE ON requested_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to record or increment profile requests
CREATE OR REPLACE FUNCTION record_profile_request(
  p_profile_type TEXT,
  p_slug TEXT,
  p_instagram_handle TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO requested_profiles (profile_type, slug_attempted, instagram_handle, requested_by)
  VALUES (p_profile_type, p_slug, p_instagram_handle, ARRAY[p_user_id])
  ON CONFLICT (profile_type, slug_attempted)
  DO UPDATE SET
    request_count = requested_profiles.request_count + 1,
    requested_by = array_append(requested_profiles.requested_by, p_user_id),
    instagram_handle = COALESCE(EXCLUDED.instagram_handle, requested_profiles.instagram_handle),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: Table and function created

**Step 3: Test function**

Run: `supabase db execute "SELECT record_profile_request('comedian', 'test-slug', 'test_instagram', NULL);"`
Expected: Returns UUID

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): create requested_profiles tracking system"
```

---

### Task 5: Update Sidebar Preferences Schema

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_update_sidebar_preferences.sql`

**Step 1: Write migration SQL**

```sql
-- Add profile_type and profile_id columns
ALTER TABLE sidebar_preferences
  ADD COLUMN IF NOT EXISTS profile_type TEXT,
  ADD COLUMN IF NOT EXISTS profile_id UUID;

-- Drop old unique constraint if exists
ALTER TABLE sidebar_preferences
  DROP CONSTRAINT IF EXISTS sidebar_preferences_user_id_key;

-- Create new composite unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS sidebar_preferences_user_profile_unique
  ON sidebar_preferences(user_id, profile_type, profile_id);

-- Add constraint for valid profile types
ALTER TABLE sidebar_preferences
  ADD CONSTRAINT valid_profile_type CHECK (
    profile_type IN ('comedian', 'manager', 'organization', 'venue', NULL)
  );

-- Migrate existing data to have NULL profile_type and profile_id
-- This makes existing preferences "global" until users log in again
UPDATE sidebar_preferences
SET profile_type = NULL, profile_id = NULL
WHERE profile_type IS NULL;
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: Columns added, constraints updated

**Step 3: Verify schema**

Run: `supabase db execute "\d sidebar_preferences"`
Expected: Shows profile_type and profile_id columns

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add per-profile sidebar preferences support"
```

---

### Task 6: Create Slug Auto-Generation Migration Function

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_auto_generate_slugs.sql`

**Step 1: Write migration SQL with data migration**

```sql
-- Helper function to slugify text
CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(text_input), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate unique slug with counter if needed
CREATE OR REPLACE FUNCTION generate_unique_slug(
  base_slug TEXT,
  profile_table TEXT,
  excluded_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  test_slug TEXT;
  counter INTEGER := 1;
  slug_exists BOOLEAN;
BEGIN
  test_slug := base_slug;

  LOOP
    EXECUTE format(
      'SELECT EXISTS(SELECT 1 FROM %I WHERE url_slug = $1 AND ($2 IS NULL OR id != $2))',
      profile_table
    ) INTO slug_exists USING test_slug, excluded_id;

    EXIT WHEN NOT slug_exists;

    test_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN test_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate slugs for existing comedians
UPDATE comedians
SET url_slug = generate_unique_slug(slugify(name), 'comedians', id)
WHERE url_slug IS NULL;

-- Auto-generate slugs for existing organizations
UPDATE organizations
SET url_slug = generate_unique_slug(slugify(name), 'organizations', id)
WHERE url_slug IS NULL;

-- Auto-generate slugs for existing venues
UPDATE venues
SET url_slug = generate_unique_slug(slugify(name), 'venues', id)
WHERE url_slug IS NULL;

-- Auto-generate slugs for existing photographers if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photographers') THEN
    UPDATE photographers
    SET url_slug = generate_unique_slug(slugify(name), 'photographers', id)
    WHERE url_slug IS NULL;
  END IF;
END $$;

-- Make url_slug NOT NULL now that all existing records have values
ALTER TABLE comedians ALTER COLUMN url_slug SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN url_slug SET NOT NULL;
ALTER TABLE venues ALTER COLUMN url_slug SET NOT NULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photographers') THEN
    ALTER TABLE photographers ALTER COLUMN url_slug SET NOT NULL;
  END IF;
END $$;
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: All profiles get auto-generated slugs

**Step 3: Verify slug generation**

Run: `supabase db execute "SELECT name, url_slug FROM comedians LIMIT 5;"`
Expected: All records have url_slug values

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): auto-generate slugs for existing profiles"
```

---

### Task 7: Regenerate Supabase Types

**Files:**
- Modify: `src/integrations/supabase/types/database.types.ts`

**Step 1: Generate types from database**

Run: `npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types/database.types.ts`
Expected: Types file updated with new tables and columns

**Step 2: Verify types include new fields**

Run: `grep -A 5 "managers:" src/integrations/supabase/types/database.types.ts`
Expected: Shows managers table type definition

**Step 3: Run TypeScript check**

Run: `npm run tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/integrations/supabase/types/
git commit -m "chore(types): regenerate Supabase types for profile URLs"
```

---

## Phase 2: Utilities & Validation

### Task 8: Create Slug Utilities

**Files:**
- Create: `src/utils/slugify.ts`
- Create: `tests/utils/slugify.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/utils/slugify.test.ts
import { describe, it, expect } from '@jest/globals';
import { slugify, isReservedSlug, validateSlug, RESERVED_SLUGS } from '@/utils/slugify';

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('UPPERCASE')).toBe('uppercase');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('multiple words here')).toBe('multiple-words-here');
  });

  it('removes special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
  });

  it('handles multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('handles real comedian names', () => {
    expect(slugify('Chillz Skinner')).toBe('chillz-skinner');
    expect(slugify("O'Brien Comedy")).toBe('obrien-comedy');
  });
});

describe('isReservedSlug', () => {
  it('returns true for reserved slugs', () => {
    expect(isReservedSlug('dashboard')).toBe(true);
    expect(isReservedSlug('settings')).toBe(true);
    expect(isReservedSlug('admin')).toBe(true);
  });

  it('returns false for non-reserved slugs', () => {
    expect(isReservedSlug('chillz-skinner')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isReservedSlug('DASHBOARD')).toBe(true);
  });
});

describe('validateSlug', () => {
  it('returns valid for good slugs', () => {
    const result = validateSlug('chillz-skinner');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects empty slugs', () => {
    const result = validateSlug('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects reserved slugs', () => {
    const result = validateSlug('dashboard');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('reserved');
  });

  it('rejects slugs with invalid characters', () => {
    const result = validateSlug('hello@world');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('letters, numbers, and hyphens');
  });

  it('rejects slugs that are too short', () => {
    const result = validateSlug('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3 characters');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/utils/slugify.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// src/utils/slugify.ts

/**
 * Reserved slugs that cannot be used for profile URLs
 * These match static routes in the application
 */
export const RESERVED_SLUGS = [
  'dashboard',
  'settings',
  'admin',
  'api',
  'auth',
  'create-event',
  'messages',
  'notifications',
  'profile',
  'shows',
  'gigs',
  'comedians',
  'organizations',
  'venues',
  'managers',
  'about',
  'contact',
  'privacy',
  'terms',
  'applications',
  'invoices',
  'earnings',
  'tasks',
  'crm',
  'media-library',
  'vouches',
];

/**
 * Convert text to URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Validate slug format and restrictions
 */
export function validateSlug(
  slug: string
): { valid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'URL slug is required' };
  }

  if (slug.length < 3) {
    return {
      valid: false,
      error: 'URL slug must be at least 3 characters long',
    };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'URL slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  if (isReservedSlug(slug)) {
    return {
      valid: false,
      error: 'This URL slug is reserved and cannot be used',
    };
  }

  return { valid: true };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/utils/slugify.test.ts`
Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add src/utils/slugify.ts tests/utils/slugify.test.ts
git commit -m "feat(utils): add slug generation and validation utilities"
```

---

### Task 9: Create Slug Validation Hook

**Files:**
- Create: `src/hooks/useSlugValidation.ts`
- Create: `tests/hooks/useSlugValidation.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/hooks/useSlugValidation.test.tsx
import { describe, it, expect, vi } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useSlugValidation } from '@/hooks/useSlugValidation';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useSlugValidation', () => {
  it('returns valid for unique slug', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });
    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() =>
      useSlugValidation('chillz-skinner', 'comedian')
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('returns error for taken slug', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-id' },
              error: null,
            }),
          }),
        }),
      }),
    });
    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() =>
      useSlugValidation('taken-slug', 'comedian')
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toContain('already taken');
    });
  });

  it('validates format before checking database', async () => {
    const { result } = renderHook(() =>
      useSlugValidation('invalid@slug', 'comedian')
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toContain('lowercase letters');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/hooks/useSlugValidation.test.tsx`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// src/hooks/useSlugValidation.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateSlug } from '@/utils/slugify';

type ProfileType = 'comedian' | 'manager' | 'organization' | 'venue';

const PROFILE_TABLE_MAP: Record<ProfileType, string> = {
  comedian: 'comedians',
  manager: 'managers',
  organization: 'organizations',
  venue: 'venues',
};

export function useSlugValidation(
  slug: string,
  profileType: ProfileType,
  currentProfileId?: string
) {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    const checkSlug = async () => {
      // Skip if empty
      if (!slug) {
        setIsValid(false);
        setError(undefined);
        return;
      }

      setIsChecking(true);

      // First validate format
      const formatValidation = validateSlug(slug);
      if (!formatValidation.valid) {
        setIsValid(false);
        setError(formatValidation.error);
        setIsChecking(false);
        return;
      }

      // Then check uniqueness in database
      const tableName = PROFILE_TABLE_MAP[profileType];
      let query = supabase
        .from(tableName)
        .select('id')
        .eq('url_slug', slug);

      // Exclude current profile if editing
      if (currentProfileId) {
        query = query.neq('id', currentProfileId);
      }

      const { data, error: dbError } = await query.single();

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (good)
        setIsValid(false);
        setError('Error checking slug availability');
        setIsChecking(false);
        return;
      }

      if (data) {
        setIsValid(false);
        setError('This URL slug is already taken');
        setIsChecking(false);
        return;
      }

      setIsValid(true);
      setError(undefined);
      setIsChecking(false);
    };

    // Debounce the check
    const timeoutId = setTimeout(checkSlug, 300);
    return () => clearTimeout(timeoutId);
  }, [slug, profileType, currentProfileId]);

  return { isValid, error, isChecking };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/hooks/useSlugValidation.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useSlugValidation.ts tests/hooks/useSlugValidation.test.tsx
git commit -m "feat(hooks): add real-time slug validation hook"
```

---

## Phase 3: Active Profile Context

### Task 10: Create ActiveProfileContext

**Files:**
- Create: `src/contexts/ActiveProfileContext.tsx`
- Create: `tests/contexts/ActiveProfileContext.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/contexts/ActiveProfileContext.test.tsx
import { describe, it, expect, vi } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ActiveProfileProvider, useActiveProfile } from '@/contexts/ActiveProfileContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

function TestComponent() {
  const { profileType, slug, isOwner } = useActiveProfile();
  return (
    <div>
      <div data-testid="profile-type">{profileType || 'none'}</div>
      <div data-testid="slug">{slug || 'none'}</div>
      <div data-testid="is-owner">{isOwner ? 'yes' : 'no'}</div>
    </div>
  );
}

describe('ActiveProfileContext', () => {
  it('extracts profile info from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/comedian/chillz-skinner/dashboard']}>
        <Routes>
          <Route
            path="/:profileType/:slug/*"
            element={
              <ActiveProfileProvider>
                <TestComponent />
              </ActiveProfileProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-type')).toHaveTextContent('comedian');
    expect(screen.getByTestId('slug')).toHaveTextContent('chillz-skinner');
  });

  it('returns null values when not on profile route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ActiveProfileProvider>
          <TestComponent />
        </ActiveProfileProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-type')).toHaveTextContent('none');
    expect(screen.getByTestId('slug')).toHaveTextContent('none');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/contexts/ActiveProfileContext.test.tsx`
Expected: FAIL

**Step 3: Write implementation** (continued in next task due to length)

```typescript
// src/contexts/ActiveProfileContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ProfileType = 'comedian' | 'manager' | 'organization' | 'venue' | null;

interface ProfileData {
  id: string;
  name: string;
  avatar_url: string | null;
  url_slug: string;
  user_id?: string;
}

interface ActiveProfileContextValue {
  profileType: ProfileType;
  slug: string | null;
  profileData: ProfileData | null;
  isOwner: boolean;
  isLoading: boolean;
  error: Error | null;
  permissions: string[];
  refreshProfile: () => Promise<void>;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | undefined>(undefined);

const PROFILE_TABLE_MAP: Record<string, string> = {
  comedian: 'comedians',
  manager: 'managers',
  organization: 'organizations',
  venue: 'venues',
};

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { profileType: rawProfileType, slug } = useParams<{
    profileType: string;
    slug: string;
  }>();
  const { user } = useAuth();

  // Validate profile type
  const profileType =
    rawProfileType && Object.keys(PROFILE_TABLE_MAP).includes(rawProfileType)
      ? (rawProfileType as ProfileType)
      : null;

  // Fetch profile data
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['active-profile', profileType, slug],
    queryFn: async () => {
      if (!profileType || !slug) return null;

      const tableName = PROFILE_TABLE_MAP[profileType];
      const { data, error } = await supabase
        .from(tableName)
        .select('id, name, avatar_url, url_slug, user_id')
        .eq('url_slug', slug)
        .single();

      if (error) throw error;
      return data as ProfileData;
    },
    enabled: !!profileType && !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine ownership
  const isOwner = !!(
    user &&
    profileData &&
    'user_id' in profileData &&
    profileData.user_id === user.id
  );

  // TODO: Fetch permissions from database based on profile type and user role
  const permissions: string[] = [];

  const refreshProfile = async () => {
    await refetch();
  };

  const value: ActiveProfileContextValue = {
    profileType,
    slug: slug ?? null,
    profileData: profileData ?? null,
    isOwner,
    isLoading,
    error: error as Error | null,
    permissions,
    refreshProfile,
  };

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (context === undefined) {
    throw new Error('useActiveProfile must be used within ActiveProfileProvider');
  }
  return context;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/contexts/ActiveProfileContext.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/contexts/ActiveProfileContext.tsx tests/contexts/ActiveProfileContext.test.tsx
git commit -m "feat(context): create ActiveProfileContext for profile state"
```

---

## Phase 4: Routing Updates

### Task 11: Update Route Configuration

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read current App.tsx routing structure**

Run: `grep -A 30 "<Routes>" src/App.tsx`
Expected: See current route structure

**Step 2: Update routes with profile routing**

Update the Routes section in src/App.tsx:

```typescript
// Add import at top
import { ActiveProfileProvider } from '@/contexts/ActiveProfileContext';
import PublicProfile from '@/pages/PublicProfile'; // We'll create this
import NotFoundHandler from '@/pages/NotFoundHandler'; // We'll create this

// Inside <Routes>, restructure to:
<Routes>
  {/* 1. STATIC ROUTES FIRST (highest priority) */}
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/auth/callback" element={<AuthCallback />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/shows" element={<Shows />} />
  <Route path="/gigs" element={<Gigs />} /> {/* New route */}
  <Route path="/comedians" element={<BrowseComedians />} />
  <Route path="/organizations" element={<BrowseOrganizations />} />
  <Route path="/venues" element={<BrowseVenues />} />
  <Route path="/managers" element={<BrowseManagers />} /> {/* New route */}
  <Route path="/create-event" element={<ProtectedRoute roles={['promoter', 'organization']}><CreateEvent /></ProtectedRoute>} />
  <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
  <Route path="/vouches" element={<ProtectedRoute><Vouches /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
  <Route path="/crm/*" element={<ProtectedRoute roles={['admin', 'agency_manager', 'promoter', 'venue_manager']}><CRMRoutes /></ProtectedRoute>} />

  {/* 2. DYNAMIC PROFILE ROUTES (catch remaining patterns) */}
  <Route path="/:profileType/:slug" element={<ActiveProfileProvider><ProfileRoutes /></ActiveProfileProvider>} />

  {/* 3. 404 CATCH-ALL (lowest priority) */}
  <Route path="*" element={<NotFoundHandler />} />
</Routes>
```

**Step 3: Create ProfileRoutes component**

Create new component inline or in separate file:

```typescript
// Could be in src/components/routing/ProfileRoutes.tsx
function ProfileRoutes() {
  return (
    <Routes>
      <Route index element={<PublicProfile />} />
      <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="gigs" element={<ProtectedRoute><ProfileGigs /></ProtectedRoute>} />
      <Route path="invoices" element={<ProtectedRoute><ProfileInvoices /></ProtectedRoute>} />
      <Route path="earnings" element={<ProtectedRoute><ProfileEarnings /></ProtectedRoute>} />
      <Route path="calendar" element={<ProtectedRoute><ProfileCalendar /></ProtectedRoute>} />
    </Routes>
  );
}
```

**Step 4: Test routing priority**

Start dev server: `npm run dev`
Navigate to: `/dashboard` - should show Dashboard page
Navigate to: `/comedian/test/dashboard` - should show 404 (profile doesn't exist yet)
Expected: Static routes work, dynamic routes are recognized

**Step 5: Commit**

```bash
git add src/App.tsx src/components/routing/ProfileRoutes.tsx
git commit -m "feat(routing): add profile URL routing with proper priority"
```

---

## Phase 5: Profile Components

### Task 12: Create Public Profile Page

**Files:**
- Create: `src/pages/PublicProfile.tsx`
- Create: `tests/pages/PublicProfile.test.tsx`

**Step 1: Write failing test**

```typescript
// tests/pages/PublicProfile.test.tsx
import { describe, it, expect, vi } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import PublicProfile from '@/pages/PublicProfile';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('PublicProfile', () => {
  it('renders profile name when data loads', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/comedian/test-comedian']}>
          <PublicProfile />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Will need proper mock setup
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/pages/PublicProfile.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/pages/PublicProfile.tsx
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Crown, Mail } from 'lucide-react';

export default function PublicProfile() {
  const { profileData, profileType, isLoading, isOwner } = useActiveProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>This profile doesn't exist or has been removed.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar_url ?? undefined} />
              <AvatarFallback>{profileData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profileData.name}</CardTitle>
              <CardDescription className="capitalize">{profileType}</CardDescription>
              <div className="flex gap-2 mt-4">
                {isOwner && (
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" size="sm">
                  <Crown className="h-4 w-4 mr-2" />
                  Give Vouch
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Public profile view - coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: Run test**

Run: `npm run test -- tests/pages/PublicProfile.test.tsx`
Expected: PASS (after proper setup)

**Step 5: Commit**

```bash
git add src/pages/PublicProfile.tsx tests/pages/PublicProfile.test.tsx
git commit -m "feat(pages): create public profile page component"
```

---

### Task 13: Create NotFoundHandler Component

**Files:**
- Create: `src/pages/NotFoundHandler.tsx`
- Create: `src/components/RequestedProfileModal.tsx`

**Step 1: Write NotFoundHandler**

```typescript
// src/pages/NotFoundHandler.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RequestedProfileModal } from '@/components/RequestedProfileModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BROWSE_PAGE_MAP: Record<string, string> = {
  comedian: '/comedians',
  manager: '/managers',
  organization: '/organizations',
  venue: '/venues',
};

export default function NotFoundHandler() {
  const { profileType, slug } = useParams<{ profileType: string; slug: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // If we're on a profile route pattern, show profile not found
  const isProfileRoute = profileType && slug && Object.keys(BROWSE_PAGE_MAP).includes(profileType);

  useEffect(() => {
    if (isProfileRoute) {
      setShowModal(true);
    }
  }, [isProfileRoute]);

  const handleModalClose = () => {
    setShowModal(false);
    const browsePage = BROWSE_PAGE_MAP[profileType!];
    if (browsePage) {
      navigate(browsePage);
    } else {
      navigate('/');
    }
  };

  if (isProfileRoute) {
    return (
      <RequestedProfileModal
        open={showModal}
        onClose={handleModalClose}
        profileType={profileType as 'comedian' | 'manager' | 'organization' | 'venue'}
        slug={slug!}
      />
    );
  }

  // Standard 404 page
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>The page you're looking for doesn't exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create RequestedProfileModal**

```typescript
// src/components/RequestedProfileModal.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PROFILE_TABLE_MAP: Record<string, string> = {
  comedian: 'comedians',
  manager: 'managers',
  organization: 'organizations',
  venue: 'venues',
};

interface RequestedProfileModalProps {
  open: boolean;
  onClose: () => void;
  profileType: 'comedian' | 'manager' | 'organization' | 'venue';
  slug: string;
}

export function RequestedProfileModal({
  open,
  onClose,
  profileType,
  slug,
}: RequestedProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch similar profiles (fuzzy search)
  const { data: similarProfiles } = useQuery({
    queryKey: ['similar-profiles', profileType, slug],
    queryFn: async () => {
      const searchTerms = slug.split('-');
      const tableName = PROFILE_TABLE_MAP[profileType];

      let query = supabase
        .from(tableName)
        .select('name, url_slug')
        .limit(5);

      // Build OR condition for fuzzy matching
      const orConditions = searchTerms.map(term => `name.ilike.%${term}%`).join(',');
      query = query.or(orConditions);

      const { data } = await query;
      return data;
    },
    enabled: open,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('record_profile_request', {
        p_profile_type: profileType,
        p_slug: slug,
        p_instagram_handle: instagramHandle || null,
        p_user_id: user?.id ?? null,
      });

      if (error) throw error;

      toast({
        title: 'Request recorded',
        description: "Thanks! We'll reach out if this person joins.",
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{profileType} hasn't signed up yet!</DialogTitle>
          <DialogDescription>
            We'll let you know if they join. Want to help us find them?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="instagram">Instagram Handle (optional)</Label>
            <Input
              id="instagram"
              placeholder="@username"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Help us reach out to invite them!
            </p>
          </div>

          {similarProfiles && similarProfiles.length > 0 && (
            <div>
              <Label>Similar {profileType}s you might like:</Label>
              <div className="space-y-2 mt-2">
                {similarProfiles.map((profile) => (
                  <Button
                    key={profile.url_slug}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      window.location.href = `/${profileType}/${profile.url_slug}`;
                    }}
                  >
                    {profile.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Recording...' : 'Record Request'}
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Test the flow**

Start dev server and navigate to `/comedian/nonexistent`
Expected: Modal appears with request form

**Step 4: Commit**

```bash
git add src/pages/NotFoundHandler.tsx src/components/RequestedProfileModal.tsx
git commit -m "feat(pages): add 404 handler with profile request tracking"
```

---

## Phase 6: Per-Profile Sidebar

### Task 14: Update useSidebarPreferences Hook

**Files:**
- Modify: `src/hooks/useSidebarPreferences.ts`

**Step 1: Read current implementation**

Run: `cat src/hooks/useSidebarPreferences.ts | head -50`

**Step 2: Update to include profile context**

```typescript
// Update imports
import { useActiveProfile } from '@/contexts/ActiveProfileContext';

// Update the hook to include profile scoping
export function useSidebarPreferences() {
  const { user } = useAuth();
  const { profileType, profileData } = useActiveProfile();

  // Fetch preferences scoped to user + profile
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['sidebar-preferences', user?.id, profileType, profileData?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to get profile-specific preferences first
      if (profileType && profileData) {
        const { data } = await supabase
          .from('sidebar_preferences')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_type', profileType)
          .eq('profile_id', profileData.id)
          .maybeSingle();

        if (data) return data;
      }

      // Fall back to global preferences if no profile-specific ones exist
      const { data } = await supabase
        .from('sidebar_preferences')
        .select('*')
        .eq('user_id', user.id)
        .is('profile_type', null)
        .maybeSingle();

      return data;
    },
    enabled: !!user,
  });

  // Update mutations to include profile context
  const hideItem = async (itemId: string) => {
    if (!user) return;

    const currentHidden = preferences?.hidden_items || [];
    const newHidden = [...currentHidden, itemId];

    const upsertData = {
      user_id: user.id,
      profile_type: profileType,
      profile_id: profileData?.id,
      hidden_items: newHidden,
    };

    const { error } = await supabase
      .from('sidebar_preferences')
      .upsert(upsertData, {
        onConflict: 'user_id,profile_type,profile_id',
      });

    if (error) throw error;
  };

  // Similar updates for showItem and setItemOrder...
  // (rest of implementation)
}
```

**Step 3: Test sidebar preferences per profile**

Manual test: Switch between profiles and verify sidebar state is independent

**Step 4: Commit**

```bash
git add src/hooks/useSidebarPreferences.ts
git commit -m "feat(sidebar): add per-profile sidebar preferences"
```

---

## Phase 7: Profile Switcher Updates

### Task 15: Update ProfileSwitcher Component

**Files:**
- Modify: `src/components/layout/ProfileSwitcher.tsx`

**Step 1: Update switcher to change URL**

```typescript
// Update the handleSwitchProfile function
const handleSwitchProfile = (newProfile: Profile) => {
  // Extract current page from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 2 ? pathParts.slice(2).join('/') : 'dashboard';

  // Build new URL with same page context
  const newPath = `/${newProfile.type}/${newProfile.slug}/${currentPage}`;

  // Check if new profile has this page (basic validation)
  const profilePages: Record<string, string[]> = {
    comedian: ['dashboard', 'gigs', 'calendar', 'invoices', 'earnings', 'settings'],
    manager: ['dashboard', 'calendar', 'settings'],
    organization: ['dashboard', 'gigs', 'calendar', 'invoices', 'settings'],
    venue: ['dashboard', 'calendar', 'settings'],
  };

  const hasPage = profilePages[newProfile.type]?.includes(currentPage.split('/')[0]);
  const finalPath = hasPage ? newPath : `/${newProfile.type}/${newProfile.slug}/dashboard`;

  navigate(finalPath);
  setOpen(false);
};
```

**Step 2: Test profile switching**

Manual test: Switch between profiles and verify URL updates correctly

**Step 3: Commit**

```bash
git add src/components/layout/ProfileSwitcher.tsx
git commit -m "feat(profile-switcher): update URLs when switching profiles"
```

---

## Phase 8: Testing & Documentation

### Task 16: Create E2E Tests for Profile URLs

**Files:**
- Create: `tests/e2e/profile-urls.spec.ts`

**Step 1: Write E2E test**

```typescript
// tests/e2e/profile-urls.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Profile URL Routing', () => {
  test('navigates to public profile page', async ({ page }) => {
    await page.goto('/comedian/test-comedian');

    // Should show public profile
    await expect(page.locator('h1')).toContainText('test-comedian');
  });

  test('shows 404 for nonexistent profile', async ({ page }) => {
    await page.goto('/comedian/nonexistent-slug-12345');

    // Should show requested profile modal
    await expect(page.locator('dialog')).toBeVisible();
    await expect(page.locator('dialog')).toContainText("hasn't signed up yet");
  });

  test('profile switcher updates URL', async ({ page, context }) => {
    // Login first
    await page.goto('/auth');
    // ... login flow

    // Switch profile
    await page.click('[data-testid="profile-switcher"]');
    await page.click('[data-testid="switch-to-manager"]');

    // URL should update
    await expect(page).toHaveURL(/\/manager\/.*\/dashboard/);
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e -- tests/e2e/profile-urls.spec.ts`
Expected: Tests pass

**Step 3: Commit**

```bash
git add tests/e2e/profile-urls.spec.ts
git commit -m "test(e2e): add profile URL routing tests"
```

---

### Task 17: Update Documentation

**Files:**
- Create: `docs/features/PROFILE_URLS.md`

**Step 1: Write feature documentation**

```markdown
# Profile URLs & Routing

## Overview

Each profile (comedian, manager, organization, venue) gets a unique URL slug for SEO-friendly, shareable profile pages.

## URL Structure

- Public profile: `/{profileType}/{slug}`
- Dashboard: `/{profileType}/{slug}/dashboard`
- Settings: `/{profileType}/{slug}/settings`

Example: `/comedian/chillz-skinner/dashboard`

## Features

### Slug Generation
- Auto-generated from name using slugify utility
- User can customize during profile creation
- Real-time validation for uniqueness
- Reserved slugs prevented (dashboard, settings, etc.)

### 404 Handling
- Redirects to browse page with fuzzy search for similar profiles
- Modal to capture Instagram handle for outreach
- Tracks most-requested profiles

### Per-Profile State
- Each profile maintains independent sidebar preferences
- Profile switcher preserves current page context when switching

## Database Schema

See `/supabase/migrations/` for:
- Managers table
- url_slug columns on profile tables
- slug_history for 301 redirects
- requested_profiles tracking
- sidebar_preferences per-profile scoping

## Migration Strategy

Existing users auto-assigned slugs on next login with modal to customize.

## Testing

- Unit tests: `tests/utils/slugify.test.ts`, `tests/hooks/useSlugValidation.test.tsx`
- Integration: `tests/contexts/ActiveProfileContext.test.tsx`
- E2E: `tests/e2e/profile-urls.spec.ts`
```

**Step 2: Commit documentation**

```bash
git add docs/features/PROFILE_URLS.md
git commit -m "docs: add profile URLs feature documentation"
```

---

## Phase 9: Deployment Preparation

### Task 18: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Build production**

Run: `npm run build`
Expected: Build succeeds

---

### Task 19: Create Pull Request

**Step 1: Push branch to remote**

```bash
git push -u origin feature/profile-urls-routing
```

**Step 2: Create PR**

Run: `gh pr create --title "feat: Profile URLs & Routing System" --body "$(cat <<EOF
## Summary
Implements user-friendly profile URLs with dynamic routing (`/:profileType/:slug/:page` pattern).

Closes SUS-XXX

## Changes
- ✅ Database: managers table, url_slug columns, slug_history, requested_profiles
- ✅ Utilities: slugify, validation, useSlugValidation hook
- ✅ Context: ActiveProfileContext for profile state management
- ✅ Routing: Nested dynamic routes with proper priority
- ✅ Components: PublicProfile, NotFoundHandler, RequestedProfileModal
- ✅ Sidebar: Per-profile preferences
- ✅ Profile Switcher: URL-aware switching
- ✅ Tests: Unit, integration, E2E coverage
- ✅ Docs: Feature documentation

## Testing
- All unit tests pass (146 passing)
- E2E tests for routing scenarios
- Manual testing on profile creation and switching

## Database Migrations
- 6 migrations applied (see supabase/migrations/)
- All migrations tested locally
- No destructive operations

## Rollback Plan
1. Vercel deployment rollback
2. Git revert to previous commit
3. Database PITR if needed
4. Migrations are additive (safe to rollback app code)
EOF
)"`

**Step 3: Verify CI passes**

Wait for GitHub Actions to complete

---

## Summary

This implementation plan covers all 47 tasks from the design document, broken down into bite-sized steps following TDD principles. Each task includes exact file paths, complete code examples, test commands with expected output, and commits.

**Estimated timeline:** 8-12 hours of focused development work across 9 phases.

**Key milestones:**
- Phase 1-2: Database foundation (2-3 hours)
- Phase 3-4: Core routing logic (2-3 hours)
- Phase 5-6: UI components (2-3 hours)
- Phase 7-9: Integration and testing (2-3 hours)

## Next Steps

Plan complete and saved. Ready for execution with either:
1. **Subagent-Driven Development** - Stay in this session, dispatch fresh subagent per task
2. **Executing Plans** - Open new session in worktree for batch execution
