import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaInput } from '@/components/SocialMediaInput';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  yearsExperience: string;
  customShowTypes: string[];
  instagramUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
}

interface ProfileInformationProps {
  user: any;
  onSave: (data: ProfileData) => Promise<void>;
}

export const ProfileInformation: React.FC<ProfileInformationProps> = ({
  user,
  onSave
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newShowType, setNewShowType] = useState('');
  
  const [formData, setFormData] = useState<ProfileData>({
    firstName: user.first_name || user.name?.split(' ')[0] || '',
    lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || '',
    yearsExperience: user.years_experience?.toString() || '',
    customShowTypes: user.custom_show_types || [],
    instagramUrl: user.instagram_url || '',
    twitterUrl: user.twitter_url || '',
    websiteUrl: user.website_url || '',
    youtubeUrl: user.youtube_url || '',
    facebookUrl: user.facebook_url || '',
    tiktokUrl: user.tiktok_url || ''
  });

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addShowType = () => {
    if (newShowType.trim() && !formData.customShowTypes.includes(newShowType.trim())) {
      setFormData(prev => ({
        ...prev,
        customShowTypes: [...prev.customShowTypes, newShowType.trim()]
      }));
      setNewShowType('');
    }
  };

  const removeShowType = (typeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      customShowTypes: prev.customShowTypes.filter(type => type !== typeToRemove)
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
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
    <Card className="professional-card">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your public profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first-name">First Name *</Label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+61 4XX XXX XXX"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="years-experience">Years of Experience</Label>
            <Select 
              value={formData.yearsExperience} 
              onValueChange={(value) => handleInputChange('yearsExperience', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">New to comedy</SelectItem>
                <SelectItem value="1">1 year</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years</SelectItem>
                <SelectItem value="4">4 years</SelectItem>
                <SelectItem value="5">5+ years</SelectItem>
                <SelectItem value="10">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell us about yourself and your comedy style..."
            rows={4}
          />
        </div>

        {/* Custom Show Types */}
        <div>
          <Label>Comedy Styles & Show Types</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newShowType}
              onChange={(e) => setNewShowType(e.target.value)}
              placeholder="Add a comedy style or show type..."
              onKeyPress={(e) => e.key === 'Enter' && addShowType()}
            />
            <Button type="button" onClick={addShowType} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.customShowTypes.map((type) => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {type}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeShowType(type)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Social Media & Links</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Just enter @username or username - we'll convert it to the full URL automatically!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SocialMediaInput
              id="instagram"
              platform="instagram"
              value={formData.instagramUrl}
              onChange={(value) => handleInputChange('instagramUrl', value)}
            />
            <SocialMediaInput
              id="twitter"
              platform="twitter"
              value={formData.twitterUrl}
              onChange={(value) => handleInputChange('twitterUrl', value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SocialMediaInput
              id="website"
              platform="website"
              value={formData.websiteUrl}
              onChange={(value) => handleInputChange('websiteUrl', value)}
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
              id="facebook"
              platform="facebook"
              value={formData.facebookUrl}
              onChange={(value) => handleInputChange('facebookUrl', value)}
            />
            <SocialMediaInput
              id="tiktok"
              platform="tiktok"
              value={formData.tiktokUrl}
              onChange={(value) => handleInputChange('tiktokUrl', value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="professional-button"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};