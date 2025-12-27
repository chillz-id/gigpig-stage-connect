# EPK Section Drag-and-Drop Reordering

Created: 2025-01-21
Status: Pending

## Overview

Allow comedians to drag-and-drop EPK content sections into custom order on their profile page. Uses the same @dnd-kit pattern as CustomLinksManager.

## User Requirements

- Drag sections to reorder: Bio, Media, Upcoming Shows, Accomplishments, Contact
- All sections are draggable (no restrictions)
- Only visible to profile owner (not public viewers)
- Order persists in database per user
- Visual drag handle indicator

## Technical Approach

### 1. Database Schema

Create migration for `comedian_section_order` table:

```sql
CREATE TABLE comedian_section_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id text NOT NULL, -- 'media', 'shows', 'accomplishments', 'contact'
  display_order int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, section_id)
);

CREATE INDEX idx_comedian_section_order_user ON comedian_section_order(user_id);
```

### 2. Hook: `useEPKSectionOrder`

Create `/root/agents/src/hooks/useEPKSectionOrder.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EPKSection {
  id: string;
  section_id: string;
  display_order: number;
}

const DEFAULT_SECTION_ORDER = [
  { section_id: 'bio', display_order: 0 },
  { section_id: 'contact', display_order: 1 },
  { section_id: 'media', display_order: 2 },
  { section_id: 'shows', display_order: 3 },
  { section_id: 'accomplishments', display_order: 4 },
];

export function useEPKSectionOrder(userId: string) {
  const queryClient = useQueryClient();

  // Fetch section order
  const { data: sections = DEFAULT_SECTION_ORDER, isLoading } = useQuery({
    queryKey: ['epk-section-order', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedian_section_order')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;

      // If no custom order, return defaults
      if (!data || data.length === 0) {
        return DEFAULT_SECTION_ORDER;
      }

      return data;
    },
    enabled: !!userId,
  });

  // Update section order
  const updateSectionOrder = useMutation({
    mutationFn: async ({ section_id, display_order }: { section_id: string; display_order: number }) => {
      const { error } = await supabase
        .from('comedian_section_order')
        .upsert({
          user_id: userId,
          section_id,
          display_order,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,section_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epk-section-order', userId] });
    },
  });

  // Batch update all sections
  const updateAllSections = async (newSections: EPKSection[]) => {
    for (const section of newSections) {
      await updateSectionOrder.mutateAsync({
        section_id: section.section_id,
        display_order: section.display_order,
      });
    }
  };

  return {
    sections,
    isLoading,
    updateSectionOrder: updateSectionOrder.mutate,
    updateAllSections,
  };
}
```

### 3. Update ComedianEPKLayout

Wrap EPK content sections in drag-and-drop when owner viewing:

**Changes to make:**

1. Import @dnd-kit dependencies
2. Add `useEPKSectionOrder` hook
3. Create sortable section components
4. Render sections in custom order
5. Add drag handlers
6. Show grip handles only to owner

**Key sections to update:**

```typescript
// Lines 146-166 (EPK tab content - owner view)
// Lines 186-206 (EPK tab content - public view)
```

**Section mapping:**

```typescript
const SECTION_COMPONENTS = {
  bio: ComedianBio,
  contact: ComedianContact,
  media: ComedianMedia,
  shows: ComedianUpcomingShows,
  accomplishments: ComedianAccomplishments,
};
```

### 4. Sortable Section Wrapper

Create wrapper component for each EPK section:

```typescript
const SortableEPKSection: React.FC<{
  sectionId: string;
  children: React.ReactNode;
  isDraggable: boolean;
}> = ({ sectionId, children, isDraggable }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId, disabled: !isDraggable || sectionId === 'bio' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isDraggable && sectionId !== 'bio' && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-4 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white p-1 z-10"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}
      {children}
    </div>
  );
};
```

## Files to Create

1. **Migration**: `supabase/migrations/YYYYMMDDHHMMSS_create_comedian_section_order.sql`
2. **Hook**: `src/hooks/useEPKSectionOrder.ts`
3. **Types**: Add to `src/integrations/supabase/types` (auto-generated)

## Files to Modify

1. **`src/components/comedian-profile/ComedianEPKLayout.tsx`**
   - Add drag-and-drop context
   - Render sections in custom order
   - Handle drag end event
   - Conditionally show drag handles

## Implementation Steps

### Phase 1: Database Setup
1. Create migration for `comedian_section_order` table
2. Run migration: `supabase db push`
3. Regenerate types: `npm run types:generate`

### Phase 2: Hook Implementation
1. Create `useEPKSectionOrder.ts` hook
2. Add default section order constant
3. Implement fetch and update mutations

### Phase 3: UI Integration
1. Add @dnd-kit imports to ComedianEPKLayout
2. Create SortableEPKSection wrapper component
3. Update TabsContent to render sections dynamically
4. Add handleDragEnd function
5. Test drag-and-drop functionality

### Phase 4: Polish
1. Add visual feedback during drag (shadow, opacity)
2. Add loading states
3. Test on mobile devices

## Key Behaviors

✅ All sections draggable: Bio, Contact, Media, Shows, Accomplishments
✅ Drag handle only visible to profile owner
✅ Order persists to database per user
✅ Default order shown if no custom order saved
✅ Public viewers see sections in user's custom order
✅ Preview mode shows custom order (same as public view)

## Notes

- Uses same @dnd-kit pattern as CustomLinksManager
- Migration is non-destructive (adds new table)
- Default order ensures consistent UX for new users
- All sections fully draggable (no restrictions)
