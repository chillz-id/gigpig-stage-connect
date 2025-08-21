import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApplicationDialog } from '@/components/events/ApplicationDialog';
import { EventCard } from '@/components/events/EventCard';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'comedian@test.com'
          }
        }
      })
    }
  }
}));

describe('Application Flow Integration Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const mockEvent = {
    id: 'test-event-id',
    title: 'Comedy Night',
    date: '2024-12-25',
    time: '20:00',
    venue: 'The Laugh Factory',
    description: 'A night of laughs',
    ticket_price: 20,
    capacity: 100,
    status: 'open' as const,
    applications: []
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Application Form', () => {
    it('renders all required form fields', async () => {
      render(
        <TestWrapper>
          <ApplicationDialog 
            event={mockEvent}
            isOpen={true}
            onOpenChange={() => {}}
          />
        </TestWrapper>
      );

      // Check form elements
      expect(screen.getByText(/Apply to Comedy Night/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Experience Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/I confirm I am available/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Additional Notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument();
    });

    it('validates required fields before submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ApplicationDialog 
            event={mockEvent}
            isOpen={true}
            onOpenChange={() => {}}
          />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /Submit Application/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/Please select your experience level/i)).toBeInTheDocument();
      });
    });

    it('submits application with all fields', async () => {
      const user = userEvent.setup();
      const mockInsert = vi.fn().mockResolvedValue({ data: { id: 'new-app-id' }, error: null });
      
      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      render(
        <TestWrapper>
          <ApplicationDialog 
            event={mockEvent}
            isOpen={true}
            onOpenChange={() => {}}
          />
        </TestWrapper>
      );

      // Fill out form
      const experienceSelect = screen.getByLabelText(/Experience Level/i);
      await user.selectOptions(experienceSelect, 'intermediate');

      const availabilityCheckbox = screen.getByLabelText(/I confirm I am available/i);
      await user.click(availabilityCheckbox);

      const notesTextarea = screen.getByLabelText(/Additional Notes/i);
      await user.type(notesTextarea, 'Looking forward to performing!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Submit Application/i });
      await user.click(submitButton);

      // Verify submission
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          event_id: 'test-event-id',
          user_id: 'test-user-id',
          experience_level: 'intermediate',
          availability_confirmed: true,
          additional_notes: 'Looking forward to performing!',
          status: 'pending'
        });
      });
    });
  });

  describe('Application Status Display', () => {
    it('shows applied status on event card', () => {
      const eventWithApplication = {
        ...mockEvent,
        applications: [{
          id: 'app-id',
          user_id: 'test-user-id',
          status: 'pending'
        }]
      };

      render(
        <TestWrapper>
          <EventCard event={eventWithApplication} />
        </TestWrapper>
      );

      // Should show applied badge
      expect(screen.getByText(/Applied/i)).toBeInTheDocument();
      expect(screen.getByText(/Applied/i)).toHaveClass('bg-yellow-500');
    });

    it('shows different status colors', () => {
      const eventWithAcceptedApp = {
        ...mockEvent,
        applications: [{
          id: 'app-id',
          user_id: 'test-user-id',
          status: 'accepted'
        }]
      };

      render(
        <TestWrapper>
          <EventCard event={eventWithAcceptedApp} />
        </TestWrapper>
      );

      // Should show accepted badge with green color
      expect(screen.getByText(/Accepted/i)).toBeInTheDocument();
      expect(screen.getByText(/Accepted/i)).toHaveClass('bg-green-500');
    });
  });
});