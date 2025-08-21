
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ContactSettings: React.FC = () => {
  const { toast } = useToast();
  const [contactSettings, setContactSettings] = useState({
    email: { show: true, value: 'alex@example.com' },
    phone: { show: false, value: '+1 (555) 123-4567' },
    managerEmail: { show: true, value: 'manager@agency.com' },
    managerPhone: { show: false, value: '+1 (555) 987-6543' },
    agentEmail: { show: false, value: 'agent@talent.com' },
    agentPhone: { show: false, value: '+1 (555) 456-7890' }
  });

  const updateSetting = (key: string, field: 'show' | 'value', value: boolean | string) => {
    setContactSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    toast({
      title: "Contact Settings Saved",
      description: "Your contact visibility preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Contact Information Visibility
          </CardTitle>
          <CardDescription>
            Control what contact information is visible to promoters and other comedians
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4" />
              <h3 className="font-semibold">Personal Contact</h3>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    <Label htmlFor="email">Email Address</Label>
                    {contactSettings.email.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                  </div>
                  <Input
                    id="email"
                    value={contactSettings.email.value}
                    onChange={(e) => updateSetting('email', 'value', e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Switch
                  checked={contactSettings.email.show}
                  onCheckedChange={(checked) => updateSetting('email', 'show', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <Label htmlFor="phone">Phone Number</Label>
                    {contactSettings.phone.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                  </div>
                  <Input
                    id="phone"
                    value={contactSettings.phone.value}
                    onChange={(e) => updateSetting('phone', 'value', e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Switch
                  checked={contactSettings.phone.show}
                  onCheckedChange={(checked) => updateSetting('phone', 'show', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Manager Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" />
              <h3 className="font-semibold">Manager Contact</h3>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    <Label htmlFor="managerEmail">Manager Email</Label>
                    {contactSettings.managerEmail.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                  </div>
                  <Input
                    id="managerEmail"
                    value={contactSettings.managerEmail.value}
                    onChange={(e) => updateSetting('managerEmail', 'value', e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Switch
                  checked={contactSettings.managerEmail.show}
                  onCheckedChange={(checked) => updateSetting('managerEmail', 'show', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <Label htmlFor="managerPhone">Manager Phone</Label>
                    {contactSettings.managerPhone.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                  </div>
                  <Input
                    id="managerPhone"
                    value={contactSettings.managerPhone.value}
                    onChange={(e) => updateSetting('managerPhone', 'value', e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Switch
                  checked={contactSettings.managerPhone.show}
                  onCheckedChange={(checked) => updateSetting('managerPhone', 'show', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Agent Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4" />
              <h3 className="font-semibold">Agent Contact</h3>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    <Label htmlFor="agentEmail">Agent Email</Label>
                    {contactSettings.agentEmail.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                  </div>
                  <Input
                    id="agentEmail"
                    value={contactSettings.agentEmail.value}
                    onChange={(e) => updateSetting('agentEmail', 'value', e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Switch
                  checked={contactSettings.agentEmail.show}
                  onCheckedChange={(checked) => updateSetting('agentEmail', 'show', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <Label htmlFor="agentPhone">Agent Phone</Label>
                    {contactSettings.agentPhone.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                  </div>
                  <Input
                    id="agentPhone"
                    value={contactSettings.agentPhone.value}
                    onChange={(e) => updateSetting('agentPhone', 'value', e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Switch
                  checked={contactSettings.agentPhone.show}
                  onCheckedChange={(checked) => updateSetting('agentPhone', 'show', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="professional-button">
              <Save className="w-4 h-4 mr-2" />
              Save Contact Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
