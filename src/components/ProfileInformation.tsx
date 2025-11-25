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

interface ProfileData {
  firstName: string;
  lastName: string;
  stageName: string;
  nameDisplayPreference: 'real' | 'stage' | 'both';
  email: string;
  phone: string;
  bio: string;
  location: string;
  customShowTypes: string[];
  instagramUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
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
  const initialFormData: ProfileData = {
    firstName: user.first_name || user.name?.split(' ')[0] || '',
    lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
    stageName: user.stage_name || '',
    nameDisplayPreference: user.name_display_preference || 'real',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || '',
    customShowTypes: user.custom_show_types || [],
    instagramUrl: user.instagram_url || '',
    twitterUrl: user.twitter_url || '',
    websiteUrl: user.website_url || '',
    youtubeUrl: user.youtube_url || '',
    facebookUrl: user.facebook_url || '',
    tiktokUrl: user.tiktok_url || ''
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


  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (First Name, Last Name, Email).",
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
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first-name">{config.labels.primaryName || 'First Name'} *</Label>
            <Input
              id="first-name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="last-name">Last Name *</Label>
            <Input
              id="last-name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Conditionally show secondary name field (Stage Name for comedians, Legal Name for organizations) */}
        {config.fields.hasSecondaryName && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage-name">{config.labels.secondaryName || 'Stage Name'}</Label>
              <Input
                id="stage-name"
                value={formData.stageName}
                onChange={(e) => handleInputChange('stageName', e.target.value)}
                placeholder={`Your ${config.labels.secondaryName?.toLowerCase() || 'stage name'}`}
              />
            </div>
            <div>
              <Label htmlFor="name-display">Name Display Preference</Label>
              <Select
                value={formData.nameDisplayPreference}
                onValueChange={(value) => handleInputChange('nameDisplayPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select how your name is displayed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">Real name only</SelectItem>
                  <SelectItem value="stage">{config.labels.secondaryName || 'Stage name'} only</SelectItem>
                  <SelectItem value="both">Both ({config.labels.secondaryName || 'Stage name'} - Real name)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
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
          <div>
            <Label htmlFor="phone">Phone</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Sydney, NSW"
          />
        </div>

        <div>
          <Label htmlFor="bio">{config.labels.bio || 'Bio'}</Label>
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
          <Label className="text-base font-semibold">Social Media & Links</Label>

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

          {/* Collapsible section for Facebook and Twitter */}
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