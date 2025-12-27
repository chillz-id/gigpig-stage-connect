import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ORG_TYPE_FEATURES, OrgType, VENUE_SUBTYPE_LABELS, VenueSubtype } from '@/config/organizationTypes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Business Information Component
 *
 * Profile tab for organizations displaying:
 * - Organization logo (profile banner)
 * - Basic information (name, types, bio)
 * - Contact information
 * - Social media links
 */
export default function BusinessInformation() {
  const { organization, refetch, isOwner, isAdmin } = useOrganization();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isOwner || isAdmin;

  // Form state
  const [formData, setFormData] = useState({
    organization_name: organization?.organization_name || '',
    organization_type: (organization?.organization_type || []) as OrgType[],
    venue_subtypes: (organization?.venue_subtypes || []) as VenueSubtype[],
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
    if (!organization) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organization_profiles')
        .update(formData)
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Business information updated successfully',
      });

      await refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update business information',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOrgType = (type: OrgType) => {
    const types = formData.organization_type || [];
    const hasType = types.includes(type);

    const newTypes = hasType
      ? types.filter(t => t !== type)
      : [...types, type];

    // If removing "venue" type, clear venue subtypes
    const newVenueSubtypes = hasType && type === 'venue'
      ? []
      : formData.venue_subtypes;

    setFormData({
      ...formData,
      organization_type: newTypes,
      venue_subtypes: newVenueSubtypes,
    });
  };

  const toggleVenueSubtype = (subtype: VenueSubtype) => {
    const subtypes = formData.venue_subtypes || [];
    const hasSubtype = subtypes.includes(subtype);

    setFormData({
      ...formData,
      venue_subtypes: hasSubtype
        ? subtypes.filter(s => s !== subtype)
        : [...subtypes, subtype],
    });
  };

  // Check if venue is selected as an organization type
  const isVenueSelected = (formData.organization_type || []).includes('venue');

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Organization Name</label>
            <Input
              value={formData.organization_name}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Organization Types</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(ORG_TYPE_FEATURES).map(([key, config]) => (
                <div key={key} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Checkbox
                    id={key}
                    checked={(formData.organization_type || []).includes(key as OrgType)}
                    onCheckedChange={() => toggleOrgType(key as OrgType)}
                    disabled={!isEditing}
                  />
                  <label htmlFor={key} className="text-sm cursor-pointer flex-1">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Subtypes - Only show if "venue" is selected */}
          {isVenueSelected && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">Venue Type (Optional)</label>
              <p className="text-xs text-gray-500 mb-3">Select the type(s) that best describe your venue</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(VENUE_SUBTYPE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                    <Checkbox
                      id={`venue-${key}`}
                      checked={(formData.venue_subtypes || []).includes(key as VenueSubtype)}
                      onCheckedChange={() => toggleVenueSubtype(key as VenueSubtype)}
                      disabled={!isEditing}
                    />
                    <label htmlFor={`venue-${key}`} className="text-sm cursor-pointer font-medium">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Bio / Description</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              rows={6}
              placeholder="Tell us about your organization..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              disabled={!isEditing}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Suburb</label>
              <Input
                value={formData.suburb}
                onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">State</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Postcode</label>
              <Input
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Card */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Instagram</label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                disabled={!isEditing}
                placeholder="@username or full URL"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Facebook</label>
              <Input
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                disabled={!isEditing}
                placeholder="Page URL"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Twitter/X</label>
              <Input
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={!isEditing}
                placeholder="@username or full URL"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">TikTok</label>
              <Input
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                disabled={!isEditing}
                placeholder="@username or full URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} className="professional-button">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data
                  setFormData({
                    organization_name: organization?.organization_name || '',
                    organization_type: (organization?.organization_type || []) as OrgType[],
                    venue_subtypes: (organization?.venue_subtypes || []) as VenueSubtype[],
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
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="professional-button">
              Edit Profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
