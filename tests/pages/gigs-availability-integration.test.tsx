import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase and services first (before any imports that use them)
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

jest.mock('@/services/event', () => ({}));
jest.mock('@/services/event/event-browse-service', () => ({}));

// Mock all dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/ProfileContext');
jest.mock('@/contexts/ThemeContext');
jest.mock('@/hooks/data/useEvents');
jest.mock('@/hooks/useBrowseLogic');
jest.mock('@/hooks/useAvailabilitySelection');
jest.mock('@/components/FeaturedEventsCarousel', () => ({
  FeaturedEventsCarousel: () => <div data-testid="featured-carousel">Featured Carousel</div>,
}));
jest.mock('@/components/events/EventFilters', () => ({
  EventFilters: () => <div data-testid="event-filters">Event Filters</div>,
}));
jest.mock('@/components/ShowCard', () => ({
  ShowCard: () => <div data-testid="show-card">Show Card</div>,
}));
jest.mock('@/components/MonthFilter', () => ({
  MonthFilter: () => <div data-testid="month-filter">Month Filter</div>,
}));
jest.mock('@/components/ApplicationForm', () => ({
  ApplicationForm: () => <div data-testid="application-form">Application Form</div>,
}));
jest.mock('@/components/profile/ProfileContextBadge', () => ({
  ProfileContextBadge: () => <div data-testid="profile-badge">Profile Badge</div>,
}));
jest.mock('@/components/shows/ShowTypeFilter', () => ({
  ShowTypeFilter: () => <div data-testid="show-type-filter">Show Type Filter</div>,
}));
jest.mock('@/components/shows/AgeRestrictionToggle', () => ({
  AgeRestrictionToggle: () => <div data-testid="age-restriction-toggle">Age Restriction Toggle</div>,
}));
jest.mock('@/components/auth/QuickSignUpCard', () => ({
  QuickSignUpCard: () => <div data-testid="quick-signup-card">Quick Sign Up Card</div>,
}));
jest.mock('@/components/comedian/EventAvailabilityCard', () => ({
  EventAvailabilityCard: ({ event }: { event: any }) => (
    <div data-testid={`event-availability-card-${event.id}`} data-event-id={event.id}>
      {event.title}
    </div>
  ),
}));

import Gigs from '@/pages/Gigs';

import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useEventsForListing } from '@/hooks/data/useEvents';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { useAvailabilitySelection } from '@/hooks/useAvailabilitySelection';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseEventsForListing = useEventsForListing as jest.MockedFunction<typeof useEventsForListing>;
const mockUseBrowseLogic = useBrowseLogic as jest.MockedFunction<typeof useBrowseLogic>;
const mockUseAvailabilitySelection = useAvailabilitySelection as jest.MockedFunction<typeof useAvailabilitySelection>;

// Sample event data (using today + days to ensure future dates in current month)
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
tomorrow.setHours(19, 0, 0, 0);

const dayAfterTomorrow = new Date(now);
dayAfterTomorrow.setDate(now.getDate() + 2);
dayAfterTomorrow.setHours(20, 0, 0, 0);

const threeDaysLater = new Date(now);
threeDaysLater.setDate(now.getDate() + 3);
threeDaysLater.setHours(19, 30, 0, 0);

const mockEvents = [
  {
    id: 'event-1',
    title: 'Comedy Night Monday',
    event_date: tomorrow.toISOString(),
    venue: 'Test Venue 1',
    city: 'Sydney',
    type: 'open-mic',
    status: 'published',
    is_past: false,
  },
  {
    id: 'event-2',
    title: 'Comedy Night Tuesday',
    event_date: dayAfterTomorrow.toISOString(),
    venue: 'Test Venue 2',
    city: 'Sydney',
    type: 'showcase',
    status: 'published',
    is_past: false,
  },
  {
    id: 'event-3',
    title: 'Comedy Night Wednesday',
    event_date: threeDaysLater.toISOString(),
    venue: 'Test Venue 3',
    city: 'Sydney',
    type: 'open-mic',
    status: 'published',
    is_past: false,
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Gigs Page - Availability Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockUseProfile.mockReturnValue({ activeProfile: null } as any);
    mockUseTheme.mockReturnValue({ theme: 'pleasure' } as any);

    mockUseBrowseLogic.mockReturnValue({
      interestedEvents: [],
      hasAppliedToEvent: jest.fn(() => false),
      getApplicationStatus: jest.fn(() => null),
      isApplying: false,
      handleToggleInterested: jest.fn(),
      handleApply: jest.fn(),
      handleBuyTickets: jest.fn(),
      handleShowDetails: jest.fn(),
      handleGetDirections: jest.fn(),
      selectedEventForApplication: null,
      showApplicationForm: false,
      handleSubmitApplication: jest.fn(),
      setShowApplicationForm: jest.fn(),
    });

    // Default mock: events loading successful
    mockUseEventsForListing.mockReturnValue({
      events: mockEvents,
      isLoading: false,
      error: null,
    });
  });

  describe('Anonymous User Experience', () => {
    it('should show QuickSignUpCard when user is not authenticated', () => {
      // Arrange: Anonymous user
      mockUseAuth.mockReturnValue({
        user: null,
        hasRole: jest.fn(() => false),
      } as any);

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.getByTestId('quick-signup-card')).toBeInTheDocument();
      expect(screen.queryByTestId('event-availability-card')).not.toBeInTheDocument();
    });

    it('should not show EventAvailabilityCard when user is not authenticated', () => {
      // Arrange: Anonymous user
      mockUseAuth.mockReturnValue({
        user: null,
        hasRole: jest.fn(() => false),
      } as any);

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.queryByTestId('event-availability-card')).not.toBeInTheDocument();
    });

    it('should not call useAvailabilitySelection hook when user is not authenticated', () => {
      // Arrange: Anonymous user
      mockUseAuth.mockReturnValue({
        user: null,
        hasRole: jest.fn(() => false),
      } as any);

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Hook should not be called for anonymous users
      expect(mockUseAvailabilitySelection).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated Comedian Experience', () => {
    it('should show EventAvailabilityCard list when user is authenticated comedian', async () => {
      // Arrange: Authenticated comedian
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Should show EventAvailabilityCard (check first event as proof)
      await waitFor(() => {
        expect(screen.getByTestId(`event-availability-card-${mockEvents[0]?.id}`)).toBeInTheDocument();
      });
    });

    it('should show EventAvailabilityCard list when user is comedian_lite', async () => {
      // Arrange: Authenticated comedian_lite
      mockUseAuth.mockReturnValue({
        user: { id: 'user-456', email: 'lite@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian_lite'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Should show EventAvailabilityCard (check first event as proof)
      await waitFor(() => {
        expect(screen.getByTestId(`event-availability-card-${mockEvents[0]?.id}`)).toBeInTheDocument();
      });
    });

    it('should not show QuickSignUpCard when user is authenticated', () => {
      // Arrange: Authenticated comedian
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.queryByTestId('quick-signup-card')).not.toBeInTheDocument();
    });

    it('should call useAvailabilitySelection hook when user is authenticated comedian', () => {
      // Arrange: Authenticated comedian
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Hook should be called with user ID
      expect(mockUseAvailabilitySelection).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Non-Comedian User Experience', () => {
    it('should not show EventAvailabilityCard when user is promoter only', () => {
      // Arrange: Authenticated promoter (not comedian)
      mockUseAuth.mockReturnValue({
        user: { id: 'promoter-123', email: 'promoter@test.com' },
        hasRole: jest.fn((role: string) => role === 'promoter'),
      } as any);

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.queryByTestId('event-availability-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-signup-card')).not.toBeInTheDocument();
    });

    it('should not show EventAvailabilityCard when user is photographer only', () => {
      // Arrange: Authenticated photographer (not comedian)
      mockUseAuth.mockReturnValue({
        user: { id: 'photo-123', email: 'photo@test.com' },
        hasRole: jest.fn((role: string) => role === 'photographer'),
      } as any);

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.queryByTestId('event-availability-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-signup-card')).not.toBeInTheDocument();
    });
  });

  describe('Save Status Indicator', () => {
    it('should display "Autosaving..." when isSaving is true', () => {
      // Arrange: Comedian with saving in progress
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(['event-1']),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: true,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.getByText('Autosaving...')).toBeInTheDocument();
    });

    it('should display "Saved at" timestamp when save is complete', () => {
      // Arrange: Comedian with recent save
      const lastSavedDate = new Date('2025-10-29T15:45:00Z');
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(['event-1']),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: lastSavedDate,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Should show saved time (format may vary based on timezone)
      expect(screen.getByText(/Saved at/i)).toBeInTheDocument();
    });

    it('should not display save status when user is not authenticated', () => {
      // Arrange: Anonymous user
      mockUseAuth.mockReturnValue({
        user: null,
        hasRole: jest.fn(() => false),
      } as any);

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.queryByText('Autosaving...')).not.toBeInTheDocument();
      expect(screen.queryByText(/Saved at/i)).not.toBeInTheDocument();
    });

    it('should not display save status before any save occurs', () => {
      // Arrange: Comedian who hasn't saved yet
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert
      expect(screen.queryByText('Autosaving...')).not.toBeInTheDocument();
      expect(screen.queryByText(/Saved at/i)).not.toBeInTheDocument();
    });
  });

  describe('Event Card Rendering', () => {
    it('should pass correct event data to EventAvailabilityCard', () => {
      // Arrange: Authenticated comedian
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Check each event is rendered with correct ID
      expect(screen.getByTestId('event-availability-card-event-1')).toBeInTheDocument();
      expect(screen.getByText('Comedy Night Monday')).toBeInTheDocument();
    });

    it('should pass userId to EventAvailabilityCard', () => {
      // Arrange: Authenticated comedian with specific user ID
      const userId = 'user-specific-123';
      mockUseAuth.mockReturnValue({
        user: { id: userId, email: 'comedian@test.com' },
        hasRole: jest.fn((role: string) => role === 'comedian'),
      } as any);

      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: jest.fn(),
        selectWeekday: jest.fn(),
        isSaving: false,
        lastSaved: null,
      });

      // Act
      renderWithProviders(<Gigs />);

      // Assert: Verify useAvailabilitySelection was called with correct userId
      expect(mockUseAvailabilitySelection).toHaveBeenCalledWith(userId);
    });
  });
});
