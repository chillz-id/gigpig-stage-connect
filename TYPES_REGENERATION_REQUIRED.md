# Supabase Types Regeneration Required

## Context

The following database migrations have been applied but the TypeScript types in `src/integrations/supabase/types.ts` have NOT been regenerated yet:

### New Tables Added
1. **managers** (20251026000000_create_managers_table.sql)
   - Columns: id, user_id, url_slug, name, bio, avatar_url, manager_type, organization_id, venue_id, created_at, updated_at

2. **slug_history** (20251026000002_create_slug_history.sql)
   - Columns: id, profile_type, profile_id, old_slug, new_slug, changed_at

3. **requested_profiles** (20251026000003_create_requested_profiles.sql)
   - Columns: id, profile_type, slug_attempted, instagram_handle, request_count, requested_by, created_at, updated_at

4. **sidebar_preferences** (20251026000004_update_sidebar_preferences.sql)
   - Columns: id, user_id, profile_type, profile_id, hidden_items, item_order, created_at, updated_at

### Columns Added to Existing Tables
1. **comedians.url_slug** (TEXT, NOT NULL, UNIQUE)
2. **organizations.url_slug** (TEXT, NOT NULL, UNIQUE)
3. **venues.url_slug** (TEXT, NOT NULL, UNIQUE)
4. **photographers.url_slug** (TEXT, NOT NULL, UNIQUE) - if table exists

### New Functions Added
1. **slugify(text_input TEXT)** - Converts text to URL-safe slug
2. **generate_unique_slug(base_slug TEXT, profile_table TEXT, excluded_id UUID)** - Generates unique slug with counter
3. **record_profile_request(p_profile_type TEXT, p_slug TEXT, p_instagram_handle TEXT, p_user_id UUID)** - Records profile requests

## How to Regenerate Types

### Option 1: Using the Script (Recommended)

```bash
# Ensure you're in the project root
cd /root/agents/.worktrees/feature/profile-urls-routing

# Run the regeneration script
./scripts/regenerate-types.sh
```

### Option 2: Manual Regeneration

1. **Login to Supabase** (if not already logged in):
   ```bash
   npx supabase login
   ```

2. **Generate types**:
   ```bash
   npx supabase gen types typescript --project-id pdikjpfulhhpqpxzpgtu > src/integrations/supabase/types.ts
   ```

3. **Verify TypeScript compilation**:
   ```bash
   npm run tsc --noEmit
   ```

### Option 3: Using Environment Variable

If you have a Supabase access token:

```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
npx supabase gen types typescript --project-id pdikjpfulhhpqpxzpgtu > src/integrations/supabase/types.ts
```

## Expected Type Changes

After regeneration, the following types should be present:

```typescript
// New table types
Database['public']['Tables']['managers']
Database['public']['Tables']['slug_history']
Database['public']['Tables']['requested_profiles']
Database['public']['Tables']['sidebar_preferences']

// Updated table types with url_slug
Database['public']['Tables']['comedians']['Row']['url_slug']: string
Database['public']['Tables']['organizations']['Row']['url_slug']: string
Database['public']['Tables']['venues']['Row']['url_slug']: string

// New functions
Database['public']['Functions']['slugify']
Database['public']['Functions']['generate_unique_slug']
Database['public']['Functions']['record_profile_request']
```

## Verification Checklist

After regenerating types:

- [ ] File `src/integrations/supabase/types.ts` exists and is updated
- [ ] All 4 new tables are present in types
- [ ] `url_slug` column appears in comedians, organizations, venues types
- [ ] New functions are typed
- [ ] `npm run tsc --noEmit` passes without errors
- [ ] No TypeScript errors in IDE

## Next Steps After Type Regeneration

Once types are regenerated, commit the changes:

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate Supabase types for profile URLs"
```

## Troubleshooting

**Error: "Access token not provided"**
- Run `npx supabase login` and follow the prompts
- Or set `SUPABASE_ACCESS_TOKEN` environment variable

**Error: "Cannot find project ref"**
- Ensure you're in the correct directory
- Check that `supabase/config.toml` has `project_id = "pdikjpfulhhpqpxzpgtu"`

**TypeScript errors after regeneration**
- Check that all migrations were applied successfully
- Verify the project ID is correct
- Review the generated types file for any obvious issues

## Related Migrations

This regeneration is part of the Profile URLs & Routing feature implementation:

- Task 1: ✅ Create Managers Table
- Task 2: ✅ Add url_slug to Existing Profile Tables
- Task 3: ✅ Create Slug History Table
- Task 4: ✅ Create Requested Profiles Table
- Task 5: ✅ Update Sidebar Preferences Schema
- Task 6: ✅ Auto-Generate Slugs for Existing Profiles
- Task 7: ⚠️  **Regenerate Supabase Types** (PENDING - requires auth)

See `/root/agents/.worktrees/feature/profile-urls-routing/docs/plans/2025-10-26-profile-urls-routing-implementation.md` for full implementation plan.
