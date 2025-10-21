import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { useUser } from '@/contexts/UserContext';

interface PendingRequestsBadgeProps {
  showIcon?: boolean;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * Badge showing count of pending requests
 * Displays notification icon with count badge
 */
export const PendingRequestsBadge: React.FC<PendingRequestsBadgeProps> = ({
  showIcon = true,
  variant = 'destructive',
}) => {
  const { user } = useUser();
  const { data: pendingCount = 0, isLoading } = usePendingRequests(user?.id);

  if (isLoading || !user || pendingCount === 0) {
    return null;
  }

  if (showIcon) {
    return (
      <div className="relative inline-flex">
        <Bell className="h-5 w-5" />
        <Badge
          variant={variant}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </Badge>
      </div>
    );
  }

  return (
    <Badge variant={variant}>
      {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
    </Badge>
  );
};
