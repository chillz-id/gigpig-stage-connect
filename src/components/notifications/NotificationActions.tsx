import { Button } from '@/components/ui/button';
import { Check, Send } from 'lucide-react';

interface NotificationActionsProps {
  totalCount: number;
  unreadCount: number;
  onMarkAllRead: () => void;
  onSendTest: () => void;
}

const NotificationActions = ({
  totalCount,
  unreadCount,
  onMarkAllRead,
  onSendTest,
}: NotificationActionsProps) => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300 text-sm">
        {totalCount} notifications
        {unreadCount > 0 && ` (${unreadCount} unread)`}
      </span>
      <div className="flex gap-2">
        <Button
          className="professional-button"
          size="sm"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-white border-white/20"
        >
          <Check className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
        <Button
          className="professional-button"
          size="sm"
          onClick={onSendTest}
          className="text-white border-white/20"
        >
          <Send className="w-4 h-4 mr-2" />
          Test
        </Button>
      </div>
    </div>
  );
};

export default NotificationActions;
