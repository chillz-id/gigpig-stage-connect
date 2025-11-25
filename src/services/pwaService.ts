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

export interface FormDraft {
  id: string;
  formType: string;
  data: Record<string, any>;
  step?: number;
  timestamp: string;
  expiresAt: string;
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

// IndexedDB database name and version
const DB_NAME = 'standup-sydney-pwa';
const DB_VERSION = 1;
const FORM_DRAFTS_STORE = 'form-drafts';

class PWAService {
  private deferredPrompt: any = null;
  private offlineActions: OfflineAction[] = [];
  private isOnline = navigator.onLine;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializePWA();
    this.setupEventListeners();
    this.initIndexedDB();
  }

  // =====================================
  // INDEXEDDB INITIALIZATION
  // =====================================

  private async initIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        // Clean up expired drafts on startup
        this.cleanupExpiredDrafts();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create form drafts store
        if (!db.objectStoreNames.contains(FORM_DRAFTS_STORE)) {
          const store = db.createObjectStore(FORM_DRAFTS_STORE, { keyPath: 'id' });
          store.createIndex('formType', 'formType', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
    }
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
        description: "Install the app for a better experience with offline access!"
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
      description: "A new version of the app is available."
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

  // =====================================
  // FORM DRAFT CACHING
  // =====================================

  /**
   * Save a form draft to IndexedDB
   * @param formType - Unique identifier for the form type (e.g., 'create-event', 'application')
   * @param data - Form data to save
   * @param step - Optional current step for multi-step forms
   * @param expiresInDays - How long to keep the draft (default: 7 days)
   */
  async saveFormDraft(
    formType: string,
    data: Record<string, any>,
    step?: number,
    expiresInDays: number = 7
  ): Promise<boolean> {
    // Try IndexedDB first
    if (this.db) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const draft: FormDraft = {
          id: formType, // Use formType as ID for simple key-value storage
          formType,
          data,
          step,
          timestamp: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        };

        return new Promise((resolve) => {
          const transaction = this.db!.transaction([FORM_DRAFTS_STORE], 'readwrite');
          const store = transaction.objectStore(FORM_DRAFTS_STORE);
          const request = store.put(draft);

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.error('Failed to save form draft to IndexedDB:', request.error);
            // Fall back to localStorage
            this.saveFormDraftToLocalStorage(formType, data, step, expiresInDays);
            resolve(true);
          };
        });
      } catch (error) {
        console.error('IndexedDB save error:', error);
      }
    }

    // Fall back to localStorage
    return this.saveFormDraftToLocalStorage(formType, data, step, expiresInDays);
  }

  private saveFormDraftToLocalStorage(
    formType: string,
    data: Record<string, any>,
    step?: number,
    expiresInDays: number = 7
  ): boolean {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const draft: FormDraft = {
        id: formType,
        formType,
        data,
        step,
        timestamp: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(`form_draft_${formType}`, JSON.stringify(draft));
      return true;
    } catch (error) {
      console.error('Failed to save form draft to localStorage:', error);
      return false;
    }
  }

  /**
   * Load a form draft from IndexedDB or localStorage
   * @param formType - Unique identifier for the form type
   * @returns The saved draft or null if not found/expired
   */
  async loadFormDraft(formType: string): Promise<FormDraft | null> {
    // Try IndexedDB first
    if (this.db) {
      try {
        const draft = await new Promise<FormDraft | null>((resolve) => {
          const transaction = this.db!.transaction([FORM_DRAFTS_STORE], 'readonly');
          const store = transaction.objectStore(FORM_DRAFTS_STORE);
          const request = store.get(formType);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => {
            console.error('Failed to load form draft from IndexedDB:', request.error);
            resolve(null);
          };
        });

        if (draft) {
          // Check if expired
          if (new Date(draft.expiresAt) < new Date()) {
            await this.deleteFormDraft(formType);
            return null;
          }
          return draft;
        }
      } catch (error) {
        console.error('IndexedDB load error:', error);
      }
    }

    // Fall back to localStorage
    return this.loadFormDraftFromLocalStorage(formType);
  }

  private loadFormDraftFromLocalStorage(formType: string): FormDraft | null {
    try {
      const stored = localStorage.getItem(`form_draft_${formType}`);
      if (!stored) return null;

      const draft: FormDraft = JSON.parse(stored);

      // Check if expired
      if (new Date(draft.expiresAt) < new Date()) {
        localStorage.removeItem(`form_draft_${formType}`);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('Failed to load form draft from localStorage:', error);
      return null;
    }
  }

  /**
   * Delete a form draft
   * @param formType - Unique identifier for the form type
   */
  async deleteFormDraft(formType: string): Promise<boolean> {
    // Delete from IndexedDB
    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([FORM_DRAFTS_STORE], 'readwrite');
          const store = transaction.objectStore(FORM_DRAFTS_STORE);
          const request = store.delete(formType);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Failed to delete from IndexedDB:', error);
      }
    }

    // Also delete from localStorage (in case it was saved there as fallback)
    try {
      localStorage.removeItem(`form_draft_${formType}`);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }

    return true;
  }

  /**
   * List all saved form drafts
   */
  async listFormDrafts(): Promise<FormDraft[]> {
    const drafts: FormDraft[] = [];

    // Get from IndexedDB
    if (this.db) {
      try {
        const indexedDBDrafts = await new Promise<FormDraft[]>((resolve) => {
          const transaction = this.db!.transaction([FORM_DRAFTS_STORE], 'readonly');
          const store = transaction.objectStore(FORM_DRAFTS_STORE);
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => {
            console.error('Failed to list form drafts from IndexedDB:', request.error);
            resolve([]);
          };
        });

        drafts.push(...indexedDBDrafts);
      } catch (error) {
        console.error('IndexedDB list error:', error);
      }
    }

    // Also check localStorage for any fallback drafts
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('form_draft_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft: FormDraft = JSON.parse(stored);
            // Only add if not already in list (from IndexedDB)
            if (!drafts.find(d => d.id === draft.id)) {
              drafts.push(draft);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to list form drafts from localStorage:', error);
    }

    // Filter out expired drafts
    const now = new Date();
    return drafts.filter(draft => new Date(draft.expiresAt) > now);
  }

  /**
   * Check if a form has a saved draft
   */
  async hasFormDraft(formType: string): Promise<boolean> {
    const draft = await this.loadFormDraft(formType);
    return draft !== null;
  }

  /**
   * Clean up expired drafts
   */
  private async cleanupExpiredDrafts(): Promise<void> {
    if (!this.db) return;

    try {
      const now = new Date().toISOString();

      const transaction = this.db.transaction([FORM_DRAFTS_STORE], 'readwrite');
      const store = transaction.objectStore(FORM_DRAFTS_STORE);
      const index = store.index('expiresAt');

      // Get all drafts that have expired
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Failed to cleanup expired drafts:', error);
    }

    // Also cleanup localStorage
    try {
      const now = new Date();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('form_draft_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft: FormDraft = JSON.parse(stored);
            if (new Date(draft.expiresAt) < now) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage drafts:', error);
    }
  }

  /**
   * Get draft statistics
   */
  async getFormDraftStats(): Promise<{ count: number; oldestTimestamp: string | null }> {
    const drafts = await this.listFormDrafts();

    if (drafts.length === 0) {
      return { count: 0, oldestTimestamp: null };
    }

    const oldestDraft = drafts.reduce((oldest, current) =>
      new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
    );

    return {
      count: drafts.length,
      oldestTimestamp: oldestDraft.timestamp,
    };
  }
}

export const pwaService = new PWAService();