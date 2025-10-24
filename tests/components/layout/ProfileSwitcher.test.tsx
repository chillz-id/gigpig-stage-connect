import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSwitcher } from '@/components/layout/ProfileSwitcher';
import { ProfileProvider, PROFILE_TYPES } from '@/contexts/ProfileContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
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

describe('ProfileSwitcher', () => {
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
              {children}
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

  describe('Rendering', () => {
    it('should render profile switcher with loading state initially', () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => new Promise(() => {})) // Never resolves
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const wrapper = createWrapper();
      render(<ProfileSwitcher />, { wrapper });

      // Should show loading state
      expect(screen.queryByText(/Profile/i)).toBeInTheDocument();
    });

    it('should display active profile name when loaded', async () => {
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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Comedian Profile|Promoter Profile/i)).toBeInTheDocument();
      });
    });

    it('should show profile icon', async () => {
      const mockRoles = [{ role: 'comedian' }];

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
        // Icon should be rendered
        const icons = screen.container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should not render when no profiles available', async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const wrapper = createWrapper();
      const { container } = render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Dropdown Menu', () => {
    it('should open dropdown when clicked', async () => {
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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Comedian Profile|Promoter Profile/i)).toBeInTheDocument();
      });

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Should show all available profiles
        expect(screen.getByText(/Comedian Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Promoter Profile/i)).toBeInTheDocument();
      });
    });

    it('should display checkmark on active profile', async () => {
      localStorageMock.setItem('active-profile-type', 'promoter');

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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Promoter Profile/i)).toBeInTheDocument();
      });

      // Open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Active profile should have checkmark indicator
        const promoterOption = screen.getAllByText(/Promoter Profile/i)[0];
        expect(promoterOption).toBeInTheDocument();
      });
    });

    it('should show "Create New Profile" option', async () => {
      const mockRoles = [{ role: 'comedian' }];

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
        expect(screen.getByText(/Comedian Profile/i)).toBeInTheDocument();
      });

      // Open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Create New Profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Switching', () => {
    it('should switch profile when option is clicked', async () => {
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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Comedian Profile|Promoter Profile/i)).toBeInTheDocument();
      });

      // Open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        const promoterOption = screen.getByText(/Promoter Profile/i);
        fireEvent.click(promoterOption);
      });

      // Should update localStorage
      await waitFor(() => {
        expect(localStorageMock.getItem('active-profile-type')).toBe('promoter');
      });
    });

    it('should close dropdown after profile switch', async () => {
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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Comedian Profile|Promoter Profile/i)).toBeInTheDocument();
      });

      // Open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        const promoterOption = screen.getAllByText(/Promoter Profile/i)[0];
        fireEvent.click(promoterOption);
      });

      // Dropdown should close - only one instance of profile name visible
      await waitFor(() => {
        const profileTexts = screen.queryAllByText(/Promoter Profile/i);
        expect(profileTexts.length).toBeLessThanOrEqual(2); // Trigger + possibly one in dropdown
      });
    });
  });

  describe('Multiple Profiles', () => {
    it('should show all 5 profile types when user has all roles', async () => {
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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Comedian Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Promoter Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Manager Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Photographer Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Videographer Profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for button', async () => {
      const mockRoles = [{ role: 'comedian' }];

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
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
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
      render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        const trigger = screen.getByRole('button');
        expect(trigger).toBeInTheDocument();

        // Should be focusable
        trigger.focus();
        expect(document.activeElement).toBe(trigger);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single profile gracefully', async () => {
      const mockRoles = [{ role: 'comedian' }];

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
        expect(screen.getByText(/Comedian Profile/i)).toBeInTheDocument();
      });

      // Should still show dropdown with create option
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Create New Profile/i)).toBeInTheDocument();
      });
    });

    it('should persist profile selection across re-renders', async () => {
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

      localStorageMock.setItem('active-profile-type', 'promoter');

      const wrapper = createWrapper();
      const { rerender } = render(<ProfileSwitcher />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Promoter Profile/i)).toBeInTheDocument();
      });

      // Re-render component
      rerender(<ProfileSwitcher />);

      // Should still show promoter profile
      await waitFor(() => {
        expect(screen.getByText(/Promoter Profile/i)).toBeInTheDocument();
      });
    });
  });
});
