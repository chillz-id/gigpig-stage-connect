import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { SidebarCustomization } from '@/components/settings/SidebarCustomization';
import {
  User,
  Bell,
  Shield,
  Palette,
  Smartphone,
  ExternalLink,
  Plug,
} from 'lucide-react';
import { XeroSettingsSection } from '@/components/settings/XeroSettingsSection';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Settings Page
 * Central hub for all user settings and preferences
 *
 * Tabs:
 * - Account: Profile settings, email, password
 * - Notifications: Email and push notification preferences
 * - Privacy: Data sharing and privacy settings
 * - Sidebar: Customize sidebar menu items
 * - PWA: Progressive Web App settings (link)
 *
 * Note: Custom Links and Social Media are managed in the Profile page accordion
 */
export default function Settings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  // Account settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const handleSaveAccountSettings = () => {
    // TODO: Implement account settings save
    toast.success('Account settings saved');
  };

  const handleSaveNotificationSettings = () => {
    // TODO: Implement notification settings save
    toast.success('Notification preferences updated');
  };

  const handleSavePrivacySettings = () => {
    // TODO: Implement privacy settings save
    toast.success('Privacy settings updated');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Sidebar</span>
          </TabsTrigger>
          <TabsTrigger value="pwa" className="gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">PWA</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Your email address is managed through your authentication provider
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  defaultValue={profile?.name || ''}
                  placeholder="Your display name"
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-4">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAccountSettings}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on this device
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and updates
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotificationSettings}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <select
                  id="profile-visibility"
                  className="w-full px-3 py-2 border rounded-md"
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                >
                  <option value="public">Public - Anyone can see your profile</option>
                  <option value="members">Members Only - Only registered users</option>
                  <option value="private">Private - Only you can see your profile</option>
                </select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Data & Privacy</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    We take your privacy seriously. Your data is encrypted and stored securely.
                  </p>
                  <p>
                    You can request a copy of your data or delete your account at any time.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="professional-button" size="sm">
                    Download My Data
                  </Button>
                  <Button className="professional-button" size="sm">
                    View Privacy Policy
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePrivacySettings}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <XeroSettingsSection />
        </TabsContent>

        {/* Sidebar Customization Tab */}
        <TabsContent value="sidebar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Customization</CardTitle>
              <CardDescription>
                Customize which menu items appear in your sidebar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SidebarCustomization />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PWA Settings Tab (Link to dedicated page) */}
        <TabsContent value="pwa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progressive Web App Settings</CardTitle>
              <CardDescription>
                Manage app installation and offline capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                PWA settings have been moved to a dedicated page for better organization and functionality.
              </p>

              <Link to="/settings/pwa">
                <Button className="gap-2">
                  Open PWA Settings
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
