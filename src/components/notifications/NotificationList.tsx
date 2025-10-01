import { Bell, Calendar, Check, Clock, Megaphone, Settings, Trash2, Users, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/components/notifications/types';

interface NotificationListProps {
  notifications: Notification[];
  hasActiveFilters: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

const priorityIcon = {
  urgent: <Badge className="bg-red-500/20 text-red-300 border-red-500/40">Urgent</Badge>,
  high: <Badge className="bg-orange-500/20 text-orange-200 border-orange-500/40">High</Badge>,
  medium: <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/40">Medium</Badge>,
  low: <Badge className="bg-gray-500/20 text-gray-200 border-gray-500/40">Low</Badge>,
};

const getTypeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'event':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'booking':
      return <Users className="w-4 h-4 text-purple-500" />;
    case 'payment':
      return <Zap className="w-4 h-4 text-green-500" />;
    case 'system':
      return <Settings className="w-4 h-4 text-gray-500" />;
    case 'reminder':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'promotion':
      return <Megaphone className="w-4 h-4 text-pink-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return `${Math.floor(diffInHours * 60)}m ago`;
  }

  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  }

  return date.toLocaleDateString();
};

const NotificationList = ({ notifications, hasActiveFilters, onMarkAsRead, onDelete }: NotificationListProps) => {
  if (notifications.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-white font-medium mb-2">No notifications found</h3>
          <p className="text-gray-400">
            {hasActiveFilters ? 'Try adjusting your filters' : "You're all caught up!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
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
                  {priorityIcon[notification.priority]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                      {notification.title}
                    </h4>
                    {!notification.is_read && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatTimestamp(notification.timestamp)}</span>
                    {notification.fromUser && <span>from {notification.fromUser}</span>}
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
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-green-400 border-green-400/50 hover:bg-green-400/10"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(notification.id)}
                  className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationList;
