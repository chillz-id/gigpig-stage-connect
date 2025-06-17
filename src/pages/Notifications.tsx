
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, X, Calendar, Star, Users, MessageCircle, DollarSign, Award, Trash2, Settings } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'application' | 'booking' | 'payment' | 'review' | 'message' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    showId?: string;
    showTitle?: string;
    amount?: number;
    rating?: number;
    senderName?: string;
    senderAvatar?: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'application',
    title: 'New Application Received',
    message: 'Sarah Johnson applied for Wednesday Comedy Night',
    timestamp: '2 hours ago',
    isRead: false,
    metadata: {
      showId: '1',
      showTitle: 'Wednesday Comedy Night',
      senderName: 'Sarah Johnson',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '2',
    type: 'booking',
    title: 'Show Confirmation',
    message: 'Your spot for Friday Headliner Showcase has been confirmed',
    timestamp: '1 day ago',
    isRead: false,
    metadata: {
      showId: '2',
      showTitle: 'Friday Headliner Showcase'
    }
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $150 for Friday Night Comedy',
    timestamp: '2 days ago',
    isRead: true,
    metadata: {
      amount: 150,
      showTitle: 'Friday Night Comedy'
    }
  },
  {
    id: '4',
    type: 'review',
    title: 'New Review',
    message: 'Comedy Central Venues left you a 5-star review',
    timestamp: '3 days ago',
    isRead: true,
    metadata: {
      rating: 5,
      senderName: 'Comedy Central Venues',
      senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop'
    }
  },
  {
    id: '5',
    type: 'message',
    title: 'New Message',
    message: 'Mike Chen sent you a message about crowd work tips',
    timestamp: '4 days ago',
    isRead: true,
    metadata: {
      senderName: 'Mike Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '6',
    type: 'achievement',
    title: 'Achievement Unlocked',
    message: 'Congratulations! You\'ve performed 50 shows',
    timestamp: '1 week ago',
    isRead: true,
  },
  {
    id: '7',
    type: 'system',
    title: 'Profile Update',
    message: 'Your profile has been successfully verified',
    timestamp: '2 weeks ago',
    isRead: true,
  },
];

const Notifications = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application': return Users;
      case 'booking': return Calendar;
      case 'payment': return DollarSign;
      case 'review': return Star;
      case 'message': return MessageCircle;
      case 'achievement': return Award;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application': return 'text-blue-400';
      case 'booking': return 'text-green-400';
      case 'payment': return 'text-yellow-400';
      case 'review': return 'text-purple-400';
      case 'message': return 'text-pink-400';
      case 'achievement': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-500/20';
      case 'booking': return 'bg-green-500/20';
      case 'payment': return 'bg-yellow-500/20';
      case 'review': return 'bg-purple-500/20';
      case 'message': return 'bg-pink-500/20';
      case 'achievement': return 'bg-orange-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    toast({
      title: "All notifications marked as read",
      description: "Your notifications have been updated.",
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast({
      title: "All notifications cleared",
      description: "Your notification list has been cleared.",
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    return notification.type === activeTab;
  });

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = getNotificationIcon(notification.type);
    
    return (
      <Card 
        className={`bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer ${
          !notification.isRead ? 'border-purple-400/50' : ''
        }`}
        onClick={() => !notification.isRead && markAsRead(notification.id)}
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
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-purple-200 mt-1">{notification.message}</p>
                  
                  {/* Metadata */}
                  {notification.metadata && (
                    <div className="mt-2 space-y-1">
                      {notification.metadata.senderName && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={notification.metadata.senderAvatar} alt={notification.metadata.senderName} />
                            <AvatarFallback className="text-xs">
                              {notification.metadata.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-purple-300">{notification.metadata.senderName}</span>
                        </div>
                      )}
                      
                      {notification.metadata.amount && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          ${notification.metadata.amount}
                        </Badge>
                      )}
                      
                      {notification.metadata.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(notification.metadata.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      )}
                      
                      {notification.metadata.showTitle && (
                        <Badge variant="outline" className="text-purple-200 border-purple-300">
                          {notification.metadata.showTitle}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-300">{notification.timestamp}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view notifications</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
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
              <p className="text-purple-100">Stay updated with your comedy career</p>
            </div>
            
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <Button 
                  onClick={markAllAsRead}
                  variant="outline" 
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button 
                onClick={clearAllNotifications}
                variant="outline" 
                className="text-red-400 border-red-400/30 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-white/30 hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-7 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500">All</TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-purple-500">Unread</TabsTrigger>
            <TabsTrigger value="application" className="data-[state=active]:bg-purple-500">Applications</TabsTrigger>
            <TabsTrigger value="booking" className="data-[state=active]:bg-purple-500">Bookings</TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-purple-500">Payments</TabsTrigger>
            <TabsTrigger value="message" className="data-[state=active]:bg-purple-500">Messages</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-purple-500">System</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-purple-100">
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
