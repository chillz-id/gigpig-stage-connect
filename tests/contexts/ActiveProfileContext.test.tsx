import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ProfileProvider,
  useActiveProfile,
  type ActiveProfile,
} from '@/contexts/ProfileContext';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

// Mock useAuth to return no user (prevents user_roles query)
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    session: null,
    loading: false,
  })),
}));

// Mock useOrganizationProfiles
jest.mock('@/hooks/useOrganizationProfiles', () => ({
  useOrganizationProfiles: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Create a fresh QueryClient for each test
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>{children}</ProfileProvider>
    </QueryClientProvider>
  );
};

describe('ActiveProfileContext (via ProfileContext)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('provides default null state', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    expect(result.current.activeProfile).toBeNull();
  });

  it('setActiveProfile updates state correctly', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const testProfile: ActiveProfile = {
      id: 'test-id-123',
      type: 'comedian',
      slug: 'john-doe',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    act(() => {
      result.current.setActiveProfile(testProfile);
    });

    expect(result.current.activeProfile).toEqual(testProfile);
  });

  it('persists active profile to localStorage', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const testProfile: ActiveProfile = {
      id: 'test-id-456',
      type: 'manager',
      slug: 'jane-smith',
      name: 'Jane Smith',
    };

    act(() => {
      result.current.setActiveProfile(testProfile);
    });

    const stored = localStorage.getItem('activeProfile');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(testProfile);
  });

  it('loads active profile from localStorage on mount', () => {
    const testProfile: ActiveProfile = {
      id: 'test-id-789',
      type: 'organization',
      slug: 'comedy-club',
      name: 'Comedy Club',
      avatarUrl: 'https://example.com/club.jpg',
    };

    localStorage.setItem('activeProfile', JSON.stringify(testProfile));

    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    expect(result.current.activeProfile).toEqual(testProfile);
  });

  it('clearActiveProfile resets state', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const testProfile: ActiveProfile = {
      id: 'test-id-clear',
      type: 'venue',
      slug: 'the-venue',
      name: 'The Venue',
    };

    act(() => {
      result.current.setActiveProfile(testProfile);
    });

    expect(result.current.activeProfile).toEqual(testProfile);

    act(() => {
      result.current.clearActiveProfile();
    });

    expect(result.current.activeProfile).toBeNull();
  });

  it('clearActiveProfile removes from localStorage', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const testProfile: ActiveProfile = {
      id: 'test-id-remove',
      type: 'comedian',
      slug: 'test-comedian',
      name: 'Test Comedian',
    };

    act(() => {
      result.current.setActiveProfile(testProfile);
    });

    expect(localStorage.getItem('activeProfile')).toBeTruthy();

    act(() => {
      result.current.clearActiveProfile();
    });

    expect(localStorage.getItem('activeProfile')).toBeNull();
  });

  it('getProfileUrl generates correct URL for dashboard', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const testProfile: ActiveProfile = {
      id: 'test-id-url',
      type: 'comedian',
      slug: 'john-doe',
      name: 'John Doe',
    };

    act(() => {
      result.current.setActiveProfile(testProfile);
    });

    expect(result.current.getProfileUrl()).toBe('/comedian/john-doe/dashboard');
  });

  it('getProfileUrl generates correct URL for specific page', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const testProfile: ActiveProfile = {
      id: 'test-id-settings',
      type: 'manager',
      slug: 'jane-manager',
      name: 'Jane Manager',
    };

    act(() => {
      result.current.setActiveProfile(testProfile);
    });

    expect(result.current.getProfileUrl('settings')).toBe(
      '/manager/jane-manager/settings'
    );
  });

  it('getProfileUrl returns root when no active profile', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    expect(result.current.getProfileUrl()).toBe('/');
    expect(result.current.getProfileUrl('settings')).toBe('/');
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('activeProfile', 'invalid-json');

    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    expect(result.current.activeProfile).toBeNull();
  });

  it('supports photographer profile type', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const photographerProfile: ActiveProfile = {
      id: 'photographer-id-123',
      type: 'photographer',
      slug: 'jane-photographer',
      name: 'Jane Photographer',
      avatarUrl: 'https://example.com/photographer.jpg',
    };

    act(() => {
      result.current.setActiveProfile(photographerProfile);
    });

    expect(result.current.activeProfile).toEqual(photographerProfile);
    expect(result.current.getProfileUrl()).toBe(
      '/photographer/jane-photographer/dashboard'
    );
    expect(result.current.getProfileUrl('portfolio')).toBe(
      '/photographer/jane-photographer/portfolio'
    );
  });

  it('supports videographer profile type', () => {
    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    const videographerProfile: ActiveProfile = {
      id: 'videographer-id-456',
      type: 'videographer',
      slug: 'bob-videographer',
      name: 'Bob Videographer',
    };

    act(() => {
      result.current.setActiveProfile(videographerProfile);
    });

    expect(result.current.activeProfile).toEqual(videographerProfile);
    expect(result.current.getProfileUrl()).toBe(
      '/videographer/bob-videographer/dashboard'
    );
  });

  it('validates profile type on load', () => {
    const invalidProfile = {
      id: 'test-id',
      type: 'invalid-type',
      slug: 'test-slug',
      name: 'Test Name',
    };

    localStorage.setItem('activeProfile', JSON.stringify(invalidProfile));

    const { result } = renderHook(() => useActiveProfile(), { wrapper: createWrapper() });

    expect(result.current.activeProfile).toBeNull();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useActiveProfile());
    }).toThrow('useActiveProfile must be used within a ProfileProvider');

    consoleSpy.mockRestore();
  });
});
