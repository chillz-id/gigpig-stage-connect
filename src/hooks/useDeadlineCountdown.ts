import { useState, useEffect } from 'react';

export interface DeadlineInfo {
  timeLeft: string;
  isExpired: boolean;
  isUrgent: boolean;
  percentageLeft: number;
}

export const useDeadlineCountdown = (deadline: string, urgentThreshold: number = 6 * 60 * 60 * 1000) => {
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo>({
    timeLeft: '',
    isExpired: false,
    isUrgent: false,
    percentageLeft: 100
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const timeDiff = deadlineDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setDeadlineInfo({
          timeLeft: 'Expired',
          isExpired: true,
          isUrgent: false,
          percentageLeft: 0
        });
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      // Format time left
      let timeLeftStr = '';
      if (days > 0) {
        timeLeftStr = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        timeLeftStr = `${hours}h ${minutes}m`;
      } else {
        timeLeftStr = `${minutes}m`;
      }

      // Calculate percentage left (assuming 7 days total deadline period)
      const totalDeadlinePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
      const percentageLeft = Math.max(0, Math.min(100, (timeDiff / totalDeadlinePeriod) * 100));

      setDeadlineInfo({
        timeLeft: timeLeftStr,
        isExpired: false,
        isUrgent: timeDiff <= urgentThreshold,
        percentageLeft
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline, urgentThreshold]);

  const getStatusColor = () => {
    if (deadlineInfo.isExpired) return 'red';
    if (deadlineInfo.isUrgent) return 'orange';
    return 'blue';
  };

  const getStatusMessage = () => {
    if (deadlineInfo.isExpired) return 'This invitation has expired';
    if (deadlineInfo.isUrgent) return 'Urgent: Response needed soon';
    return 'Response required';
  };

  return {
    ...deadlineInfo,
    getStatusColor,
    getStatusMessage
  };
};