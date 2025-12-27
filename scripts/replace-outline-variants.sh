#!/bin/bash

# Script to replace variant="outline" with appropriate variants
# Cancel/Close/Dismiss buttons → ghost
# Everything else → secondary

echo "Starting variant='outline' replacement..."
echo ""

# Find all TypeScript/TSX files with variant="outline"
files=$(find /root/agents/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l 'variant="outline"' {} \;)

# Count files
file_count=$(echo "$files" | wc -l)
echo "Found $file_count files to update"
echo ""

# Step 1: Replace all variant="outline" with variant="secondary"
echo "Step 1: Replacing all variant='outline' with variant='secondary'..."
for file in $files; do
  sed -i 's/variant="outline"/variant="secondary"/g' "$file"
  echo "  ✓ Updated: $file"
done

echo ""
echo "Step 2: Updating Cancel/Close/Dismiss buttons to variant='ghost'..."

# Step 2: Find buttons with Cancel, Close, or Dismiss text and change to ghost
# Look for lines with both variant="secondary" and Cancel/Close/Dismiss keywords
for file in $files; do
  # Check if file has both variant="secondary" and cancel-type words
  if grep -qi -E '(Cancel|Close|Dismiss)' "$file" && grep -q 'variant="secondary"' "$file"; then
    # Use a more sophisticated sed that looks for Cancel/Close/Dismiss context
    # This will find buttons where the text contains these words
    sed -i -E '/variant="secondary"/,/Button>/ {
      />(Cancel|Close|Dismiss)</I {
        s/variant="secondary"/variant="ghost"/g
      }
    }' "$file"
    echo "  ✓ Updated Cancel/Close buttons in: $file"
  fi
done

echo ""
echo "Replacement complete!"
echo ""
echo "Summary:"
echo "  - Files updated: $file_count"
echo "  - All variant='outline' → variant='secondary'"
echo "  - Cancel/Close/Dismiss buttons → variant='ghost'"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff src/"
echo "  2. Test critical user flows"
echo "  3. Commit if everything looks good"
