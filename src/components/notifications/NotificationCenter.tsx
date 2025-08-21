import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, BellRing, Mail, MessageSquare, Calendar, Users, 
  Settings, Send, Eye, Trash2, Check, Clock, AlertCircle,
  Megaphone, Zap, Filter, Search, MoreHorizontal, Star,
  Volume2, VolumeX, Smartphone, Monitor, Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'event' | 'booking' | 'payment' | 'system' | 'reminder' | 'promotion';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  fromUser?: string;
  metadata?: any;
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    eventUpdates: boolean;
    bookingNotifications: boolean;
    paymentAlerts: boolean;
    systemMessages: boolean;
    promotions: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    eventUpdates: boolean;
    bookingNotifications: boolean;
    paymentAlerts: boolean;
    systemMessages: boolean;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    priority: 'all' | 'high' | 'urgent';
  };
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedTab, setSelectedTab] = useState('notifications');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, []);

  const loadNotifications = async () => {
    try {
      // Mock data - in real implementation, fetch from your backend
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'booking',
          title: 'New Event Application',
          message: 'Sarah Mitchell has applied to perform at "Comedy Night" on Jan 15th',
          timestamp: '2025-01-02T14:30:00Z',
          is_read: false,
          priority: 'high',
          actionUrl: '/admin/events/123/applications',
          actionText: 'Review Application',
          fromUser: 'Sarah Mitchell'
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Received',
          message: 'Invoice INV-2025-001 has been paid by The Comedy Store ($2,500.00)',
          timestamp: '2025-01-02T12:15:00Z',
          is_read: false,
          priority: 'medium',
          actionUrl: '/admin/invoices/inv-001',
          actionText: 'View Invoice'
        },
        {
          id: '3',
          type: 'event',
          title: 'Event Published',
          message: 'Your event "New Year Comedy Gala" is now live and accepting bookings',
          timestamp: '2025-01-02T10:00:00Z',
          is_read: true,
          priority: 'low',
          actionUrl: '/events/nye-gala',
          actionText: 'View Event'
        },
        {
          id: '4',
          type: 'system',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2-4 AM AEDT',
          timestamp: '2025-01-01T18:00:00Z',
          is_read: true,
          priority: 'urgent',
          actionUrl: '/admin/system',
          actionText: 'Learn More'
        },
        {
          id: '5',
          type: 'reminder',
          title: 'Event Reminder',
          message: 'Comedy Night at The Basement starts in 2 hours',
          timestamp: '2025-01-01T16:00:00Z',
          is_read: false,
          priority: 'medium',
          actionUrl: '/events/comedy-basement',
          actionText: 'View Event'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      // Mock preferences
      const mockPreferences: NotificationPreferences = {
        email: {
          enabled: true,
          eventUpdates: true,
          bookingNotifications: true,
          paymentAlerts: true,
          systemMessages: true,
          promotions: false,
          frequency: 'immediate'
        },
        push: {
          enabled: true,
          eventUpdates: true,
          bookingNotifications: true,
          paymentAlerts: true,
          systemMessages: false
        },
        inApp: {
          enabled: true,
          sound: true,
          desktop: true,
          priority: 'high'
        }
      };

      setPreferences(mockPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    );
    
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
    
    toast({
      title: "Notification Deleted",
      description: "Notification has been removed",
    });
  };

  const sendTestNotification = async () => {
    const testNotification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings are working correctly.',
      timestamp: new Date().toISOString(),
      is_read: false,
      priority: 'medium'
    };

    setNotifications(prev => [testNotification, ...prev]);
    
    toast({
      title: "Test Notification Sent",
      description: "Check your notification preferences",
    });
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    
    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved",
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesRead = !showUnreadOnly || !notification.is_read;
    
    return matchesSearch && matchesType && matchesPriority && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <Star className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'booking': return <Users className="w-4 h-4 text-purple-500" />;
      case 'payment': return <Zap className="w-4 h-4 text-green-500" />;
      case 'system': return <Settings className="w-4 h-4 text-gray-500" />;
      case 'reminder': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'promotion': return <Megaphone className="w-4 h-4 text-pink-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const NotificationsTab = () => (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`text-white border-white/20 ${showUnreadOnly ? 'bg-purple-600' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Unread
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">
          {filteredNotifications.length} notifications
          {unreadCount > 0 && ` (${unreadCount} unread)`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-white border-white/20"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="text-white border-white/20"
          >
            <Send className="w-4 h-4 mr-2" />
            Test
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`bg-white/10 backdrop-blur-sm border-white/20 transition-colors hover:bg-white/15 ${
              !notification.is_read ? 'border-purple-500/50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(notification.type)}
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatTimestamp(notification.timestamp)}</span>
                      {notification.fromUser && (
                        <span>from {notification.fromUser}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {notification.actionUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-purple-400 border-purple-400/50 hover:bg-purple-400/10"
                      onClick={() => window.open(notification.actionUrl, '_blank')}
                    >
                      {notification.actionText || 'View'}
                    </Button>
                  )}
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                      className="text-green-400 border-green-400/50 hover:bg-green-400/10"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredNotifications.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-white font-medium mb-2">No notifications found</h3>
              <p className="text-gray-400">
                {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || showUnreadOnly
                  ? 'Try adjusting your filters'
                  : 'You\'re all caught up!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const PreferencesTab = () => {
    if (!preferences) return null;

    return (
      <div className="space-y-6">
        {/* Email Preferences */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Enable email notifications</Label>
                <p className="text-gray-400 text-sm">Receive notifications via email</p>
              </div>
              <Switch
                checked={preferences.email.enabled}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    ...preferences,
                    email: { ...preferences.email, enabled: checked }
                  })
                }
              />
            </div>
            
            {preferences.email.enabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Event updates</Label>
                    <Switch
                      checked={preferences.email.eventUpdates}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          ...preferences,
                          email: { ...preferences.email, eventUpdates: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Booking notifications</Label>
                    <Switch
                      checked={preferences.email.bookingNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          ...preferences,
                          email: { ...preferences.email, bookingNotifications: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Payment alerts</Label>
                    <Switch
                      checked={preferences.email.paymentAlerts}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          ...preferences,
                          email: { ...preferences.email, paymentAlerts: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">System messages</Label>
                    <Switch
                      checked={preferences.email.systemMessages}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          ...preferences,
                          email: { ...preferences.email, systemMessages: checked }
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Email frequency</Label>
                  <Select
                    value={preferences.email.frequency}
                    onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                      updatePreferences({
                        ...preferences,
                        email: { ...preferences.email, frequency: value }
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Enable push notifications</Label>
                <p className="text-gray-400 text-sm">Receive browser and mobile push notifications</p>
              </div>
              <Switch
                checked={preferences.push.enabled}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    ...preferences,
                    push: { ...preferences.push, enabled: checked }
                  })
                }
              />
            </div>
            
            {preferences.push.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Event updates</Label>
                  <Switch
                    checked={preferences.push.eventUpdates}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        ...preferences,
                        push: { ...preferences.push, eventUpdates: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Booking notifications</Label>
                  <Switch
                    checked={preferences.push.bookingNotifications}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        ...preferences,
                        push: { ...preferences.push, bookingNotifications: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Payment alerts</Label>
                  <Switch
                    checked={preferences.push.paymentAlerts}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        ...preferences,
                        push: { ...preferences.push, paymentAlerts: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">System messages</Label>
                  <Switch
                    checked={preferences.push.systemMessages}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        ...preferences,
                        push: { ...preferences.push, systemMessages: checked }
                      })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* In-App Preferences */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              In-App Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Enable in-app notifications</Label>
                <p className="text-gray-400 text-sm">Show notifications within the application</p>
              </div>
              <Switch
                checked={preferences.inApp.enabled}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    ...preferences,
                    inApp: { ...preferences.inApp, enabled: checked }
                  })
                }
              />
            </div>
            
            {preferences.inApp.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Sound notifications</Label>
                    <p className="text-gray-500 text-xs">Play sound for new notifications</p>
                  </div>
                  <Switch
                    checked={preferences.inApp.sound}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        ...preferences,
                        inApp: { ...preferences.inApp, sound: checked }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Desktop notifications</Label>
                    <p className="text-gray-500 text-xs">Show notifications even when tab is not active</p>
                  </div>
                  <Switch
                    checked={preferences.inApp.desktop}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        ...preferences,
                        inApp: { ...preferences.inApp, desktop: checked }
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Minimum priority level</Label>
                  <Select
                    value={preferences.inApp.priority}
                    onValueChange={(value: 'all' | 'high' | 'urgent') =>
                      updatePreferences({
                        ...preferences,
                        inApp: { ...preferences.inApp, priority: value }
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All notifications</SelectItem>
                      <SelectItem value="high">High priority and above</SelectItem>
                      <SelectItem value="urgent">Urgent only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            Notification Center
            {unreadCount > 0 && (
              <Badge className="bg-red-500 ml-2">{unreadCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-purple-600">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-purple-600">
                Preferences
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="mt-6">
              <NotificationsTab />
            </TabsContent>
            
            <TabsContent value="preferences" className="mt-6">
              <PreferencesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;