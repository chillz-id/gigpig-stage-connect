import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileProvider, useProfile, PROFILE_TYPES } from '@/contexts/ProfileContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ProfileContext', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    return Wrapper;
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe('Initial State', () => {
    it('should provide default context values', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      expect(result.current.activeProfile).toBeNull();
      expect(result.current.availableProfiles).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(typeof result.current.switchProfile).toBe('function');
      expect(typeof result.current.hasProfile).toBe('function');
    });

    it('should load active profile from localStorage if valid', async () => {
      localStorageMock.setItem('active-profile-type', 'comedian');

      // Mock user_roles query to return comedian role
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [{ role: 'comedian' }],
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeProfile).toBe('comedian');
      expect(result.current.availableProfiles).toContain('comedian');
    });

    it('should clear invalid profile from localStorage', async () => {
      localStorageMock.setItem('active-profile-type', 'invalid-profile');

      // Mock user_roles query to return no roles
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(localStorageMock.getItem('active-profile-type')).toBeNull();
      });
    });
  });

  describe('Available Profiles', () => {
    it('should fetch available profiles from user_roles', async () => {
      const mockRoles = [
        { role: 'comedian' },
        { role: 'promoter' },
        { role: 'photographer' }
      ];

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockRoles,
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableProfiles).toHaveLength(3);
      expect(result.current.availableProfiles).toContain('comedian');
      expect(result.current.availableProfiles).toContain('promoter');
      expect(result.current.availableProfiles).toContain('photographer');
    });

    it('should set first available profile as active if none saved', async () => {
      const mockRoles = [
        { role: 'promoter' },
        { role: 'manager' }
      ];

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockRoles,
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeProfile).toBe('promoter');
    });

    it('should handle empty user_roles gracefully', async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableProfiles).toEqual([]);
      expect(result.current.activeProfile).toBeNull();
    });
  });

  describe('switchProfile', () => {
    it('should switch to a valid profile and persist to localStorage', async () => {
      const mockRoles = [
        { role: 'comedian' },
        { role: 'promoter' }
      ];

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockRoles,
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial profile should be comedian (first in list)
      expect(result.current.activeProfile).toBe('comedian');

      // Switch to promoter
      act(() => {
        result.current.switchProfile('promoter');
      });

      expect(result.current.activeProfile).toBe('promoter');
      expect(localStorageMock.getItem('active-profile-type')).toBe('promoter');
    });

    it('should not switch to unavailable profile', async () => {
      const mockRoles = [
        { role: 'comedian' }
      ];

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockRoles,
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalProfile = result.current.activeProfile;

      // Try to switch to unavailable profile
      act(() => {
        result.current.switchProfile('manager');
      });

      // Should remain on original profile
      expect(result.current.activeProfile).toBe(originalProfile);
    });
  });

  describe('hasProfile', () => {
    it('should return true for available profiles', async () => {
      const mockRoles = [
        { role: 'comedian' },
        { role: 'photographer' }
      ];

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockRoles,
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasProfile('comedian')).toBe(true);
      expect(result.current.hasProfile('photographer')).toBe(true);
      expect(result.current.hasProfile('promoter')).toBe(false);
      expect(result.current.hasProfile('manager')).toBe(false);
    });
  });

  describe('PROFILE_TYPES constant', () => {
    it('should contain all profile types with correct structure', () => {
      expect(PROFILE_TYPES).toHaveProperty('comedian');
      expect(PROFILE_TYPES).toHaveProperty('promoter');
      expect(PROFILE_TYPES).toHaveProperty('manager');
      expect(PROFILE_TYPES).toHaveProperty('photographer');
      expect(PROFILE_TYPES).toHaveProperty('videographer');

      // Verify structure
      Object.values(PROFILE_TYPES).forEach(profileType => {
        expect(profileType).toHaveProperty('type');
        expect(profileType).toHaveProperty('label');
        expect(profileType).toHaveProperty('icon');
        expect(typeof profileType.type).toBe('string');
        expect(typeof profileType.label).toBe('string');
        expect(typeof profileType.icon).toBe('function');
      });
    });

    it('should have unique types', () => {
      const types = Object.values(PROFILE_TYPES).map(p => p.type);
      const uniqueTypes = new Set(types);
      expect(types.length).toBe(uniqueTypes.size);
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase query errors gracefully', async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      // Mock auth session with user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableProfiles).toEqual([]);
      expect(result.current.activeProfile).toBeNull();
    });

    it('should handle missing user session', async () => {
      // Mock no auth session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableProfiles).toEqual([]);
      expect(result.current.activeProfile).toBeNull();
    });
  });
});
