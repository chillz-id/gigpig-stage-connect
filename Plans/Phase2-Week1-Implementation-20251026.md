# Phase 2 Week 1: Deployment Safety & PR Quality Gates
Created: 2025-10-26
Status: In Progress

## Overview
Implement Week 1 of Phase 2: PR quality enforcement and deployment safety automation.

## Implementation Order

### Task 1: PR Quality Gates (3-4 hours)
**Priority**: Highest (foundational)

#### 1.1 PR Description Validation
**File**: `.github/workflows/pr-quality-gates.yml`
- Check that PR body is not empty
- Require minimum description length (50 chars)
- Fail if only template text present
- Allow override with `[skip-validation]` label

#### 1.2 PR Size Limits
**File**: Same workflow
- Count total lines changed (additions + deletions)
- Warn if >500 lines changed
- Suggest breaking into smaller PRs
- Fail if >1000 lines (force `[large-pr]` label)

#### 1.3 Issue Link Validation
**File**: Same workflow
- Check PR body for Linear issue link (linear.app/sus-gigpig/issue/SUS-*)
- OR GitHub issue reference (#123)
- Warn if missing, but don't block
- Skip for bot PRs (dependabot, renovate)

#### 1.4 Conventional Commit Validation
**File**: Same workflow
- Validate all commit messages in PR
- Format: `type(scope?): description`
- Types: feat, fix, chore, docs, style, refactor, test, perf, ci
- Allow merge commits and revert commits
- Provide helpful error messages with examples

**Implementation**:
```yaml
name: PR Quality Gates

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

jobs:
  validate-pr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for commit validation

      - name: Validate PR Description
        run: |
          # Script to check PR body length and content

      - name: Check PR Size
        run: |
          # Script to count changed lines

      - name: Validate Issue Link
        run: |
          # Script to check for Linear/GitHub issue links

      - name: Validate Conventional Commits
        run: |
          # Script to validate all commit messages
```

### Task 2: Vercel Preview Comments (2-3 hours)
**Priority**: High (enhances PR workflow)

#### 2.1 Vercel Deployment Comment
**File**: `.github/workflows/deployment-preview.yml`
- Trigger on PR open/sync
- Wait for Vercel deployment to complete
- Comment with preview URL
- Update comment on subsequent pushes
- Add QA checklist in comment

**Implementation**:
```yaml
name: Deployment Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  comment-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Vercel Deployment
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300

      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            // Find or create comment with preview URL
            // Include QA checklist
```

#### 2.2 Deployment Status Check
**File**: Same workflow
- Add required status check for deployment
- Fail if deployment errors
- Show deployment logs on failure

### Task 3: Rollback Documentation (1 hour)
**Priority**: Medium (safety net)

#### 3.1 Update PHASE1_IMPLEMENTATION.md
**Add section**: "Rollback Procedures"

**Content**:
```markdown
## Rollback Procedures

### Quick Rollback (Vercel)
1. Go to Vercel dashboard: https://vercel.com/chillz-id/gigpig-stage-connect
2. Find last known good deployment
3. Click "Promote to Production"
4. Verify site loads correctly

OR via CLI:
```bash
# List recent deployments
vercel ls gigpig-stage-connect

# Rollback to specific deployment
vercel rollback gigpig-stage-connect <deployment-url>
```

### Database Rollback (Supabase)
```bash
# Restore from backup (created by safe-migrate.js)
psql $SUPABASE_DB_URL < backups/pre-migrate-YYYY-MM-DDTHH-MM-SS-sssZ.dump

# OR rollback specific migration
cd supabase/migrations
git revert <migration-commit-hash>
node scripts/safe-migrate.js
```

### Emergency Rollback (Full)
1. Revert code: `git revert <commit-hash> && git push`
2. Trigger re-deployment (Vercel auto-deploys on push)
3. Verify production site
4. If needed, rollback database (see above)
```

#### 3.2 Test Rollback Process
- Document testing steps
- Verify Vercel CLI access
- Test backup restoration

## Files to Create/Modify

### New Files:
```
.github/workflows/
  ├── pr-quality-gates.yml       # PR validation checks
  └── deployment-preview.yml     # Vercel preview comments

scripts/
  ├── validate-pr-description.js  # Check PR body
  ├── check-pr-size.js           # Count changed lines
  └── validate-commits.js        # Conventional commits
```

### Modified Files:
```
PHASE1_IMPLEMENTATION.md         # Add rollback procedures
.github/workflows/ci.yml         # Reference new workflows
```

## Validation Checklist

### PR Quality Gates:
- [ ] Create test PR with empty description → should fail
- [ ] Create test PR with valid description → should pass
- [ ] Create test PR with >500 lines → should warn
- [ ] Create test PR with invalid commit message → should fail
- [ ] Create test PR with valid conventional commit → should pass
- [ ] Test `[skip-validation]` label override

### Vercel Preview:
- [ ] Create test PR → should comment with preview URL
- [ ] Push to PR → should update comment
- [ ] Verify preview URL works
- [ ] Check QA checklist present in comment

### Rollback Procedures:
- [ ] Verify Vercel CLI access
- [ ] Test listing deployments
- [ ] Test backup restoration (on dev DB)
- [ ] Document all steps clearly

## Success Metrics

### Week 1 Complete When:
- ✅ PR quality gates workflow running on all PRs
- ✅ PRs automatically commented with Vercel preview URLs
- ✅ Rollback procedures documented and tested
- ✅ All validation checks passing
- ✅ Zero manual steps required for PR review

## Time Estimate
**Total**: 6-8 hours
- PR Quality Gates: 3-4 hours
- Vercel Preview Comments: 2-3 hours
- Rollback Documentation: 1 hour

## Next Steps
1. Implement PR quality gates workflow
2. Create validation scripts
3. Test with dummy PR
4. Implement Vercel preview workflow
5. Document rollback procedures
6. Update PHASE1_IMPLEMENTATION.md

---
**Created**: 2025-10-26
**Status**: Ready to implement
**Phase**: 2, Week 1
