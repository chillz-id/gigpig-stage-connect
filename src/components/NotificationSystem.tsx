
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Calendar, Star, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'news' | 'comedian_confirmed' | 'event_reminder';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  comedianName?: string;
  eventDate?: string;
  venueTime?: string;
}

interface NotificationSystemProps {
  userId?: string;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ userId }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'news',
      title: 'Welcome to Stand Up Sydney!',
      message: 'Stay updated with the latest comedy shows and events in Sydney.',
      timestamp: new Date(),
      isRead: false
    },
    {
      id: '2',
      type: 'comedian_confirmed',
      title: 'Sarah Mitchell Confirmed',
      message: 'Sarah Mitchell is confirmed to perform at The Laugh Track this Friday!',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      isRead: false,
      comedianName: 'Sarah Mitchell',
      eventDate: 'Friday, Dec 29',
      venueTime: 'The Laugh Track - 8:00 PM'
    },
    {
      id: '3',
      type: 'comedian_confirmed',
      title: 'Jake Thompson Confirmed',
      message: 'Jake Thompson will be performing at Comedy Corner next week!',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      isRead: true,
      comedianName: 'Jake Thompson',
      eventDate: 'Next Tuesday',
      venueTime: 'Comedy Corner - 9:00 PM'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast({
      title: "Notification dismissed",
      description: "The notification has been removed.",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comedian_confirmed':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-purple-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'comedian_confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'event_reminder':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Stay updated with comedy news and your followed comedians
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-semibold mb-2">No notifications</h4>
            <p className="text-muted-foreground">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notification.isRead 
                    ? 'bg-background/50 border-border' 
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm">{notification.title}</h5>
                        <Badge 
                          className="professional-button" 
                          className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                        >
                          {notification.type === 'comedian_confirmed' && 'Comedian Update'}
                          {notification.type === 'event_reminder' && 'Event Reminder'}
                          {notification.type === 'news' && 'News'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {(notification.comedianName || notification.eventDate) && (
                        <div className="text-xs text-muted-foreground">
                          {notification.eventDate && (
                            <span>{notification.eventDate}</span>
                          )}
                          {notification.venueTime && (
                            <span className="ml-2">• {notification.venueTime}</span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp.toLocaleDateString()} at{' '}
                        {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSystem;
