/**
 * Unit tests for QuickSignUpCard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickSignUpCard } from '@/components/comedian/QuickSignUpCard';
import { useAvailabilitySelection } from '@/hooks/useAvailabilitySelection';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock the availability service
jest.mock('@/services/availability/availability-service', () => ({
  availabilityService: {
    getUserAvailability: jest.fn(),
    batchUpdateAvailability: jest.fn(),
  },
}));

// Mock the useAvailabilitySelection hook
jest.mock('@/hooks/useAvailabilitySelection');

// Mock the formatEventTime utility
jest.mock('@/utils/formatEventTime', () => ({
  formatEventTime: (value: string | null | undefined) => {
    if (!value) return 'TBC';
    return '8:00pm'; // Simplified mock
  },
}));

const mockUseAvailabilitySelection = useAvailabilitySelection as jest.MockedFunction<
  typeof useAvailabilitySelection
>;

describe('QuickSignUpCard', () => {
  const mockEvent = {
    id: 'event-123',
    name: 'Comedy Night at The Laugh Factory',
    start_date: '2025-11-15T20:00:00',
    venue_name: 'The Laugh Factory',
    source_id: 'htx-123',
    created_at: '2025-10-01',
  };

  const mockToggleEvent = jest.fn();
  const mockSelectWeekday = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseAvailabilitySelection.mockReturnValue({
      selectedEvents: new Set(),
      toggleEvent: mockToggleEvent,
      selectWeekday: mockSelectWeekday,
      isSaving: false,
      lastSaved: null,
    });
  });

  describe('Rendering', () => {
    it('should render event details correctly', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      expect(screen.getByText('Comedy Night at The Laugh Factory')).toBeInTheDocument();
      expect(screen.getByText('The Laugh Factory')).toBeInTheDocument();
      expect(screen.getByText(/8:00pm/)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should render with default border when not selected', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const card = screen.getByTestId('quick-signup-card');
      expect(card).toHaveClass('border-2');
      expect(card).not.toHaveClass('border-primary');
    });

    it('should render with primary border when selected', () => {
      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(['event-123']),
        toggleEvent: mockToggleEvent,
        selectWeekday: mockSelectWeekday,
        isSaving: false,
        lastSaved: null,
      });

      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const card = screen.getByTestId('quick-signup-card');
      expect(card).toHaveClass('border-primary');
    });
  });

  describe('Checkbox Interaction', () => {
    it('should have unchecked checkbox when event not selected', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should have checked checkbox when event is selected', () => {
      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(['event-123']),
        toggleEvent: mockToggleEvent,
        selectWeekday: mockSelectWeekday,
        isSaving: false,
        lastSaved: null,
      });

      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should call toggleEvent with correct event ID when checkbox clicked', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockToggleEvent).toHaveBeenCalledWith('event-123');
      expect(mockToggleEvent).toHaveBeenCalledTimes(1);
    });

    it('should disable checkbox when saving', () => {
      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: mockToggleEvent,
        selectWeekday: mockSelectWeekday,
        isSaving: true,
        lastSaved: null,
      });

      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Save Status Display', () => {
    it('should show "Saving..." when isSaving is true', () => {
      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: mockToggleEvent,
        selectWeekday: mockSelectWeekday,
        isSaving: true,
        lastSaved: null,
      });

      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show "Saved at" timestamp when lastSaved exists', () => {
      const savedDate = new Date('2025-10-29T15:45:00');
      mockUseAvailabilitySelection.mockReturnValue({
        selectedEvents: new Set(),
        toggleEvent: mockToggleEvent,
        selectWeekday: mockSelectWeekday,
        isSaving: false,
        lastSaved: savedDate,
      });

      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      expect(screen.getByText(/Saved at/)).toBeInTheDocument();
      expect(screen.getByText(/3:45pm/)).toBeInTheDocument();
    });

    it('should not show save status when not saving and no lastSaved', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.queryByText(/Saved at/)).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      // Check that the date is displayed (format: "Fri, Nov 15")
      expect(screen.getByText(/Nov 15/)).toBeInTheDocument();
    });

    it('should handle null start_date gracefully', () => {
      const eventWithNullDate = {
        ...mockEvent,
        start_date: null,
      };

      render(<QuickSignUpCard event={eventWithNullDate} userId="user-123" />);

      // Both date and time show "TBC" when start_date is null
      const tbcElements = screen.getAllByText('TBC');
      expect(tbcElements.length).toBeGreaterThanOrEqual(2); // Date and time both show TBC
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName(/Comedy Night at The Laugh Factory/);
    });

    it('should support keyboard navigation', () => {
      render(<QuickSignUpCard event={mockEvent} userId="user-123" />);

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });
  });
});
