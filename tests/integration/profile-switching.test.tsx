import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';
import { ProfileSwitcher } from '@/components/layout/ProfileSwitcher';
import { ProfileManagement } from '@/pages/ProfileManagement';
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
        })),
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        data: null,
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      upsert: jest.fn(() => ({
        data: null,
        error: null
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
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

// Test component to display active profile
function TestProfileDisplay() {
  const { activeProfile, availableProfiles } = useProfile();

  return (
    <div>
      <div data-testid="active-profile">{activeProfile || 'none'}</div>
      <div data-testid="profile-count">{availableProfiles.length}</div>
    </div>
  );
}

describe('Profile Switching Integration Tests', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileProvider>
              <Routes>
                <Route path="/" element={children} />
                <Route path="/settings/profiles" element={<ProfileManagement />} />
              </Routes>
            </ProfileProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );

    return Wrapper;
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();

    // Mock auth session with user
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe('Profile Context Integration', () => {
    it('should provide profile context to nested components', async () => {
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

      const wrapper = createWrapper();
      render(<TestProfileDisplay />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toHaveTextContent(/comedian|promoter/);
        expect(screen.getByTestId('profile-count')).toHaveTextContent('2');
      });
    });

    it('should update all consumers when profile switches', async () => {
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

      const wrapper = createWrapper();
      render(
        <div>
          <ProfileSwitcher />
          <TestProfileDisplay />
        </div>,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toBeInTheDocument();
      });

      const initialProfile = screen.getByTestId('active-profile').textContent;

      // Open switcher and select different profile
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        const otherProfile = initialProfile === 'comedian' ? 'Promoter Profile' : 'Comedian Profile';
        const option = screen.getByText(otherProfile);
        fireEvent.click(option);
      });

      // TestProfileDisplay should update
      await waitFor(() => {
        const newProfile = screen.getByTestId('active-profile').textContent;
        expect(newProfile).not.toBe(initialProfile);
      });
    });
  });

  describe('Profile Switching Flow', () => {
    it('should complete full profile switch workflow', async () => {
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

      const wrapper = createWrapper();
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Step 1: Open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Step 2: Verify all profiles shown
      await waitFor(() => {
        expect(screen.getByText(/Comedian Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Promoter Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Photographer Profile/i)).toBeInTheDocument();
      });

      // Step 3: Select photographer profile
      const photographerOption = screen.getByText(/Photographer Profile/i);
      fireEvent.click(photographerOption);

      // Step 4: Verify persistence
      await waitFor(() => {
        expect(localStorageMock.getItem('active-profile-type')).toBe('photographer');
      });
    });

    it('should switch between multiple profiles sequentially', async () => {
      const mockRoles = [
        { role: 'comedian' },
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

      const wrapper = createWrapper();
      render(
        <div>
          <ProfileSwitcher />
          <TestProfileDisplay />
        </div>,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toBeInTheDocument();
      });

      // Switch to promoter
      let trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        const promoterOption = screen.getByText(/Promoter Profile/i);
        fireEvent.click(promoterOption);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toHaveTextContent('promoter');
      });

      // Switch to manager
      trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        const managerOption = screen.getByText(/Manager Profile/i);
        fireEvent.click(managerOption);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toHaveTextContent('manager');
        expect(localStorageMock.getItem('active-profile-type')).toBe('manager');
      });
    });
  });

  describe('Profile Creation Integration', () => {
    it('should show create profile option when not all profiles exist', async () => {
      const mockRoles = [
        { role: 'comedian' }
        // User doesn't have all 5 profile types
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

      const wrapper = createWrapper();
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Create New Profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Persistence Across Sessions', () => {
    it('should restore saved profile on mount', async () => {
      localStorageMock.setItem('active-profile-type', 'manager');

      const mockRoles = [
        { role: 'comedian' },
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

      const wrapper = createWrapper();
      render(<TestProfileDisplay />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toHaveTextContent('manager');
      });
    });

    it('should default to first profile if saved profile is invalid', async () => {
      localStorageMock.setItem('active-profile-type', 'videographer');

      const mockRoles = [
        { role: 'comedian' },
        { role: 'promoter' }
        // videographer not available
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

      const wrapper = createWrapper();
      render(<TestProfileDisplay />, { wrapper });

      await waitFor(() => {
        const activeProfile = screen.getByTestId('active-profile').textContent;
        expect(activeProfile).toMatch(/comedian|promoter/);
        expect(activeProfile).not.toBe('videographer');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle profile fetch errors gracefully', async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const wrapper = createWrapper();
      render(<TestProfileDisplay />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toHaveTextContent('none');
        expect(screen.getByTestId('profile-count')).toHaveTextContent('0');
      });
    });

    it('should handle missing user gracefully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const wrapper = createWrapper();
      render(<TestProfileDisplay />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('active-profile')).toHaveTextContent('none');
        expect(screen.getByTestId('profile-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Multiple Profile Types', () => {
    it('should handle user with all 5 profile types', async () => {
      const mockRoles = [
        { role: 'comedian' },
        { role: 'promoter' },
        { role: 'manager' },
        { role: 'photographer' },
        { role: 'videographer' }
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

      const wrapper = createWrapper();
      render(<TestProfileDisplay />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('profile-count')).toHaveTextContent('5');
      });
    });

    it('should allow switching between all available profile types', async () => {
      const mockRoles = [
        { role: 'comedian' },
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

      const wrapper = createWrapper();
      render(
        <div>
          <ProfileSwitcher />
          <TestProfileDisplay />
        </div>,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-count')).toHaveTextContent('3');
      });

      // Test switching to each profile type
      const profileTypes = ['comedian', 'promoter', 'manager'];

      for (const profileType of profileTypes) {
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        await waitFor(() => {
          const profileLabel = profileType.charAt(0).toUpperCase() + profileType.slice(1) + ' Profile';
          const option = screen.getByText(new RegExp(profileLabel, 'i'));
          fireEvent.click(option);
        });

        await waitFor(() => {
          expect(localStorageMock.getItem('active-profile-type')).toBe(profileType);
        });
      }
    });
  });
});
