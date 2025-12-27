import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface ManagerProfileFormData {
  agency_name: string;
  bio?: string;
  commission_rate?: number;
  phone?: string;
  linkedin_url?: string;
}

interface ManagerProfileFormProps {
  initialData?: Partial<ManagerProfileFormData>;
  onSubmit: (data: ManagerProfileFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Manager Profile Form Component
 *
 * Form for creating or editing manager profiles.
 * Required fields: agency_name
 * Optional fields: bio, commission_rate, phone, linkedin_url
 */
export function ManagerProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Profile'
}: ManagerProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+61'); // Default to Australia
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState<ManagerProfileFormData>({
    agency_name: initialData?.agency_name || '',
    bio: initialData?.bio || '',
    commission_rate: initialData?.commission_rate,
    phone: initialData?.phone || '',
    linkedin_url: initialData?.linkedin_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse existing phone number to extract country code
  useEffect(() => {
    if (initialData?.phone) {
      const phone = initialData.phone;
      // Try to extract country code (format: +XX or +XXX)
      const match = phone.match(/^(\+\d{1,3})(.*)$/);
      if (match) {
        setCountryCode(match[1]);
        setPhoneNumber(match[2].trim());
      } else {
        setPhoneNumber(phone);
      }
    }
  }, [initialData?.phone]);

  const handleInputChange = (field: keyof ManagerProfileFormData, value: string | number) => {
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

    if (!formData.agency_name.trim()) {
      newErrors.agency_name = 'Agency name is required';
    }

    if (formData.commission_rate !== undefined && formData.commission_rate !== null) {
      if (formData.commission_rate < 0 || formData.commission_rate > 100) {
        newErrors.commission_rate = 'Commission rate must be between 0 and 100';
      }
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
      // Combine country code with phone number
      const combinedPhone = phoneNumber.trim()
        ? `${countryCode}${phoneNumber.trim().replace(/^0+/, '')}`
        : '';
      await onSubmit({
        ...formData,
        phone: combinedPhone || undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Manager Profile</CardTitle>
          <CardDescription>
            Set up your manager profile to start representing comedians
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Information</h3>

            <div>
              <Label htmlFor="agency_name">Agency Name *</Label>
              <Input
                id="agency_name"
                value={formData.agency_name}
                onChange={(e) => handleInputChange('agency_name', e.target.value)}
                placeholder="Your agency or management company name"
                className={errors.agency_name ? 'border-red-500' : ''}
              />
              {errors.agency_name && (
                <p className="text-sm text-red-500 mt-1">{errors.agency_name}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Optional Information</h3>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell comedians about your agency, experience, and the services you provide..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.bio?.length || 0} characters
              </p>
            </div>

            <div>
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commission_rate || ''}
                onChange={(e) => handleInputChange('commission_rate', e.target.value ? parseFloat(e.target.value) : undefined as any)}
                placeholder="e.g., 15"
                className={errors.commission_rate ? 'border-red-500' : ''}
              />
              {errors.commission_rate && (
                <p className="text-sm text-red-500 mt-1">{errors.commission_rate}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Standard commission percentage for talent management
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+61">🇦🇺 +61</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+44">🇬🇧 +44</SelectItem>
                    <SelectItem value="+64">🇳🇿 +64</SelectItem>
                    <SelectItem value="+33">🇫🇷 +33</SelectItem>
                    <SelectItem value="+49">🇩🇪 +49</SelectItem>
                    <SelectItem value="+81">🇯🇵 +81</SelectItem>
                    <SelectItem value="+86">🇨🇳 +86</SelectItem>
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+65">🇸🇬 +65</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="4XX XXX XXX"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="https://www.linkedin.com/in/your-profile"
              />
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
