
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  action_url?: string | null;
  priority?: string | null;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onMarkAsRead && !notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      // Handle both internal and external URLs
      if (notification.action_url.startsWith('http')) {
        window.open(notification.action_url, '_blank');
      } else {
        navigate(notification.action_url);
      }
    }
  };

  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    : '';

  return (
    <DropdownMenuItem
      key={notification.id}
      className={cn(
        "flex flex-col items-start p-3 cursor-pointer",
        !notification.is_read && "bg-blue-50 dark:bg-blue-950/20"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-sm truncate",
            !notification.is_read ? "font-semibold" : "font-medium"
          )}>
            {notification.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </div>
          {timeAgo && (
            <div className="text-xs text-muted-foreground/70 mt-1">
              {timeAgo}
            </div>
          )}
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
        )}
      </div>
    </DropdownMenuItem>
  );
};
