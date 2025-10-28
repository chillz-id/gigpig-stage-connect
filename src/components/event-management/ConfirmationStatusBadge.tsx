import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmationStatusBadgeProps {
  status: 'confirmed' | 'pending' | 'declined' | 'expired' | 'unfilled';
  deadline?: string; // ISO timestamp
  showCountdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfirmationStatusBadge({
  status: initialStatus,
  deadline,
  showCountdown = false,
  size = 'md',
}: ConfirmationStatusBadgeProps) {
  const [status, setStatus] = useState(initialStatus);
  const [countdown, setCountdown] = useState<string>('');

  // Sync status when prop changes
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Calculate countdown time remaining
  const calculateCountdown = (deadlineTime: string): string => {
    const now = new Date().getTime();
    const target = new Date(deadlineTime).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return 'expired';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Update countdown every minute
  useEffect(() => {
    if (!showCountdown || !deadline || status !== 'pending') {
      return;
    }

    // Initial calculation
    const timeRemaining = calculateCountdown(deadline);
    if (timeRemaining === 'expired') {
      setStatus('expired');
      setCountdown('');
      return;
    }
    setCountdown(timeRemaining);

    // Update every minute
    const interval = setInterval(() => {
      const timeRemaining = calculateCountdown(deadline);
      if (timeRemaining === 'expired') {
        setStatus('expired');
        setCountdown('');
        clearInterval(interval);
      } else {
        setCountdown(timeRemaining);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [showCountdown, deadline, status]);

  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle2,
          text: 'Confirmed',
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        };
      case 'declined':
        return {
          icon: XCircle,
          text: 'Declined',
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          text: 'Expired',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
      case 'unfilled':
        return {
          icon: User,
          text: 'Unfilled',
          className: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
        };
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'md':
        return 'text-sm px-2.5 py-1';
      case 'lg':
        return 'text-base px-3 py-1.5';
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const sizeClasses = getSizeClasses();

  // Icon size based on badge size
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <Badge className={cn(config.className, sizeClasses)}>
      <span className="flex items-center gap-1">
        <Icon className={iconSize} />
        {config.text}
        {showCountdown && countdown && status === 'pending' && (
          <span className="ml-1">({countdown})</span>
        )}
      </span>
    </Badge>
  );
}
