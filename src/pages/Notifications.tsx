
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, X, Calendar, Star, Users, MessageCircle, DollarSign, Award, Trash2, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  // Use real notifications from database with real-time updates
  const {
    notifications: allNotifications,
    unreadCount,
    isLoading,
    isError,
    error,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    refetch
  } = useNotifications({
    enableRealtime: true,
    limit: 100
  });

  // Check if user is comedian_lite to grey out payment tab
  const isComedianLite = hasRole('comedian_lite');

  const getNotificationIcon = (type: string) => {
    // Map database notification types to icons
    if (type.includes('application')) return Users;
    if (type.includes('spot') || type.includes('event') || type.includes('booking')) return Calendar;
    if (type.includes('payment')) return DollarSign;
    if (type.includes('review')) return Star;
    if (type.includes('message')) return MessageCircle;
    if (type.includes('achievement')) return Award;
    if (type.includes('tour') || type.includes('collaboration') || type.includes('task')) return Calendar;
    return Bell; // Default for system notifications
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('application')) return 'text-blue-400';
    if (type.includes('spot') || type.includes('event') || type.includes('booking')) return 'text-green-400';
    if (type.includes('payment')) return 'text-yellow-400';
    if (type.includes('review')) return 'text-secondary';
    if (type.includes('message')) return 'text-primary';
    if (type.includes('achievement')) return 'text-orange-400';
    return 'text-gray-400';
  };

  const getNotificationBgColor = (type: string) => {
    if (type.includes('application')) return 'bg-blue-500/20';
    if (type.includes('spot') || type.includes('event') || type.includes('booking')) return 'bg-green-500/20';
    if (type.includes('payment')) return 'bg-yellow-500/20';
    if (type.includes('review')) return 'bg-secondary/20';
    if (type.includes('message')) return 'bg-primary/20';
    if (type.includes('achievement')) return 'bg-orange-500/20';
    return 'bg-gray-500/20';
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // Filter notifications by active tab
  const filteredNotifications = allNotifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;

    // Map tab types to notification types
    if (activeTab === 'applications') {
      return notification.type.includes('application');
    }
    if (activeTab === 'bookings') {
      return notification.type.includes('spot') || notification.type.includes('event') || notification.type.includes('booking');
    }
    if (activeTab === 'payments') {
      return notification.type.includes('payment');
    }
    if (activeTab === 'messages') {
      return notification.type.includes('message');
    }
    if (activeTab === 'system') {
      return notification.type.includes('system') || notification.type === 'general';
    }

    return false;
  });

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = getNotificationIcon(notification.type);
    const timeAgo = notification.created_at
      ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
      : 'recently';

    return (
      <Card
        className={`bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer ${
          !notification.read ? 'border-primary/50' : ''
        }`}
        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type)}`}>
              <Icon className={`w-5 h-5 ${getNotificationColor(notification.type)}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{notification.title}</h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{notification.message}</p>

                  {/* Action button if action_url is provided */}
                  {notification.action_url && notification.action_label && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = notification.action_url!;
                      }}
                    >
                      {notification.action_label}
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">{timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view notifications</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg">Loading notifications...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Notifications</h2>
            <p className="text-slate-300 mb-4">
              {error?.message || 'Failed to load notifications'}
            </p>
            <Button onClick={() => refetch()} className="professional-button">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-3 bg-red-500">
                    {unreadCount} new
                  </Badge>
                )}
              </h1>
              <p className="text-slate-300">Stay updated with your comedy career</p>
            </div>

            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="secondary"
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/profile?tab=settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className={`grid ${isComedianLite ? 'grid-cols-4' : 'grid-cols-7'} bg-white/10 backdrop-blur-sm`}>
            <TabsTrigger value="all" className="data-[state=active]:bg-primary">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-primary">
              Unread
            </TabsTrigger>
            {!isComedianLite && (
              <TabsTrigger value="applications" className="data-[state=active]:bg-primary">
                Applications
              </TabsTrigger>
            )}
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary">
              Bookings
            </TabsTrigger>
            {!isComedianLite && (
              <TabsTrigger value="payments" className="data-[state=active]:bg-primary">
                Payments
              </TabsTrigger>
            )}
            {!isComedianLite && (
              <TabsTrigger value="messages" className="data-[state=active]:bg-primary">
                Messages
              </TabsTrigger>
            )}
            <TabsTrigger value="system" className="data-[state=active]:bg-primary">
              System
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-slate-300">
                  {activeTab === 'unread' 
                    ? "You're all caught up! No unread notifications." 
                    : "You don't have any notifications in this category."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
