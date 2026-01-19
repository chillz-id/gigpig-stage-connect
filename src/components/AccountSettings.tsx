import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Bell, Shield, Phone, Palette, User, AlertTriangle, Download, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarCustomization } from '@/components/settings/SidebarCustomization';
import { privacyService } from '@/services/privacyService';
import ComedianCalendarSync from '@/components/comedian-profile/ComedianCalendarSync';

export const AccountSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    newGigs: {
      enabled: true,
      frequency: 'instant' as 'instant' | 'daily' | 'weekly' | 'custom',
      customDays: 1,
    },
    gigReminders: {
      enabled: true,
      frequency: 'instant' as 'instant' | 'daily' | 'weekly' | 'custom',
      customDays: 1,
    },
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
  });

  // Load current privacy settings on mount
  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (user?.id) {
        try {
          const visible = await privacyService.getProfileVisibility(user.id);
          setPrivacySettings({ profileVisibility: visible });
        } catch (error) {
          console.error('Failed to load privacy settings:', error);
        }
      }
    };
    loadPrivacySettings();
  }, [user?.id]);

  const handleSaveNotifications = () => {
    toast({
      title: 'Notifications Updated',
      description: 'Your notification preferences have been saved.',
    });
  };

  const handleSavePrivacy = async () => {
    if (!user?.id) return;

    try {
      await privacyService.updateProfileVisibility(user.id, privacySettings.profileVisibility);
      toast({
        title: 'Privacy Settings Updated',
        description: 'Your profile visibility has been saved.',
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save privacy settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadData = () => {
    toast({
      title: 'Download Started',
      description: 'Your data export will be ready shortly.',
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: 'Account Deletion',
      description: 'Please contact support to delete your account.',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardContent className="p-6">
          <Accordion type="multiple" defaultValue={['notifications']} className="w-full">

            {/* Notifications Section */}
            <AccordionItem value="notifications">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <span>Notifications</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {/* New Gig Alerts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-gigs">New Gig Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          In-platform notifications when new gigs are posted
                        </p>
                      </div>
                      <Switch
                        id="new-gigs"
                        checked={notificationSettings.newGigs.enabled}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            newGigs: { ...notificationSettings.newGigs, enabled: checked }
                          })
                        }
                      />
                    </div>
                    {notificationSettings.newGigs.enabled && (
                      <div className="pl-4 space-y-2">
                        <Label htmlFor="new-gigs-frequency" className="text-sm">Frequency</Label>
                        <Select
                          value={notificationSettings.newGigs.frequency}
                          onValueChange={(value: 'instant' | 'daily' | 'weekly' | 'custom') =>
                            setNotificationSettings({
                              ...notificationSettings,
                              newGigs: { ...notificationSettings.newGigs, frequency: value }
                            })
                          }
                        >
                          <SelectTrigger id="new-gigs-frequency" className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Instant</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        {notificationSettings.newGigs.frequency === 'custom' && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={notificationSettings.newGigs.customDays}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  newGigs: { ...notificationSettings.newGigs, customDays: parseInt(e.target.value) || 1 }
                                })
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Gig Reminders */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="gig-reminders">Gig Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          In-platform reminders about upcoming gigs you're confirmed for
                        </p>
                      </div>
                      <Switch
                        id="gig-reminders"
                        checked={notificationSettings.gigReminders.enabled}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            gigReminders: { ...notificationSettings.gigReminders, enabled: checked }
                          })
                        }
                      />
                    </div>
                    {notificationSettings.gigReminders.enabled && (
                      <div className="pl-4 space-y-2">
                        <Label htmlFor="gig-reminders-frequency" className="text-sm">Frequency</Label>
                        <Select
                          value={notificationSettings.gigReminders.frequency}
                          onValueChange={(value: 'instant' | 'daily' | 'weekly' | 'custom') =>
                            setNotificationSettings({
                              ...notificationSettings,
                              gigReminders: { ...notificationSettings.gigReminders, frequency: value }
                            })
                          }
                        >
                          <SelectTrigger id="gig-reminders-frequency" className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Instant</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        {notificationSettings.gigReminders.frequency === 'custom' && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={notificationSettings.gigReminders.customDays}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  gigReminders: { ...notificationSettings.gigReminders, customDays: parseInt(e.target.value) || 1 }
                                })
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notif">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive these notifications via email also
                      </p>
                    </div>
                    <Switch
                      id="email-notif"
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, email: checked })
                      }
                    />
                  </div>

                  <Separator />
                  <Button onClick={handleSaveNotifications} className="professional-button">
                    Save Notification Settings
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Privacy & Visibility Section */}
            <AccordionItem value="privacy">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Privacy & Visibility</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visibility">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your profile discoverable to promoters in browse/search
                      </p>
                    </div>
                    <Switch
                      id="profile-visibility"
                      checked={privacySettings.profileVisibility}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ profileVisibility: checked })
                      }
                    />
                  </div>

                  <Separator />
                  <Button onClick={handleSavePrivacy} className="professional-button">
                    Save Privacy Settings
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Display Preferences Section */}
            <AccordionItem value="display">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <span>Display Preferences</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {/* Sidebar Customization */}
                  <SidebarCustomization />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Calendar Sync Section */}
            <AccordionItem value="calendar">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>Calendar Sync</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <ComedianCalendarSync comedianId={user?.id || ''} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Account Management Section */}
            <AccordionItem value="account">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Account Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="mb-2 block">Email Address</Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email is managed by your authentication provider
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="mb-2 block">Display Name</Label>
                    <Input
                      id="display-name"
                      defaultValue={profile?.name || ''}
                      placeholder="Your name"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={handleDownloadData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download My Data
                    </Button>

                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={handleDownloadData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Event History
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  {/* Danger Zone */}
                  <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">Danger Zone</h4>
                        <p className="text-sm text-red-700">
                          Irreversible actions that will permanently affect your account
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};
