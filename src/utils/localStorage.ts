/**
 * localStorage utility with safe JSON serialization, error handling, and TTL support
 */

interface StoredItem<T> {
  value: T;
  expires?: number;
  timestamp: number;
}

export class LocalStorageError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'LocalStorageError';
  }
}

/**
 * Safe localStorage wrapper with JSON serialization and TTL support
 */
export const localStorage = {
  /**
   * Set an item in localStorage with optional TTL
   * @param key - The storage key
   * @param value - The value to store (will be JSON serialized)
   * @param ttlMinutes - Optional time-to-live in minutes
   * @throws LocalStorageError if quota exceeded or serialization fails
   */
  setItem<T>(key: string, value: T, ttlMinutes?: number): void {
    try {
      const item: StoredItem<T> = {
        value,
        timestamp: Date.now(),
        ...(ttlMinutes && { expires: Date.now() + ttlMinutes * 60 * 1000 })
      };

      const serialized = JSON.stringify(item);
      
      try {
        window.localStorage.setItem(key, serialized);
      } catch (e) {
        // Check if it's a quota exceeded error
        if (e instanceof DOMException && (
          e.code === 22 || // Legacy browsers
          e.code === 1014 || // Firefox
          e.name === 'QuotaExceededError' || // Modern browsers
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' // Firefox
        )) {
          throw new LocalStorageError('Storage quota exceeded', 'QUOTA_EXCEEDED');
        }
        throw e;
      }
    } catch (e) {
      if (e instanceof LocalStorageError) {
        throw e;
      }
      throw new LocalStorageError(
        `Failed to save item: ${e instanceof Error ? e.message : 'Unknown error'}`,
        'SERIALIZATION_ERROR'
      );
    }
  },

  /**
   * Get an item from localStorage
   * @param key - The storage key
   * @returns The stored value or null if not found/expired
   */
  getItem<T>(key: string): T | null {
    try {
      const serialized = window.localStorage.getItem(key);
      if (!serialized) return null;

      const item = JSON.parse(serialized) as StoredItem<T>;

      // Check if expired
      if (item.expires && Date.now() > item.expires) {
        this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (e) {
      console.error(`Failed to parse localStorage item "${key}":`, e);
      // Remove corrupted item
      this.removeItem(key);
      return null;
    }
  },

  /**
   * Remove an item from localStorage
   * @param key - The storage key
   */
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove localStorage item "${key}":`, e);
    }
  },

  /**
   * Check if an item exists in localStorage
   * @param key - The storage key
   * @returns true if the item exists and hasn't expired
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  },

  /**
   * Clear all expired items from localStorage
   */
  clearExpired(): void {
    try {
      const keys = Object.keys(window.localStorage);
      
      for (const key of keys) {
        try {
          const serialized = window.localStorage.getItem(key);
          if (!serialized) continue;

          const item = JSON.parse(serialized) as StoredItem<unknown>;
          
          if (item.expires && Date.now() > item.expires) {
            this.removeItem(key);
          }
        } catch {
          // Skip invalid items
          continue;
        }
      }
    } catch (e) {
      console.error('Failed to clear expired items:', e);
    }
  },

  /**
   * Get the size of localStorage usage in bytes
   */
  getUsedSpace(): number {
    try {
      let size = 0;
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          size += window.localStorage[key].length + key.length;
        }
      }
      return size * 2; // UTF-16 uses 2 bytes per character
    } catch {
      return 0;
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
};

// Note: Consumers should call clearExpired() manually when needed
// to avoid issues with module loading and testing