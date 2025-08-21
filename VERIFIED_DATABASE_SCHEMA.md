# VERIFIED DATABASE SCHEMA

**GENERATED**: August 6, 2025 - After proper verification (no assumptions)
**PURPOSE**: Document actual database structure to prevent future schema assumption errors

## 1. PROFILES TABLE STRUCTURE

```sql
-- From: 2025-07-09T19-33-59_fix_profile_system_foundation.sql
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**CRITICAL**: There is **NO** `role` column in the profiles table.

## 2. USER ROLES SYSTEM

```sql
-- Role enum definition
CREATE TYPE public.user_role AS ENUM (
  'comedian', 'promoter', 'admin',        -- Original roles
  'photographer', 'videographer',         -- Added in 20250108
  'member', 'co_promoter'                 -- Added in 20250626
);

-- Separate user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
```

## 3. VERIFIED RLS POLICY PATTERNS

### Pattern 1: Admin Role Check
```sql
EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
)
```

### Pattern 2: Event Owner Check  
```sql
EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = [table].event_id
  AND events.promoter_id = auth.uid()
)
```

### Pattern 3: Authenticated Users
```sql
auth.role() = 'authenticated'
```

## 4. EXISTING MANUAL ENTRY TABLE

**VERIFIED**: There is already a `manual_ticket_entries` table from 20250805_add_manual_platforms_support.sql

```sql
CREATE TABLE public.manual_ticket_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  entry_type TEXT CHECK (entry_type IN ('single', 'bulk_csv', 'bulk_manual')) DEFAULT 'single',
  entries_count INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  -- ... more columns
);
```

**PLATFORM CONSTRAINTS**: Currently has CHECK constraint limiting platforms to specific values.

## 5. EVENTS TABLE REFERENCE

```sql
-- Events table has these key columns for access control:
- id UUID
- promoter_id UUID (references auth.users)
```

## 6. CRITICAL LESSONS

1. **NEVER assume schema structure** - Always verify against actual migrations
2. **Use existing successful patterns** - Don't invent new RLS policy structures  
3. **Check for existing tables** - May already have what we need
4. **Follow exact existing patterns** - Copy successful policy syntax exactly

## 7. NEXT STEPS FOR FLEXIBLE PLATFORM SYSTEM

Based on VERIFIED schema:
1. Modify existing `manual_ticket_entries` table to remove platform constraints
2. Use EXACT RLS patterns from successful migrations
3. Update UI to work with existing table structure
4. Test with actual database first

**NO MORE ASSUMPTIONS. ONLY VERIFIED FACTS.**