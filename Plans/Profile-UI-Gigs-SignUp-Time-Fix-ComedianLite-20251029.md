# Profile UI Improvements + Gigs Quick Sign-Up + Time Fix + Comedian Lite Role + Feature Roadmap

Created: 2025-10-29
Updated: 2025-10-29 - Added Feature Roadmap component
Status: Pending

## Overview
Five major updates: (1) Profile UI improvements, (2) Gigs page quick sign-up with limited "comedian_lite" role, (3) Fix event time display showing 6am instead of correct times, (4) Auth protection for homepage and other pages, (5) Feature Roadmap kanban board for users to view and request features.

---

## PART 1: Fix Event Time Display (6am Bug)

### Root Cause
- Database stores `session_start_local` correctly (e.g., "20:00:00" for 8pm Sydney)
- Service converts to ISO without timezone: `"2025-11-15T20:00:00"` (no `Z` or `+10:00`)
- `parseISO()` in Gigs.tsx treats ambiguous timestamps as browser's local timezone
- If browser is in different timezone → displays wrong time (e.g., 6am instead of 8pm)

### Solution: Parse Time Directly from String

**File**: `/root/agents/src/pages/Gigs.tsx` (lines 31-39)

**Replace `formatEventTime()` function:**
```typescript
// OLD (buggy):
const formatEventTime = (value: string | null | undefined) => {
  if (!value) return 'TBC';
  try {
    const parsed = parseISO(value);  // ❌ Timezone ambiguity
    return format(parsed, 'h:mmaaa');
  } catch (error) {
    return 'TBC';
  }
};

// NEW (fixed):
const formatEventTime = (value: string | null | undefined) => {
  if (!value) return 'TBC';
  try {
    // Extract time directly: "2025-11-15T20:00:00" → "20:00"
    const timePart = value.slice(11, 16); // "HH:MM"
    const [hours, minutes] = timePart.split(':').map(Number);

    // Format to 12-hour time
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  } catch (error) {
    return 'TBC';
  }
};
```

**Why this works:**
- `session_start_local` is already in venue's local time (converted by database)
- We extract the time portion directly without timezone parsing
- No ambiguity, always displays the exact time from database

---

## PART 2: Add "comedian_lite" Role System

### 2.1 Database Changes

**New Migration**: `/root/agents/supabase/migrations/20251029_add_comedian_lite_role.sql`

```sql
-- Add comedian_lite to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comedian_lite';

-- Add comment explaining the role
COMMENT ON TYPE user_role IS
  'User roles: member (default), comedian (full), comedian_lite (limited beta), promoter, admin, co_promoter, photographer, videographer, manager, visual_artist, agency_manager, venue_manager';
```

### 2.2 TypeScript Type Updates

**File 1**: `/root/agents/src/types/auth.ts`
```typescript
export interface UserRole {
  id: string;
  user_id: string;
  role: 'member' | 'comedian' | 'comedian_lite' | 'promoter' | 'co_promoter' | 'admin' | 'photographer' | 'videographer';
  created_at: string;
}
```

**File 2**: `/root/agents/src/config/sidebarMenuItems.tsx` (line 25)
```typescript
export type UserRole = 'comedian' | 'comedian_lite' | 'promoter' | 'photographer' | 'videographer' | 'manager' | 'admin' | 'agency_manager' | 'venue_manager';
```

**File 3**: `/root/agents/src/contexts/AuthContext.tsx` (hasRole function signature)
```typescript
const hasRole = useCallback((role: 'member' | 'comedian' | 'comedian_lite' | 'promoter' | 'co_promoter' | 'admin' | 'photographer' | 'videographer') => {
  return roles.some(userRole => userRole.role === role);
}, [roles]);
```

### 2.3 Sidebar Menu Access for comedian_lite

**File**: `/root/agents/src/config/sidebarMenuItems.tsx`

**Update MENU_ITEMS array to include 'comedian_lite' in roles:**

Items comedian_lite CAN access:
- Dashboard: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- Gigs: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- Profile: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- Calendar: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- Vouches: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- Settings: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- Applications: `roles: ['comedian', 'comedian_lite', 'photographer', ...]`
- Media Library: `roles: ['comedian', 'comedian_lite', 'promoter', ...]`
- **Feature Roadmap**: `roles: ['comedian', 'comedian_lite', 'promoter', ...]` **(NEW)**

Items comedian_lite CANNOT access (keep as-is, no comedian_lite):
- Shows
- Messages
- Browse Comedians
- Browse Photographers
- My Gigs
- Add Gig
- Tasks
- Invoices
- Earnings
- Analytics
- CRM
- Users
- Web App Settings
- Social Media Manager

**Add default hidden items for comedian_lite** (line 281):
```typescript
export const getDefaultHiddenItemsForRole = (role: UserRole): string[] => {
  switch (role) {
    case 'comedian':
      return [];
    case 'comedian_lite':
      return [
        'shows',
        'messages',
        'browse-comedians',
        'browse-photographers',
        'my-gigs',
        'add-gig',
        'tasks',
        'invoices',
        'earnings',
        'social-media-manager'
      ];
    // ... rest of cases
  }
};
```

### 2.4 Display "Comedian" Label for comedian_lite

**File**: `/root/agents/src/components/layout/UnifiedSidebar.tsx` or wherever role is displayed

Add display name mapping:
```typescript
const getRoleDisplayName = (role: string): string => {
  if (role === 'comedian_lite') return 'Comedian';
  if (role === 'agency_manager') return 'Agency Manager';
  if (role === 'venue_manager') return 'Venue Manager';
  // Capitalize first letter for others
  return role.charAt(0).toUpperCase() + role.slice(1);
};
```

---

## PART 3: Gigs Page Quick Sign-Up

### 3.1 Create QuickSignUpCard Component

**New File**: `/root/agents/src/components/auth/QuickSignUpCard.tsx`

**Requirements**:
- Only visible when `!user`
- ProfileHeader-sized card (~200-250px height)
- Auto-set role as "comedian_lite"
- Fields: First Name, Last Name, Email, Password
- Default avatar icon (no upload)

**Implementation**:
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function QuickSignUpCard() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !email || !password) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        role: 'comedian_lite',
        roles: ['comedian_lite', 'member']
      });

      toast({ title: 'Welcome to Stand Up Sydney!', description: 'Your account has been created.' });
      window.location.reload(); // Refresh to hide card and show calendar
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/[0.08] backdrop-blur-md border-white/[0.20] mb-6">
      <CardContent className="p-8">
        <form onSubmit={handleSignUp}>
          <div className="flex items-center gap-6">
            {/* Avatar placeholder */}
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-16 h-16 text-white/40" />
            </div>

            {/* Form fields */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                disabled={isLoading}
              />
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                disabled={isLoading}
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-2 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                disabled={isLoading}
              />
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-2 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                disabled={isLoading}
              />
            </div>

            {/* CTA */}
            <div className="flex flex-col items-end gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="min-w-[180px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing Up...
                  </>
                ) : (
                  'Sign Up & Find Gigs'
                )}
              </Button>
              <p className="text-xs text-white/60 text-center">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 3.2 Update Gigs Page

**File**: `/root/agents/src/pages/Gigs.tsx`

**Add import** (line 27):
```typescript
import { QuickSignUpCard } from '@/components/auth/QuickSignUpCard';
```

**Add card above header** (before line 136):
```typescript
{/* Quick Sign-Up for non-logged-in users */}
{!user && <QuickSignUpCard />}

{/* Header */}
<div className="mb-6">
  <h1 className="text-3xl font-bold text-white mb-2">Find Gigs</h1>
  ...
</div>
```

---

## PART 4: Profile UI Improvements

### 4.1 ProfileHeader Component

**File**: `/root/agents/src/components/ProfileHeader.tsx`

**Changes:**
1. Remove ribbon vouch button (lines 132-135)
2. Keep Crown vouch button (lines 136-139)
3. Wire Messages button to /messages (lines 128-131)

**Add import:**
```typescript
import { useNavigate } from 'react-router-dom';
```

**Update Messages button:**
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => navigate('/messages')}
>
  <MessageSquare className="w-4 h-4 mr-2" />
  Messages
</Button>
```

### 4.2 Social Media & Links

**New File**: `/root/agents/src/components/SocialMediaCollapsible.tsx`

Create collapsible social platform selector:
- Default visible: Instagram, YouTube, Website
- Hidden until + clicked: Twitter, TikTok, Facebook, LinkedIn
- Remove "URL" text from headings
- Remove green preview text
- Keep validation indicators

### 4.3 Media Portfolio

**File**: `/root/agents/src/components/profile/MediaUpload.tsx`

**Changes:**
1. Remove Google Drive option for videos
2. Add YouTube explainer text: "Upload videos as Unlisted to YouTube, then paste the link here. This keeps file sizes manageable and videos load fast."
3. Remove Featured checkbox (line 259)
4. Style upload button to match primary actions

**File**: `/root/agents/src/components/comedian-profile/ComedianMedia.tsx`

**Changes:**
1. Rename "Photos" tab to "Media Library"
2. Remove featured badge display (lines 216-220)

---

## PART 5: Auth Protection

### 5.1 Redirect Homepage to /auth

**File**: `/root/agents/src/pages/Index.tsx`

**Add at top of component:**
```typescript
const { user, isLoading } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!isLoading && !user) {
    navigate('/auth');
  }
}, [user, isLoading, navigate]);

if (isLoading) return <LoadingSpinner size="lg" />;
if (!user) return null;
```

### 5.2 Protect Other Pages

Apply same pattern to:
- `/root/agents/src/pages/Dashboard.tsx` (may already have)
- `/root/agents/src/pages/Shows.tsx`
- `/root/agents/src/pages/Profile.tsx`

**Exception pages** (NO auth required):
- `/auth` - Auth page
- `/gigs` - Gigs page (has QuickSignUpCard)
- Public profile pages (/:profileType/:slug/*)

---

## Files to Create

1. **`/root/agents/supabase/migrations/20251029_add_comedian_lite_role.sql`**
   - Add comedian_lite to user_role enum

2. **`/root/agents/src/components/auth/QuickSignUpCard.tsx`**
   - Inline sign-up for Gigs page
   - Auto-set comedian_lite role

3. **`/root/agents/src/components/SocialMediaCollapsible.tsx`**
   - Collapsible social platform selector

---

## Files to Modify

### Time Fix:
1. **`/root/agents/src/pages/Gigs.tsx`** (lines 31-39)
   - Fix formatEventTime() to parse time directly

### Comedian Lite Role:
2. **`/root/agents/src/types/auth.ts`**
   - Add 'comedian_lite' to UserRole interface

3. **`/root/agents/src/config/sidebarMenuItems.tsx`**
   - Add 'comedian_lite' to UserRole type
   - Add comedian_lite to roles arrays for allowed menu items
   - Add comedian_lite case to getDefaultHiddenItemsForRole()

4. **`/root/agents/src/contexts/AuthContext.tsx`**
   - Update hasRole function signature to include comedian_lite

5. **`/root/agents/src/components/layout/UnifiedSidebar.tsx`**
   - Add getRoleDisplayName() to show "Comedian" for comedian_lite

### Gigs Page:
6. **`/root/agents/src/pages/Gigs.tsx`**
   - Add QuickSignUpCard component above header

### Profile UI:
7. **`/root/agents/src/components/ProfileHeader.tsx`**
   - Remove ribbon vouch button
   - Wire Messages button

8. **`/root/agents/src/components/SocialMediaInput.tsx`**
   - Remove green URL preview

9. **`/root/agents/src/components/profile/MediaUpload.tsx`**
   - Remove Google Drive for videos
   - Add YouTube explainer
   - Remove Featured checkbox
   - Style upload button

10. **`/root/agents/src/components/comedian-profile/ComedianMedia.tsx`**
    - Rename Photos to Media Library
    - Remove featured badge

### Auth Protection:
11. **`/root/agents/src/pages/Index.tsx`**
    - Redirect to /auth if not logged in

12. **`/root/agents/src/pages/Shows.tsx`**
    - Add auth check

13. **`/root/agents/src/pages/Dashboard.tsx`**
    - Verify auth check exists

14. **`/root/agents/src/pages/Profile.tsx`**
    - Add auth check if missing

---

## Key Behaviors

### Time Display:
✅ Events show correct local time (8pm shows as 8pm, not 6am)
✅ Time extracted directly from string, no timezone parsing
✅ Works regardless of user's browser timezone

### Comedian Lite Role:
✅ QuickSignUpCard auto-assigns comedian_lite role
✅ comedian_lite displays as "Comedian" in UI
✅ comedian_lite can access: Gigs, Profile, Calendar, Vouches, Settings, Applications, Media Library
✅ comedian_lite CANNOT access: Shows, Messages, My Gigs, Add Gig, Tasks, Invoices, Earnings, Browse pages, Admin pages
✅ Sidebar shows only allowed items for comedian_lite

### Gigs Page:
✅ QuickSignUpCard visible only when NOT logged in
✅ Card same size as ProfileHeader (~200-250px)
✅ Fields: First Name, Last Name, Email, Password
✅ Default avatar icon (no upload)
✅ On success: Card disappears, user can browse gigs
✅ "Sign in" link navigates to /auth

### Auth Protection:
✅ Homepage redirects to /auth if not logged in
✅ Shows page protected
✅ Dashboard protected
✅ /gigs and /auth remain publicly accessible

### Profile UI:
✅ ProfileHeader: Only Crown vouch button (no ribbon)
✅ Messages button navigates to /messages
✅ Social: Instagram/YouTube/Website default, + for more
✅ No "URL" text in headings
✅ No green preview text
✅ Video: YouTube only with explainer
✅ Photos → Media Library
✅ Featured checkbox removed
✅ Upload button matches primary styling

---

## Testing Checklist

### Time Display:
- [ ] Events show correct time (not 6am)
- [ ] Sydney evening shows (8pm) display as 8pm
- [ ] Time consistent across different browser timezones

### Comedian Lite:
- [ ] QuickSignUp creates comedian_lite account
- [ ] comedian_lite sees: Gigs, Profile, Calendar, Vouches, Settings, Applications, Media Library
- [ ] comedian_lite does NOT see: Shows, Messages, My Gigs, Add Gig, Tasks, Invoices, Earnings
- [ ] Role displays as "Comedian" in UI (not "comedian_lite")
- [ ] comedian_lite can access public profile pages

### Gigs Page:
- [ ] QuickSignUpCard visible when logged out
- [ ] Card hidden when logged in
- [ ] All form fields functional
- [ ] Password validation (min 6 chars)
- [ ] Email validation working
- [ ] Sign up success → card disappears
- [ ] "Sign in" link goes to /auth

### Auth Protection:
- [ ] Homepage redirects to /auth when logged out
- [ ] Shows redirects to /auth when logged out
- [ ] /gigs accessible without login
- [ ] /auth accessible without login

### Profile UI:
- [ ] One vouch button (Crown only)
- [ ] Messages navigates to /messages
- [ ] Social shows 3 defaults, + reveals more
- [ ] No "URL" headings
- [ ] No green preview
- [ ] Video: YouTube only + explainer
- [ ] Media Library tab exists
- [ ] Featured checkbox hidden
- [ ] Featured badge hidden
- [ ] Upload button styled correctly

---

## Database Migration Order

1. Apply comedian_lite role migration first
2. Regenerate Supabase types: `npx supabase gen types typescript --project-ref YOUR_PROJECT_REF > src/integrations/supabase/types.ts`
3. Then deploy code changes

---

---

## PART 6: Feature Roadmap Kanban Board

### 6.1 Database Tables

**New Migration**: `/root/agents/supabase/migrations/20251029_create_feature_roadmap_tables.sql`

```sql
-- Feature requests table
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  -- Statuses: requested, under_review, planned, in_progress, completed
  category TEXT,
  -- Categories: ui_ux, performance, integration, new_feature, bug_fix
  priority INTEGER DEFAULT 0,
  -- Priority: 0-4 (higher = more important, set by admins only)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('requested', 'under_review', 'planned', 'in_progress', 'completed'))
);

-- Feature votes table (upvoting system)
CREATE TABLE IF NOT EXISTS feature_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, user_id) -- One vote per user per feature
);

-- Feature comments table
CREATE TABLE IF NOT EXISTS feature_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_created_by ON feature_requests(created_by);
CREATE INDEX idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX idx_feature_votes_user_id ON feature_votes(user_id);
CREATE INDEX idx_feature_comments_feature_id ON feature_comments(feature_id);

-- RLS Policies

-- Everyone can read feature requests
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feature requests"
  ON feature_requests FOR SELECT
  USING (true);

-- Authenticated users can create feature requests
CREATE POLICY "Authenticated users can create feature requests"
  ON feature_requests FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only admins can update/delete feature requests
CREATE POLICY "Admins can update feature requests"
  ON feature_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Feature votes policies
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view votes"
  ON feature_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON feature_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feature_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Feature comments policies
ALTER TABLE feature_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments"
  ON feature_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON feature_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON feature_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON feature_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_comments_updated_at
  BEFORE UPDATE ON feature_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE feature_requests IS 'User-submitted feature requests and roadmap items';
COMMENT ON TABLE feature_votes IS 'Upvotes on feature requests (one per user per feature)';
COMMENT ON TABLE feature_comments IS 'Discussion threads on feature requests';
```

### 6.2 Create Roadmap Kanban Board

**New File**: `/root/agents/src/pages/Roadmap.tsx`

**Features**:
- Kanban board with 5 columns: Requested → Under Review → Planned → In Progress → Completed
- Uses `react-beautiful-dnd` for drag-and-drop (admin only)
- Vote counter with upvote button
- "Request Feature" button opens dialog
- Click feature card to open detail dialog with comments
- Admin-only: Drag cards between columns to change status
- Protected route (auth required)

**Columns Configuration**:
```typescript
const ROADMAP_COLUMNS = [
  {
    id: 'requested',
    title: 'Requested',
    description: 'Community feature requests',
    color: 'bg-purple-100 dark:bg-purple-900/20'
  },
  {
    id: 'under_review',
    title: 'Under Review',
    description: 'Being evaluated by team',
    color: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    id: 'planned',
    title: 'Planned',
    description: 'Approved for development',
    color: 'bg-yellow-100 dark:bg-yellow-900/20'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Currently being built',
    color: 'bg-orange-100 dark:bg-orange-900/20'
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Shipped features',
    color: 'bg-green-100 dark:bg-green-900/20'
  }
];
```

### 6.3 Create Feature Card Component

**New File**: `/root/agents/src/components/roadmap/FeatureCard.tsx`

**Features**:
- Title, description preview (truncated)
- Vote counter with upvote button (changes color when voted)
- Category badge
- Comment count badge
- Created by user (name + avatar)
- Click to open detail dialog
- Draggable (admin only)

### 6.4 Create Feature Detail Dialog

**New File**: `/root/agents/src/components/roadmap/FeatureDetailDialog.tsx`

**Features**:
- Full title and description
- Vote button (prominent)
- Category and status badges
- Created by info + timestamp
- Comment thread
  - Display all comments with avatar, name, timestamp
  - Rich text input for new comments
  - Edit/delete own comments
  - Real-time updates via TanStack Query
- Admin controls:
  - Change status dropdown
  - Change category dropdown
  - Delete feature button

### 6.5 Create Request Feature Dialog

**New File**: `/root/agents/src/components/roadmap/RequestFeatureDialog.tsx`

**Features**:
- Title input (required, max 100 chars)
- Description textarea (required, max 500 chars)
- Category dropdown (optional)
- Submit button
- Auto-sets status to 'requested'
- Auto-sets created_by to current user

### 6.6 Add Roadmap to Sidebar

**File**: `/root/agents/src/config/sidebarMenuItems.tsx`

**Add new menu item** (after Media Library):
```typescript
{
  id: 'roadmap',
  label: 'Feature Roadmap',
  path: '/roadmap',
  icon: LayoutDashboard, // or Lightbulb or Sparkles
  roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
  section: 'account', // Or create new 'feedback' section
}
```

### 6.7 Add Roadmap Route

**File**: `/root/agents/src/App.tsx`

**Add route** (with auth protection):
```typescript
<Route
  path="/roadmap"
  element={
    <ProtectedRoute>
      <Roadmap />
    </ProtectedRoute>
  }
/>
```

### 6.8 Create Services

**New File**: `/root/agents/src/services/roadmap/roadmap-service.ts`

**Functions**:
- `listFeatures(status?: string)` - Get all features, optionally filtered by status
- `getFeature(id: string)` - Get single feature with votes and comments
- `createFeature(data)` - Create new feature request
- `updateFeature(id, data)` - Update feature (admin only)
- `deleteFeature(id)` - Delete feature (admin only)
- `voteFeature(featureId)` - Upvote a feature
- `unvoteFeature(featureId)` - Remove upvote
- `addComment(featureId, content)` - Add comment
- `updateComment(id, content)` - Update comment
- `deleteComment(id)` - Delete comment

### 6.9 Create Hooks

**New File**: `/root/agents/src/hooks/useRoadmap.ts`

**Hooks**:
- `useFeatures()` - Query all features grouped by status
- `useFeature(id)` - Query single feature
- `useVoteFeature()` - Mutation to vote
- `useCreateFeature()` - Mutation to create
- `useUpdateFeature()` - Mutation to update
- `useFeatureComments(id)` - Query comments for feature
- `useAddComment()` - Mutation to add comment

---

## Files to Create

1. **`/root/agents/supabase/migrations/20251029_add_comedian_lite_role.sql`**
   - Add comedian_lite to user_role enum

2. **`/root/agents/supabase/migrations/20251029_create_feature_roadmap_tables.sql`** **(NEW)**
   - Create feature_requests, feature_votes, feature_comments tables
   - RLS policies for public read, authenticated write

3. **`/root/agents/src/components/auth/QuickSignUpCard.tsx`**
   - Inline sign-up for Gigs page

4. **`/root/agents/src/components/SocialMediaCollapsible.tsx`**
   - Collapsible social platform selector

5. **`/root/agents/src/pages/Roadmap.tsx`** **(NEW)**
   - Main roadmap kanban board page

6. **`/root/agents/src/components/roadmap/FeatureCard.tsx`** **(NEW)**
   - Feature card component for kanban

7. **`/root/agents/src/components/roadmap/FeatureDetailDialog.tsx`** **(NEW)**
   - Feature detail dialog with comments

8. **`/root/agents/src/components/roadmap/RequestFeatureDialog.tsx`** **(NEW)**
   - Dialog to submit new feature requests

9. **`/root/agents/src/services/roadmap/roadmap-service.ts`** **(NEW)**
   - Service layer for roadmap API calls

10. **`/root/agents/src/hooks/useRoadmap.ts`** **(NEW)**
    - TanStack Query hooks for roadmap data

---

## Files to Modify

### Time Fix:
1. **`/root/agents/src/pages/Gigs.tsx`** (lines 31-39)
   - Fix formatEventTime() to parse time directly

### Comedian Lite Role:
2. **`/root/agents/src/types/auth.ts`**
   - Add 'comedian_lite' to UserRole interface

3. **`/root/agents/src/config/sidebarMenuItems.tsx`**
   - Add 'comedian_lite' to UserRole type
   - Add comedian_lite to roles arrays for allowed menu items
   - Add comedian_lite case to getDefaultHiddenItemsForRole()
   - **Add Feature Roadmap menu item** **(NEW)**

4. **`/root/agents/src/contexts/AuthContext.tsx`**
   - Update hasRole function signature to include comedian_lite

5. **`/root/agents/src/components/layout/UnifiedSidebar.tsx`**
   - Add getRoleDisplayName() to show "Comedian" for comedian_lite

### Gigs Page:
6. **`/root/agents/src/pages/Gigs.tsx`**
   - Add QuickSignUpCard component above header

### Roadmap:
7. **`/root/agents/src/App.tsx`** **(NEW)**
   - Add /roadmap route with ProtectedRoute

### Profile UI:
8. **`/root/agents/src/components/ProfileHeader.tsx`**
   - Remove ribbon vouch button
   - Wire Messages button

9. **`/root/agents/src/components/SocialMediaInput.tsx`**
   - Remove green URL preview

10. **`/root/agents/src/components/profile/MediaUpload.tsx`**
    - Remove Google Drive for videos
    - Add YouTube explainer
    - Remove Featured checkbox
    - Style upload button

11. **`/root/agents/src/components/comedian-profile/ComedianMedia.tsx`**
    - Rename Photos to Media Library
    - Remove featured badge

### Auth Protection:
12. **`/root/agents/src/pages/Index.tsx`**
    - Redirect to /auth if not logged in

13. **`/root/agents/src/pages/Shows.tsx`**
    - Add auth check

14. **`/root/agents/src/pages/Dashboard.tsx`**
    - Verify auth check exists

15. **`/root/agents/src/pages/Profile.tsx`**
    - Add auth check if missing

---

## Key Behaviors

### Time Display:
✅ Events show correct local time (8pm shows as 8pm, not 6am)
✅ Time extracted directly from string, no timezone parsing
✅ Works regardless of user's browser timezone

### Comedian Lite Role:
✅ QuickSignUpCard auto-assigns comedian_lite role
✅ comedian_lite displays as "Comedian" in UI
✅ comedian_lite can access: Gigs, Profile, Calendar, Vouches, Settings, Applications, Media Library, **Feature Roadmap**
✅ comedian_lite CANNOT access: Shows, Messages, My Gigs, Add Gig, Tasks, Invoices, Earnings, Browse pages, Admin pages
✅ Sidebar shows only allowed items for comedian_lite

### Feature Roadmap:
✅ Roadmap accessible to all logged-in users (comedian_lite included)
✅ 5-column kanban: Requested → Under Review → Planned → In Progress → Completed
✅ Users can view, vote, comment, and request features
✅ Admins can drag cards between columns to change status
✅ Vote counter shows total votes, button highlights when user has voted
✅ Click feature card opens detail dialog with full description and comments
✅ "Request Feature" button opens form dialog
✅ Real-time vote counts and comment updates via TanStack Query
✅ RLS ensures users can only edit/delete their own comments

### Gigs Page:
✅ QuickSignUpCard visible only when NOT logged in
✅ Card same size as ProfileHeader (~200-250px)
✅ Fields: First Name, Last Name, Email, Password
✅ Default avatar icon (no upload)
✅ On success: Card disappears, user can browse gigs
✅ "Sign in" link navigates to /auth

### Auth Protection:
✅ Homepage redirects to /auth if not logged in
✅ Shows page protected
✅ Dashboard protected
✅ /gigs and /auth remain publicly accessible
✅ /roadmap requires authentication

### Profile UI:
✅ ProfileHeader: Only Crown vouch button (no ribbon)
✅ Messages button navigates to /messages
✅ Social: Instagram/YouTube/Website default, + for more
✅ No "URL" text in headings
✅ No green preview text
✅ Video: YouTube only with explainer
✅ Photos → Media Library
✅ Featured checkbox removed
✅ Upload button matches primary styling

---

## Testing Checklist

### Time Display:
- [ ] Events show correct time (not 6am)
- [ ] Sydney evening shows (8pm) display as 8pm
- [ ] Time consistent across different browser timezones

### Comedian Lite:
- [ ] QuickSignUp creates comedian_lite account
- [ ] comedian_lite sees: Gigs, Profile, Calendar, Vouches, Settings, Applications, Media Library, Feature Roadmap
- [ ] comedian_lite does NOT see: Shows, Messages, My Gigs, Add Gig, Tasks, Invoices, Earnings
- [ ] Role displays as "Comedian" in UI (not "comedian_lite")
- [ ] comedian_lite can access public profile pages

### Feature Roadmap:
- [ ] Roadmap accessible at /roadmap when logged in
- [ ] Roadmap sidebar item visible to comedian_lite
- [ ] 5 columns display correctly with titles
- [ ] Features grouped by status in correct columns
- [ ] Vote button works (adds/removes vote)
- [ ] Vote count updates in real-time
- [ ] Vote button highlights when user has voted
- [ ] Click feature card opens detail dialog
- [ ] Comments display in detail dialog
- [ ] Can add new comment
- [ ] Can edit/delete own comments
- [ ] "Request Feature" button opens form
- [ ] Can submit new feature request
- [ ] New feature appears in "Requested" column
- [ ] Admin can drag features between columns
- [ ] Status updates when admin moves card
- [ ] Non-admins cannot drag features
- [ ] Category badges display correctly
- [ ] Comment count badge shows correct number

### Gigs Page:
- [ ] QuickSignUpCard visible when logged out
- [ ] Card hidden when logged in
- [ ] All form fields functional
- [ ] Password validation (min 6 chars)
- [ ] Email validation working
- [ ] Sign up success → card disappears
- [ ] "Sign in" link goes to /auth

### Auth Protection:
- [ ] Homepage redirects to /auth when logged out
- [ ] Shows redirects to /auth when logged out
- [ ] Roadmap redirects to /auth when logged out
- [ ] /gigs accessible without login
- [ ] /auth accessible without login

### Profile UI:
- [ ] One vouch button (Crown only)
- [ ] Messages navigates to /messages
- [ ] Social shows 3 defaults, + reveals more
- [ ] No "URL" headings
- [ ] No green preview
- [ ] Video: YouTube only + explainer
- [ ] Media Library tab exists
- [ ] Featured checkbox hidden
- [ ] Featured badge hidden
- [ ] Upload button styled correctly

---

## Database Migration Order

1. Apply comedian_lite role migration first
2. Apply feature roadmap tables migration
3. Regenerate Supabase types: `npx supabase gen types typescript --project-ref YOUR_PROJECT_REF > src/integrations/supabase/types.ts`
4. Then deploy code changes

---

## Notes

- Time fix is critical - should be deployed first
- comedian_lite role enables gradual onboarding (limited → full comedian)
- Database keeps is_featured column for future use
- Messages route may need placeholder page
- QuickSignUpCard matches Gigs page theme (gradient background)
- comedian_lite users get limited access for beta testing
- Can upgrade comedian_lite → comedian later via admin interface
- **Feature Roadmap uses existing `react-beautiful-dnd` library (already installed)**
- **Roadmap follows established kanban patterns from CRM (DealKanbanBoard, TaskKanban)**
- **RLS policies ensure users can only edit their own comments/requests**
- **Admins have full control over feature status and organization**
- **Vote system prevents duplicate votes (unique constraint on user_id + feature_id)**
