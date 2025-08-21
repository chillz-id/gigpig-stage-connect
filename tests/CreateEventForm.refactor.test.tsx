import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateEventForm } from '@/components/CreateEventForm';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the Google Maps hook
jest.mock('@/hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({
    isLoaded: true,
    loadScript: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock the create event hook
jest.mock('@/hooks/useCreateEvent', () => ({
  useCreateEvent: () => ({
    createEvent: jest.fn(),
    isCreating: false,
  }),
}));

// Mock the auth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    isLoading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  }),
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('CreateEventForm Refactor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all component sections', () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    // Check for main sections
    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByText('Venue Information')).toBeInTheDocument();
    expect(screen.getByText('Event Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Performer Requirements & Settings')).toBeInTheDocument();
    expect(screen.getByText('Ticketing Information')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /publish event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Event title is required')).toBeInTheDocument();
      expect(screen.getByText('Venue name is required')).toBeInTheDocument();
      expect(screen.getByText('Event date is required')).toBeInTheDocument();
    });
  });

  it('handles basic form input correctly', async () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    // Fill in basic information
    const titleInput = screen.getByLabelText(/event title/i);
    const venueInput = screen.getByLabelText(/venue name/i);
    const capacityInput = screen.getByLabelText(/capacity/i);

    fireEvent.change(titleInput, { target: { value: 'Test Comedy Night' } });
    fireEvent.change(venueInput, { target: { value: 'Test Venue' } });
    fireEvent.change(capacityInput, { target: { value: '100' } });

    expect(titleInput).toHaveValue('Test Comedy Night');
    expect(venueInput).toHaveValue('Test Venue');
    expect(capacityInput).toHaveValue(100);
  });

  it('manages requirements correctly', async () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    // Find the requirements input and add button
    const requirementInput = screen.getByPlaceholderText(/add a requirement/i);
    const addButton = requirementInput.nextElementSibling;

    // Add a requirement
    fireEvent.change(requirementInput, { target: { value: 'Clean material only' } });
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(screen.getByText('Clean material only')).toBeInTheDocument();
    });
  });

  it('toggles recurring event settings', async () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    const recurringCheckbox = screen.getByLabelText(/this is a recurring event/i);
    fireEvent.click(recurringCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Recurrence Pattern')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
    });
  });

  it('switches between external and internal ticketing', async () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    // Should start with external ticketing
    expect(screen.getByText('Ticket Purchase URL')).toBeInTheDocument();

    // Switch to internal ticketing
    const ticketingSelect = screen.getByDisplayValue(/external platform/i);
    fireEvent.change(ticketingSelect, { target: { value: 'internal' } });

    await waitFor(() => {
      expect(screen.getByText('Fee Handling')).toBeInTheDocument();
      expect(screen.getByText('Ticket Types')).toBeInTheDocument();
    });
  });

  it('renders action buttons correctly', () => {
    render(
      <TestWrapper>
        <CreateEventForm />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish event/i })).toBeInTheDocument();
  });
});