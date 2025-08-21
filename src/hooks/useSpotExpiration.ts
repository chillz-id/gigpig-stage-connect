import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { spotExpirationService } from '@/services/spotExpirationService';

export const useSpotExpiration = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only start the cleanup service if user is authenticated
    if (user) {
      spotExpirationService.startPeriodicCleanup();
    }

    // Cleanup on unmount
    return () => {
      spotExpirationService.stopPeriodicCleanup();
    };
  }, [user]);

  return {
    cleanupExpiredSpots: () => spotExpirationService.cleanupExpiredSpots(),
    sendExpirationReminders: () => spotExpirationService.sendExpirationReminders(),
    getExpiringSpots: () => spotExpirationService.getExpiringSpots()
  };
};