import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ApplicationForm, ApplicationFormData } from '@/components/ApplicationForm';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ApplicationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    eventId: 'test-event-id',
    eventTitle: 'Test Event',
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<ApplicationForm {...defaultProps} />);

    expect(screen.getByText('Apply to Test Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/Message to Promoter/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Spot Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/I confirm my availability/)).toBeInTheDocument();
    expect(screen.getByLabelText(/I meet all event requirements/)).toBeInTheDocument();
  });

  it('shows validation errors when required fields are missing', async () => {
    const { toast } = await import('@/hooks/use-toast');
    render(<ApplicationForm {...defaultProps} />);

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Submit Application'));

    await waitFor(() => {
      expect(toast.toast).toHaveBeenCalledWith({
        title: 'Message required',
        description: 'Please provide a message with your application.',
        variant: 'destructive',
      });
    });
  });

  it('shows validation error when availability is not confirmed', async () => {
    const { toast } = await import('@/hooks/use-toast');
    render(<ApplicationForm {...defaultProps} />);

    // Fill message but don't confirm availability
    fireEvent.change(screen.getByLabelText(/Message to Promoter/), {
      target: { value: 'Test message' },
    });

    // Check requirements acknowledged but not availability
    fireEvent.click(screen.getByLabelText(/I meet all event requirements/));

    fireEvent.click(screen.getByText('Submit Application'));

    await waitFor(() => {
      expect(toast.toast).toHaveBeenCalledWith({
        title: 'Availability confirmation required',
        description: 'Please confirm your availability for this event.',
        variant: 'destructive',
      });
    });
  });

  it('shows validation error when requirements are not acknowledged', async () => {
    const { toast } = await import('@/hooks/use-toast');
    render(<ApplicationForm {...defaultProps} />);

    // Fill message and confirm availability but don't acknowledge requirements
    fireEvent.change(screen.getByLabelText(/Message to Promoter/), {
      target: { value: 'Test message' },
    });

    fireEvent.click(screen.getByLabelText(/I confirm my availability/));

    fireEvent.click(screen.getByText('Submit Application'));

    await waitFor(() => {
      expect(toast.toast).toHaveBeenCalledWith({
        title: 'Requirements acknowledgment required',
        description: 'Please acknowledge that you meet the event requirements.',
        variant: 'destructive',
      });
    });
  });

  it('submits the form with correct data when all fields are filled', async () => {
    render(<ApplicationForm {...defaultProps} />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/Message to Promoter/), {
      target: { value: 'I would love to perform at your show!' },
    });

    // Select spot type
    fireEvent.click(screen.getByLabelText('Headliner'));

    // Confirm availability and requirements
    fireEvent.click(screen.getByLabelText(/I confirm my availability/));
    fireEvent.click(screen.getByLabelText(/I meet all event requirements/));

    fireEvent.click(screen.getByText('Submit Application'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        event_id: 'test-event-id',
        message: 'I would love to perform at your show!',
        spot_type: 'Headliner',
        availability_confirmed: true,
        requirements_acknowledged: true,
      });
    });
  });

  it('disables form when submitting', () => {
    render(<ApplicationForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('closes the form when cancel is clicked', () => {
    render(<ApplicationForm {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('defaults to Feature spot type', () => {
    render(<ApplicationForm {...defaultProps} />);

    expect(screen.getByLabelText('Feature Act')).toBeChecked();
  });

  it('allows changing spot type selection', () => {
    render(<ApplicationForm {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('MC (Host)'));

    expect(screen.getByLabelText('MC (Host)')).toBeChecked();
    expect(screen.getByLabelText('Feature Act')).not.toBeChecked();
  });
});