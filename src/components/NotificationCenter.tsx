// Unified Notification Center - Real-time notifications with cross-system integration
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  X, 
  Settings, 
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Plane,
  Calendar,
  DollarSign,
  Info,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { useNotifications, useNotificationPreferences } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType, NotificationPriority } from '@/services/notificationService';
import NotificationPreferencesPanel from '@/components/notifications/NotificationPreferences';

interface NotificationCenterProps {
  className?: string;
  showAsPopover?: boolean;
  maxHeight?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  showAsPopover = false,
  maxHeight = "500px"
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | NotificationType>('all');
  // Hooks for notifications
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    refetch 
  } = useNotifications({
    enableRealtime: true,
    limit: 50
  });

  const {
    preferences,
    savePreferences,
    isUpdating,
    isLoading: preferencesLoading
  } = useNotificationPreferences();

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (preferences.inApp.sound && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors (user interaction required)
        });
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  }, [preferences.inApp.sound]);

  // Listen for new notifications to play sound
  useEffect(() => {
    const previousCount = localStorage.getItem('notification-count');
    const currentCount = unreadCount.toString();
    
    if (previousCount && parseInt(previousCount) < unreadCount) {
      playNotificationSound();
    }
    
    localStorage.setItem('notification-count', currentCount);
  }, [unreadCount, playNotificationSound]);

  // Filter notifications by category
  const filteredNotifications = notifications.filter(notification => 
    selectedCategory === 'all' || notification.type === selectedCategory
  );

  // Get notification icon and color
  const getNotificationIcon = (type: NotificationType, priority: NotificationPriority) => {
    const iconProps = {
      className: cn(
        "w-5 h-5",
        priority === 'urgent' ? 'text-red-500' :
        priority === 'high' ? 'text-orange-500' :
        priority === 'medium' ? 'text-blue-500' : 'text-gray-500'
      )
    };

    const typeIcons: Record<NotificationType, React.ReactNode> = {
      tour_created: <Calendar {...iconProps} />,
      tour_updated: <Calendar {...iconProps} />,
      tour_cancelled: <X {...iconProps} />,
      collaboration_invite: <Users {...iconProps} />,
      collaboration_accepted: <CheckCircle {...iconProps} />,
      collaboration_declined: <X {...iconProps} />,
      task_assigned: <CheckCircle {...iconProps} />,
      task_due_soon: <Clock {...iconProps} />,
      task_overdue: <AlertCircle {...iconProps} />,
      task_completed: <Check {...iconProps} />,
      flight_delayed: <Plane {...iconProps} />,
      flight_cancelled: <X {...iconProps} />,
      flight_boarding: <Plane {...iconProps} />,
      event_booking: <Calendar {...iconProps} />,
      event_cancelled: <X {...iconProps} />,
      payment_received: <DollarSign {...iconProps} />,
      payment_due: <DollarSign {...iconProps} />,
      system_update: <Info {...iconProps} />,
      general: <Bell {...iconProps} />
    };

    return typeIcons[type] || <Bell {...iconProps} />;
  };

  // Get priority color
  const getPriorityColor = (priority: NotificationPriority): string => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[priority];
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Category filter options
  const categoryOptions = [
    { value: 'all' as const, label: 'All', count: notifications.length },
    { value: 'tour_created' as const, label: 'Tours', count: notifications.filter(n => n.type.startsWith('tour_') || n.type.startsWith('collaboration_')).length },
    { value: 'task_assigned' as const, label: 'Tasks', count: notifications.filter(n => n.type.startsWith('task_')).length },
    { value: 'flight_delayed' as const, label: 'Flights', count: notifications.filter(n => n.type.startsWith('flight_')).length },
    { value: 'event_booking' as const, label: 'Events', count: notifications.filter(n => n.type.startsWith('event_')).length },
    { value: 'payment_received' as const, label: 'Payments', count: notifications.filter(n => n.type.startsWith('payment_')).length }
  ];

  const NotificationList = () => (
    <ScrollArea className="h-full" style={{ maxHeight }}>
      <div className="space-y-2 p-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                !notification.is_read && "border-l-4 border-l-blue-500 bg-blue-50/50"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "font-medium text-sm leading-tight",
                        !notification.is_read ? "text-gray-900" : "text-gray-700"
                      )}>
                        {notification.title}
                      </h4>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={cn("text-xs", getPriorityColor(notification.priority))}>
                          {notification.priority}
                        </Badge>
                        
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      
                      {notification.action_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.action_url!;
                          }}
                        >
                          {notification.action_label || 'View'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );

  const NotificationSettings = () => (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="font-medium mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          {preferencesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <NotificationPreferencesPanel
              preferences={preferences}
              onUpdate={(nextPreferences) => {
                void savePreferences(nextPreferences);
              }}
              disabled={isUpdating}
            />
          )}
        </div>
      </div>
    </div>
  );

  // Trigger component
  if (showAsPopover) {
    return (
      <div className={className}>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          {preferences.inApp.sound ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md h-[600px] p-0">
            <DialogHeader className="p-4 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle>Notifications</DialogTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <CheckCheck className="w-4 h-4 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {showSettings ? (
              <NotificationSettings />
            ) : (
              <div className="flex-1">
                {/* Category Filter */}
                <div className="px-4 py-2 border-b">
                  <ScrollArea>
                    <div className="flex gap-2">
                      {categoryOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedCategory === option.value ? "default" : "secondary"}
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => setSelectedCategory(option.value)}
                        >
                          {option.label}
                          {option.count > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {option.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <NotificationList />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full component
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                className="professional-button"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={showSettings ? "settings" : "notifications"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="notifications"
              onClick={() => setShowSettings(false)}
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-0">
            {/* Category Filter */}
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="flex gap-2 overflow-x-auto">
                {categoryOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedCategory === option.value ? "default" : "secondary"}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => setSelectedCategory(option.value)}
                  >
                    {option.label}
                    {option.count > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <NotificationList />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
