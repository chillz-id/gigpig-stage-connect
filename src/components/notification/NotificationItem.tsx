
import React from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  return (
    <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
      <div className="font-medium text-sm">{notification.title}</div>
      <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
    </DropdownMenuItem>
  );
};
