import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Database, Mail, Shield, Globe, Bell, Palette, Facebook, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { facebookAdsService } from '@/services/facebookAdsService';

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

  const [facebookAdsStatus, setFacebookAdsStatus] = useState({
    connected: false,
    lastSync: null,
    syncInProgress: false,
    campaignCount: 0,
    adAccountId: null
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

  const handleFacebookAdsSync = async () => {
    setFacebookAdsStatus(prev => ({ ...prev, syncInProgress: true }));
    
    try {
      // Initialize service with mock config (in production, this would come from environment)
      facebookAdsService.initialize({
        accessToken: 'mock_token',
        appId: 'mock_app_id',
        appSecret: 'mock_app_secret',
        adAccountId: 'act_123456789'
      });

      // Sync all Facebook Ads data
      const syncResult = await facebookAdsService.syncAllData();
      
      // Update status with real data from service
      setFacebookAdsStatus(prev => ({
        ...prev,
        connected: true,
        lastSync: syncResult.lastSyncTime,
        syncInProgress: false,
        campaignCount: syncResult.campaigns.length,
        adAccountId: 'act_123456789'
      }));

      toast({
        title: "Facebook Ads Sync Complete",
        description: `Successfully synced ${syncResult.campaigns.length} campaigns. Total spend: $${syncResult.totalSpend.toFixed(2)}`,
      });
    } catch (error) {
      setFacebookAdsStatus(prev => ({ ...prev, syncInProgress: false }));
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Facebook Ads. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const handleConnectFacebookAds = () => {
    // In a real implementation, this would redirect to Facebook OAuth
    toast({
      title: "Redirecting to Facebook",
      description: "Opening Facebook authorization page...",
    });
    
    // Simulate connection after OAuth
    setTimeout(() => {
      setFacebookAdsStatus(prev => ({
        ...prev,
        connected: true,
        adAccountId: 'act_123456789'
      }));
      toast({
        title: "Facebook Ads Connected",
        description: "Successfully connected to Facebook Ads Manager.",
      });
    }, 2000);
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
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                <Palette className="w-4 h-4 mr-2" />
                Open Design System
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Ads Integration */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Facebook className="w-5 h-5" />
            Facebook Ads Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Connection Status</Label>
              <p className="text-gray-300 text-sm">
                {facebookAdsStatus.connected 
                  ? `Connected to ad account ${facebookAdsStatus.adAccountId}` 
                  : 'Connect to Facebook Ads Manager to sync campaigns and audience data'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {facebookAdsStatus.connected ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
              )}
              <span className={`text-sm ${facebookAdsStatus.connected ? 'text-green-400' : 'text-gray-400'}`}>
                {facebookAdsStatus.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>

          {facebookAdsStatus.connected && (
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Integration Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Active Campaigns:</span>
                  <span className="text-white ml-2">{facebookAdsStatus.campaignCount}</span>
                </div>
                <div>
                  <span className="text-gray-300">Last Sync:</span>
                  <span className="text-white ml-2">
                    {facebookAdsStatus.lastSync 
                      ? new Date(facebookAdsStatus.lastSync).toLocaleString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!facebookAdsStatus.connected ? (
              <Button 
                onClick={handleConnectFacebookAds}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Connect Facebook Ads
              </Button>
            ) : (
              <Button 
                onClick={handleFacebookAdsSync}
                disabled={facebookAdsStatus.syncInProgress}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                {facebookAdsStatus.syncInProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Campaigns
                  </>
                )}
              </Button>
            )}
            
            {facebookAdsStatus.connected && (
              <Button 
                className="professional-button"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  setFacebookAdsStatus({
                    connected: false,
                    lastSync: null,
                    syncInProgress: false,
                    campaignCount: 0,
                    adAccountId: null
                  });
                  toast({
                    title: "Facebook Ads Disconnected",
                    description: "Successfully disconnected from Facebook Ads Manager.",
                  });
                }}
              >
                Disconnect
              </Button>
            )}
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
              className="professional-button"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Globe className="w-4 h-4 mr-2" />
              Clear Site Cache
            </Button>

            <Button 
              className="professional-button"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Mail className="w-4 h-4 mr-2" />
              Test Email System
            </Button>

            <Button 
              className="professional-button"
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
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
          <Settings className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
