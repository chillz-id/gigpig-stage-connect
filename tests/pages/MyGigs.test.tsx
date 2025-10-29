import { render, screen, fireEvent } from '@testing-library/react';
import MyGigs from '@/pages/MyGigs';

// Mock the calendar subscription hook
jest.mock('@/hooks/useCalendarSubscription', () => ({
  getBaseUrl: jest.fn(() => 'http://localhost:8080'),
  useCalendarSubscription: jest.fn(() => ({
    subscription: null,
    isLoading: true,
    regenerateToken: jest.fn(),
    isRegenerating: false,
    getSubscriptionUrl: jest.fn(),
  })),
}));

// Mock hooks
const mockManualGigs = [];
const mockDeleteGig = jest.fn();

const mockUseMyGigs = jest.fn(() => ({
  manualGigs: mockManualGigs,
  isLoading: false,
  deleteGig: mockDeleteGig,
  isDeleting: false,
  createGig: jest.fn(),
  isCreating: false
}));

jest.mock('@/hooks/useMyGigs', () => ({
  useMyGigs: () => mockUseMyGigs()
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    loading: false
  })
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn()
  })
}));

describe('MyGigs Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page title and description', () => {
    render(<MyGigs />);

    expect(screen.getByRole('heading', { name: /my gigs/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your personal gig schedule/i)).toBeInTheDocument();
  });

  it('should render add gig button', () => {
    render(<MyGigs />);

    const addButtons = screen.getAllByRole('button', { name: /add gig/i });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('should render subscribe to calendar button', () => {
    render(<MyGigs />);

    expect(screen.getByRole('button', { name: /subscribe to calendar/i })).toBeInTheDocument();
  });

  it('should render confirmed platform gigs section', () => {
    render(<MyGigs />);

    expect(screen.getByText(/confirmed platform gigs/i)).toBeInTheDocument();
  });

  it('should render manual gigs section', () => {
    render(<MyGigs />);

    expect(screen.getByText(/my manual gigs/i)).toBeInTheDocument();
  });

  it('should show empty state when no manual gigs', () => {
    mockUseMyGigs.mockReturnValueOnce({
      manualGigs: [],
      isLoading: false,
      deleteGig: mockDeleteGig,
      isDeleting: false,
      createGig: jest.fn(),
      isCreating: false
    });

    render(<MyGigs />);

    expect(screen.getByText(/no manual gigs yet/i)).toBeInTheDocument();
  });

  it('should display manual gigs when available', () => {
    const mockGigs = [
      {
        id: 'gig-1',
        user_id: 'user-123',
        title: 'Comedy Night',
        venue_name: 'The Comedy Store',
        venue_address: '1 Comedy Ln',
        start_datetime: '2025-11-15T20:00:00Z',
        end_datetime: '2025-11-15T22:00:00Z',
        notes: 'Bring mic',
        created_at: '2025-10-29T10:00:00Z',
        updated_at: '2025-10-29T10:00:00Z'
      }
    ];

    mockUseMyGigs.mockReturnValueOnce({
      manualGigs: mockGigs,
      isLoading: false,
      deleteGig: mockDeleteGig,
      isDeleting: false,
      createGig: jest.fn(),
      isCreating: false
    });

    render(<MyGigs />);

    expect(screen.getByText('Comedy Night')).toBeInTheDocument();
    expect(screen.getByText(/the comedy store/i)).toBeInTheDocument();
    expect(screen.getByText(/bring mic/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseMyGigs.mockReturnValueOnce({
      manualGigs: [],
      isLoading: true,
      deleteGig: mockDeleteGig,
      isDeleting: false,
      createGig: jest.fn(),
      isCreating: false
    });

    render(<MyGigs />);

    // Look for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should open add gig dialog when add button is clicked', () => {
    render(<MyGigs />);

    const addButton = screen.getAllByRole('button', { name: /add gig/i })[0];
    fireEvent.click(addButton);

    // Dialog should open (tested in AddGigDialog.test.tsx)
  });
});
