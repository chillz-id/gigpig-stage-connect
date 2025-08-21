import { localStorage, LocalStorageError } from '@/utils/localStorage';

describe('localStorage utility', () => {
  // Mock window.localStorage
  const mockLocalStorage = (() => {
    let store: { [key: string]: string } = {};

    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: jest.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      })
    };
  })();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  describe('setItem', () => {
    it('should store a value with timestamp', () => {
      const testData = { name: 'Test', value: 123 };
      localStorage.setItem('test-key', testData);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const calls = mockLocalStorage.setItem.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const storedValue = JSON.parse(calls[0]![1] as string);
      
      expect(storedValue).toMatchObject({
        value: testData,
        timestamp: expect.any(Number)
      });
      expect(storedValue.expires).toBeUndefined();
    });

    it('should store a value with TTL', () => {
      const testData = { name: 'Test' };
      const ttlMinutes = 30;
      
      localStorage.setItem('test-key', testData, ttlMinutes);

      const calls = mockLocalStorage.setItem.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const storedValue = JSON.parse(calls[0]![1] as string);
      
      expect(storedValue).toMatchObject({
        value: testData,
        timestamp: expect.any(Number),
        expires: expect.any(Number)
      });
      
      // Check that expires is approximately 30 minutes from now
      const expectedExpiry = Date.now() + ttlMinutes * 60 * 1000;
      expect(Math.abs(storedValue.expires - expectedExpiry)).toBeLessThan(1000);
    });

    it('should handle quota exceeded error', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        const error = new DOMException('QuotaExceededError');
        Object.defineProperty(error, 'name', {
          value: 'QuotaExceededError',
          writable: false
        });
        throw error;
      });

      expect(() => {
        localStorage.setItem('test-key', { data: 'large' });
      }).toThrow(LocalStorageError);

      try {
        localStorage.setItem('test-key', { data: 'large' });
      } catch (error) {
        expect(error).toBeInstanceOf(LocalStorageError);
        expect((error as LocalStorageError).code).toBe('QUOTA_EXCEEDED');
      }
    });

    it('should handle serialization errors', () => {
      const circularRef: any = { a: 1 };
      circularRef.self = circularRef;

      expect(() => {
        localStorage.setItem('test-key', circularRef);
      }).toThrow(LocalStorageError);

      try {
        localStorage.setItem('test-key', circularRef);
      } catch (error) {
        expect(error).toBeInstanceOf(LocalStorageError);
        expect((error as LocalStorageError).code).toBe('SERIALIZATION_ERROR');
      }
    });
  });

  describe('getItem', () => {
    it('should retrieve a stored value', () => {
      const testData = { name: 'Test', value: 456 };
      const storedItem = {
        value: testData,
        timestamp: Date.now()
      };
      
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedItem));
      
      const result = localStorage.getItem('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      
      const result = localStorage.getItem('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired item and remove it', () => {
      const expiredItem = {
        value: { data: 'expired' },
        timestamp: Date.now() - 60000,
        expires: Date.now() - 30000 // Expired 30 seconds ago
      };
      
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(expiredItem));
      
      const result = localStorage.getItem('expired-key');
      
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expired-key');
    });

    it('should handle corrupted data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('corrupted{data');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = localStorage.getItem('corrupted-key');
      
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('corrupted-key');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove an item', () => {
      localStorage.removeItem('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removal errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Removal failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Should not throw
      expect(() => localStorage.removeItem('test-key')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('hasItem', () => {
    it('should return true for existing item', () => {
      const storedItem = {
        value: { exists: true },
        timestamp: Date.now()
      };
      
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedItem));
      
      expect(localStorage.hasItem('existing-key')).toBe(true);
    });

    it('should return false for non-existent item', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      
      expect(localStorage.hasItem('non-existent')).toBe(false);
    });

    it('should return false for expired item', () => {
      const expiredItem = {
        value: { data: 'expired' },
        timestamp: Date.now() - 60000,
        expires: Date.now() - 30000
      };
      
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(expiredItem));
      
      expect(localStorage.hasItem('expired-key')).toBe(false);
    });
  });

  describe('clearExpired', () => {
    it('should remove all expired items', () => {
      const keys = ['item1', 'item2', 'item3'];
      Object.defineProperty(mockLocalStorage, 'length', { value: keys.length });
      
      // Mock Object.keys to return our test keys
      jest.spyOn(Object, 'keys').mockReturnValueOnce(keys);
      
      // Set up mock returns for each item
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify({
          value: 'fresh',
          timestamp: Date.now(),
          expires: Date.now() + 60000 // Not expired
        }))
        .mockReturnValueOnce(JSON.stringify({
          value: 'expired1',
          timestamp: Date.now() - 120000,
          expires: Date.now() - 60000 // Expired
        }))
        .mockReturnValueOnce(JSON.stringify({
          value: 'expired2',
          timestamp: Date.now() - 120000,
          expires: Date.now() - 30000 // Expired
        }));

      localStorage.clearExpired();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('item2');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('item3');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('item1');
    });

    it.skip('should handle errors gracefully', () => {
      const originalKeys = Object.keys;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock Object.keys to throw error
      Object.keys = jest.fn().mockImplementation(() => {
        throw new Error('Failed to get keys');
      });
      
      // Should not throw
      expect(() => localStorage.clearExpired()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore
      Object.keys = originalKeys;
      consoleSpy.mockRestore();
    });
  });

  describe('getUsedSpace', () => {
    it('should calculate used space in bytes', () => {
      // Save original localStorage
      const originalLocalStorage = window.localStorage;
      
      // Create a proper mock storage
      const testData: { [key: string]: string } = {
        key1: 'value1',
        key2: 'value2',
        key3: 'a longer value here'
      };
      
      const mockStorage = {
        ...testData,
        hasOwnProperty(key: string) {
          return testData.hasOwnProperty(key);
        }
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true
      });

      // Calculate expected size: (key + value) * 2 for UTF-16
      const expectedSize = Object.entries(testData)
        .reduce((total, [key, value]) => total + key.length + value.length, 0) * 2;

      expect(localStorage.getUsedSpace()).toBe(expectedSize);
      
      // Restore original
      window.localStorage = originalLocalStorage;
    });

    it('should return 0 on error', () => {
      const originalLocalStorage = window.localStorage;
      
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Access denied');
        },
        configurable: true
      });

      expect(localStorage.getUsedSpace()).toBe(0);
      
      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true
      });
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(localStorage.isAvailable()).toBe(true);
      
      // Verify test was performed
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('__localStorage_test__', 'test');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__localStorage_test__');
    });

    it('should return false when localStorage is not available', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });

      expect(localStorage.isAvailable()).toBe(false);
    });
  });
});