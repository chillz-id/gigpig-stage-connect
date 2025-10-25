#!/usr/bin/env node

/**
 * PR Description Validation Script
 *
 * Validates that PRs have meaningful descriptions.
 *
 * Usage:
 *   node scripts/validate-pr-description.js
 *
 * Environment variables:
 *   PR_BODY - The PR description body (from GitHub Actions)
 *   PR_NUMBER - The PR number
 */

const MIN_DESCRIPTION_LENGTH = 50;

const TEMPLATE_PATTERNS = [
  /^## Description\s*$/m,
  /^## Changes\s*$/m,
  /^## Testing\s*$/m,
  /^<!-- Please provide a brief description/,
  /^\s*$/,
];

function validatePRDescription(prBody) {
  if (!prBody || prBody.trim().length === 0) {
    return {
      valid: false,
      error: '❌ PR description is empty. Please provide a meaningful description of your changes.',
    };
  }

  // Remove common template sections to get actual content
  let contentWithoutTemplate = prBody;
  TEMPLATE_PATTERNS.forEach(pattern => {
    contentWithoutTemplate = contentWithoutTemplate.replace(pattern, '');
  });

  const trimmedContent = contentWithoutTemplate.trim();

  if (trimmedContent.length === 0) {
    return {
      valid: false,
      error: '❌ PR description only contains template text. Please fill in the template with actual information about your changes.',
    };
  }

  if (trimmedContent.length < MIN_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `❌ PR description is too short (${trimmedContent.length} characters). Please provide at least ${MIN_DESCRIPTION_LENGTH} characters describing your changes.\n\nCurrent description:\n${trimmedContent.substring(0, 100)}...`,
    };
  }

  return {
    valid: true,
    message: `✅ PR description is valid (${trimmedContent.length} characters)`,
  };
}

// Main execution
const prBody = process.env.PR_BODY || '';
const prNumber = process.env.PR_NUMBER || 'unknown';

console.log(`\n📝 Validating PR #${prNumber} description...\n`);

const result = validatePRDescription(prBody);

if (result.valid) {
  console.log(result.message);
  console.log('\n✅ PR description validation passed!\n');
  process.exit(0);
} else {
  console.error(result.error);
  console.error('\n💡 Tips for writing good PR descriptions:');
  console.error('  • Explain WHAT changed and WHY');
  console.error('  • Include context for reviewers');
  console.error('  • Reference related issues (Linear/GitHub)');
  console.error('  • Describe testing performed');
  console.error('  • Mention any breaking changes\n');
  console.error('To skip validation, add the "[skip-validation]" label to your PR.\n');
  process.exit(1);
}
