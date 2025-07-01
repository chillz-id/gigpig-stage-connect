import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Database, Mail, Shield, Globe, Bell, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Stand Up Sydney',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    defaultUserRole: 'member',
    maxEventsPerPromoter: 10,
    eventApprovalRequired: false,
    supportEmail: 'support@standupSydney.com',
    defaultTimezone: 'Australia/Sydney'
  });

  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully.",
    });
  };

  const handleDatabaseBackup = () => {
    toast({
      title: "Backup Started",
      description: "Database backup has been initiated. You'll be notified when complete.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Design System Access */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Design System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Design System Control Panel</Label>
              <p className="text-gray-300 text-sm">Customize the visual appearance and branding</p>
            </div>
            <Link to="/design-system">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Palette className="w-4 h-4 mr-2" />
                Open Design System
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-name" className="text-white">Site Name</Label>
              <Input
                id="site-name"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-email" className="text-white">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-white">Default Timezone</Label>
              <Select value={settings.defaultTimezone} onValueChange={(value) => setSettings({...settings, defaultTimezone: value})}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                  <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                  <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
                  <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-role" className="text-white">Default User Role</Label>
              <Select value={settings.defaultUserRole} onValueChange={(value) => setSettings({...settings, defaultUserRole: value})}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="comedian">Comedian</SelectItem>
                  <SelectItem value="promoter">Promoter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Maintenance Mode</Label>
                <p className="text-gray-300 text-sm">Temporarily disable access to the site</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">User Registration</Label>
                <p className="text-gray-300 text-sm">Allow new users to register</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings({...settings, registrationEnabled: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Event Approval Required</Label>
                <p className="text-gray-300 text-sm">Require admin approval for new events</p>
              </div>
              <Switch
                checked={settings.eventApprovalRequired}
                onCheckedChange={(checked) => setSettings({...settings, eventApprovalRequired: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Email Notifications</Label>
              <p className="text-gray-300 text-sm">Send email notifications to users</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">SMS Notifications</Label>
              <p className="text-gray-300 text-sm">Send SMS notifications for important updates</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Operations */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleDatabaseBackup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Create Database Backup
            </Button>

            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Globe className="w-4 h-4 mr-2" />
              Clear Site Cache
            </Button>

            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Mail className="w-4 h-4 mr-2" />
              Test Email System
            </Button>

            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security Audit
            </Button>
          </div>

          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">System Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Version:</span>
                <span className="text-white ml-2">v2.1.0</span>
              </div>
              <div>
                <span className="text-gray-300">Database:</span>
                <span className="text-white ml-2">PostgreSQL 15</span>
              </div>
              <div>
                <span className="text-gray-300">Last Backup:</span>
                <span className="text-white ml-2">2024-12-26 03:00</span>
              </div>
              <div>
                <span className="text-gray-300">Uptime:</span>
                <span className="text-white ml-2">99.9%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="bg-purple-600 hover:bg-purple-700">
          <Settings className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
