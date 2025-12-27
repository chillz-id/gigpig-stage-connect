# Media Library & Toast UI Image Editor Integration

Created: 2025-11-26
Status: Approved

## Overview

Two parallel workstreams to complete the media management system:
1. **Toast UI Image Editor**: Replace all current image cropping with full-featured editor
2. **Filestash Media Library**: Complete integration for file browsing

**Environment**: Development server (port 8080) first. Production deployment to gigpigs.app happens after dev is stable.

## User Requirements

- **Toast UI Features**: Full editor (crop, rotate, flip, filters, draw, text, shapes)
- **Toast UI Scope**: Replace ALL current cropping (avatar, banner, event images, org logos)
- **Deployment Strategy**: Dev server first, production later when ready

---

## Part 1: Toast UI Image Editor Integration

### 1.1 Installation & Setup

**Package**: `@toast-ui/react-image-editor`

```bash
npm install @toast-ui/react-image-editor tui-image-editor
```

**Files to create**:
- `src/components/ui/ImageEditor.tsx` - Reusable Toast UI wrapper component
- `src/components/ui/ImageEditorModal.tsx` - Modal wrapper for inline editing
- `src/styles/toast-ui-editor.css` - Custom styling overrides

### 1.2 Components to Replace

| Current Component | Location | Used For |
|-------------------|----------|----------|
| `ImageCrop.tsx` | `src/components/` | Avatar cropping |
| `EventImageCrop.tsx` | `src/components/` | Event banner cropping |
| `BannerImageEditor.tsx` | `src/components/comedian-profile/` | Comedian banner |
| `EventBannerImageEditor.tsx` | `src/components/events/` | Event banner |

### 1.3 Integration Points

1. **Profile Avatar** (`src/pages/Profile.tsx`)
   - Replace canvas cropping with Toast UI modal
   - Keep existing upload flow to `profile-images/${userId}/`

2. **Comedian Banner** (`src/components/comedian-profile/BannerImageEditor.tsx`)
   - Full editor for banner customization
   - Filters and adjustments for professional look

3. **Event Images** (`src/components/events/EventBannerImageEditor.tsx`)
   - Banner editing with aspect ratio presets
   - Quick crop/resize for event thumbnails

4. **Organization Logos** (`src/components/organization/OrganizationHeader.tsx`)
   - Logo editing with transparent background support

### 1.4 Toast UI Editor Configuration

```typescript
const editorOptions = {
  includeUI: {
    loadImage: { path: '', name: '' },
    theme: customTheme, // Dark theme matching app
    menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
    initMenu: 'crop',
    uiSize: { width: '100%', height: '700px' },
    menuBarPosition: 'bottom',
  },
  cssMaxWidth: 1200,
  cssMaxHeight: 800,
  usageStatistics: false,
};
```

### 1.5 Output Handling

- Export edited images as Blob
- Maintain existing upload services (`imageOptimization.ts`, `useFileUpload.ts`)
- Preserve aspect ratio constraints where needed (1:1 avatar, 16:9 banner)

---

## Part 2: Filestash Media Library

### 2.1 Current State

- Docker Compose configured: Filestash + Caddy + S3 Proxy
- Token edge function deployed (version 5) with userId-based scopes
- Media Library UI shell exists at `/org/:slug/media`

### 2.2 Dev Server Setup

Running locally on dev server alongside the Vite app:
- Filestash: Port 8334 (via Docker)
- S3 Proxy: Port 3001
- Caddy: Reverse proxy handling

### 2.3 S3 Proxy Configuration

The S3 proxy translates Supabase Storage API to S3-compatible endpoints:
- Buckets: `profile-images`, `comedian-media`, `event-media`, `organization-media`
- Auth: JWT token scopes limit access per user

---

## Implementation Order

### Phase 1: Toast UI Image Editor (Priority)
1. Install packages
2. Create reusable `ImageEditor` component
3. Replace `ImageCrop.tsx` for avatars
4. Replace `EventImageCrop.tsx` for banners
5. Update comedian banner editor
6. Update organization logo editor
7. Test all editing workflows

### Phase 2: Filestash Dev Completion
1. Verify Docker services running
2. Test S3 proxy with Supabase storage
3. Update Media Library UI with working Filestash embed
4. Test file browsing and uploads on dev

### Phase 3: Production Deployment (Future)
1. Push to main branch
2. Configure production environment
3. Deploy to gigpigs.app
4. Open to users

---

## Files to Create/Modify

### New Files
1. `src/components/ui/ImageEditor.tsx` - Toast UI wrapper
2. `src/components/ui/ImageEditorModal.tsx` - Modal container
3. `src/styles/toast-ui-editor.css` - Style overrides

### Files to Modify
1. `src/components/ImageCrop.tsx` - Replace with Toast UI
2. `src/components/EventImageCrop.tsx` - Replace with Toast UI
3. `src/components/comedian-profile/BannerImageEditor.tsx` - Update to use new editor
4. `src/components/events/EventBannerImageEditor.tsx` - Update to use new editor
5. `src/pages/Profile.tsx` - Update avatar editing
6. `src/components/organization/OrganizationHeader.tsx` - Update logo editing
7. `package.json` - Add Toast UI dependencies

---

## Success Criteria

### Toast UI Editor
- [ ] All image uploads use Toast UI for editing
- [ ] Crop, rotate, flip work correctly
- [ ] Filters and adjustments available
- [ ] Output maintains quality
- [ ] Mobile-responsive editor UI

### Filestash Media Library
- [ ] Docker services running on dev
- [ ] JWT authentication working
- [ ] File browsing shows user's folders
- [ ] Upload/download functional

---

## Completed Prior Work

1. **Avatar Storage Paths** - All uploads use userId-based paths
2. **Broken URLs Cleared** - Chillz Skinner, Stand Up Sydney Admin, iD Comedy
3. **Filestash Token v5** - Deployed with userId-based scopes
4. **Media Library Shell** - UI exists at `/org/:slug/media`
