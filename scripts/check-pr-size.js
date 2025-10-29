#!/usr/bin/env node

/**
 * PR Size Check Script
 *
 * Warns about large PRs and enforces maximum size limits.
 *
 * Usage:
 *   node scripts/check-pr-size.js
 *
 * Environment variables:
 *   PR_NUMBER - The PR number
 *   GITHUB_REPOSITORY - Repository name (owner/repo)
 *   GITHUB_TOKEN - GitHub API token
 */

const WARN_THRESHOLD = 500;
const ERROR_THRESHOLD = 1000;

async function getPRStats(owner, repo, prNumber, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    additions: data.additions,
    deletions: data.deletions,
    changedFiles: data.changed_files,
    totalChanges: data.additions + data.deletions,
    labels: data.labels ? data.labels.map(l => l.name) : [],
  };
}

function analyzeSize(stats) {
  const { additions, deletions, changedFiles, totalChanges, labels } = stats;

  console.log(`\n📊 PR Size Analysis:`);
  console.log(`  • Files changed: ${changedFiles}`);
  console.log(`  • Lines added: +${additions}`);
  console.log(`  • Lines removed: -${deletions}`);
  console.log(`  • Total changes: ${totalChanges} lines\n`);

  // Check if large-pr label is present
  const hasLargePRLabel = labels.includes('large-pr');

  if (totalChanges >= ERROR_THRESHOLD) {
    if (hasLargePRLabel) {
      console.warn(`⚠️  PR is large (${totalChanges} lines changed)`);
      console.warn(`   Maximum recommended: ${ERROR_THRESHOLD} lines`);
      console.warn(`✅ [large-pr] label found - size check bypassed\n`);
      console.warn('💡 Large PRs acknowledged. Please ensure:');
      console.warn('  • Comprehensive testing has been done');
      console.warn('  • PR description explains why size is necessary');
      console.warn('  • Reviewers have sufficient context\n');
      return { status: 'warning', totalChanges };
    } else {
      console.error(`❌ PR is too large (${totalChanges} lines changed)`);
      console.error(`   Maximum allowed: ${ERROR_THRESHOLD} lines\n`);
      console.error('💡 This PR is very large and difficult to review. Please consider:');
      console.error('  • Breaking it into smaller, focused PRs');
      console.error('  • Splitting by feature or component');
      console.error('  • Separating refactoring from feature work');
      console.error('  • Adding the "[large-pr]" label if this size is unavoidable\n');
      return { status: 'error', totalChanges };
    }
  }

  if (totalChanges >= WARN_THRESHOLD) {
    console.warn(`⚠️  PR is large (${totalChanges} lines changed)`);
    console.warn(`   Recommended maximum: ${WARN_THRESHOLD} lines\n`);
    console.warn('💡 Large PRs are harder to review and more likely to introduce bugs.');
    console.warn('   Consider breaking this into smaller PRs if possible.\n');
    return { status: 'warning', totalChanges };
  }

  console.log(`✅ PR size is reasonable (${totalChanges} lines changed)\n`);
  return { status: 'ok', totalChanges };
}

// Main execution
async function main() {
  const prNumber = process.env.PR_NUMBER;
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!prNumber || !repository || !token) {
    console.error('❌ Missing required environment variables');
    console.error('   Required: PR_NUMBER, GITHUB_REPOSITORY, GITHUB_TOKEN');
    process.exit(1);
  }

  const [owner, repo] = repository.split('/');

  console.log(`\n📏 Checking PR #${prNumber} size...\n`);

  try {
    const stats = await getPRStats(owner, repo, prNumber, token);
    const result = analyzeSize(stats);

    // Exit with appropriate code
    if (result.status === 'error') {
      process.exit(1);
    } else if (result.status === 'warning') {
      // Warnings don't fail the check
      process.exit(0);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ Error checking PR size: ${error.message}`);
    process.exit(1);
  }
}

main();
