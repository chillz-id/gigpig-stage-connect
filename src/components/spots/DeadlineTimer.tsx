import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DeadlineTimerProps {
  deadline: string | Date;
  className?: string;
  showIcon?: boolean;
  showSeconds?: boolean;
  compact?: boolean;
  onExpire?: () => void;
}

export function DeadlineTimer({ 
  deadline, 
  className,
  showIcon = true,
  showSeconds = false,
  compact = false,
  onExpire
}: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'expired' | 'critical' | 'urgent' | 'normal'>('normal');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const deadlineDate = new Date(deadline);
    
    const updateTimer = () => {
      const now = new Date();
      const secondsRemaining = differenceInSeconds(deadlineDate, now);
      
      if (secondsRemaining <= 0) {
        setTimeRemaining('Expired');
        setUrgencyLevel('expired');
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
        return;
      }
      
      // Calculate time parts
      const days = Math.floor(secondsRemaining / (24 * 60 * 60));
      const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
      const seconds = secondsRemaining % 60;
      
      // Format display
      let display = '';
      if (days > 0) {
        display = `${days}d ${hours}h`;
        setUrgencyLevel('normal');
      } else if (hours > 6) {
        display = `${hours}h ${minutes}m`;
        setUrgencyLevel('normal');
      } else if (hours > 1) {
        display = showSeconds ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m`;
        setUrgencyLevel('urgent');
      } else {
        display = showSeconds ? `${minutes}m ${seconds}s` : `${hours}h ${minutes}m`;
        setUrgencyLevel('critical');
      }
      
      setTimeRemaining(display);
    };
    
    // Initial update
    updateTimer();
    
    // Update every second if showing seconds, otherwise every minute
    const interval = setInterval(updateTimer, showSeconds ? 1000 : 60000);
    
    return () => clearInterval(interval);
  }, [deadline, showSeconds, isExpired, onExpire]);

  const getIcon = () => {
    switch (urgencyLevel) {
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getColorClasses = () => {
    switch (urgencyLevel) {
      case 'expired':
        return 'text-red-600 dark:text-red-400';
      case 'critical':
        return 'text-orange-600 dark:text-orange-400';
      case 'urgent':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getBadgeVariant = () => {
    switch (urgencyLevel) {
      case 'expired':
        return 'destructive';
      case 'critical':
      case 'urgent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={getBadgeVariant()} 
              className={cn('cursor-help', className)}
            >
              {showIcon && getIcon()}
              <span className="ml-1">{timeRemaining}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deadline: {new Date(deadline).toLocaleString()}</p>
            {urgencyLevel === 'expired' && (
              <p className="text-red-500">This deadline has passed</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', getColorClasses(), className)}>
      {showIcon && getIcon()}
      <span className="font-medium">{timeRemaining}</span>
      {urgencyLevel === 'critical' && (
        <span className="text-xs">(Critical)</span>
      )}
    </div>
  );
}