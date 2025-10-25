#!/usr/bin/env node

/**
 * Conventional Commits Validation Script
 *
 * Validates that all commit messages in a PR follow Conventional Commits format.
 *
 * Usage:
 *   node scripts/validate-commits.js
 *
 * Environment variables:
 *   PR_NUMBER - The PR number
 *   GITHUB_REPOSITORY - Repository name (owner/repo)
 *   GITHUB_TOKEN - GitHub API token
 */

const ALLOWED_TYPES = [
  'feat',     // New feature
  'fix',      // Bug fix
  'docs',     // Documentation changes
  'style',    // Code style changes (formatting, etc.)
  'refactor', // Code refactoring
  'perf',     // Performance improvements
  'test',     // Adding or updating tests
  'chore',    // Maintenance tasks
  'ci',       // CI/CD changes
  'build',    // Build system changes
  'revert',   // Reverting changes
];

// Conventional Commits regex: type(scope?): description
const COMMIT_REGEX = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .{3,}/;

// Allow merge commits and revert commits
const MERGE_REGEX = /^Merge (branch|pull request|remote-tracking branch)/;
const REVERT_REGEX = /^Revert "/;

async function getPRCommits(owner, repo, prNumber, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const commits = await response.json();
  return commits.map(c => ({
    sha: c.sha.substring(0, 7),
    message: c.commit.message.split('\n')[0], // First line only
  }));
}

function validateCommitMessage(message) {
  // Allow merge commits
  if (MERGE_REGEX.test(message)) {
    return { valid: true, type: 'merge' };
  }

  // Allow revert commits
  if (REVERT_REGEX.test(message)) {
    return { valid: true, type: 'revert' };
  }

  // Validate conventional commit format
  const match = message.match(COMMIT_REGEX);

  if (!match) {
    return {
      valid: false,
      error: 'Does not follow Conventional Commits format',
    };
  }

  const type = match[1];
  const scope = match[2] ? match[2].slice(1, -1) : null; // Remove ()
  const description = message.substring(match[0].length);

  return {
    valid: true,
    type,
    scope,
  };
}

function analyzeCommits(commits) {
  const results = commits.map(commit => {
    const validation = validateCommitMessage(commit.message);
    return {
      ...commit,
      ...validation,
    };
  });

  const invalid = results.filter(r => !r.valid);

  return { results, invalid };
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

  console.log(`\n💬 Validating commits in PR #${prNumber}...\n`);

  try {
    const commits = await getPRCommits(owner, repo, prNumber, token);
    const { results, invalid } = analyzeCommits(commits);

    console.log(`📊 Found ${commits.length} commit(s)\n`);

    // Show all commits with validation status
    results.forEach(commit => {
      const icon = commit.valid ? '✅' : '❌';
      const typeInfo = commit.type ? ` [${commit.type}]` : '';
      console.log(`${icon} ${commit.sha}${typeInfo}: ${commit.message}`);
    });

    if (invalid.length === 0) {
      console.log('\n✅ All commits follow Conventional Commits format!\n');
      process.exit(0);
    } else {
      console.error(`\n❌ ${invalid.length} commit(s) do not follow Conventional Commits format:\n`);

      invalid.forEach(commit => {
        console.error(`  ${commit.sha}: ${commit.message}`);
        console.error(`    └─ ${commit.error}\n`);
      });

      console.error('💡 Conventional Commits format:');
      console.error('   type(scope?): description\n');
      console.error('   Examples:');
      console.error('     feat: add user authentication');
      console.error('     fix(api): handle null response from Supabase');
      console.error('     docs: update README with setup instructions');
      console.error('     refactor(components): simplify event card logic\n');
      console.error(`   Allowed types: ${ALLOWED_TYPES.join(', ')}\n`);
      console.error('   Scope is optional but recommended for context.\n');
      console.error('💡 To fix:');
      console.error('   1. Amend commit messages: git commit --amend -m "type: description"');
      console.error('   2. Force push: git push --force-with-lease');
      console.error('   3. Or squash commits when merging\n');

      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error validating commits: ${error.message}`);
    process.exit(1);
  }
}

main();
