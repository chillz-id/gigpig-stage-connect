// PWA Service - Progressive Web App functionality and offline capabilities
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'event' | 'task' | 'tour' | 'notification' | 'profile';
  data: any;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface PWAInstallPrompt {
  show(): Promise<void>;
  outcome: 'accepted' | 'dismissed';
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOfflineCapable: boolean;
  supportsPushNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsPeriodicSync: boolean;
  supportsShare: boolean;
  supportsFileHandling: boolean;
}

class PWAService {
  private deferredPrompt: any = null;
  private offlineActions: OfflineAction[] = [];
  private isOnline = navigator.onLine;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializePWA();
    this.setupEventListeners();
  }

  // =====================================
  // PWA INITIALIZATION
  // =====================================

  private async initializePWA(): Promise<void> {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully');
        
        // Listen for updates
        this.swRegistration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });

        // Check for waiting service worker
        if (this.swRegistration.waiting) {
          this.showUpdateAvailable();
        }
      }

      // Load offline actions from storage
      await this.loadOfflineActions();
      
      // Try to sync if online
      if (this.isOnline) {
        await this.syncOfflineActions();
      }
    } catch (error) {
      console.error('PWA initialization failed:', error);
    }
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // App installed handling
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      toast({
        title: "App Installed",
        description: "Stand Up Sydney has been installed successfully!",
      });
    });

    // Visibility change for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineActions();
      }
    });
  }

  // =====================================
  // INSTALLATION MANAGEMENT
  // =====================================

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  isInstallable(): boolean {
    return !!this.deferredPrompt;
  }

  private showInstallPrompt(): void {
    // Show custom install prompt UI
    setTimeout(() => {
      toast({
        title: "Install Stand Up Sydney",
        description: "Install the app for a better experience with offline access!",
        action: {
          label: "Install",
          onClick: () => this.installApp()
        }
      });
    }, 5000); // Show after 5 seconds
  }

  // =====================================
  // OFFLINE FUNCTIONALITY
  // =====================================

  async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const offlineAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID?.() || `action_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.offlineActions.push(offlineAction);
    await this.saveOfflineActions();

    toast({
      title: "Action Queued",
      description: "Your action will be synced when you're back online.",
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncOfflineActions();
    }
  }

  private async syncOfflineActions(): Promise<void> {
    if (!this.isOnline || this.offlineActions.length === 0) {
      return;
    }

    const actionsToSync = [...this.offlineActions];
    const syncedActions: string[] = [];

    for (const action of actionsToSync) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.data ? JSON.stringify(action.data) : undefined
        });

        if (response.ok) {
          syncedActions.push(action.id);
          console.log('Synced offline action:', action.id);
        } else {
          // Increment retry count
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            syncedActions.push(action.id); // Remove failed actions after max retries
            console.error('Offline action failed after max retries:', action.id);
          }
        }
      } catch (error) {
        console.error('Failed to sync offline action:', action.id, error);
        action.retryCount++;
        if (action.retryCount >= action.maxRetries) {
          syncedActions.push(action.id);
        }
      }
    }

    // Remove synced actions
    this.offlineActions = this.offlineActions.filter(
      action => !syncedActions.includes(action.id)
    );

    await this.saveOfflineActions();

    if (syncedActions.length > 0) {
      toast({
        title: "Synced",
        description: `${syncedActions.length} offline actions synced successfully.`,
      });
    }
  }

  private async loadOfflineActions(): Promise<void> {
    try {
      const stored = localStorage.getItem('pwa_offline_actions');
      if (stored) {
        this.offlineActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error);
      this.offlineActions = [];
    }
  }

  private async saveOfflineActions(): Promise<void> {
    try {
      localStorage.setItem('pwa_offline_actions', JSON.stringify(this.offlineActions));
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  }

  getOfflineActionsCount(): number {
    return this.offlineActions.length;
  }

  clearOfflineActions(): void {
    this.offlineActions = [];
    localStorage.removeItem('pwa_offline_actions');
  }

  // =====================================
  // PUSH NOTIFICATIONS
  // =====================================

  async subscribeToPushNotifications(): Promise<boolean> {
    if (!('Notification' in window) || !this.swRegistration) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      // Send subscription to server
      await supabase.functions.invoke('save-push-subscription', {
        body: { subscription }
      });

      return true;
    } catch (error) {
      console.error('Push notification subscription failed:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // =====================================
  // BACKGROUND SYNC
  // =====================================

  async requestBackgroundSync(tag: string): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !this.swRegistration) {
      return false;
    }

    try {
      await this.swRegistration.sync.register(tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }

  // =====================================
  // CAPABILITIES DETECTION
  // =====================================

  getCapabilities(): PWACapabilities {
    return {
      isInstallable: this.isInstallable(),
      isInstalled: window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true,
      isOfflineCapable: 'serviceWorker' in navigator,
      supportsPushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      supportsPeriodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      supportsShare: 'share' in navigator,
      supportsFileHandling: 'launchQueue' in window
    };
  }

  // =====================================
  // SHARING FUNCTIONALITY
  // =====================================

  async shareContent(data: {
    title: string;
    text: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }

    // Fallback to clipboard
    try {
      const shareText = `${data.title}\n${data.text}${data.url ? `\n${data.url}` : ''}`;
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Content has been copied to your clipboard.",
      });
      return true;
    } catch (error) {
      console.error('Clipboard share failed:', error);
      return false;
    }
  }

  // =====================================
  // CACHE MANAGEMENT
  // =====================================

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        toast({
          title: "Cache Cleared",
          description: "All cached data has been cleared.",
        });
      } catch (error) {
        console.error('Cache clearing failed:', error);
      }
    }
  }

  async getCacheSize(): Promise<number> {
    if ('caches' in window && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      } catch (error) {
        console.error('Cache size estimation failed:', error);
      }
    }
    return 0;
  }

  // =====================================
  // SERVICE WORKER UPDATES
  // =====================================

  private handleServiceWorkerUpdate(): void {
    if (this.swRegistration?.installing) {
      this.swRegistration.installing.addEventListener('statechange', () => {
        if (this.swRegistration?.waiting) {
          this.showUpdateAvailable();
        }
      });
    }
  }

  private showUpdateAvailable(): void {
    toast({
      title: "Update Available",
      description: "A new version of the app is available.",
      action: {
        label: "Update",
        onClick: () => this.updateApp()
      }
    });
  }

  private updateApp(): void {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  private handleOnlineStatusChange(isOnline: boolean): void {
    if (isOnline) {
      toast({
        title: "Back Online",
        description: "Syncing your offline changes...",
      });
      this.syncOfflineActions();
    } else {
      toast({
        title: "You're Offline",
        description: "Your changes will be synced when you're back online.",
      });
    }
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        if (persistent) {
          console.log('Persistent storage granted');
        }
        return persistent;
      } catch (error) {
        console.error('Persistent storage request failed:', error);
      }
    }
    return false;
  }

  // Get storage quota
  async getStorageQuota(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.error('Storage quota estimation failed:', error);
      }
    }
    return { usage: 0, quota: 0 };
  }
}

export const pwaService = new PWAService();