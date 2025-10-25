## Summary
<!-- Explain the change and why it's needed in 2-4 lines -->


## Linear Issue
<!-- Link to Linear issue: Closes SUS-XXX -->


## Safety Checklist
<!-- Check all that apply -->
- [ ] No direct writes to production DB (changes go through migrations)
- [ ] Database migrations tested locally
- [ ] Tests added/updated for new functionality
- [ ] Lint and typecheck pass locally (`npm run lint`)
- [ ] E2E smoke tests pass locally (if UI changes: `npm run test:e2e`)
- [ ] Breaking changes documented in description
- [ ] Feature flagged (if user-visible and high-risk)

## Type of Change
<!-- Check one -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Database migration (schema or data changes)
- [ ] Configuration change (environment variables, build config)
- [ ] Documentation update

## Testing & Validation
<!-- Describe how you tested this change -->

**Steps to verify:**
1.
2.
3.

**Expected behavior:**


**Test URLs/Commands:**
```bash
# Example: npm run test -- --testNamePattern="invoice sync"
```

## Database Migrations
<!-- If this PR includes migrations, fill out this section -->
**Migration files:**
- [ ] `supabase/migrations/YYYYMMDD_description.sql`

**Migration tested on:**
- [ ] Local shadow database (Docker Postgres)
- [ ] Development database
- [ ] Includes rollback/down migration (if applicable)

**Destructive operations:** (DROP TABLE, DROP COLUMN, etc.)
- [ ] None
- [ ] Yes - details:

## Rollback Plan
<!-- REQUIRED: How to undo this change if something goes wrong -->

**If deployed to production and issues occur:**

**Option 1 - Vercel Rollback (fastest):**
```bash
# Vercel dashboard → Deployments → [previous deployment] → Promote to Production
# OR: vercel alias set <previous-deployment-url> production --token=$VERCEL_TOKEN
```

**Option 2 - Git Revert:**
```bash
git revert <commit-sha>
git push origin main
```

**Option 3 - Database Rollback (if migration applied):**
```bash
# Restore from PITR: Supabase Dashboard → Database → Backups → Point-in-time recovery
# OR: pg_restore --dbname="$DATABASE_URL" predeploy.dump
```

**Option 4 - Feature Flag Disable (if flagged):**
```sql
UPDATE feature_flags SET enabled = false WHERE key = 'feature_name';
```

## Screenshots
<!-- If UI changes, add before/after screenshots -->


## Additional Notes
<!-- Anything else reviewers should know -->


## Deployment Notes
<!-- Special instructions for deployment (e.g., run migrations first, update env vars) -->


---

**Checklist before requesting review:**
- [ ] PR title follows Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.)
- [ ] All checkboxes in Safety Checklist are reviewed
- [ ] Rollback plan is filled out
- [ ] Tests pass locally
- [ ] Ready for review

**For Reviewers:**
- [ ] Code quality and style are acceptable
- [ ] Tests adequately cover the changes
- [ ] Rollback plan is realistic and complete
- [ ] No obvious security or performance issues
- [ ] Documentation is updated if needed
