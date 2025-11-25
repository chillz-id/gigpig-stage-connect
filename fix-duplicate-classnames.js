#!/usr/bin/env node

/**
 * Script to fix duplicate className attributes in JSX files
 * Merges duplicate className props into a single className
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

function fixDuplicateClassNames(content) {
  let fixed = content;
  let changesMade = false;

  // Pattern to match duplicate className attributes on the same JSX element
  // Handles cases like:
  // className="foo"
  // className="bar"
  // OR
  // className="foo"
  // className={`bar ${baz}`}

  const pattern = /(<\w+[^>]*?)\s+className=["'{]([^"'}]+)["'}]\s*\n\s*([^>]*?)\s+className=(["'{][^"'}]+["'}])/g;

  fixed = fixed.replace(pattern, (match, beforeFirst, firstClass, between, secondClass) => {
    changesMade = true;

    // Clean up the classes
    const first = firstClass.trim();
    let second = secondClass.trim().replace(/^["'{]|["'}]$/g, '');

    // Determine if we need template literal or regular string
    const needsTemplate = second.includes('${') || second.includes('`');

    let merged;
    if (needsTemplate) {
      // Use template literal
      merged = `className={\`${first} ${second}\`}`;
    } else {
      // Use regular string
      merged = `className="${first} ${second}"`;
    }

    return `${beforeFirst} ${between} ${merged}`;
  });

  return { fixed, changesMade };
}

async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { fixed, changesMade } = fixDuplicateClassNames(content);

    if (changesMade) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Searching for JSX/TSX files with duplicate className attributes...\n');

  const files = await glob('src/**/*.{jsx,tsx}', { cwd: '/root/agents' });

  console.log(`Found ${files.length} JSX/TSX files to check\n`);

  let fixedCount = 0;

  for (const file of files) {
    const fullPath = path.join('/root/agents', file);
    const wasFixed = await processFile(fullPath);
    if (wasFixed) fixedCount++;
  }

  console.log(`\n✓ Fixed ${fixedCount} file(s)`);
  console.log(`✓ No changes needed in ${files.length - fixedCount} file(s)`);
}

main().catch(console.error);
