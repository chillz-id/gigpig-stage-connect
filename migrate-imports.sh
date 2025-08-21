#!/bin/bash

# Update imports from old hooks location to new location
echo "Migrating hook imports to new structure..."

# Update useEvents imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|'@/hooks/useEvents'|'@/hooks/data/useEvents'|g"

# Update useComedians imports  
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|'@/hooks/useComedians'|'@/hooks/data/useComedians'|g"

# For components that were using the old useEvents hook directly
# We need to be careful not to update the new file itself
grep -l "from '@/hooks/useEvents'" src/**/*.{ts,tsx} 2>/dev/null | grep -v "hooks/data/useEvents.ts" | while read file; do
  echo "Updating imports in: $file"
  sed -i "s|from '@/hooks/useEvents'|from '@/hooks/data/useEvents'|g" "$file"
done

echo "Import migration complete!"