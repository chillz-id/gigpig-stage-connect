# Manager & Agency Roster System

**Status**: PLANNED (For Future Implementation)
**Created**: 2025-12-02
**Priority**: Medium

---

## Overview

Build a hierarchical roster management system connecting:
1. **Comedians** (profiles) managed by **Managers** (personal roster)
2. **Managers** sharing selected artists with **Agencies** (organization roster)

### Real-World Example
> Frenchy (comedian) is managed by Liam Saunders (manager) from Pillar Talent Agency.
> - Frenchy has a Comedian profile
> - Liam has a Manager profile with his personal Roster
> - Liam can choose to publicly show he manages Frenchy (or keep it private)
> - Liam creates/joins Pillar Talent Agency (artist_agency org)
> - Liam selects which artists from his Roster to share with Pillar (or "Share All")
> - Pillar Talent Agency EPK shows Liam as one of their Managers, with his shared Roster

---

## Data Model

### Existing Tables (Already in Schema)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `comedian_managers` | Direct manager-comedian relationship | `comedian_id`, `manager_id`, `is_primary`, `status` |
| `manager_client_requests` | Request/approval flow | `manager_id`, `client_id`, `status` (pending/accepted/rejected) |
| `agencies` | Agency profiles | `name`, `agency_type`, `owner_id` |
| `manager_agency_memberships` | Manager belongs to agency | `manager_id`, `company_id`, `role` |
| `artist_management` | Artist-to-agency relationship | `artist_id`, `agency_id`, `manager_id`, `relationship_status` |

### Schema Changes Required

#### 1. Add Visibility Control to `comedian_managers`

```sql
ALTER TABLE comedian_managers
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN display_order INT DEFAULT 0,
ADD COLUMN roster_bio TEXT; -- Manager's note about this artist
```

#### 2. Add Agency Sharing to `artist_management`

```sql
-- artist_management already has agency_id + manager_id
-- Add explicit sharing control
ALTER TABLE artist_management
ADD COLUMN shared_by_manager_id UUID REFERENCES profiles(id),
ADD COLUMN share_mode TEXT CHECK (share_mode IN ('explicit', 'auto_all')),
ADD COLUMN shared_at TIMESTAMPTZ;
```

#### 3. Add Manager EPK Fields to `profiles` or `managers` table

```sql
-- If using profiles table
ALTER TABLE profiles
ADD COLUMN manager_tagline TEXT,
ADD COLUMN manager_specialties TEXT[],
ADD COLUMN show_roster_in_epk BOOLEAN DEFAULT true;

-- Or create dedicated managers table extension
CREATE TABLE manager_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  tagline TEXT,
  specialties TEXT[] DEFAULT '{}',
  show_roster_in_epk BOOLEAN DEFAULT true,
  roster_layout TEXT DEFAULT 'grid', -- grid, list, cards
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## User Flows

### Flow 1: Manager Requests to Manage Comedian

```
1. Manager searches for Comedian
2. Manager clicks "Request to Manage"
3. Creates record in `manager_client_requests` (status: 'pending')
4. Comedian receives notification
5. Comedian approves/rejects
6. On approval: Create `comedian_managers` record (is_public: false by default)
```

### Flow 2: Manager Sets Visibility

```
1. Manager goes to their Roster page
2. For each managed comedian:
   - Toggle "Show Publicly" (updates is_public)
   - Set display order (drag-and-drop)
   - Add roster bio/notes
3. Public comedians appear on Manager's EPK
```

### Flow 3: Manager Shares Artists with Agency

```
1. Manager is member of Agency (via manager_agency_memberships)
2. Manager goes to "Agency Sharing" settings
3. Options:
   a) "Share All" - Auto-share all public roster artists
   b) "Select Artists" - Pick specific artists to share
4. Creates/updates `artist_management` records with:
   - agency_id = Agency
   - manager_id = This manager
   - shared_by_manager_id = This manager
   - share_mode = 'auto_all' or 'explicit'
```

### Flow 4: Agency EPK Display

```
Agency EPK shows:
├── Agency Info (banner, bio, contact)
├── Our Managers
│   ├── Liam Saunders
│   │   ├── Bio/Tagline
│   │   └── Roster: [Frenchy, Comic B, Comic C]
│   └── Jane Smith
│       ├── Bio/Tagline
│       └── Roster: [Comic D, Comic E]
└── All Artists (aggregated view)
```

---

## Components to Build

### Manager Profile/EPK

```
src/components/manager-profile/
├── ManagerEPKLayout.tsx      # Main layout (tabs: EPK | Roster | Settings)
├── ManagerHeader.tsx         # Banner, photo, tagline
├── ManagerBio.tsx            # Bio section
├── ManagerRoster.tsx         # Public roster display
├── ManagerContact.tsx        # Contact info
└── RosterManagement.tsx      # Admin: manage roster visibility/order
```

### Agency Profile/EPK

```
src/components/agency-profile/
├── AgencyEPKLayout.tsx       # Main layout
├── AgencyHeader.tsx          # Banner, logo, info
├── AgencyManagers.tsx        # List of managers with their rosters
├── AgencyRoster.tsx          # Aggregated artist roster
└── AgencyAbout.tsx           # About, contact, specialties
```

### Roster Management UI

```
src/components/roster/
├── RosterCard.tsx            # Artist card in roster
├── RosterGrid.tsx            # Grid layout
├── RosterList.tsx            # List layout
├── RosterVisibilityToggle.tsx
├── AgencySharingModal.tsx    # Select artists to share
└── ManagementRequestCard.tsx # Pending request card
```

---

## Pages to Create

| Route | Component | Purpose |
|-------|-----------|---------|
| `/manager/:slug` | ManagerProfilePage | Public manager EPK |
| `/manager/:slug/roster` | ManagerRosterPage | Manager's roster management |
| `/agency/:slug` | AgencyProfilePage | Public agency EPK |
| `/agency/:slug/managers` | AgencyManagersPage | Agency's managers list |
| `/agency/:slug/roster` | AgencyRosterPage | Agency's full roster |

---

## Services to Extend

### `src/services/managerService.ts` (new)

```typescript
// Manager roster operations
getManagerRoster(managerId: string): Promise<RosterEntry[]>
updateRosterVisibility(managerId: string, comedianId: string, isPublic: boolean)
updateRosterOrder(managerId: string, orderedIds: string[])
getPublicRoster(managerId: string): Promise<RosterEntry[]>

// Management requests
sendManagementRequest(managerId: string, comedianId: string, message?: string)
respondToManagementRequest(requestId: string, accept: boolean)
getPendingRequests(userId: string): Promise<ManagementRequest[]>
```

### `src/services/agencyService.ts` (extend existing)

```typescript
// Agency roster operations
getAgencyManagers(agencyId: string): Promise<ManagerWithRoster[]>
getAgencyRoster(agencyId: string): Promise<ArtistEntry[]>

// Sharing operations
shareArtistsWithAgency(managerId: string, agencyId: string, artistIds: string[])
setShareAllMode(managerId: string, agencyId: string, enabled: boolean)
getSharedArtists(managerId: string, agencyId: string): Promise<ArtistEntry[]>
```

---

## Hooks to Create

```typescript
// Manager hooks
useManagerRoster(managerId: string)
useRosterVisibility(managerId: string, comedianId: string)
useManagementRequests(userId: string)

// Agency hooks
useAgencyManagers(agencyId: string)
useAgencyRoster(agencyId: string)
useAgencySharing(managerId: string, agencyId: string)
```

---

## Notification Events

| Event | Recipient | Message |
|-------|-----------|---------|
| `management_request_sent` | Comedian | "{Manager} wants to manage you" |
| `management_request_accepted` | Manager | "{Comedian} accepted your management request" |
| `management_request_rejected` | Manager | "{Comedian} declined your management request" |
| `artist_shared_with_agency` | Agency Owner | "{Manager} shared {count} artists with your agency" |
| `added_to_agency_roster` | Comedian | "You were added to {Agency}'s roster" |

---

## Permission Model

| Action | Who Can Do It |
|--------|---------------|
| Request to manage comedian | Any user with `manager` role |
| Accept/reject management request | The comedian being requested |
| Toggle roster visibility | The manager |
| Share artist with agency | Manager who manages the artist AND is member of agency |
| View public manager roster | Anyone |
| View agency roster | Anyone |
| Manage agency settings | Agency owner/admins |

---

## Critical Files to Reference

| File | Pattern to Follow |
|------|-------------------|
| `src/components/comedian-profile/ComedianEPKLayout.tsx` | EPK tab structure, device preview |
| `src/hooks/useEPKSectionOrder.ts` | Section ordering with drag-and-drop |
| `src/services/agencyService.ts` | Existing agency CRUD patterns |
| `src/services/managerCommissionService.ts` | Manager-comedian relationship queries |
| `src/types/agency.ts` | Type definitions for agency system |

---

## Implementation Phases

### Phase 1: Database & Types
- [ ] Add `is_public`, `display_order`, `roster_bio` to `comedian_managers`
- [ ] Add sharing fields to `artist_management`
- [ ] Create `manager_profiles` extension table
- [ ] Update TypeScript types

### Phase 2: Manager Roster
- [ ] Build `ManagerRoster` component
- [ ] Create roster management UI (visibility toggles, ordering)
- [ ] Implement `managerService.ts` functions
- [ ] Add `/manager/:slug` route

### Phase 3: Manager EPK
- [ ] Build `ManagerEPKLayout` with sections
- [ ] Implement `ManagerHeader`, `ManagerBio`, `ManagerContact`
- [ ] Add EPK settings (show_roster_in_epk, layout options)

### Phase 4: Agency Integration
- [ ] Build "Share with Agency" modal
- [ ] Implement sharing logic in `agencyService.ts`
- [ ] Create agency roster aggregation queries

### Phase 5: Agency EPK
- [ ] Build `AgencyEPKLayout` with manager sections
- [ ] Implement `AgencyManagers` showing each manager's roster
- [ ] Add `/agency/:slug` route

### Phase 6: Notifications & Polish
- [ ] Add notification events for all flows
- [ ] Build management request UI
- [ ] Add email templates for requests
- [ ] Mobile-responsive testing

---

## Open Questions

1. **Comedian autonomy**: Can a comedian remove themselves from a manager's public roster? Or only the manager controls visibility?
2. **Multiple managers**: If comedian has 2 managers, can both show them publicly? Any conflict resolution?
3. **Agency hierarchy**: Can agencies have sub-agencies or is it flat?
4. **Commission visibility**: Should commission rates be visible on EPK or private?
5. **Verification**: Should managers/agencies require verification before they can add artists?

---

## Notes

- This builds on existing infrastructure (tables exist, just need UI)
- EPK pattern from comedian profiles can be reused
- Commission system already handles manager-comedian financial relationship
- Consider adding "verified manager" badge similar to social platforms
