
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { User, Shield, Mail, Phone, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileAwareProps } from '@/types/universalProfile';

interface ContactDetail {
  id: string;
  type: 'email' | 'phone';
  label: string;
  value: string;
  show: boolean;
}

interface ContactInformationProps extends ProfileAwareProps {
  user?: any; // Profile data being edited (may differ from logged-in user)
  organizationId?: string; // If editing an organization profile
  onSave?: (data: any) => Promise<void>;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  profileType,
  config,
  user: _user, // Available for future data loading
  organizationId: _organizationId, // Available for future data loading
  onSave: _onSave, // Available for future save functionality
}) => {
  const { toast } = useToast();
  
  const [contactSettings, setContactSettings] = useState({
    email: { show: true, value: 'alex@example.com' },
    phone: { show: false, value: '' },
    managerEmail: { show: true, value: 'manager@agency.com' },
    managerPhone: { show: false, value: '' },
  });

  const [additionalContacts, setAdditionalContacts] = useState<ContactDetail[]>([]);

  const updateContactSetting = (key: string, field: 'show' | 'value', value: boolean | string) => {
    setContactSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const addContactDetail = () => {
    const newContact: ContactDetail = {
      id: `contact_${Date.now()}`,
      type: 'email',
      label: 'New Contact',
      value: '',
      show: false
    };
    setAdditionalContacts(prev => [...prev, newContact]);
  };

  const updateAdditionalContact = (id: string, field: keyof ContactDetail, value: any) => {
    setAdditionalContacts(prev => 
      prev.map(contact => 
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const removeAdditionalContact = (id: string) => {
    setAdditionalContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleSaveContactSettings = () => {
    toast({
      title: "Contact Settings Saved",
      description: "Your contact visibility preferences have been updated.",
    });
  };

  const getContactIcon = (type: 'email' | 'phone') => {
    return type === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />;
  };

  // Get visibility label based on profile type
  const getVisibilityLabel = (isVisible: boolean) => {
    if (profileType === 'organization') {
      return isVisible ? 'Public' : 'Platform';
    }
    return isVisible ? 'Public' : 'Platform';
  };

  return (
    <div className="space-y-6">
      {/* Public Contact */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4" />
          <h3 className="font-semibold">Public Contact</h3>
          <span className="text-xs text-muted-foreground">(shown on your public profile)</span>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 mr-3">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Badge variant="secondary" className="text-xs">{getVisibilityLabel(contactSettings.email.show)}</Badge>
                </div>
                <Input
                  id="email"
                  value={contactSettings.email.value}
                  onChange={(e) => updateContactSetting('email', 'value', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="pt-10">
                <Switch
                  checked={contactSettings.email.show}
                  onCheckedChange={(checked) => updateContactSetting('email', 'show', checked)}
                />
              </div>
            </div>

            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 mr-3">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  <Label htmlFor="phone" className="text-sm">Phone</Label>
                  <Badge variant="secondary" className="text-xs">{getVisibilityLabel(contactSettings.phone.show)}</Badge>
                </div>
                <PhoneInput
                  value={contactSettings.phone.value}
                  onChange={(value) => updateContactSetting('phone', 'value', value)}
                  className="text-sm"
                />
              </div>
              <div className="pt-10">
                <Switch
                  checked={contactSettings.phone.show}
                  onCheckedChange={(checked) => updateContactSetting('phone', 'show', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Manager Contact - Only show for comedians */}
        {profileType === 'comedian' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" />
              <h3 className="font-semibold">Manager Contact</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    <Label htmlFor="managerEmail" className="text-sm">Manager Email</Label>
                    <Badge variant="secondary" className="text-xs">{getVisibilityLabel(contactSettings.managerEmail.show)}</Badge>
                  </div>
                  <Input
                    id="managerEmail"
                    value={contactSettings.managerEmail.value}
                    onChange={(e) => updateContactSetting('managerEmail', 'value', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="pt-10">
                  <Switch
                    checked={contactSettings.managerEmail.show}
                    onCheckedChange={(checked) => updateContactSetting('managerEmail', 'show', checked)}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <Label htmlFor="managerPhone" className="text-sm">Manager Phone</Label>
                    <Badge variant="secondary" className="text-xs">{getVisibilityLabel(contactSettings.managerPhone.show)}</Badge>
                  </div>
                  <PhoneInput
                    value={contactSettings.managerPhone.value}
                    onChange={(value) => updateContactSetting('managerPhone', 'value', value)}
                    className="text-sm"
                  />
                </div>
                <div className="pt-10">
                  <Switch
                    checked={contactSettings.managerPhone.show}
                    onCheckedChange={(checked) => updateContactSetting('managerPhone', 'show', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Contact Details */}
        {additionalContacts.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4" />
                <h3 className="font-semibold">Additional Contact Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Select
                          value={contact.type}
                          onValueChange={(value) => updateAdditionalContact(contact.id, 'type', value)}
                        >
                          <SelectTrigger className="w-20 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={contact.label}
                          onChange={(e) => updateAdditionalContact(contact.id, 'label', e.target.value)}
                          placeholder="Label"
                          className="text-xs h-6 flex-1"
                        />
                        <Badge variant="secondary" className="text-xs">{getVisibilityLabel(contact.show)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getContactIcon(contact.type)}
                        {contact.type === 'phone' ? (
                          <PhoneInput
                            value={contact.value}
                            onChange={(value) => updateAdditionalContact(contact.id, 'value', value)}
                            className="text-xs flex-1"
                            placeholder="4XX XXX XXX"
                          />
                        ) : (
                          <Input
                            value={contact.value}
                            onChange={(e) => updateAdditionalContact(contact.id, 'value', e.target.value)}
                            placeholder="contact@example.com"
                            className="text-xs flex-1"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Switch
                        checked={contact.show}
                        onCheckedChange={(checked) => updateAdditionalContact(contact.id, 'show', checked)}
                      />
                      <Button
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        size="sm"
                        onClick={() => removeAdditionalContact(contact.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button onClick={addContactDetail} className="professional-button flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add More Contact Details
          </Button>
          <Button onClick={handleSaveContactSettings} className="professional-button">
            Save Contact Settings
          </Button>
        </div>
    </div>
  );
};
