import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUpdateOrganizationProfile } from '@/hooks/useOrganizationProfiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, MapPin, Globe, Save } from 'lucide-react';
import { OrganizationLogoUpload } from '@/components/organization/OrganizationLogoUpload';

export default function OrganizationProfile() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { mutate: updateProfile, isPending } = useUpdateOrganizationProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'comedy_club',
    bio: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    suburb: '',
    postcode: '',
    state: '',
    country: 'Australia',
    social_links: {},
  });

  // Update form data when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        organization_name: organization.organization_name || '',
        organization_type: organization.organization_type || 'comedy_club',
        bio: organization.bio || '',
        email: organization.contact_email || '',
        phone: '', // Add phone field to organization_profiles if needed
        website: organization.website_url || '',
        address: '', // Add address fields to organization_profiles if needed
        suburb: '',
        postcode: '',
        state: '',
        country: 'Australia',
        social_links: {
          instagram: organization.instagram_url || '',
          facebook: organization.facebook_url || '',
          twitter: organization.twitter_url || '',
          tiktok: organization.tiktok_url || '',
        },
      });
    }
  }, [organization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile(formData, {
      onSuccess: () => {
        toast({
          title: 'Profile updated',
          description: 'Organization profile has been updated successfully.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error updating profile',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Organization Profile</h1>
        <p className="mt-1 text-gray-600">Manage {organization.organization_name}'s public profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>General information about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <OrganizationLogoUpload
              currentLogoUrl={organization.logo_url}
              onLogoUpdate={(logoUrl) => {
                // Logo is updated directly in the component, no need to update formData
                // But we can trigger a refetch if needed
              }}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization_name">Organization Name *</Label>
                <Input
                  id="organization_name"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization_type">Organization Type *</Label>
                <Select
                  value={formData.organization_type}
                  onValueChange={(value) => setFormData({ ...formData, organization_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comedy_club">Comedy Club</SelectItem>
                    <SelectItem value="production_company">Production Company</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell people about your organization..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>How people can reach your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@organization.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+61 2 1234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.organization.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>Your organization's physical location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="suburb">Suburb</Label>
                <Input
                  id="suburb"
                  value={formData.suburb}
                  onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                  placeholder="Sydney"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSW">NSW</SelectItem>
                    <SelectItem value="VIC">VIC</SelectItem>
                    <SelectItem value="QLD">QLD</SelectItem>
                    <SelectItem value="SA">SA</SelectItem>
                    <SelectItem value="WA">WA</SelectItem>
                    <SelectItem value="TAS">TAS</SelectItem>
                    <SelectItem value="NT">NT</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  placeholder="2000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media
            </CardTitle>
            <CardDescription>Your organization's social media presence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.social_links?.instagram || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, instagram: e.target.value },
                    })
                  }
                  placeholder="@organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.social_links?.facebook || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, facebook: e.target.value },
                    })
                  }
                  placeholder="facebook.com/organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={formData.social_links?.twitter || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, twitter: e.target.value },
                    })
                  }
                  placeholder="@organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={formData.social_links?.tiktok || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, tiktok: e.target.value },
                    })
                  }
                  placeholder="@organization"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
