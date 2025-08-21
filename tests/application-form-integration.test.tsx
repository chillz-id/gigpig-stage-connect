import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ApplicationFormData } from '@/types/application';
import { vi } from 'vitest';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ApplicationForm Integration', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    eventId: 'test-event-id',
    eventTitle: 'Test Comedy Show',
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required fields', () => {
    render(<ApplicationForm {...defaultProps} />);

    // Check for message field
    expect(screen.getByLabelText(/message to promoter/i)).toBeInTheDocument();
    
    // Check for spot type radio buttons
    expect(screen.getByLabelText(/mc \(host\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/feature act/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/headliner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/guest spot/i)).toBeInTheDocument();
    
    // Check for checkboxes
    expect(screen.getByLabelText(/i confirm my availability/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i meet all event requirements/i)).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    const { getByText } = render(<ApplicationForm {...defaultProps} />);
    
    // Try to submit without checking required fields
    const submitButton = getByText('Submit Application');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits form with all fields filled', async () => {
    render(<ApplicationForm {...defaultProps} />);

    // Fill in the form
    const messageInput = screen.getByPlaceholderText(/tell the promoter/i);
    fireEvent.change(messageInput, { target: { value: 'I would love to perform!' } });

    // Select spot type
    const featureRadio = screen.getByLabelText(/feature act/i);
    fireEvent.click(featureRadio);

    // Check both checkboxes
    const availabilityCheckbox = screen.getByLabelText(/i confirm my availability/i);
    const requirementsCheckbox = screen.getByLabelText(/i meet all event requirements/i);
    fireEvent.click(availabilityCheckbox);
    fireEvent.click(requirementsCheckbox);

    // Submit the form
    const submitButton = screen.getByText('Submit Application');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        event_id: 'test-event-id',
        message: 'I would love to perform!',
        spot_type: 'Feature',
        availability_confirmed: true,
        requirements_acknowledged: true,
      });
    });
  });

  it('allows submission with empty optional message', async () => {
    render(<ApplicationForm {...defaultProps} />);

    // Don't fill message (it's optional)
    
    // Check both required checkboxes
    const availabilityCheckbox = screen.getByLabelText(/i confirm my availability/i);
    const requirementsCheckbox = screen.getByLabelText(/i meet all event requirements/i);
    fireEvent.click(availabilityCheckbox);
    fireEvent.click(requirementsCheckbox);

    // Submit the form
    const submitButton = screen.getByText('Submit Application');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        event_id: 'test-event-id',
        message: '',
        spot_type: 'Feature', // Default value
        availability_confirmed: true,
        requirements_acknowledged: true,
      });
    });
  });

  it('shows loading state when submitting', () => {
    render(<ApplicationForm {...defaultProps} isSubmitting={true} />);
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    
    // Buttons should be disabled
    const cancelButton = screen.getByText('Cancel');
    const submitButton = screen.getByText('Submitting...').closest('button');
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('is mobile responsive', () => {
    render(<ApplicationForm {...defaultProps} />);
    
    const dialogContent = screen.getByRole('dialog');
    expect(dialogContent).toHaveClass('max-h-[90vh]', 'overflow-y-auto');
  });
});