import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface PromoterProfileFormData {
  name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website_url?: string;
}

interface PromoterProfileFormProps {
  initialData?: Partial<PromoterProfileFormData>;
  onSubmit: (data: PromoterProfileFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Promoter Profile Form Component
 *
 * Form for creating or editing promoter profiles.
 * Required fields: name (organization name)
 * Optional fields: bio, avatar_url, location, website_url
 */
export function PromoterProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Profile'
}: PromoterProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PromoterProfileFormData>({
    name: initialData?.name || '',
    bio: initialData?.bio || '',
    avatar_url: initialData?.avatar_url || '',
    location: initialData?.location || '',
    website_url: initialData?.website_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof PromoterProfileFormData, value: string) => {
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
      newErrors.name = 'Organization name is required';
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
          <CardTitle>Promoter Profile</CardTitle>
          <CardDescription>
            Set up your promoter profile to start organizing events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Information</h3>

            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your organization or venue name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Optional Information</h3>

            <div>
              <Label htmlFor="bio">Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell comedians about your venue, the types of shows you run, and what makes your events special..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.bio?.length || 0} characters
              </p>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Sydney, NSW"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.yourwebsite.com"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
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
