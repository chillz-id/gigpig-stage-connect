
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileAwareProps } from '@/types/universalProfile';

interface ContactInformationProps extends ProfileAwareProps {
  user?: any; // Profile data being edited
  organizationId?: string; // If editing an organization profile
  onSave?: (data: any) => Promise<void>;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  profileType,
  config,
  user,
  organizationId,
  onSave,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Determine the profile ID and table based on whether this is an org or user
  const profileId = organizationId || user?.id;
  const tableName = organizationId ? 'organization_profiles' : 'profiles';

  // Contact settings state
  const [contactSettings, setContactSettings] = useState({
    email: '',
    phone: '',
    showEmailPublic: true,
    showPhonePublic: false,
    showContactInEpk: true,
  });

  // Load contact data from user prop or fetch if needed
  useEffect(() => {
    if (user) {
      setContactSettings({
        email: organizationId
          ? (user.contact_email || '')
          : (user.email || ''),
        phone: organizationId
          ? (user.contact_phone || '')
          : (user.phone || ''),
        showEmailPublic: user.show_email_public ?? true,
        showPhonePublic: user.show_phone_public ?? false,
        showContactInEpk: user.show_contact_in_epk ?? true,
      });
    }
  }, [user, organizationId]);

  const handleInputChange = (field: keyof typeof contactSettings, value: string | boolean) => {
    setContactSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveContactSettings = async () => {
    if (!profileId) {
      toast({
        title: 'Error',
        description: 'Unable to save - no profile ID available.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Build update object based on profile type
      const updateData: Record<string, any> = organizationId
        ? {
            contact_email: contactSettings.email,
            contact_phone: contactSettings.phone,
            show_contact_in_epk: contactSettings.showContactInEpk,
          }
        : {
            phone: contactSettings.phone,
            show_email_public: contactSettings.showEmailPublic,
            show_phone_public: contactSettings.showPhonePublic,
          };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Contact Settings Saved',
        description: 'Your contact information has been updated.',
      });
    } catch (error) {
      console.error('Error saving contact settings:', error);
      toast({
        title: 'Error saving contact settings',
        description: 'Could not save your contact details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Get visibility label based on profile type
  const getVisibilityLabel = (isVisible: boolean) => {
    return isVisible ? 'Public' : 'Platform Only';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info note */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Visibility Controls:</strong> Toggle whether your contact information is visible
          to everyone (Public) or only to registered platform users (Platform Only).
        </p>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <Label htmlFor="contact-email" className="text-sm font-medium">
              {organizationId ? 'Contact Email' : 'Email'}
            </Label>
            {!organizationId && (
              <Badge variant="secondary" className="text-xs">
                {getVisibilityLabel(contactSettings.showEmailPublic)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="contact-email"
              type="email"
              value={contactSettings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@example.com"
              className="flex-1"
              disabled={!organizationId} // Users can't change their auth email here
            />
            {!organizationId && (
              <Switch
                checked={contactSettings.showEmailPublic}
                onCheckedChange={(checked) => handleInputChange('showEmailPublic', checked)}
              />
            )}
          </div>
          {!organizationId && (
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <Label htmlFor="contact-phone" className="text-sm font-medium">
              {organizationId ? 'Contact Phone' : 'Phone'}
            </Label>
            {!organizationId && (
              <Badge variant="secondary" className="text-xs">
                {getVisibilityLabel(contactSettings.showPhonePublic)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PhoneInput
              value={contactSettings.phone}
              onChange={(value) => handleInputChange('phone', value)}
              className="flex-1"
            />
            {!organizationId && (
              <Switch
                checked={contactSettings.showPhonePublic}
                onCheckedChange={(checked) => handleInputChange('showPhonePublic', checked)}
              />
            )}
          </div>
        </div>
      </div>

      {/* EPK visibility toggle for organizations */}
      {organizationId && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label className="text-sm font-medium">Show Contact in Public Profile</Label>
            <p className="text-xs text-muted-foreground mt-1">
              When enabled, your contact information will be visible on your public organization page
            </p>
          </div>
          <Switch
            checked={contactSettings.showContactInEpk}
            onCheckedChange={(checked) => handleInputChange('showContactInEpk', checked)}
          />
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSaveContactSettings}
          className="professional-button"
          disabled={saving}
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? 'Saving...' : 'Save Contact Settings'}
        </Button>
      </div>
    </div>
  );
};
