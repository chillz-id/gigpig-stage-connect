import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SocialMediaInput } from '@/components/SocialMediaInput';
import { Loader2 } from 'lucide-react';

export interface ComedianProfileFormData {
  name: string;
  bio: string;
  avatar_url?: string;
  location?: string;
  instagram_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  youtube_url?: string;
}

interface ComedianProfileFormProps {
  initialData?: Partial<ComedianProfileFormData>;
  onSubmit: (data: ComedianProfileFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Comedian Profile Form Component
 *
 * Form for creating or editing comedian profiles.
 * Required fields: name, bio
 * Optional fields: avatar_url, location, social media links
 */
export function ComedianProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Profile'
}: ComedianProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ComedianProfileFormData>({
    name: initialData?.name || '',
    bio: initialData?.bio || '',
    avatar_url: initialData?.avatar_url || '',
    location: initialData?.location || '',
    instagram_url: initialData?.instagram_url || '',
    twitter_url: initialData?.twitter_url || '',
    facebook_url: initialData?.facebook_url || '',
    youtube_url: initialData?.youtube_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ComedianProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Stage name is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Comedian Profile</CardTitle>
          <CardDescription>
            Set up your comedian profile to start getting bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Information</h3>

            <div>
              <Label htmlFor="name">Stage Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your stage name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell promoters about your comedy style, experience, and what makes you unique..."
                rows={5}
                className={errors.bio ? 'border-red-500' : ''}
              />
              {errors.bio && (
                <p className="text-sm text-red-500 mt-1">{errors.bio}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {formData.bio.length} characters
              </p>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Optional Information</h3>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Sydney, NSW"
              />
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Social Media</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SocialMediaInput
                  id="instagram"
                  platform="instagram"
                  value={formData.instagram_url || ''}
                  onChange={(value) => handleInputChange('instagram_url', value)}
                />
                <SocialMediaInput
                  id="twitter"
                  platform="twitter"
                  value={formData.twitter_url || ''}
                  onChange={(value) => handleInputChange('twitter_url', value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SocialMediaInput
                  id="facebook"
                  platform="facebook"
                  value={formData.facebook_url || ''}
                  onChange={(value) => handleInputChange('facebook_url', value)}
                />
                <SocialMediaInput
                  id="youtube"
                  platform="youtube"
                  value={formData.youtube_url || ''}
                  onChange={(value) => handleInputChange('youtube_url', value)}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" className="professional-button" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
