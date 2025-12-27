import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { pwaService } from '@/services/pwaService';
import { toast } from '@/hooks/use-toast';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className, 
  showDetails = false 
}) => {
  const [isOnline, setIsOnline] = useState(pwaService.isOnlineStatus());
  const [offlineActionsCount, setOfflineActionsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(pwaService.isOnlineStatus());
      setOfflineActionsCount(pwaService.getOfflineActionsCount());
    };

    // Initial update
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update offline actions count periodically
    const interval = setInterval(updateStatus, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "You're currently offline. Sync will happen automatically when you're back online.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Trigger background sync
      await pwaService.requestBackgroundSync('manual-sync');
      
      // Wait a moment for sync to complete
      setTimeout(() => {
        setIsSyncing(false);
        setOfflineActionsCount(pwaService.getOfflineActionsCount());
        
        toast({
          title: "Sync Complete",
          description: "Your offline changes have been synchronized.",
        });
      }, 2000);
    } catch (error) {
      setIsSyncing(false);
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (showDetails) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {offlineActionsCount > 0 && (
                <Badge variant="secondary">
                  {offlineActionsCount} pending
                </Badge>
              )}
            </div>

            {offlineActionsCount > 0 && (
              <Button
                size="sm"
                className="professional-button"
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </div>

          {offlineActionsCount > 0 && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>
                  You have {offlineActionsCount} offline action{offlineActionsCount !== 1 ? 's' : ''} waiting to sync.
                </span>
              </div>
              {!isOnline && (
                <p className="text-xs text-muted-foreground mt-1">
                  These will sync automatically when you're back online.
                </p>
              )}
            </div>
          )}

          {isOnline && offlineActionsCount === 0 && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span>All changes are synced</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Simple indicator mode
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isOnline ? (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      
      {offlineActionsCount > 0 && (
        <Badge className="professional-button">
          {offlineActionsCount} pending
        </Badge>
      )}
    </div>
  );
};