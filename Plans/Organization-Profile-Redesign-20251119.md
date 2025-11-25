# Organization Profile Redesign: Tab-Based Interface with Multi-Type Support

Created: 2025-11-19
Status: Pending

## Overview

Transform the organization profile page from a single-form layout to a comprehensive tab-based interface matching the comedian_lite profile structure, with organization-specific customizations. This redesign introduces multi-type organization support, feature toggles, financial details management, and company highlights tracking.

**Key Goals:**
- Match comedian_lite tab structure with org-specific terminology
- Support organizations with multiple types (Event Promoter, Artist Agency, Venue)
- Separate financial details (ABN, ACN, banking) into dedicated tab
- Enable feature toggle system for flexible organization capabilities
- Reuse existing components (calendar, vouches) with organization context

## Changes Overview

### 1. Database Schema Updates
**Files**: New migration file
- Change `organization_type` from single enum to array for multi-type selection
- Add `enabled_features` JSONB column for feature toggles
- Create `organization_highlights` table for company achievements
- Migration to update existing organizations (change iD Comedy to "Event Promoter")

### 2. Organization Profile Tabs Component
**Files**: `src/components/organization/OrganizationProfileTabs.tsx` (NEW)
- Create 6-tab interface: Profile, Financial Details, Company Highlights, Calendar, Vouches, Settings
- Model after `ProfileTabs.tsx` structure (tab-based accordion layout)
- Mobile responsive with proper tab navigation
- Use OrganizationContext for state management

### 3. Profile Tab - Business Information
**Files**: `src/components/organization/BusinessInformation.tsx` (NEW)
- Profile banner with logo upload (top of page)
- Basic information accordion (name, types, bio)
- Contact information accordion (email, phone, location)
- Social media accordion (Instagram, Facebook, Twitter, TikTok)

### 4. Financial Details Tab
**Files**: `src/components/organization/FinancialDetails.tsx` (NEW)
- Business registration section (ABN, ACN, structure)
- Banking information section (BSB, account, name)
- Tax settings section (GST, TFN, payment terms)

### 5. Company Highlights Tab
**Files**: `src/components/organization/CompanyHighlightsManager.tsx` (NEW)
- Based on `CareerHighlightsManager.tsx`
- CRUD operations with dialog interface
- Categories: Major Events, Partnerships, Awards, Milestones

### 6. Settings Tab
**Files**: `src/components/organization/OrganizationSettings.tsx` (NEW)
- Feature toggles (enable/disable features per org type)
- Privacy & visibility controls
- Notification preferences
- Team management links
- Billing & invoices
- Danger zone (archive, delete, transfer)

### 7. Configuration & Hooks
**Files**:
- `src/config/organizationTypes.ts` (NEW)
- `src/hooks/organization/useOrganizationHighlights.ts` (NEW)
- `src/hooks/organization/useOrganizationFeatures.ts` (NEW)

### 8. Routing Updates
**Files**: `src/pages/PublicProfile.tsx` (MODIFIED)
- Replace `<OrganizationProfile />` with `<OrganizationProfileTabs />`
- Keep all other organization routes intact

## Files to Modify/Create

### New Files (8 files)

1. **src/components/organization/OrganizationProfileTabs.tsx** - Main tab interface container
2. **src/components/organization/BusinessInformation.tsx** - Profile tab with business info
3. **src/components/organization/FinancialDetails.tsx** - Financial Details tab (ABN, ACN, banking)
4. **src/components/organization/CompanyHighlightsManager.tsx** - Company Highlights tab
5. **src/components/organization/OrganizationSettings.tsx** - Settings tab with feature toggles
6. **src/config/organizationTypes.ts** - Organization type configuration
7. **src/hooks/organization/useOrganizationHighlights.ts** - Highlights CRUD hook
8. **src/hooks/organization/useOrganizationFeatures.ts** - Feature toggle management hook

### Modified Files (2 files)

1. **src/pages/PublicProfile.tsx** - Update route to use new tabs component
2. **Database migration file** - Schema updates for multi-type support

### Reused Components (4 components)

1. **OrganizationLogoUpload** - Logo management (profile banner)
2. **ProfileCalendarView** - Calendar interface with organization context
3. **GiveVouchForm** - Vouch system
4. **VouchHistory** - Vouch display

## Detailed Changes

### Phase 1: Database Schema Updates

**Migration File**: `supabase/migrations/YYYYMMDDHHMMSS_organization_profile_redesign.sql`

```sql
-- 1. Change organization_type to array for multi-type support
ALTER TABLE organization_profiles
  ALTER COLUMN organization_type TYPE text[] USING ARRAY[organization_type]::text[];

-- 2. Add enabled_features column
ALTER TABLE organization_profiles
  ADD COLUMN enabled_features JSONB DEFAULT '{}'::jsonb;

-- 3. Create organization_highlights table
CREATE TABLE organization_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  category text CHECK (category IN ('event', 'partnership', 'award', 'milestone')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Add RLS policies
ALTER TABLE organization_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view highlights"
  ON organization_highlights FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage highlights"
  ON organization_highlights FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 5. Update existing iD Comedy organization
UPDATE organization_profiles
SET organization_type = ARRAY['event_promoter']::text[]
WHERE organization_name = 'iD Comedy';

-- 6. Add indexes
CREATE INDEX idx_org_highlights_org_id ON organization_highlights(organization_id);
CREATE INDEX idx_org_highlights_date ON organization_highlights(date DESC);
```

### Phase 2: Organization Types Configuration

**File**: `src/config/organizationTypes.ts`

```typescript
export const ORG_TYPES = {
  EVENT_PROMOTER: 'event_promoter',
  ARTIST_AGENCY: 'artist_agency',
  VENUE: 'venue',
} as const;

export type OrgType = typeof ORG_TYPES[keyof typeof ORG_TYPES];

export interface OrgTypeConfig {
  label: string;
  defaultFeatures: string[];
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ORG_TYPE_FEATURES: Record<OrgType, OrgTypeConfig> = {
  [ORG_TYPES.EVENT_PROMOTER]: {
    label: 'Event Promoter',
    defaultFeatures: ['events', 'analytics', 'media', 'invoices', 'ticketing'],
    description: 'Organizations that run comedy events and shows',
    icon: Calendar,
  },
  [ORG_TYPES.ARTIST_AGENCY]: {
    label: 'Artist Agency',
    defaultFeatures: ['roster', 'bookings', 'deals', 'invoices', 'analytics'],
    description: 'Manages comedians and books them for gigs',
    icon: Users,
  },
  [ORG_TYPES.VENUE]: {
    label: 'Venue',
    defaultFeatures: ['events', 'bookings', 'media', 'calendar'],
    description: 'Physical locations that host comedy events',
    icon: MapPin,
  },
};

export const ALL_ORG_FEATURES = [
  'events',
  'roster',
  'bookings',
  'deals',
  'analytics',
  'media',
  'invoices',
  'ticketing',
  'calendar',
  'social',
  'notifications',
] as const;
```

### Phase 3: Main Tabs Component

**File**: `src/components/organization/OrganizationProfileTabs.tsx`

```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, DollarSign, Award, Calendar, Heart, Settings } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import BusinessInformation from './BusinessInformation';
import FinancialDetails from './FinancialDetails';
import CompanyHighlightsManager from './CompanyHighlightsManager';
import ProfileCalendarView from '@/components/profile/ProfileCalendarView';
import { GiveVouchForm } from '@/components/GiveVouchForm';
import { VouchHistory } from '@/components/VouchHistory';
import OrganizationSettings from './OrganizationSettings';

const TABS = [
  { id: 'profile', label: 'Profile', icon: Building2 },
  { id: 'financial', label: 'Financial Details', icon: DollarSign },
  { id: 'highlights', label: 'Company Highlights', icon: Award },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'vouches', label: 'Vouches', icon: Heart },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function OrganizationProfileTabs() {
  const { organization, isOwner, isAdmin, isMember } = useOrganization();
  const [activeTab, setActiveTab] = useState<string>('profile');

  if (!organization) {
    return <div>Loading organization...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <BusinessInformation />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinancialDetails />
        </TabsContent>

        <TabsContent value="highlights" className="mt-6">
          <CompanyHighlightsManager />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <ProfileCalendarView context="organization" />
        </TabsContent>

        <TabsContent value="vouches" className="mt-6">
          <div className="space-y-6">
            {(isOwner || isAdmin || isMember) && (
              <GiveVouchForm context="organization" />
            )}
            <VouchHistory context="organization" />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <OrganizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Phase 4: Business Information Component

**File**: `src/components/organization/BusinessInformation.tsx`

```typescript
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { OrganizationLogoUpload } from './OrganizationLogoUpload';
import { ORG_TYPE_FEATURES, OrgType } from '@/config/organizationTypes';

export default function BusinessInformation() {
  const { organization, updateOrganization, isOwner, isAdmin } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = isOwner || isAdmin;

  // Form state
  const [formData, setFormData] = useState({
    organization_name: organization?.organization_name || '',
    organization_types: organization?.organization_type || [],
    bio: organization?.bio || '',
    contact_email: organization?.contact_email || '',
    phone: organization?.phone || '',
    website: organization?.website || '',
    address: organization?.address || '',
    suburb: organization?.suburb || '',
    state: organization?.state || '',
    postcode: organization?.postcode || '',
    instagram: organization?.instagram || '',
    facebook: organization?.facebook || '',
    twitter: organization?.twitter || '',
    tiktok: organization?.tiktok || '',
  });

  const handleSave = async () => {
    await updateOrganization(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Banner - Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationLogoUpload />
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <Accordion type="multiple" defaultValue={['basic', 'contact', 'social']}>
        {/* Basic Information */}
        <AccordionItem value="basic">
          <AccordionTrigger>Basic Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Organization Types</label>
                <div className="space-y-2 mt-2">
                  {Object.entries(ORG_TYPE_FEATURES).map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={formData.organization_types.includes(key as OrgType)}
                        onCheckedChange={(checked) => {
                          const types = checked
                            ? [...formData.organization_types, key as OrgType]
                            : formData.organization_types.filter(t => t !== key);
                          setFormData({ ...formData, organization_types: types });
                        }}
                        disabled={!isEditing}
                      />
                      <label htmlFor={key} className="text-sm">
                        {config.label}
                        <span className="text-xs text-gray-500 block">{config.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Bio / Description</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={6}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contact Information */}
        <AccordionItem value="contact">
          <AccordionTrigger>Contact Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website</label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Suburb</label>
                  <Input
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Postcode</label>
                  <Input
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social Media */}
        <AccordionItem value="social">
          <AccordionTrigger>Social Media</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div>
                <label className="text-sm font-medium">Instagram</label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  disabled={!isEditing}
                  placeholder="@username or full URL"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Facebook</label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Page URL"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Twitter/X</label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  disabled={!isEditing}
                  placeholder="@username or full URL"
                />
              </div>

              <div>
                <label className="text-sm font-medium">TikTok</label>
                <Input
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  disabled={!isEditing}
                  placeholder="@username or full URL"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Phase 5: Financial Details Component

**File**: `src/components/organization/FinancialDetails.tsx`

```typescript
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';

export default function FinancialDetails() {
  const { organization, updateOrganization, isOwner, isAdmin } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = isOwner || isAdmin;

  const [formData, setFormData] = useState({
    abn: organization?.abn || '',
    acn: organization?.acn || '',
    business_structure: organization?.business_structure || '',
    bsb: organization?.bsb || '',
    account_number: organization?.account_number || '',
    account_name: organization?.account_name || '',
    gst_registered: organization?.gst_registered || false,
    tfn: organization?.tfn || '',
    payment_terms: organization?.payment_terms || '30',
  });

  // ABN validation (11 digits)
  const validateABN = (abn: string) => {
    return /^\d{11}$/.test(abn.replace(/\s/g, ''));
  };

  // ACN validation (9 digits)
  const validateACN = (acn: string) => {
    if (!acn) return true; // Optional
    return /^\d{9}$/.test(acn.replace(/\s/g, ''));
  };

  const handleSave = async () => {
    // Validation
    if (!validateABN(formData.abn)) {
      alert('ABN must be 11 digits');
      return;
    }
    if (formData.acn && !validateACN(formData.acn)) {
      alert('ACN must be 9 digits');
      return;
    }

    await updateOrganization(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Financial Information
          </CardTitle>
          <CardDescription>
            Secure storage of business registration and banking details
          </CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={['registration']}>
        {/* Business Registration */}
        <AccordionItem value="registration">
          <AccordionTrigger>Business Registration</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div>
                <label className="text-sm font-medium">ABN (Australian Business Number) *</label>
                <Input
                  value={formData.abn}
                  onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                  disabled={!isEditing}
                  placeholder="12 345 678 901"
                  maxLength={14}
                />
                <p className="text-xs text-gray-500 mt-1">11 digits required</p>
              </div>

              <div>
                <label className="text-sm font-medium">ACN (Australian Company Number)</label>
                <Input
                  value={formData.acn}
                  onChange={(e) => setFormData({ ...formData, acn: e.target.value })}
                  disabled={!isEditing}
                  placeholder="123 456 789"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 mt-1">9 digits (optional)</p>
              </div>

              <div>
                <label className="text-sm font-medium">Business Structure</label>
                <Select
                  value={formData.business_structure}
                  onValueChange={(value) => setFormData({ ...formData, business_structure: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole_trader">Sole Trader</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="pty_ltd">Pty Ltd Company</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Banking Information */}
        <AccordionItem value="banking">
          <AccordionTrigger>Banking Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <p className="text-sm text-gray-600">
                For receiving payments and invoices
              </p>

              <div>
                <label className="text-sm font-medium">BSB</label>
                <Input
                  value={formData.bsb}
                  onChange={(e) => setFormData({ ...formData, bsb: e.target.value })}
                  disabled={!isEditing}
                  placeholder="123-456"
                  maxLength={7}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Account Number</label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  disabled={!isEditing}
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Account Name</label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Company Name Pty Ltd"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tax Settings */}
        <AccordionItem value="tax">
          <AccordionTrigger>Tax Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">GST Registered</label>
                  <p className="text-xs text-gray-500">Are you registered for GST?</p>
                </div>
                <Switch
                  checked={formData.gst_registered}
                  onCheckedChange={(checked) => setFormData({ ...formData, gst_registered: checked })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tax File Number (TFN)</label>
                <Input
                  type="password"
                  value={formData.tfn}
                  onChange={(e) => setFormData({ ...formData, tfn: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter TFN (encrypted)"
                />
                <p className="text-xs text-gray-500 mt-1">Securely encrypted</p>
              </div>

              <div>
                <label className="text-sm font-medium">Default Payment Terms</label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Financial Details</Button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Phase 6: Company Highlights Component

**File**: `src/components/organization/CompanyHighlightsManager.tsx`

```typescript
// Similar structure to CareerHighlightsManager.tsx
// CRUD operations for organization highlights
// Categories: Major Events, Partnerships, Awards, Milestones
// Fields: Title, Description, Date, Category
// Uses useOrganizationHighlights hook
// Dialog-based editing interface
```

### Phase 7: Organization Settings Component

**File**: `src/components/organization/OrganizationSettings.tsx`

```typescript
// Feature toggle management
// Privacy & visibility controls
// Notification preferences
// Team management links
// Billing & invoices section
// Danger zone (archive, delete, transfer)
```

### Phase 8: Hooks

**File**: `src/hooks/organization/useOrganizationHighlights.ts`

```typescript
// CRUD operations for organization_highlights table
// useQuery for fetching highlights
// useMutation for create, update, delete
```

**File**: `src/hooks/organization/useOrganizationFeatures.ts`

```typescript
// Feature toggle management
// Get enabled features from enabled_features JSONB column
// Enable/disable features
// Check if feature is enabled
```

### Phase 9: Routing Update

**File**: `src/pages/PublicProfile.tsx`

```typescript
// Line 168 - Replace:
<Route path="profile" element={<OrganizationProfile />} />

// With:
<Route path="profile" element={<OrganizationProfileTabs />} />
```

## Database Changes

### Migration: `supabase/migrations/YYYYMMDDHHMMSS_organization_profile_redesign.sql`

1. **Change organization_type to array**:
   - Alter column from single text enum to text array
   - Supports multi-type organizations

2. **Add enabled_features column**:
   - JSONB column for feature toggle storage
   - Default empty object

3. **Create organization_highlights table**:
   - Tracks company achievements, milestones, awards
   - Linked to organization via foreign key
   - RLS policies for organization members

4. **Update existing data**:
   - Migrate iD Comedy to "Event Promoter" type
   - Set default enabled_features for existing organizations

5. **Add indexes**:
   - Index on organization_id for highlights
   - Index on date for sorting

## Key Behaviors

✅ Organizations can select multiple types (Event Promoter, Artist Agency, Venue)

✅ Profile banner displays logo at top of profile page (separate from EPK)

✅ Financial Details in separate tab with ABN (required), ACN (optional)

✅ ABN validated as 11 digits, ACN validated as 9 digits

✅ All organizations see all features, can enable/disable per needs

✅ Each org type has default features enabled on creation

✅ Calendar shows organization's own events + events with deals

✅ Vouches work same as comedian profiles (give/receive endorsements)

✅ Settings only accessible to organization members (owner/admin/member)

✅ Terminology changes from comedian profiles:
  - "Personal Information" → "Business Information"
  - "Career Highlights" → "Company Highlights"

✅ Reuses existing components (ProfileCalendarView, VouchHistory, GiveVouchForm)

✅ Mobile responsive tab navigation

✅ Permissions respect OrganizationContext (isOwner, isAdmin, isMember)

## Testing Checklist

- [ ] Test multi-type selection (Event Promoter + Artist Agency combination)
- [ ] Test single type selection still works
- [ ] Test ABN validation (must be 11 digits)
- [ ] Test ACN validation (must be 9 digits if provided)
- [ ] Test company highlights CRUD operations
- [ ] Test feature toggle enable/disable
- [ ] Test calendar shows correct organization events
- [ ] Test vouch system with organization context
- [ ] Test settings only accessible to organization members
- [ ] Test profile banner logo upload/display
- [ ] Test financial details save/edit permissions
- [ ] Test tab navigation on mobile and desktop
- [ ] Test existing iD Comedy organization migrated to Event Promoter
- [ ] Verify RLS policies protect organization data
- [ ] Test empty states for each tab
- [ ] Test navigation between tabs maintains state

## Notes

### EPK vs Profile Banner Clarification
- **Profile Banner**: Logo display at top of profile page (THIS feature)
- **EPK (Electronic Press Kit)**: Separate feature with logo + event banner format (FUTURE feature)

### Organization Types
- Event Promoter: Runs comedy events/shows
- Artist Agency: Manages comedians, books gigs
- Venue: Physical locations hosting events
- Multi-select: Organizations can have multiple types (e.g., iD Comedy = Event Promoter + Artist Agency)

### Feature Toggle Philosophy
- All organizations see same feature set
- Can enable/disable per organizational needs
- Default features based on organization type(s) on creation
- Flexibility for organizations to grow/change focus

### Data Migration
- Existing organizations need organization_type converted to array
- iD Comedy specifically changed from current type to "Event Promoter"
- enabled_features initialized with defaults based on type

### Security Considerations
- TFN stored encrypted
- Financial details only visible to organization members
- RLS policies enforce organization membership for all operations
- Banking information marked as sensitive

### Mobile Responsiveness
- Tab labels hidden on mobile, icons only
- Grid changes from 6 columns to 2 columns on mobile
- Accordion sections stack vertically
- Input fields adjust to smaller screens

### Component Reuse Strategy
- OrganizationLogoUpload (existing)
- ProfileCalendarView (existing, adapted for org context)
- GiveVouchForm (existing, adapted for org context)
- VouchHistory (existing, adapted for org context)
- New components only where organization-specific logic required

### Dependencies
- Requires OrganizationContext for state management
- Requires existing vouch system tables
- Requires Supabase RLS policies
- Requires React Hook Form + Zod for validation
- Requires shadcn/ui components (Accordion, Tabs, Card, etc.)
