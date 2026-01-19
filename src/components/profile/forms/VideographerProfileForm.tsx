import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';

export interface VideographerProfileFormData {
  specialties: string[];
  experience_years?: number;
  video_reel_url?: string;
  rate_per_hour?: number;
  youtube_channel?: string;
}

interface VideographerProfileFormProps {
  initialData?: Partial<VideographerProfileFormData>;
  onSubmit: (data: VideographerProfileFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Videographer Profile Form Component
 *
 * Form for creating or editing videographer profiles.
 * Required fields: specialties (at least one)
 * Optional fields: experience_years, video_reel_url, rate_per_hour, youtube_channel
 */
export function VideographerProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Profile'
}: VideographerProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VideographerProfileFormData>({
    specialties: initialData?.specialties || [],
    experience_years: initialData?.experience_years,
    video_reel_url: initialData?.video_reel_url || '',
    rate_per_hour: initialData?.rate_per_hour,
    youtube_channel: initialData?.youtube_channel || '',
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof VideographerProfileFormData, value: string | number) => {
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

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
      // Clear error if exists
      if (errors.specialties) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.specialties;
          return newErrors;
        });
      }
    }
  };

  const removeSpecialty = (specialtyToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialtyToRemove)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.specialties.length === 0) {
      newErrors.specialties = 'At least one specialty is required';
    }

    if (formData.experience_years !== undefined && formData.experience_years !== null) {
      if (formData.experience_years < 0) {
        newErrors.experience_years = 'Experience cannot be negative';
      }
    }

    if (formData.rate_per_hour !== undefined && formData.rate_per_hour !== null) {
      if (formData.rate_per_hour < 0) {
        newErrors.rate_per_hour = 'Rate cannot be negative';
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
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggested specialties for videographers
  const suggestedSpecialties = [
    'Comedy Shows',
    'Live Performance',
    'Event Videography',
    'Highlight Reels',
    'Promotional Videos',
    'Social Media Content',
    'Multi-Camera Setup',
    'Live Streaming',
  ];

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Videographer Profile</CardTitle>
          <CardDescription>
            Set up your videographer profile to get hired for comedy events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Information</h3>

            <div>
              <Label>Specialties *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                What types of videography do you specialize in?
              </p>

              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Add a specialty..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  className={errors.specialties ? 'border-red-500' : ''}
                />
                <Button type="button" onClick={addSpecialty} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {errors.specialties && (
                <p className="text-sm text-red-500 mb-2">{errors.specialties}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {formData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="default" className="flex items-center gap-1">
                    {specialty}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeSpecialty(specialty)}
                    />
                  </Badge>
                ))}
              </div>

              {/* Suggested specialties */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSpecialties
                    .filter(s => !formData.specialties.includes(s))
                    .map((specialty) => (
                      <Badge
                        key={specialty}
                        className="professional-button cursor-pointer hover:bg-muted"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            specialties: [...prev.specialties, specialty]
                          }));
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {specialty}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Optional Information</h3>

            <div>
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                value={formData.experience_years || ''}
                onChange={(e) => handleInputChange('experience_years', e.target.value ? parseInt(e.target.value) : undefined as any)}
                placeholder="e.g., 5"
                className={errors.experience_years ? 'border-red-500' : ''}
              />
              {errors.experience_years && (
                <p className="text-sm text-red-500 mt-1">{errors.experience_years}</p>
              )}
            </div>

            <div>
              <Label htmlFor="video_reel_url">Video Reel URL</Label>
              <Input
                id="video_reel_url"
                type="url"
                value={formData.video_reel_url}
                onChange={(e) => handleInputChange('video_reel_url', e.target.value)}
                placeholder="https://vimeo.com/your-reel or YouTube link"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Link to your demo reel or highlight video
              </p>
            </div>

            <div>
              <Label htmlFor="rate_per_hour">Hourly Rate ($)</Label>
              <Input
                id="rate_per_hour"
                type="number"
                min="0"
                step="0.01"
                value={formData.rate_per_hour || ''}
                onChange={(e) => handleInputChange('rate_per_hour', e.target.value ? parseFloat(e.target.value) : undefined as any)}
                placeholder="e.g., 200"
                className={errors.rate_per_hour ? 'border-red-500' : ''}
              />
              {errors.rate_per_hour && (
                <p className="text-sm text-red-500 mt-1">{errors.rate_per_hour}</p>
              )}
            </div>

            <div>
              <Label htmlFor="youtube_channel">YouTube Channel</Label>
              <Input
                id="youtube_channel"
                value={formData.youtube_channel}
                onChange={(e) => handleInputChange('youtube_channel', e.target.value)}
                placeholder="@your_channel or channel URL"
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
