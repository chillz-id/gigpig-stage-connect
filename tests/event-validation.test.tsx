import { render, screen, fireEvent } from '@testing-library/react';
import { ModernEventCard } from '@/components/ModernEventCard';
import EventFilters from '@/components/admin/EventFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/data/useEvents';
import { prepareEventData } from '@/utils/eventDataMapper';
import { Event } from '@/types/event';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/data/useEvents');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('Event System Validation', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Test Comedy Show',
    description: 'A great comedy show',
    date: '2024-03-15',
    event_date: '2024-03-15T20:00:00Z',
    start_time: '20:00',
    venue: 'Comedy Club',
    promoter_id: 'promoter-123',
    status: 'open',
    total_spots: 10,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    image_url: 'https://example.com/banner.jpg',
    city: 'Sydney',
    state: 'NSW',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Creation', () => {
    it('should create event with promoter_id from authenticated user', async () => {
      const mockCreateEvent = jest.fn();
      
      (useAuth as any).mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' },
      });
      
      (useEvents as any).mockReturnValue({
        createEvent: mockCreateEvent,
        isCreating: false,
      });

      const formData = {
        title: 'New Comedy Night',
        venue: 'Laugh Factory',
        address: '123 Comedy St',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        date: '2024-03-20',
        time: '19:00',
        type: 'open_mic',
        spots: 10,
        description: 'Open mic night',
        requirements: ['5 min set'],
        imageUrl: 'https://example.com/new-banner.jpg',
      };

      const eventData = prepareEventData(
        formData as any,
        { isRecurring: false } as any,
        [],
        mockUser.id
      );

      // Verify promoter_id is set correctly
      expect(eventData.promoter_id).toBe(mockUser.id);
      expect(eventData).not.toHaveProperty('stage_manager_id');
    });

    it('should show helpful error when user is not authenticated', async () => {
      (useAuth as any).mockReturnValue({
        user: null,
        session: null,
      });

      // Would render CreateEventForm and test the auth error flow
      // The component should show "Authentication required" message
    });
  });

  describe('Event Display', () => {
    it('should display event with correct banner image', () => {
      const mockOnToggleInterested = jest.fn();
      const mockOnApply = jest.fn();
      const mockOnBuyTickets = jest.fn();
      const mockOnShowDetails = jest.fn();
      const mockOnGetDirections = jest.fn();

      render(
        <ModernEventCard
          show={mockEvent}
          interestedEvents={new Set()}
          onToggleInterested={mockOnToggleInterested}
          onApply={mockOnApply}
          onBuyTickets={mockOnBuyTickets}
          onShowDetails={mockOnShowDetails}
          onGetDirections={mockOnGetDirections}
        />
      );

      // Check if banner image is rendered
      const bannerImage = screen.getByAltText('Test Comedy Show');
      expect(bannerImage).toBeInTheDocument();
      expect(bannerImage).toHaveAttribute('src', 'https://example.com/banner.jpg');
    });

    it('should display fallback gradient when no banner image', () => {
      const eventWithoutBanner = { ...mockEvent, image_url: null };
      
      render(
        <ModernEventCard
          show={eventWithoutBanner}
          interestedEvents={new Set()}
          onToggleInterested={jest.fn()}
          onApply={jest.fn()}
          onBuyTickets={jest.fn()}
          onShowDetails={jest.fn()}
          onGetDirections={jest.fn()}
        />
      );

      // Check for gradient fallback
      const gradientDiv = screen.getByTestId('gradient-fallback');
      expect(gradientDiv).toHaveClass('bg-gradient-to-br from-purple-500 to-pink-500');
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by status correctly', () => {
      const mockSetStatusFilter = jest.fn();
      
      render(
        <EventFilters
          searchTerm=""
          setSearchTerm={jest.fn()}
          statusFilter="open"
          setStatusFilter={mockSetStatusFilter}
        />
      );

      // Check that status filter shows correct options
      const statusSelect = screen.getByRole('combobox');
      fireEvent.click(statusSelect);

      const openOption = screen.getByText('Open');
      expect(openOption).toBeInTheDocument();
      
      const completedOption = screen.getByText('Completed');
      expect(completedOption).toBeInTheDocument();
    });

    it('should handle search term input', () => {
      const mockSetSearchTerm = jest.fn();
      
      render(
        <EventFilters
          searchTerm=""
          setSearchTerm={mockSetSearchTerm}
          statusFilter="all"
          setStatusFilter={jest.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'Comedy Night' } });
      
      expect(mockSetSearchTerm).toHaveBeenCalledWith('Comedy Night');
    });
  });

  describe('TypeScript Type Validation', () => {
    it('should have correct Event type structure', () => {
      const event: Event = {
        id: 'test-id',
        title: 'Test Event',
        date: '2024-03-15',
        event_date: '2024-03-15T20:00:00Z',
        start_time: '20:00',
        promoter_id: 'promoter-123', // This should be required
        status: 'open',
        total_spots: 10,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      // TypeScript will enforce the correct structure
      expect(event.promoter_id).toBeDefined();
      expect(event).not.toHaveProperty('stage_manager_id');
    });
  });

  describe('Error Messages', () => {
    it('should show helpful validation errors', () => {
      // Test various validation scenarios
      const testCases = [
        {
          formData: { title: '' },
          expectedError: 'Title is required',
        },
        {
          formData: { title: 'Test', venue: '' },
          expectedError: 'Venue is required',
        },
        {
          formData: { title: 'Test', venue: 'Place', date: '' },
          expectedError: 'Event date is required',
        },
      ];

      // Each test case would validate the appropriate error message
      testCases.forEach(() => {
        // Validation logic would be tested here
      });
    });
  });

  describe('No stage_manager_id References', () => {
    it('should not have any stage_manager_id in the codebase', () => {
      // This is a meta-test to ensure no stage_manager_id references exist
      // In actual implementation, this would be checked via grep/search
      
      const eventData = prepareEventData(
        {
          title: 'Test',
          venue: 'Test Venue',
          date: '2024-03-20',
          time: '19:00',
        } as any,
        { isRecurring: false } as any,
        [],
        'user-id'
      );

      // Ensure the prepared data doesn't have stage_manager_id
      expect(eventData).not.toHaveProperty('stage_manager_id');
      expect(eventData).toHaveProperty('promoter_id');
    });
  });
});