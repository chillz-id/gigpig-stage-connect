# Universal Profile Editor Implementation Plan

Created: 2025-01-21
Status: Approved

## Overview
Create ONE profile editor that works for all profile types (comedian, organization, photographer, videographer, manager) with dynamic text labels based on profile type.

**Target**: Match the accordion-style UI shown in `/root/agents/docs/testing/org profiles should look like this.png` with sections that adapt labels per type:
- "Personal Information" → "Business Information" (orgs)
- "Career Highlights" → "Company Highlights" (orgs)
- etc.

**Key Principle**: Universal profile editor with minor text adjustments per type. Same structure, different labels.

## Phase 1: Database Schema (CRITICAL - Do First)

### Add Missing Fields to organization_profiles
```sql
ALTER TABLE organization_profiles
  ADD COLUMN banner_url TEXT,
  ADD COLUMN banner_position JSONB DEFAULT '{"x": 50, "y": 50, "scale": 1}'::jsonb,
  ADD COLUMN tagline TEXT,
  ADD COLUMN media_layout TEXT DEFAULT 'grid',
  ADD COLUMN show_contact_in_epk BOOLEAN DEFAULT true;
```

### Create Missing Tables for Non-Comedian Profiles
```sql
-- Photographer tables
CREATE TABLE photographer_accomplishments (LIKE comedian_accomplishments INCLUDING ALL);
CREATE TABLE photographer_custom_links (LIKE comedian_custom_links INCLUDING ALL);
CREATE TABLE photographer_press_reviews (LIKE comedian_press_reviews INCLUDING ALL);

-- Videographer tables
CREATE TABLE videographer_accomplishments (LIKE comedian_accomplishments INCLUDING ALL);
CREATE TABLE videographer_custom_links (LIKE comedian_custom_links INCLUDING ALL);
CREATE TABLE videographer_press_reviews (LIKE comedian_press_reviews INCLUDING ALL);

-- Manager tables
CREATE TABLE manager_accomplishments (LIKE comedian_accomplishments INCLUDING ALL);
CREATE TABLE manager_custom_links (LIKE comedian_custom_links INCLUDING ALL);
CREATE TABLE manager_press_reviews (LIKE comedian_press_reviews INCLUDING ALL);

-- Organization tables
CREATE TABLE organization_accomplishments (LIKE comedian_accomplishments INCLUDING ALL);
CREATE TABLE organization_custom_links (LIKE comedian_custom_links INCLUDING ALL);
CREATE TABLE organization_press_reviews (LIKE comedian_press_reviews INCLUDING ALL);
```

## Phase 2: Profile Type Configuration

### Create `src/utils/profileConfig.ts`
Define configuration for each profile type:
- Section visibility (which sections to show)
- Label mappings (dynamic text per type)
- Table names (which DB tables to use)
- Field conditionals (show/hide specific fields)

**Example structure**:
```typescript
export const profileConfig = {
  comedian: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      highlights: 'Career Highlights',
      image: 'Profile Picture',
      primaryName: 'First Name',
      secondaryName: 'Stage Name',
    },
    tables: {
      main: 'profiles',
      media: 'comedian_media',
      accomplishments: 'comedian_accomplishments',
      reviews: 'comedian_press_reviews',
      links: 'comedian_custom_links',
    },
    fields: {
      hasSecondaryName: true,
      hasExperience: true,
      hasFinancial: true,
      hasRates: false,
    }
  },
  organization: {
    sections: ['business', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Business Information',
      highlights: 'Company Highlights',
      image: 'Logo',
      primaryName: 'Organization Name',
      secondaryName: 'Legal Name',
    },
    tables: {
      main: 'organization_profiles',
      media: 'organization_media',
      accomplishments: 'organization_accomplishments',
      reviews: 'organization_press_reviews',
      links: 'organization_custom_links',
    },
    fields: {
      hasSecondaryName: true,
      hasExperience: false,
      hasFinancial: true,
      hasRates: false,
    }
  },
  photographer: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      highlights: 'Experience Highlights',
      image: 'Profile Picture',
      financial: 'Rates & Availability',
    },
    tables: {
      main: 'profiles',
      media: 'photographer_portfolio_items',
      accomplishments: 'photographer_accomplishments',
      reviews: 'photographer_press_reviews',
      links: 'photographer_custom_links',
    },
    fields: {
      hasSecondaryName: false,
      hasExperience: true,
      hasFinancial: true,
      hasRates: true,
    }
  },
  videographer: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      highlights: 'Experience Highlights',
      image: 'Profile Picture',
      financial: 'Rates & Availability',
      media: 'Portfolio & Reels',
    },
    tables: {
      main: 'profiles',
      media: 'videographer_portfolio_items',
      accomplishments: 'videographer_accomplishments',
      reviews: 'videographer_press_reviews',
      links: 'videographer_custom_links',
    },
    fields: {
      hasSecondaryName: false,
      hasExperience: true,
      hasFinancial: true,
      hasRates: true,
    }
  },
  manager: {
    sections: ['personal', 'contact', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      highlights: 'Career Highlights',
      image: 'Profile Picture',
    },
    tables: {
      main: 'comedy_manager_profiles',
      accomplishments: 'manager_accomplishments',
      reviews: 'manager_press_reviews',
      links: 'manager_custom_links',
    },
    fields: {
      hasSecondaryName: false,
      hasExperience: true,
      hasFinancial: false,
      hasRates: false,
      hasMedia: false,
    }
  },
};
```

## Phase 3: Make Existing Components Profile-Type Aware

### Update These Components to Accept `profileType` Prop:

1. **`src/components/ProfileInformation.tsx`**
   - Add `profileType` prop
   - Add `config` prop from profileConfig
   - Conditionally show/hide fields (stage_name for comedians only, etc.)
   - Use dynamic labels from config.labels
   - Handle different main table names

2. **`src/components/ContactInformation.tsx`**
   - Add `profileType` prop
   - Add `config` prop
   - Hide manager contact fields for non-comedians
   - Use dynamic labels

3. **`src/components/FinancialInformation.tsx`**
   - Add `profileType` prop
   - Add `config` prop
   - Show rates section for photographers/videographers (if config.fields.hasRates)
   - Hide entire section for managers (if !config.fields.hasFinancial)
   - Dynamic section title

4. **`src/components/profile/CareerHighlightsManager.tsx`**
   - Accept `tableName` prop (comedian_accomplishments, organization_accomplishments, etc.)
   - Accept `sectionTitle` prop from config
   - Use tableName for all database operations

5. **`src/components/profile/PressReviewsManager.tsx`**
   - Accept `tableName` prop
   - Accept `sectionTitle` prop
   - Use tableName for all database operations

6. **`src/components/profile/CustomLinksManager.tsx`**
   - Accept `tableName` prop
   - Accept `sectionTitle` prop from config
   - Use tableName for all database operations

7. **`src/components/comedian-profile/ComedianMedia.tsx`**
   - Refactor to accept `tableName` prop
   - Make it work universally (rename to PortfolioManager.tsx?)
   - Support different media table structures

## Phase 4: Create Universal Profile Editor

### New File: `src/pages/UniversalProfileEditor.tsx`
Main profile editor page that works for all types:

**Key Features**:
- Detect profile type from URL or ActiveProfileContext
- Load appropriate profileConfig
- Render tab navigation (Profile, Calendar, Invoices, Vouches, Settings)
- Use ProfileTabs-style accordion sections
- Handle save/update for correct database table
- Permission checks (verify user owns profile)
- Image upload (avatar vs logo based on type)

**Structure** (~300 lines, similar to current Profile.tsx):
```typescript
export function UniversalProfileEditor() {
  const { activeProfile } = useActiveProfile();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Detect profile type from context
  const profileType = activeProfile?.type || 'comedian';
  const config = profileConfig[profileType];

  // Load profile data from appropriate table
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', profileType, activeProfile?.id],
    queryFn: () => fetchProfileData(config.tables.main, activeProfile?.id),
  });

  // Tab management
  const currentTab = searchParams.get('tab') || 'profile';

  return (
    <div className="profile-editor-container">
      {/* Header with image upload */}
      <ProfileHeader
        profileType={profileType}
        config={config}
        profileData={profileData}
      />

      {/* Tab Navigation */}
      <Tabs value={currentTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          {/* ... other tabs */}
        </TabsList>

        <TabsContent value="profile">
          <UniversalProfileTabs
            profileType={profileType}
            config={config}
            profileData={profileData}
          />
        </TabsContent>

        {/* ... other tab contents */}
      </Tabs>
    </div>
  );
}
```

### New File: `src/components/profile/UniversalProfileTabs.tsx`
Generalized version of current ProfileTabs.tsx with dynamic sections:

**Key Features**:
- Accordion-based sections (preserve current UI)
- Dynamic section rendering based on config.sections
- Conditional visibility per profile type
- Pass profileType and config to child components

**Structure** (~400 lines):
```typescript
export function UniversalProfileTabs({
  profileType,
  config,
  profileData
}: UniversalProfileTabsProps) {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {/* Personal/Business Information Section */}
      {config.sections.includes('personal') && (
        <AccordionItem value="personal">
          <AccordionTrigger>
            <User className="w-5 h-5 mr-2" />
            {config.labels.personal}
          </AccordionTrigger>
          <AccordionContent>
            <ProfileInformation
              profileType={profileType}
              config={config}
              data={profileData}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Media Portfolio Section */}
      {config.sections.includes('media') && config.fields.hasMedia !== false && (
        <AccordionItem value="media">
          <AccordionTrigger>
            <Camera className="w-5 h-5 mr-2" />
            {config.labels.media || 'Media Portfolio'}
          </AccordionTrigger>
          <AccordionContent>
            <PortfolioManager
              tableName={config.tables.media}
              profileId={profileData?.id}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Contact Information Section */}
      {config.sections.includes('contact') && (
        <AccordionItem value="contact">
          <AccordionTrigger>
            <Mail className="w-5 h-5 mr-2" />
            Contact Information
          </AccordionTrigger>
          <AccordionContent>
            <ContactInformation
              profileType={profileType}
              config={config}
              data={profileData}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Financial Information Section */}
      {config.sections.includes('financial') && config.fields.hasFinancial && (
        <AccordionItem value="financial">
          <AccordionTrigger>
            <DollarSign className="w-5 h-5 mr-2" />
            {config.labels.financial || 'Financial Information'}
          </AccordionTrigger>
          <AccordionContent>
            <FinancialInformation
              profileType={profileType}
              config={config}
              data={profileData}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Career Highlights Section */}
      {config.sections.includes('highlights') && (
        <AccordionItem value="highlights">
          <AccordionTrigger>
            <Award className="w-5 h-5 mr-2" />
            {config.labels.highlights}
          </AccordionTrigger>
          <AccordionContent>
            <CareerHighlightsManager
              tableName={config.tables.accomplishments}
              sectionTitle={config.labels.highlights}
              userId={profileData?.id}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Press Reviews Section */}
      {config.sections.includes('reviews') && (
        <AccordionItem value="reviews">
          <AccordionTrigger>
            <Star className="w-5 h-5 mr-2" />
            {config.labels.reviews || 'Press Reviews'}
          </AccordionTrigger>
          <AccordionContent>
            <PressReviewsManager
              tableName={config.tables.reviews}
              sectionTitle={config.labels.reviews || 'Press Reviews'}
              userId={profileData?.id}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Custom Links Section */}
      {config.sections.includes('links') && (
        <AccordionItem value="links">
          <AccordionTrigger>
            <Link className="w-5 h-5 mr-2" />
            {config.labels.links || 'Custom Links'}
          </AccordionTrigger>
          <AccordionContent>
            <CustomLinksManager
              tableName={config.tables.links}
              sectionTitle={config.labels.links || 'Custom Links'}
              userId={profileData?.id}
            />
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
```

## Phase 5: Create Organization EPK Layout

### Update `src/components/organization/OrganizationProfileLayout.tsx`
Match ComedianEPKLayout structure for consistency:

**Changes**:
- Add drag-and-drop section ordering (use @dnd-kit like comedians)
- Change "Profile" tab to "EPK" tab
- Use SortableEPKSection wrapper for organization sections
- Implement useOrganizationEPKSectionOrder hook (or generalize to useEPKSectionOrder with profile type param)

**Sections to Make Sortable**:
- Bio
- Contact
- Media
- Events (analogous to Shows)
- Highlights (analogous to Accomplishments)

**New Hook**: `src/hooks/useOrganizationEPKSectionOrder.ts`
- Copy pattern from `useEPKSectionOrder.ts`
- Use `organization_section_order` table (or add profile_type column to existing table)

## Phase 6: Update Routing

### Modify `src/App.tsx`:
Replace individual profile edit routes with universal editor:

```typescript
// BEFORE:
<Route path="/comedian/:slug/edit" element={<Profile />} />
<Route path="/organization/:slug/edit" element={<OrganizationProfile />} />

// AFTER:
<Route path="/comedian/:slug/edit" element={<UniversalProfileEditor />} />
<Route path="/organization/:slug/edit" element={<UniversalProfileEditor />} />
<Route path="/photographer/:slug/edit" element={<UniversalProfileEditor />} />
<Route path="/videographer/:slug/edit" element={<UniversalProfileEditor />} />
<Route path="/manager/:slug/edit" element={<UniversalProfileEditor />} />
```

**Note**: Keep old Profile.tsx and OrganizationProfile.tsx files (commented out) for rollback capability

## Key Behaviors

✅ **Single Universal Editor**: One component handles all profile types
✅ **Dynamic Text Labels**: Text changes based on profile type (e.g., "Personal Information" vs "Business Information")
✅ **Conditional Sections**: Some sections only appear for specific types (e.g., Rates for photographers, Media hidden for managers)
✅ **Table Abstraction**: Components accept table names as props to work with different backend tables
✅ **Preserved Accordion UI**: All existing accordion functionality maintained
✅ **Preserved Features**: Drag-and-drop, image upload, form validation all continue working
✅ **EPK Section Ordering**: Organizations get same drag-and-drop EPK as comedians
✅ **Banner Support**: All profile types can upload/reposition banner images
✅ **Permission Checks**: Verify user owns profile before allowing edits
✅ **Mobile Responsive**: Maintain accordion mobile experience
✅ **Tab Navigation**: Profile, Calendar, Invoices, Vouches, Settings tabs

## Files to Create

1. **`supabase/migrations/YYYYMMDD_universal_profile_schema.sql`** - Database schema changes
2. **`src/utils/profileConfig.ts`** - Profile type configurations (~200 lines)
3. **`src/pages/UniversalProfileEditor.tsx`** - Main universal editor (~300 lines)
4. **`src/components/profile/UniversalProfileTabs.tsx`** - Dynamic tab renderer (~400 lines)
5. **`src/types/universalProfile.ts`** - TypeScript interfaces (~100 lines)
6. **`src/hooks/useOrganizationEPKSectionOrder.ts`** - Org EPK section ordering hook

## Files to Modify

1. **`src/components/ProfileInformation.tsx`** - Add profileType & config props (+50 lines)
2. **`src/components/ContactInformation.tsx`** - Add profileType & config props (+30 lines)
3. **`src/components/FinancialInformation.tsx`** - Add profileType & config props, rates section (+80 lines)
4. **`src/components/profile/CareerHighlightsManager.tsx`** - Accept tableName & sectionTitle props (+10 lines)
5. **`src/components/profile/PressReviewsManager.tsx`** - Accept tableName & sectionTitle props (+10 lines)
6. **`src/components/profile/CustomLinksManager.tsx`** - Accept tableName & sectionTitle props (+10 lines)
7. **`src/components/comedian-profile/ComedianMedia.tsx`** - Refactor to accept tableName (+50 lines)
8. **`src/components/organization/OrganizationProfileLayout.tsx`** - Add EPK drag-and-drop features (+100 lines)
9. **`src/App.tsx`** - Update routes to use UniversalProfileEditor (~20 lines)

## Testing Checklist

**Per Profile Type** (comedian, organization, photographer, videographer, manager):
- [ ] Create new profile
- [ ] Edit existing profile
- [ ] Upload profile image/logo
- [ ] Save personal/business information
- [ ] Add/edit/delete media items (if applicable)
- [ ] Update contact information
- [ ] Save financial information (if applicable)
- [ ] Add/reorder/delete career highlights
- [ ] Add/edit/delete press reviews
- [ ] Add/edit/delete custom links
- [ ] Verify correct database table updates
- [ ] Check dynamic label customization
- [ ] Test accordion expand/collapse
- [ ] Test tab navigation
- [ ] Test mobile layout
- [ ] Test unsaved changes warning

**Organization-Specific EPK Tests**:
- [ ] Drag-and-drop section reordering
- [ ] Section order persistence
- [ ] Preview mode toggle
- [ ] Public view matches custom order

**Edge Cases**:
- [ ] Profile type not found
- [ ] User doesn't own profile
- [ ] Missing required fields
- [ ] Image upload failure
- [ ] Database save error
- [ ] Network timeout during save

## Implementation Order

**Phase 1: Database (Day 1)**
1. Create migration file
2. Add fields to organization_profiles
3. Create accomplishments/links/reviews tables for all types
4. Test migration locally
5. Generate TypeScript types

**Phase 2: Configuration (Day 2)**
1. Create profileConfig.ts
2. Define all 5 profile type configs
3. Create TypeScript interfaces

**Phase 3: Component Updates (Days 3-4)**
1. Update ProfileInformation.tsx
2. Update ContactInformation.tsx
3. Update FinancialInformation.tsx
4. Update CareerHighlightsManager.tsx
5. Update PressReviewsManager.tsx
6. Update CustomLinksManager.tsx
7. Test with comedian profile (verify no regressions)

**Phase 4: Universal Editor (Days 5-6)**
1. Create UniversalProfileEditor.tsx
2. Create UniversalProfileTabs.tsx
3. Test with comedian type first
4. Add organization type
5. Add photographer/videographer types
6. Add manager type

**Phase 5: Organization EPK (Day 7)**
1. Update OrganizationProfileLayout.tsx
2. Create useOrganizationEPKSectionOrder hook
3. Add drag-and-drop sections
4. Test section reordering

**Phase 6: Routing & Integration (Day 8)**
1. Update App.tsx routes
2. End-to-end testing all types
3. Fix bugs
4. Mobile testing

**Phase 7: Polish & Deploy (Days 9-10)**
1. Final regression testing
2. Documentation updates
3. Deploy to staging
4. User acceptance testing
5. Deploy to production

## Rollout Strategy

**Incremental Deployment**:
- **Week 1**: Database + Components + Comedian type only
- **Week 2**: Add Organization type, test thoroughly
- **Week 3**: Add Photographer/Videographer/Manager types
- **Week 4**: Full testing, bug fixes, deploy

**Rollback Plan**:
- Keep original Profile.tsx and OrganizationProfile.tsx in codebase
- Add feature flag in UniversalProfileEditor to redirect to legacy component if needed
- Can revert routes in App.tsx to use old components
- Database changes are additive (non-destructive)

## Success Metrics

✅ All 5 profile types use same editor component
✅ Zero regressions in existing comedian/org profile functionality
✅ Organizations have EPK with drag-and-drop ordering
✅ Label customization works per profile type
✅ All tests pass
✅ Mobile experience maintained
✅ Page load performance unchanged

## Notes

- **Organizations keep additional routes**: Dashboard, Events, Team, Tasks, Media Library, Invoices (these are business features, not removed)
- **Logo vs Avatar**: Organizations keep square logo, comedians/etc. keep circular avatars
- **Baseline Profile**: This creates a solid baseline that all profile types share, then specific types can have additional features layered on
- **Future Extensibility**: Easy to add new profile types by just adding to profileConfig.ts
- **No Breaking Changes**: All existing profiles continue working during migration
