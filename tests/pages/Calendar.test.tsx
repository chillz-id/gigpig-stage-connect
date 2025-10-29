import { render, screen, waitFor } from '@testing-library/react';
import Calendar from '@/pages/Calendar';

// Mock dependencies
const mockGigs = [
  {
    id: 'gig-1',
    title: 'Comedy Night',
    venue_name: 'The Laugh Factory',
    venue_address: '123 Main St',
    start_datetime: '2025-11-15T19:00:00Z',
    end_datetime: null,
    source: 'platform' as const,
  },
  {
    id: 'gig-2',
    title: 'Open Mic',
    venue_name: 'Comedy Club',
    venue_address: null,
    start_datetime: '2025-11-20T20:00:00Z',
    end_datetime: null,
    source: 'manual' as const,
  },
];

const mockUseUnifiedGigs = jest.fn(() => ({
  data: mockGigs,
  isLoading: false,
  isError: false,
  error: null,
}));

jest.mock('@/hooks/useUnifiedGigs', () => ({
  useUnifiedGigs: () => mockUseUnifiedGigs(),
}));

jest.mock('@/components/comedian/GigCalendar', () => ({
  GigCalendar: ({ gigs }: any) => (
    <div data-testid="gig-calendar">
      {gigs.map((gig: any) => (
        <div key={gig.id}>{gig.title}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    hasRole: () => true,
  }),
}));

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => children,
}));

jest.mock('@/services/calendar/ical-service', () => ({
  icalService: {
    generateFeedForToken: jest.fn(),
    downloadICalFile: jest.fn(),
  },
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { token: 'test-token-123' },
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('Calendar Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mock return value
    mockUseUnifiedGigs.mockReturnValue({
      data: mockGigs,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it('renders page title and heading', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Calendar />);

    expect(screen.getByText('My Calendar')).toBeInTheDocument();
  });

  it('renders subscribe button placeholder', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Calendar />);

    expect(screen.getByText('Subscribe to Calendar')).toBeInTheDocument();
  });

  it('displays color legend', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Calendar />);

    expect(screen.getByText('Platform Gigs')).toBeInTheDocument();
    expect(screen.getByText('Manual Gigs')).toBeInTheDocument();
  });

  it('shows loading spinner when data is loading', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<Calendar />);

    // Loading spinner should be visible
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders calendar with gigs data', async () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: mockGigs,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText('Comedy Night')).toBeInTheDocument();
      expect(screen.getByText('Open Mic')).toBeInTheDocument();
    });
  });

  it('handles empty gigs gracefully', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Calendar />);

    // Calendar should still render with no gigs
    expect(screen.getByText('My Calendar')).toBeInTheDocument();
    expect(screen.getByText('Platform Gigs')).toBeInTheDocument();
  });

  it('handles error state', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch gigs'),
    });

    render(<Calendar />);

    // Should show error message
    expect(screen.getByText(/error loading calendar/i)).toBeInTheDocument();
  });

  it('has correct page structure', () => {
    mockUseUnifiedGigs.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { container } = render(<Calendar />);

    // Should have container layout
    const pageContainer = container.querySelector('.container');
    expect(pageContainer).toBeInTheDocument();
  });
});
