#!/usr/bin/env python3
"""
Fix duplicate className attributes in TSX files
"""

import re
import os
from pathlib import Path

def fix_duplicate_classnames(content):
    """Fix duplicate className attributes in JSX/TSX content"""
    changes = 0

    # Pattern 1: Two simple string classNames
    # className="foo"
    # className="bar"
    pattern1 = r'className="([^"]+)"\s*\n\s+className="([^"]+)"'
    def replace1(match):
        nonlocal changes
        changes += 1
        return f'className="{match.group(1)} {match.group(2)}"'
    content = re.sub(pattern1, replace1, content)

    # Pattern 2: String followed by template literal
    # className="foo"
    # className={`bar`}
    pattern2 = r'className="([^"]+)"\s*\n\s+className=\{`([^`]+)`\}'
    def replace2(match):
        nonlocal changes
        changes += 1
        return f'className={{`{match.group(1)} {match.group(2)}`}}'
    content = re.sub(pattern2, replace2, content)

    # Pattern 3: String followed by cn() or complex expression
    #className="foo"
    # className={cn(...)}
    pattern3 = r'className="([^"]+)"\s*\n\s+className=\{(cn\([^}]+\))\}'
    def replace3(match):
        nonlocal changes
        changes += 1
        class1 = match.group(1)
        cn_expr = match.group(2)
        # Try to merge the first class into the cn call
        # cn("bar", ...) => cn("foo bar", ...)
        cn_merged = re.sub(r'cn\("([^"]+)"', f'cn("{class1} \\1"', cn_expr)
        if cn_merged != cn_expr:
            return f'className={{{cn_merged}}}'
        else:
            # If we couldn't merge, just put it at the start
            return f'className={{`{class1} ${{cn(...)}}`}}'
    content = re.sub(pattern3, replace3, content)

    # Pattern 4: String followed by className with template literal containing expressions
    # className="foo"
    # className={`text-xs ${expr}`}
    pattern4 = r'className="([^"]+)"\s*\n\s+className=\{`([^`]*\$\{[^}]+\}[^`]*)`\}'
    def replace4(match):
        nonlocal changes
        changes += 1
        class1 = match.group(1)
        template = match.group(2)
        return f'className={{`{class1} {template}`}}'
    content = re.sub(pattern4, replace4, content)

    return content, changes

def process_file(file_path):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content, changes = fix_duplicate_classnames(content)

        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Fixed {changes} duplicate(s) in: {file_path}")
            return changes
        return 0
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return 0

def main():
    """Main entry point"""
    src_dir = Path('/root/agents/src')
    tsx_files = list(src_dir.rglob('*.tsx'))

    print(f"Found {len(tsx_files)} TSX files\n")

    total_changes = 0
    files_changed = 0

    for file_path in tsx_files:
        changes = process_file(file_path)
        if changes > 0:
            total_changes += changes
            files_changed += 1

    print(f"\n✓ Fixed {total_changes} duplicate className(s) in {files_changed} file(s)")

if __name__ == '__main__':
    main()
