# Media Library: Albums, Multi-Upload & Sharing System

**Created**: 2024-12-04
**Status**: In Progress
**Linear Issue**: TBD

---

## Overview

Enhance the Media Library with:
1. Multi-photo upload capability
2. Album system with cover photos
3. Sharing system between users/orgs
4. Quick Stats implementation
5. EPK album selection

---

## Phase 1: Quick Stats Fix (Quick Win)

- [x] **Status**: Completed

**File**: `src/components/media-library/MediaLibraryShell.tsx` (lines 569-597)

Currently shows hardcoded "--". Fix by:
1. Add `getMediaCounts()` to media service
2. Query actual counts from `directory_media` grouped by `media_type`
3. Update Quick Stats to display real numbers

---

## Phase 2: Multi-Photo Upload

- [x] **Status**: Completed

**File**: `src/components/media-library/UserPhotoGallery.tsx`

Changes:
1. Add `multiple` attribute to file input (line 469)
2. Track array of files instead of single file
3. Show preview grid for multiple files
4. Sequential upload with progress indicator
5. Optional: Add to existing album during upload

---

## Phase 3: Album System

- [ ] **Status**: Pending

### Database Migration

```sql
-- Albums table
CREATE TABLE media_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  directory_profile_id UUID REFERENCES directory_profiles(id),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_media_id UUID REFERENCES directory_media(id),
  is_public BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT owner_check CHECK (
    (user_id IS NOT NULL)::int +
    (directory_profile_id IS NOT NULL)::int +
    (organization_id IS NOT NULL)::int = 1
  )
);

-- Album items junction
CREATE TABLE media_album_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES media_albums(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES directory_media(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(album_id, media_id)
);

CREATE INDEX idx_album_items_album ON media_album_items(album_id);
CREATE INDEX idx_album_items_media ON media_album_items(media_id);
```

### New Service: `src/services/media/album-service.ts`

```typescript
// Core functions
createAlbum(ownerId, ownerType, name, description?)
updateAlbum(albumId, updates)
deleteAlbum(albumId)
getAlbums(ownerId, ownerType)
getAlbum(albumId)

// Photo management
addPhotosToAlbum(albumId, mediaIds[])
removePhotoFromAlbum(albumId, mediaId)
setCoverPhoto(albumId, mediaId)
reorderPhotos(albumId, orderedIds[])
```

### UI Components: `src/components/media-library/albums/`

| Component | Purpose |
|-----------|---------|
| `AlbumGrid.tsx` | Grid display of albums with cover thumbnails |
| `AlbumCard.tsx` | Single album card (cover, name, count) |
| `AlbumCreateDialog.tsx` | Create album modal |
| `AlbumDetailView.tsx` | View/manage album contents |
| `AddToAlbumDialog.tsx` | Add selected photos to album |

### Integration in MediaLibraryShell

- Add "Albums" section in sidebar (below folders)
- "Create Album" button
- Album list with thumbnails
- Click album to view contents

---

## Phase 4: Sharing System

- [ ] **Status**: Pending

### Database Migration

```sql
CREATE TYPE share_resource_type AS ENUM ('album', 'media');
CREATE TYPE share_target_type AS ENUM ('user', 'profile', 'organization');
CREATE TYPE share_status AS ENUM ('pending', 'accepted', 'declined', 'revoked');

CREATE TABLE media_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type share_resource_type NOT NULL,
  album_id UUID REFERENCES media_albums(id) ON DELETE CASCADE,
  media_id UUID REFERENCES directory_media(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_with_type share_target_type NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_with_profile_id UUID REFERENCES directory_profiles(id),
  shared_with_org_id UUID REFERENCES organizations(id),
  status share_status DEFAULT 'pending',
  can_copy BOOLEAN DEFAULT true,
  message TEXT,
  shared_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT resource_check CHECK (
    (album_id IS NOT NULL)::int + (media_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT target_check CHECK (
    (shared_with_user_id IS NOT NULL)::int +
    (shared_with_profile_id IS NOT NULL)::int +
    (shared_with_org_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_shares_shared_by ON media_shares(shared_by);
CREATE INDEX idx_shares_shared_with_user ON media_shares(shared_with_user_id);
CREATE INDEX idx_shares_shared_with_profile ON media_shares(shared_with_profile_id);
CREATE INDEX idx_shares_shared_with_org ON media_shares(shared_with_org_id);
```

### New Service: `src/services/media/sharing-service.ts`

```typescript
// Share operations
shareAlbum(albumId, targetType, targetId, options?)
shareMedia(mediaId, targetType, targetId, options?)
revokeShare(shareId)

// Query shares
getSharesSharedWithMe(userId)
getSharesIAmSharing(userId)
getPendingShares(userId)

// Accept/decline
respondToShare(shareId, accept: boolean)
copySharedMediaToProfile(shareId, profileId)
```

### Tab Structure Update

**File**: `src/components/media-library/MediaLibraryShell.tsx`

Change tabs from: `My Photos | All Files`
To: `My Photos | Shared | All Files`

### UI Components: `src/components/media-library/sharing/`

| Component | Purpose |
|-----------|---------|
| `SharedTab.tsx` | Main Shared tab container |
| `SharedWithMeSection.tsx` | Pending + accepted shares from others |
| `ImSharingSection.tsx` | What I'm sharing + recipient management |
| `ShareDialog.tsx` | Share album/photo modal |
| `ShareTargetPicker.tsx` | Search users/orgs/profiles to share with |

### SharedTab Layout

```
┌─────────────────────────────────────────────┐
│ Shared With Me                              │
├─────────────────────────────────────────────┤
│ [Pending]  Album from @joecomedian          │
│            "Event Photos" - 12 photos       │
│            [Accept] [Decline]               │
├─────────────────────────────────────────────┤
│ [Accepted] Album from Sydney Comedy Org     │
│            "Show Promo" - 8 photos          │
│            [View] [Copy to Profile]         │
├─────────────────────────────────────────────┤
│                                             │
│ I'm Sharing                                 │
├─────────────────────────────────────────────┤
│ "My Headshots" album                        │
│ Shared with: @sarahcomedian, @venueX        │
│ [Manage] [Stop Sharing]                     │
└─────────────────────────────────────────────┘
```

---

## Phase 5: EPK Album Selection

- [ ] **Status**: Pending

### Database Migration

```sql
CREATE TABLE epk_album_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comedian_id UUID NOT NULL REFERENCES comedians(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES media_albums(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comedian_id, album_id)
);
```

### UI Component: `src/components/comedian-profile/EPKAlbumPicker.tsx`

Dropdown in EPK edit mode to select which album to display in Photo section.

### Modify: `src/components/comedian-profile/ComedianMedia.tsx`

- Add album selector when `isOwnProfile && editMode`
- Filter photos by selected album
- Show "All Photos" option to display without album filter

### Modify: `src/hooks/useComedianMedia.ts`

Add optional `albumId` filter parameter to query.

---

## Files to Create

| File | Purpose | Status |
|------|---------|--------|
| `supabase/migrations/YYYYMMDD_media_albums.sql` | Albums + items tables | [ ] |
| `supabase/migrations/YYYYMMDD_media_shares.sql` | Sharing system tables | [ ] |
| `supabase/migrations/YYYYMMDD_epk_album_selections.sql` | EPK album link | [ ] |
| `src/services/media/album-service.ts` | Album CRUD | [ ] |
| `src/services/media/sharing-service.ts` | Sharing logic | [ ] |
| `src/components/media-library/albums/AlbumGrid.tsx` | Album grid | [ ] |
| `src/components/media-library/albums/AlbumCard.tsx` | Album card | [ ] |
| `src/components/media-library/albums/AlbumCreateDialog.tsx` | Create modal | [ ] |
| `src/components/media-library/albums/AlbumDetailView.tsx` | Album contents | [ ] |
| `src/components/media-library/albums/AddToAlbumDialog.tsx` | Add photos | [ ] |
| `src/components/media-library/sharing/SharedTab.tsx` | Shared tab | [ ] |
| `src/components/media-library/sharing/SharedWithMeSection.tsx` | Incoming shares | [ ] |
| `src/components/media-library/sharing/ImSharingSection.tsx` | Outgoing shares | [ ] |
| `src/components/media-library/sharing/ShareDialog.tsx` | Share modal | [ ] |
| `src/components/comedian-profile/EPKAlbumPicker.tsx` | EPK album picker | [ ] |

## Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `src/components/media-library/MediaLibraryShell.tsx` | Add Shared tab, Albums sidebar, Quick Stats | [ ] |
| `src/components/media-library/UserPhotoGallery.tsx` | Multi-upload, Add to Album | [ ] |
| `src/components/media-library/index.ts` | Export new components | [ ] |
| `src/services/media/index.ts` | Export new services | [ ] |
| `src/components/comedian-profile/ComedianMedia.tsx` | Album picker | [ ] |
| `src/hooks/useComedianMedia.ts` | Album filter | [ ] |
| `src/types/directory.ts` | Add Album, Share types | [ ] |

---

## Testing Checklist

- [x] Quick Stats shows actual counts
- [x] Can upload multiple photos at once
- [ ] Can create album with name/description
- [ ] Can add photos to album
- [ ] Can set cover photo
- [ ] Album appears in sidebar
- [ ] Can share album with another user
- [ ] Recipient sees pending share
- [ ] Accept/decline works
- [ ] Can copy shared media to own profile
- [ ] Can revoke share access
- [ ] EPK shows album picker in edit mode
- [ ] EPK filters photos by selected album

---

## Progress Log

| Date | Phase | Notes |
|------|-------|-------|
| 2024-12-04 | Planning | Initial plan created |
| 2024-12-04 | Phase 1 | Quick Stats implemented - MediaLibraryShell.tsx now queries directory_media counts |
| 2024-12-04 | Phase 2 | Multi-photo upload implemented - supports batch uploads with preview grid and progress |
