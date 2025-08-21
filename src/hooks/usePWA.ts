import { useState, useEffect, useCallback } from 'react';
import { pwaService, PWACapabilities, OfflineAction } from '@/services/pwaService';
import { toast } from '@/hooks/use-toast';

export interface UsePWAReturn {
  // Installation
  isInstallable: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installApp: () => Promise<boolean>;
  
  // Capabilities
  capabilities: PWACapabilities;
  
  // Offline functionality
  isOnline: boolean;
  offlineActionsCount: number;
  queueOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  clearOfflineActions: () => void;
  
  // Notifications
  subscribeToPushNotifications: () => Promise<boolean>;
  
  // Sharing
  shareContent: (data: {
    title: string;
    text: string;
    url?: string;
    files?: File[];
  }) => Promise<boolean>;
  
  // Cache management
  cacheSize: number;
  clearCache: () => Promise<void>;
  
  // Storage
  storageQuota: { usage: number; quota: number };
  requestPersistentStorage: () => Promise<boolean>;
}

export const usePWA = (): UsePWAReturn => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [capabilities, setCapabilities] = useState<PWACapabilities>(pwaService.getCapabilities());
  const [isOnline, setIsOnline] = useState(pwaService.isOnlineStatus());
  const [offlineActionsCount, setOfflineActionsCount] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);
  const [storageQuota, setStorageQuota] = useState({ usage: 0, quota: 0 });

  // Update capabilities and status
  const updateCapabilities = useCallback(() => {
    const caps = pwaService.getCapabilities();
    setCapabilities(caps);
    setIsInstallable(caps.isInstallable);
    setIsInstalled(caps.isInstalled);
    setIsOnline(pwaService.isOnlineStatus());
    setOfflineActionsCount(pwaService.getOfflineActionsCount());
  }, []);

  // Update cache and storage info
  const updateStorageInfo = useCallback(async () => {
    try {
      setCacheSize(await pwaService.getCacheSize());
      setStorageQuota(await pwaService.getStorageQuota());
    } catch (error) {
      console.error('Failed to update storage info:', error);
    }
  }, []);

  useEffect(() => {
    // Initial update
    updateCapabilities();
    updateStorageInfo();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateCapabilities();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateCapabilities();
    };

    // Listen for install prompt events
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      updateCapabilities();
    };

    const handleAppInstalled = () => {
      updateCapabilities();
      toast({
        title: "App Installed",
        description: "Stand Up Sydney has been installed successfully!",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Periodic updates
    const interval = setInterval(() => {
      updateCapabilities();
      updateStorageInfo();
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, [updateCapabilities, updateStorageInfo]);

  // Install app
  const installApp = useCallback(async (): Promise<boolean> => {
    setIsInstalling(true);
    try {
      const success = await pwaService.installApp();
      if (success) {
        updateCapabilities();
      }
      return success;
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: "Installation Failed",
        description: "Failed to install the app. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [updateCapabilities]);

  // Queue offline action
  const queueOfflineAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    await pwaService.queueOfflineAction(action);
    setOfflineActionsCount(pwaService.getOfflineActionsCount());
  }, []);

  // Clear offline actions
  const clearOfflineActions = useCallback(() => {
    pwaService.clearOfflineActions();
    setOfflineActionsCount(0);
    toast({
      title: "Offline Actions Cleared",
      description: "All pending offline actions have been cleared.",
    });
  }, []);

  // Subscribe to push notifications
  const subscribeToPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const success = await pwaService.subscribeToPushNotifications();
      if (success) {
        updateCapabilities();
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications for important updates.",
        });
      } else {
        toast({
          title: "Notifications Disabled",
          description: "Push notifications are not available or were denied.",
          variant: "destructive"
        });
      }
      return success;
    } catch (error) {
      console.error('Push notification subscription failed:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications.",
        variant: "destructive"
      });
      return false;
    }
  }, [updateCapabilities]);

  // Share content
  const shareContent = useCallback(async (data: {
    title: string;
    text: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> => {
    try {
      return await pwaService.shareContent(data);
    } catch (error) {
      console.error('Sharing failed:', error);
      toast({
        title: "Sharing Failed",
        description: "Failed to share content.",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await pwaService.clearCache();
      await updateStorageInfo();
    } catch (error) {
      console.error('Cache clearing failed:', error);
      toast({
        title: "Cache Clear Failed",
        description: "Failed to clear cache.",
        variant: "destructive"
      });
    }
  }, [updateStorageInfo]);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await pwaService.requestPersistentStorage();
      if (granted) {
        toast({
          title: "Persistent Storage Granted",
          description: "Your data will be preserved even when storage is low.",
        });
      }
      return granted;
    } catch (error) {
      console.error('Persistent storage request failed:', error);
      return false;
    }
  }, []);

  return {
    // Installation
    isInstallable,
    isInstalled,
    isInstalling,
    installApp,
    
    // Capabilities
    capabilities,
    
    // Offline functionality
    isOnline,
    offlineActionsCount,
    queueOfflineAction,
    clearOfflineActions,
    
    // Notifications
    subscribeToPushNotifications,
    
    // Sharing
    shareContent,
    
    // Cache management
    cacheSize,
    clearCache,
    
    // Storage
    storageQuota,
    requestPersistentStorage
  };
};