import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface OrganizationProfileFormData {
  organization_name: string;
  display_name: string;
  legal_name: string;
  display_name_preference: 'display' | 'legal';
  organization_type: string;
  custom_organization_type?: string;
  abn?: string;
  bio?: string;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
}

interface OrganizationProfileFormProps {
  initialData?: Partial<OrganizationProfileFormData>;
  onSubmit: (data: OrganizationProfileFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function OrganizationProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Organization'
}: OrganizationProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OrganizationProfileFormData>({
    organization_name: initialData?.organization_name || '',
    display_name: initialData?.display_name || '',
    legal_name: initialData?.legal_name || '',
    display_name_preference: initialData?.display_name_preference || 'display',
    organization_type: initialData?.organization_type || '',
    custom_organization_type: initialData?.custom_organization_type || '',
    abn: initialData?.abn || '',
    bio: initialData?.bio || '',
    contact_email: initialData?.contact_email || '',
    contact_phone: initialData?.contact_phone || '',
    website_url: initialData?.website_url || '',
    instagram_url: initialData?.instagram_url || '',
    facebook_url: initialData?.facebook_url || '',
    twitter_url: initialData?.twitter_url || '',
    tiktok_url: initialData?.tiktok_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof OrganizationProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (!formData.legal_name.trim()) {
      newErrors.legal_name = 'Legal name is required';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    if (formData.abn && !/^\d{11}$/.test(formData.abn.replace(/\s/g, ''))) {
      newErrors.abn = 'ABN must be 11 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      // Remove spaces from ABN
      const cleanedData = {
        ...formData,
        abn: formData.abn?.replace(/\s/g, '') || undefined
      };
      await onSubmit(cleanedData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>
            Create an organization profile for your venue, production company, or comedy agency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Information</h3>

            <div>
              <Label htmlFor="organization_name">Organization Name *</Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => handleInputChange('organization_name', e.target.value)}
                placeholder="e.g., The Comedy Store"
                className={errors.organization_name ? 'border-red-500' : ''}
              />
              {errors.organization_name && (
                <p className="text-sm text-red-500 mt-1">{errors.organization_name}</p>
              )}
            </div>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-muted-foreground text-sm">
                  <p className="font-semibold mb-1">Display Names</p>
                  <p>
                    Set both a casual display name (e.g., "iD Comedy") and legal name (e.g., "iD Comedy Pty Ltd").
                    Choose which one appears publicly - legal name always shows on invoices.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="e.g., iD Comedy"
                  className={errors.display_name ? 'border-red-500' : ''}
                />
                {errors.display_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.display_name}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">Public-facing name shown in listings</p>
              </div>

              <div>
                <Label htmlFor="legal_name">Legal Name *</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => handleInputChange('legal_name', e.target.value)}
                  placeholder="e.g., iD Comedy Pty Ltd"
                  className={errors.legal_name ? 'border-red-500' : ''}
                />
                {errors.legal_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.legal_name}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">Legal business name for invoices and contracts</p>
              </div>

              <div>
                <Label htmlFor="display_name_preference">Display Preference</Label>
                <Select
                  value={formData.display_name_preference}
                  onValueChange={(value: 'display' | 'legal') => handleInputChange('display_name_preference', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="display">Show Display Name ({formData.display_name || 'casual name'})</SelectItem>
                    <SelectItem value="legal">Show Legal Name ({formData.legal_name || 'formal name'})</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Which name appears publicly (invoices always show legal name)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="organization_type">Organization Type</Label>
              <Select
                value={formData.organization_type}
                onValueChange={(value) => handleInputChange('organization_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="production_company">Production Company</SelectItem>
                  <SelectItem value="comedy_agency">Comedy Agency</SelectItem>
                  <SelectItem value="event_management">Event Management</SelectItem>
                  <SelectItem value="media_company">Media Company</SelectItem>
                  <SelectItem value="entertainment_group">Entertainment Group</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.organization_type === 'other' && (
              <div>
                <Label htmlFor="custom_organization_type">Custom Organization Type</Label>
                <Input
                  id="custom_organization_type"
                  value={formData.custom_organization_type}
                  onChange={(e) => handleInputChange('custom_organization_type', e.target.value)}
                  placeholder="Enter your organization type"
                />
              </div>
            )}

            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="info@yourorganization.com"
                className={errors.contact_email ? 'border-red-500' : ''}
              />
              {errors.contact_email && (
                <p className="text-sm text-red-500 mt-1">{errors.contact_email}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Optional Information</h3>

            <div>
              <Label htmlFor="abn">ABN (Australian Business Number)</Label>
              <Input
                id="abn"
                value={formData.abn}
                onChange={(e) => handleInputChange('abn', e.target.value)}
                placeholder="12 345 678 901"
                maxLength={14}
                className={errors.abn ? 'border-red-500' : ''}
              />
              {errors.abn && (
                <p className="text-sm text-red-500 mt-1">{errors.abn}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">11 digits</p>
            </div>

            <div>
              <Label htmlFor="bio">About Organization</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about your organization..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+61 2 1234 5678"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.yourorganization.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="@yourorganization"
                />
              </div>

              <div>
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  placeholder="facebook.com/yourorganization"
                />
              </div>

              <div>
                <Label htmlFor="twitter_url">Twitter/X</Label>
                <Input
                  id="twitter_url"
                  value={formData.twitter_url}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  placeholder="@yourorganization"
                />
              </div>

              <div>
                <Label htmlFor="tiktok_url">TikTok</Label>
                <Input
                  id="tiktok_url"
                  value={formData.tiktok_url}
                  onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                  placeholder="@yourorganization"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Note: Bank details can be added later in profile settings for secure payment processing.
            </p>
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
