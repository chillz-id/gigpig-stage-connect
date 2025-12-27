# Promoter Removal Rollback Plan

## Overview

**Created**: 2025-01-21
**Status**: Ready for Emergency Use
**Risk Level**: Medium
**Estimated Rollback Time**: 15-30 minutes

This document provides step-by-step procedures to rollback the promoter role removal changes if critical issues are discovered after deployment.

## When to Execute Rollback

Execute this rollback plan if any of the following occur:

🔴 **Critical Issues (Immediate Rollback)**
- Users with promoter role cannot access the platform
- Database errors preventing event creation/editing
- Cascade errors affecting existing data
- Authentication/authorization failures for former promoters
- Production crash or service unavailability

🟡 **High Priority Issues (Evaluate First)**
- Migration banner not displaying correctly
- Profile switcher errors
- Organization creation failures (evaluate: might be unrelated)
- UI rendering issues (might be fixable without rollback)

🟢 **Low Priority Issues (No Rollback Needed)**
- Migration banner dismissed too easily (UX tweak)
- Help text unclear (documentation update)
- Visual inconsistencies (CSS fix)

## Rollback Options

### Option 1: Vercel Deployment Rollback (Fastest - 2 minutes)

**Use When**: Quick revert needed, no database changes involved

**Steps:**
1. Log into Vercel dashboard
2. Navigate to Stand Up Sydney project
3. Go to "Deployments" tab
4. Find the deployment immediately before promoter removal
5. Click "..." menu → "Promote to Production"
6. Confirm rollback
7. Wait for deployment (typically 30-60 seconds)
8. Verify at https://standupsydney.com

**Pros:**
- Fastest option (2 minutes)
- No code changes needed
- Automatic DNS propagation

**Cons:**
- Only reverts frontend code
- Database remains unchanged
- Loses any unrelated changes deployed after

**Testing After Rollback:**
```bash
# Verify promoter role works
curl https://standupsydney.com/api/test-promoter-access

# Check profile switcher
# Manually: Log in as promoter user, verify profile switcher shows promoter option
```

---

### Option 2: Git Revert (Standard - 10 minutes)

**Use When**: Need to revert specific commits while keeping other changes

**Steps:**

**1. Identify Commits to Revert**
```bash
cd /root/agents

# Find the commits related to promoter removal
git log --oneline --grep="promoter" --since="2025-01-21"

# Note the commit SHAs for:
# - PromoterMigrationBanner creation
# - ProfileContext updates
# - ActiveProfileContext updates
# - Test file updates
# - Documentation updates
```

**2. Create Revert Branch**
```bash
# Create revert branch
git checkout -b revert/promoter-removal-20250121

# Revert commits in reverse chronological order
git revert <commit-sha-phase6> --no-commit
git revert <commit-sha-phase5> --no-commit
git revert <commit-sha-phase4> --no-commit
git revert <commit-sha-phase3> --no-commit
git revert <commit-sha-phase2> --no-commit
git revert <commit-sha-phase1> --no-commit

# Review changes
git status
git diff --cached
```

**3. Test Locally**
```bash
# Run type checking
npx tsc --noEmit

# Run unit tests
npm run test

# Run build
npm run build

# If all pass, commit
git commit -m "revert: rollback promoter removal (emergency fix)

CRITICAL: Reverting promoter to organization migration due to production issues.

Reverted changes:
- PromoterMigrationBanner component
- ProfileContext PROFILE_TYPES updates
- ActiveProfileContext type changes
- ProfileSwitcher promoter removal
- Photographer service updates
- Documentation changes

Reason: [DESCRIBE ISSUE HERE]
Impact: Restores promoter role functionality
Testing: All tests passing locally"
```

**4. Deploy**
```bash
# Push to GitHub
git push origin revert/promoter-removal-20250121

# Create PR with URGENT label
gh pr create \
  --title "🔴 URGENT: Rollback Promoter Removal" \
  --body "Emergency rollback of promoter to organization migration.

## Issue
[DESCRIBE CRITICAL ISSUE]

## Changes
Reverts all promoter removal changes from 2025-01-21.

## Testing
- ✅ TypeScript compilation
- ✅ Unit tests (47 tests)
- ✅ Build succeeds

## Deployment
Request immediate merge and deploy to production." \
  --label urgent \
  --label rollback

# Merge PR
gh pr merge --squash --delete-branch

# Verify Vercel auto-deploys
# (usually within 2-3 minutes)
```

**Pros:**
- Surgical revert of specific changes
- Preserves other commits
- Creates audit trail
- Can be reviewed before deploy

**Cons:**
- Takes 10-15 minutes
- Requires manual testing
- May have merge conflicts

---

### Option 3: Database Point-In-Time Restore (Nuclear - 30 minutes)

**Use When**: Database corruption or critical data integrity issues

⚠️ **WARNING**: This restores the ENTIRE database to a previous state. **All data changes since the backup will be lost.**

**Before You Start:**
- Confirm issue is database-related (not frontend bug)
- Get approval from senior team member
- Document current database state
- Notify all users of impending downtime

**Steps:**

**1. Export Current State (Just in Case)**
```bash
# Backup current state before restore
supabase db dump \
  --project-ref <project-ref> \
  > backup-before-rollback-$(date +%Y%m%d-%H%M%S).sql
```

**2. Perform Point-In-Time Restore**

Via Supabase Dashboard:
1. Go to Supabase dashboard
2. Select Stand Up Sydney project
3. Navigate to Database → Backups
4. Find backup from before deployment (2025-01-21 00:00)
5. Click "Restore"
6. Confirm: "I understand this will delete current data"
7. Wait for restore (5-10 minutes)

Via Supabase CLI (faster):
```bash
supabase db restore \
  --project-ref <project-ref> \
  --backup-id <backup-before-deployment>
```

**3. Verify Database State**
```bash
# Check promoter role exists
supabase db query "
  SELECT COUNT(*) as promoter_count
  FROM user_roles
  WHERE role = 'promoter';
"

# Check photographer_profiles exists/doesn't exist
# (depending on when photographer was added)
supabase db query "
  SELECT COUNT(*) as photographer_count
  FROM photographer_profiles;
"
```

**4. Rollback Frontend (Option 1 or 2 above)**

**Pros:**
- Complete database rollback
- Fixes data integrity issues
- Known good state

**Cons:**
- **Loses all data since backup** (events, users, content)
- Significant downtime (30+ minutes)
- Requires user notification
- Very disruptive

---

### Option 4: Feature Flag Disable (If Implemented - 1 minute)

**Use When**: Feature flags were added for phased rollout

**Note**: This option is **NOT currently implemented** but recommended for future major changes.

**If Implemented:**
```typescript
// In src/config/features.ts
export const FEATURE_FLAGS = {
  useOrganizationsInsteadOfPromoters: false, // Disable feature
  showPromoterMigrationBanner: false,
  enablePhotographerProfiles: false,
};
```

**Recommendation**: Add feature flags for next major migration.

---

## Rollback Verification Checklist

After executing any rollback option, verify:

### 1. Functionality Tests
- [ ] User with promoter role can log in
- [ ] Profile switcher shows promoter option
- [ ] `/create-event` accessible to promoters
- [ ] Event creation works
- [ ] Event editing works
- [ ] Applications page loads
- [ ] CRM access works for promoter role

### 2. Database Tests
```sql
-- Verify promoter role exists
SELECT COUNT(*) FROM user_roles WHERE role = 'promoter';
-- Expected: > 0

-- Verify PROFILE_TYPES includes promoter (or doesn't, depending on rollback scope)
-- Check via application UI

-- Verify no orphaned data
SELECT COUNT(*) FROM events WHERE created_by NOT IN (
  SELECT id FROM profiles
);
-- Expected: 0
```

### 3. UI Tests
- [ ] No console errors on dashboard
- [ ] Profile switcher renders correctly
- [ ] No migration banner (if fully rolled back)
- [ ] Navigation works correctly
- [ ] No broken links or 404s

### 4. Integration Tests
- [ ] Run smoke tests: `npm run test:smoke`
- [ ] Run profile tests: `npm run test:profile`
- [ ] Verify E2E critical paths

### 5. User Communication
- [ ] Post status update (if downtime occurred)
- [ ] Email affected users (if data was lost)
- [ ] Update Linear issue with rollback details
- [ ] Internal team notification

---

## Post-Rollback Actions

### Immediate (Within 1 hour)

1. **Document Root Cause**
   - What went wrong?
   - Why did rollback occur?
   - What data was affected?

2. **Create Linear Issue**
   ```
   Title: 🔴 Rollback Required: Promoter Removal Failed
   Type: Bug
   Priority: Urgent
   Labels: rollback, production-incident, promoter-migration

   ## Issue
   [Describe what went wrong]

   ## Impact
   [Users affected, data lost, downtime]

   ## Rollback Performed
   [Which option: 1, 2, 3, or 4]

   ## Root Cause
   [Analysis of why this happened]

   ## Prevention
   [How to prevent this in future]
   ```

3. **Notify Stakeholders**
   - Send Slack/email update
   - Update status page if applicable
   - Communicate timeline for fix

### Short Term (Within 24 hours)

1. **Root Cause Analysis**
   - Technical investigation
   - Code review
   - Test gap analysis

2. **Fix Plan**
   - What needs to change?
   - Additional tests needed?
   - Migration strategy revision?

3. **Communication Plan**
   - When will feature be re-deployed?
   - What changed to prevent recurrence?
   - User impact summary

### Medium Term (Within 1 week)

1. **Re-deployment Plan**
   - Incorporate fixes
   - Add feature flags
   - Enhanced testing
   - Phased rollout strategy

2. **Prevention Measures**
   - Add pre-deployment checklist
   - Implement feature flags
   - Add integration tests
   - Staging environment testing protocol

---

## Prevention: Recommended Changes for Next Deployment

### 1. Add Feature Flags

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  // Controlled rollout
  enableOrganizationMigration: env.VITE_ENABLE_ORG_MIGRATION === 'true',
  showPromoterMigrationBanner: env.VITE_SHOW_PROMOTER_BANNER === 'true',
  enablePhotographerProfiles: env.VITE_ENABLE_PHOTOGRAPHER === 'true',

  // Kill switches
  disablePromoterRole: env.VITE_DISABLE_PROMOTER === 'true',
};
```

### 2. Implement Phased Rollout

**Week 1**: Deploy with feature flags OFF (dark launch)
- Code deployed but not active
- Test in production environment
- No user impact

**Week 2**: Enable for internal team only
- Feature flags ON for specific user IDs
- Internal testing with real data
- Gather feedback

**Week 3**: Enable for 10% of users
- Gradual rollout via percentage
- Monitor errors, performance
- User feedback collection

**Week 4**: Full rollout
- Feature flags ON for all users
- Migration banner visible
- Monitor closely

### 3. Enhanced Pre-Deployment Checklist

Before deploying major changes:

- [ ] All unit tests passing (47/47)
- [ ] All E2E tests passing
- [ ] TypeScript compilation 0 errors
- [ ] Manual testing in staging
- [ ] Database migration tested
- [ ] Rollback plan documented ✅
- [ ] Feature flags implemented
- [ ] Monitoring/alerting configured
- [ ] User communication prepared
- [ ] Stakeholder approval obtained

### 4. Monitoring & Alerts

Set up alerts for:
- 404 error rate spike
- Authentication failures
- Profile switcher errors
- Event creation failures
- Database query errors

**Recommended Tools:**
- Sentry error tracking
- Vercel analytics
- Supabase database logs
- Custom Linear automation

---

## Emergency Contacts

**If rollback is required:**

1. **Primary**: <Team Lead Email>
2. **Secondary**: <Senior Developer Email>
3. **Database Admin**: <DBA Email>
4. **Supabase Support**: support@supabase.com
5. **Vercel Support**: support@vercel.com

**Escalation Path:**
1. Developer discovers issue → Execute rollback Option 1
2. If Option 1 fails → Escalate to team lead (Option 2)
3. If database issue → Escalate to DBA (Option 3)
4. Critical outage → Page on-call engineer

---

## Related Documentation

- **Migration Guide**: `/root/agents/docs/migrations/PROMOTER_TO_ORGANIZATION.md`
- **Implementation Plan**: `/root/agents/Plans/Remove-Promoter-Add-Photographer-20250121.md`
- **Profile URLs Docs**: `/root/agents/docs/features/PROFILE_URLS.md`
- **PR Template**: `/root/agents/.github/PULL_REQUEST_TEMPLATE.md`

---

**Last Updated**: 2025-01-21
**Version**: 1.0.0
**Reviewed By**: Platform Team
**Next Review**: 2025-02-21 (1 month)
