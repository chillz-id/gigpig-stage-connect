import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaInput } from '@/components/SocialMediaInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import type { ProfileAwareProps } from '@/types/universalProfile';
import { getProfileConfig } from '@/utils/profileConfig';

// Australian states for location dropdown
const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'NSW' },
  { value: 'VIC', label: 'VIC' },
  { value: 'QLD', label: 'QLD' },
  { value: 'WA', label: 'WA' },
  { value: 'SA', label: 'SA' },
  { value: 'TAS', label: 'TAS' },
  { value: 'NT', label: 'NT' },
  { value: 'ACT', label: 'ACT' },
];

interface ProfileData {
  firstName: string;
  lastName: string;
  stageName: string;
  nameDisplayPreference: 'real' | 'stage' | 'both';
  email: string;
  phone: string;
  bio: string;
  location: string;
  country: string;
  customShowTypes: string[];
  instagramUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
}

interface ProfileInformationProps extends Partial<ProfileAwareProps> {
  user: any;
  onSave: (data: ProfileData) => Promise<void>;
}

export const ProfileInformation: React.FC<ProfileInformationProps> = ({
  user,
  onSave,
  profileType = 'comedian',
  config: propConfig
}) => {
  const { toast } = useToast();
  // Use provided config or derive from profileType (backwards compatibility)
  const config = propConfig ?? getProfileConfig(profileType);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreSocial, setShowMoreSocial] = useState(false);

  // Initial form data for change detection
  // For organizations: use display_name/legal_name, for individuals: use first_name/last_name
  const initialFormData: ProfileData = {
    firstName: user?.first_name || user?.display_name || user?.organization_name || user?.name?.split(' ')?.[0] || '',
    lastName: user?.last_name || user?.legal_name || user?.name?.split(' ')?.slice(1)?.join(' ') || '',
    stageName: user?.stage_name || '',
    nameDisplayPreference: user?.name_display_preference || user?.display_name_preference || 'real',
    email: user?.email || user?.contact_email || '',
    phone: user?.phone || user?.contact_phone || '',
    bio: user?.bio || '',
    location: user?.location || user?.city || user?.state || '',
    country: user?.country || 'Australia',
    customShowTypes: user?.custom_show_types || [],
    instagramUrl: user?.instagram_url || '',
    twitterUrl: user?.twitter_url || '',
    websiteUrl: user?.website_url || '',
    youtubeUrl: user?.youtube_url || '',
    facebookUrl: user?.facebook_url || '',
    tiktokUrl: user?.tiktok_url || '',
    linkedinUrl: user?.linkedin_url || ''
  };

  const [formData, setFormData] = useState<ProfileData>(initialFormData);

  // Check if form has unsaved changes
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  // Check if lastName is required (not required for organizations)
  const isLastNameRequired = config.fields.hasLastName !== false;

  const handleSubmit = async () => {
    // Basic validation - lastName not required for organizations
    const isLastNameValid = !isLastNameRequired || formData.lastName.trim();
    if (!formData.firstName.trim() || !isLastNameValid || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: isLastNameRequired
          ? "Please fill in all required fields (First Name, Last Name, Email)."
          : "Please fill in all required fields (Name, Email).",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSave(formData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 px-2">
        <div className={`grid grid-cols-1 ${isLastNameRequired ? 'md:grid-cols-2' : ''} gap-4`}>
          <div className="space-y-2">
            <Label htmlFor="first-name" className="mb-2 block">{config.labels.primaryName || 'First Name'} *</Label>
            <Input
              id="first-name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
          </div>
          {/* Hide Last Name for organizations */}
          {isLastNameRequired && (
            <div className="space-y-2">
              <Label htmlFor="last-name" className="mb-2 block">Last Name *</Label>
              <Input
                id="last-name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* Conditionally show secondary name field (Stage Name for comedians, Legal Name for organizations) */}
        {config.fields.hasSecondaryName && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name" className="mb-2 block">
                {config.labels.secondaryName || 'Stage Name'}
              </Label>
              <Input
                id="stage-name"
                value={formData.stageName}
                onChange={(e) => handleInputChange('stageName', e.target.value)}
                placeholder={
                  profileType === 'organization'
                    ? 'Your business legal name'
                    : `Your ${config.labels.secondaryName?.toLowerCase() || 'stage name'}`
                }
              />
              {profileType === 'organization' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your business legal name as registered
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-display" className="mb-2 block">Name Display Preference</Label>
              <Select
                value={formData.nameDisplayPreference}
                onValueChange={(value) => handleInputChange('nameDisplayPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select how your name is displayed" />
                </SelectTrigger>
                <SelectContent>
                  {profileType === 'organization' ? (
                    <>
                      <SelectItem value="real">Organization Name</SelectItem>
                      <SelectItem value="stage">Legal Name</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="real">Real name only</SelectItem>
                      <SelectItem value="stage">{config.labels.secondaryName || 'Stage name'} only</SelectItem>
                      <SelectItem value="both">Both ({config.labels.secondaryName || 'Stage name'} - Real name)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="mb-2 block">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled
              className="bg-muted cursor-not-allowed"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Contact support to change your email address
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="mb-2 block">Phone</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
            />
          </div>
        </div>

        {/* Location - dropdown for organizations, text input for others */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="mb-2 block">{profileType === 'organization' ? 'State' : 'Location'}</Label>
            {config.fields.hasStateDropdown ? (
              <Select
                value={formData.location}
                onValueChange={(value) => handleInputChange('location', value)}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {AUSTRALIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Sydney, NSW"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country" className="mb-2 block">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Australia"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="mb-2 block">{config.labels.bio || 'Bio'}</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder={
              profileType === 'organization'
                ? 'Describe your organization, mission, and what you do...'
                : profileType === 'photographer' || profileType === 'videographer'
                ? 'Tell us about your work, style, and experience...'
                : 'Tell us about yourself and your comedy style...'
            }
            rows={4}
          />
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <Label className="text-base font-semibold mb-2 block">Social Media</Label>

          {/* Always visible: Instagram, YouTube, TikTok, Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SocialMediaInput
              id="instagram"
              platform="instagram"
              value={formData.instagramUrl}
              onChange={(value) => handleInputChange('instagramUrl', value)}
            />
            <SocialMediaInput
              id="youtube"
              platform="youtube"
              value={formData.youtubeUrl}
              onChange={(value) => handleInputChange('youtubeUrl', value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SocialMediaInput
              id="tiktok"
              platform="tiktok"
              value={formData.tiktokUrl}
              onChange={(value) => handleInputChange('tiktokUrl', value)}
            />
            <SocialMediaInput
              id="website"
              platform="website"
              value={formData.websiteUrl}
              onChange={(value) => handleInputChange('websiteUrl', value)}
            />
          </div>

          {/* Collapsible section for Facebook, Twitter, and LinkedIn */}
          <div>
            <Button
              type="button"
              className="professional-button flex items-center gap-2"
              size="sm"
              onClick={() => setShowMoreSocial(!showMoreSocial)}
            >
              <Plus className="w-4 h-4" />
              {showMoreSocial ? 'Hide' : 'Add'} More Social Links
              {showMoreSocial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showMoreSocial && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <SocialMediaInput
                  id="facebook"
                  platform="facebook"
                  value={formData.facebookUrl}
                  onChange={(value) => handleInputChange('facebookUrl', value)}
                />
                <SocialMediaInput
                  id="twitter"
                  platform="twitter"
                  value={formData.twitterUrl}
                  onChange={(value) => handleInputChange('twitterUrl', value)}
                />
                <SocialMediaInput
                  id="linkedin"
                  platform="linkedin"
                  value={formData.linkedinUrl}
                  onChange={(value) => handleInputChange('linkedinUrl', value)}
                />
              </div>
            )}
          </div>
        </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !hasUnsavedChanges}
          className="professional-button"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};