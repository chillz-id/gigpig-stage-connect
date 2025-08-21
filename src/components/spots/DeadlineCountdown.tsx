import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, Clock } from 'lucide-react';

interface DeadlineCountdownProps {
  deadline: string;
  onExpired?: () => void;
  className?: string;
}

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({
  deadline,
  onExpired,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const timeDiff = deadlineDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        onExpired?.();
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      // Mark as urgent if less than 6 hours remaining
      setIsUrgent(timeDiff <= 6 * 60 * 60 * 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  const getVariant = () => {
    if (isExpired) return 'destructive';
    if (isUrgent) return 'secondary';
    return 'outline';
  };

  const getIcon = () => {
    if (isExpired) return <AlertTriangle className="w-3 h-3" />;
    if (isUrgent) return <Timer className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const getColorClass = () => {
    if (isExpired) return 'bg-red-100 text-red-800 border-red-200';
    if (isUrgent) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <Badge 
      variant={getVariant()}
      className={`${getColorClass()} flex items-center gap-1 ${className}`}
    >
      {getIcon()}
      <span className="text-xs font-medium">{timeLeft}</span>
    </Badge>
  );
};