# Linktree-Style Link Enhancement for EPK
Created: 2025-11-18
Updated: 2025-11-18 - Added OG fetch and thumbnail uploads
Status: Approved

## Overview
Transform the basic custom links feature into a full Linktree-style experience with automatic thumbnail fetching, custom image uploads, sections with headings, and flexible layouts (stacked/grid). UI controls use icons for clean, professional interface.

## Key Design Principles
- **Thumbnail-based cards** - Auto-fetch OG images + custom upload option
- **Icon-based UI controls** - Upload, layout toggle, edit actions use icons
- **Sections with headings** - Organize links into groups
- **Layout flexibility** - Stacked (vertical list) or Grid (2-column cards)
- **ShowCard aesthetic** - Match existing design language
- **Linktree-style** - Clean cards with image + title display

## Database Schema Changes

### 1. Add Columns to `custom_links` Table
```sql
ALTER TABLE public.custom_links
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN custom_thumbnail_url TEXT,
  ADD COLUMN section_id UUID REFERENCES public.link_sections(id) ON DELETE SET NULL,
  ADD COLUMN description TEXT;

COMMENT ON COLUMN public.custom_links.thumbnail_url IS 'Auto-fetched Open Graph image from URL';
COMMENT ON COLUMN public.custom_links.custom_thumbnail_url IS 'User-uploaded custom thumbnail (overrides auto-fetched)';
COMMENT ON COLUMN public.custom_links.section_id IS 'Optional section grouping for organizing links';
COMMENT ON COLUMN public.custom_links.description IS 'Optional subtitle text shown below title';
```

### 2. Create `link_sections` Table
```sql
CREATE TABLE IF NOT EXISTS public.link_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  layout TEXT NOT NULL DEFAULT 'stacked',  -- 'stacked' or 'grid'
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_link_sections_user_id ON public.link_sections(user_id);
CREATE INDEX idx_link_sections_order ON public.link_sections(user_id, display_order);

-- RLS Policies
ALTER TABLE public.link_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sections for visible links"
  ON public.link_sections FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own sections"
  ON public.link_sections FOR ALL
  USING (auth.uid() = user_id);
```

## Backend Services

### 3. Open Graph Thumbnail Fetcher
**New Edge Function**: `supabase/functions/fetch-og-metadata/index.ts`

Fetches Open Graph metadata from URLs:
- Accepts URL parameter
- Fetches HTML and parses `<meta>` tags (og:image, og:title, og:description)
- Falls back to Twitter Card tags if OG not available
- Returns JSON: `{ image, title, description }`
- CORS-safe server-side fetching

**New Service**: `src/services/opengraph-fetcher.ts`
- Calls Edge Function
- Caches results to avoid repeated fetching
- Error handling for unreachable URLs
- Auto-triggered on URL input (debounced 500ms)

### 4. Thumbnail Upload Service
**New Component**: `src/components/comedian-profile/LinkThumbnailUpload.tsx`

Based on existing `EventBannerUpload` pattern:
- Upload custom thumbnail (overrides OG image)
- Image cropping/resizing (400x400px for stacked, 800x400px for grid)
- Stores in Supabase Storage: `custom-link-thumbnails/{userId}/{linkId}`
- Preview uploaded image
- Icon-based upload button: `<Upload className="w-4 h-4" />`

## Component Changes

### 5. Enhanced CustomLinks Display
**File**: `src/components/comedian-profile/CustomLinks.tsx`

**Structure**:
```
Section: Social Media [Layout: stacked icon]
├─ [YouTube thumbnail] YouTube - Watch my videos
├─ [Instagram thumbnail] Instagram - Follow my journey
└─ [TikTok thumbnail] TikTok - Daily clips

Section: Shows & Tickets [Layout: grid icon]
├─ [Tickets img]      [Book img]
│  Get Tickets        Book Me
└─ [Calendar img]     [Contact img]
   My Calendar        Contact
```

**Stacked Layout** (vertical list, Linktree default):
- Full-width cards with thumbnail background or thumbnail on side
- ShowCard-inspired design but horizontal
- Title + description overlay or beside image
- Hover: scale + border glow

**Grid Layout** (2-column cards):
- ShowCard-style vertical cards (aspect-video thumbnail)
- Title overlay on image bottom
- 2 columns desktop, 1 on mobile
- Hover: scale + shadow (like ShowCard)

**Visual Style**:
```tsx
// Stacked (full width, like Linktree)
<a className="group relative overflow-hidden rounded-xl border-2 border-slate-600
              hover:border-purple-500 hover:scale-[1.02] transition-all duration-200
              bg-gradient-to-br from-slate-800 to-slate-900">
  {/* Thumbnail background (subtle) */}
  <div className="absolute inset-0 opacity-30">
    <img src={thumbnail || customThumbnail} className="w-full h-full object-cover" />
  </div>

  {/* Content */}
  <div className="relative flex items-center gap-4 px-6 py-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white/10">
      <img src={thumbnail || customThumbnail} className="w-full h-full object-cover" />
    </div>
    <div className="flex-grow text-left">
      <div className="font-semibold text-white">{title}</div>
      {description && <div className="text-sm text-white/80">{description}</div>}
    </div>
  </div>
</a>

// Grid (ShowCard-style vertical cards)
<a className="group overflow-hidden rounded-xl border-2 border-slate-600
              hover:border-purple-500 hover:scale-[1.02] hover:shadow-lg
              transition-all duration-200 bg-gradient-to-br from-slate-800 to-slate-900">
  {/* Thumbnail Image (aspect-video like ShowCard) */}
  <div className="aspect-video overflow-hidden relative">
    <img
      src={thumbnail || customThumbnail || fallbackImage}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
    />
    {/* Title Overlay (bottom gradient) */}
    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
    </div>
  </div>
</a>
```

### 6. Enhanced CustomLinksManager
**File**: `src/components/comedian-profile/CustomLinksManager.tsx`

**New Features**:
- **Icon-based controls** - All buttons use Lucide icons (no text labels)
- Auto-fetch OG thumbnail on URL input (debounced, with loading spinner)
- Custom thumbnail upload button (Upload icon)
- Section management with icon controls
- Section layout toggle (List icon vs LayoutGrid icon)
- Thumbnail preview in manager
- Description field

**Icon Buttons**:
- `<Upload />` - Upload custom thumbnail
- `<RefreshCw />` - Re-fetch OG thumbnail
- `<LayoutList />` - Stacked layout
- `<LayoutGrid />` - Grid layout
- `<Edit />` - Edit link
- `<Trash2 />` - Delete link
- `<ChevronUp />` / `<ChevronDown />` - Reorder
- `<Eye />` / `<EyeOff />` - Toggle visibility
- `<Plus />` - Add link/section

**UI Structure** (Icon-based):
```
┌──────────────────────────────────────────────┐
│ Sections                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ Social Media  [≡] [⊞]  [↑] [↓] [✏️] [🗑️] │ │
│ │                └─layout toggle─┘          │ │
│ │ ┌──────────────────────────────────────┐  │ │
│ │ │ [Thumbnail]  YouTube                 │  │ │
│ │ │              Watch my videos         │  │ │
│ │ │ [📤] [🔄] [↑] [↓] [✏️] [👁️] [🗑️]   │  │ │
│ │ │ └upload └refresh                     │  │ │
│ │ └──────────────────────────────────────┘  │ │
│ │ [+] Add Link                              │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ [+] Add Section                               │
└──────────────────────────────────────────────┘
```

**Add/Edit Link Dialog**:
- URL field triggers OG fetch (automatic, 500ms debounce)
- Loading spinner while fetching: `<Loader2 className="animate-spin" />`
- Thumbnail preview with upload override option
- Icon button to upload custom thumbnail: `<Upload />`
- Icon button to re-fetch OG: `<RefreshCw />`

### 7. New Section Dialog Component
**New File**: `src/components/comedian-profile/LinkSectionDialog.tsx`

- Add/Edit section name (heading text)
- Layout toggle with icons:
  - `<LayoutList />` - Stacked layout (default)
  - `<LayoutGrid />` - Grid layout
- Visual preview of selected layout
- Icon buttons only (no text labels)

## TypeScript Interfaces

### 8. Updated Types
**File**: `src/hooks/useCustomLinks.ts`

```typescript
export interface LinkSection {
  id: string;
  user_id: string;
  title: string;
  layout: 'stacked' | 'grid';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;           // NEW - optional subtitle
  icon_type: string | null;
  thumbnail_url: string | null;          // NEW - auto-fetched OG image
  custom_thumbnail_url: string | null;  // NEW - user-uploaded override
  section_id: string | null;             // NEW - optional section grouping
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  section?: LinkSection;                 // JOIN result
}
```

### 9. New Section Hook
**New File**: `src/hooks/useLinkSections.ts`

```typescript
export const useLinkSections = ({ userId }: { userId: string }) => {
  // CRUD operations for sections
  // Returns: sections, addSection, updateSection, deleteSection, reorderSections
};
```

### 10. New OG Fetcher Hook
**New File**: `src/hooks/useOGFetch.ts`

```typescript
export const useOGFetch = () => {
  const fetchOGData = async (url: string): Promise<{ image: string; title: string; description: string }> => {
    // Calls Edge Function
    // Returns OG metadata
  };

  return { fetchOGData, isLoading, error };
};
```

## Implementation Checklist

### Phase 1: Database & Edge Functions (1 hour)
- [ ] Create Edge Function for OG metadata fetching
- [ ] Test OG fetching with various URLs (YouTube, Instagram, etc.)
- [ ] Create migration for `link_sections` table
- [ ] Add thumbnail and section columns to `custom_links`
- [ ] Update Supabase types generation
- [ ] Test RLS policies

### Phase 2: Thumbnail Services (1.5 hours)
- [ ] Create `useOGFetch` hook calling Edge Function
- [ ] Create `LinkThumbnailUpload` component (based on EventBannerUpload)
- [ ] Set up Supabase Storage bucket for link thumbnails
- [ ] Add image cropping/resizing logic
- [ ] Test upload and storage

### Phase 3: Section Management (2 hours)
- [ ] Create `useLinkSections` hook with CRUD operations
- [ ] Update `useCustomLinks` to include section JOIN and thumbnails
- [ ] Create `LinkSectionDialog` component with icon-based layout toggle
- [ ] Add section management UI to `CustomLinksManager`
- [ ] Add icon-only controls (LayoutList/LayoutGrid icons)
- [ ] Test section creation and reordering

### Phase 4: Enhanced Link Manager (2 hours)
- [ ] Add auto OG fetch on URL input (debounced 500ms)
- [ ] Add thumbnail preview in manager
- [ ] Add upload icon button for custom thumbnails
- [ ] Add refresh icon button to re-fetch OG
- [ ] Add description field
- [ ] Add section assignment dropdown
- [ ] Replace all text buttons with icon buttons
- [ ] Test thumbnail fetching and uploading

### Phase 5: Display Enhancement (2.5 hours)
- [ ] Update `CustomLinks.tsx` to group by sections
- [ ] Implement stacked layout (horizontal card with thumbnail)
- [ ] Implement grid layout (ShowCard-style vertical cards)
- [ ] Add section headings with layout indicator
- [ ] Handle thumbnail display (custom_thumbnail_url overrides thumbnail_url)
- [ ] Fallback image for links without thumbnails
- [ ] Match ShowCard aesthetic (gradients, borders, hover)

### Phase 6: Polish & Testing (1 hour)
- [ ] Mobile responsive (grid becomes 1-column)
- [ ] Thumbnail loading states and errors
- [ ] OG fetch error handling
- [ ] Hidden links filtered correctly
- [ ] Empty states for no links/sections
- [ ] Analytics tracking on link clicks
- [ ] Cross-browser testing

## Files to Modify/Create

**Database**:
1. `supabase/migrations/YYYYMMDD_add_link_sections_and_thumbnails.sql`

**Edge Functions**:
2. `supabase/functions/fetch-og-metadata/index.ts` - OG scraper

**Services**:
3. `src/services/opengraph-fetcher.ts` - OG fetch wrapper
4. `src/services/link-thumbnail-storage.ts` - Storage helper

**Hooks**:
5. `src/hooks/useCustomLinks.ts` - Add thumbnails, sections JOIN
6. `src/hooks/useLinkSections.ts` - Section CRUD hook
7. `src/hooks/useOGFetch.ts` - OG metadata fetching hook

**Components**:
8. `src/components/comedian-profile/CustomLinks.tsx` - Thumbnail-based display
9. `src/components/comedian-profile/CustomLinksManager.tsx` - Enhanced manager with thumbnails
10. `src/components/comedian-profile/LinkSectionDialog.tsx` - Section dialog
11. `src/components/comedian-profile/LinkThumbnailUpload.tsx` - Thumbnail upload

**Types**:
12. `src/integrations/supabase/types.ts` - Auto-generated from schema

## Design Reference

Based on Linktree standard layout:
- **Section headings** - Bold text with layout icon indicator
- **Stacked links** - Full-width cards with thumbnail (background or side)
- **Grid links** - ShowCard-style vertical cards with aspect-video thumbnails
- **Icon-based controls** - All manager buttons use Lucide icons only
- **Thumbnail priority** - custom_thumbnail_url overrides auto-fetched thumbnail_url
- **Smooth interactions** - Hover scale, border glow, smooth transitions

## Key Behaviors

✅ **Auto-fetch OG thumbnails** - Triggered on URL input (debounced 500ms)
✅ **Custom thumbnail upload** - Overrides auto-fetched image
✅ **Thumbnail display priority** - custom_thumbnail_url > thumbnail_url > fallback
✅ **Icon-only UI controls** - Upload, refresh, layout toggle all use icons
✅ **Sections with layouts** - Each section has stacked or grid layout
✅ **Links grouped under sections** - Organized by section headings
✅ **Unsectioned links** - Links without section_id appear separately
✅ **ShowCard aesthetic** - Gradients, borders, hover effects match existing design
✅ **Mobile responsive** - Grid becomes 1-column, stacked stays full-width
✅ **Hidden links filtered** - is_visible=false links don't show in public view
✅ **OG fetch error handling** - Fallback to default image if fetch fails

## Notes
- OG fetching uses Edge Function to avoid CORS issues
- Custom thumbnails stored in Supabase Storage bucket
- Thumbnail dimensions: 400x400px (stacked), 800x400px (grid)
- Layout toggle icons: LayoutList (stacked), LayoutGrid (grid)
- Upload icon button triggers thumbnail upload dialog
- RefreshCw icon re-fetches OG metadata
- All manager controls are icon-only (no text labels except form fields)
