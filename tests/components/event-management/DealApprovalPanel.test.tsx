import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealApprovalPanel } from '@/components/event-management/DealApprovalPanel';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to render with wrapper
const renderWithProviders = (ui: ReactNode) => render(<TestWrapper>{ui}</TestWrapper>);

describe('DealApprovalPanel', () => {
  const mockOnApprove = jest.fn();
  const mockOnRequestChanges = jest.fn();
  const mockOnDecline = jest.fn();

  const mockDealParticipant = {
    id: 'participant-1',
    deal_id: 'deal-1',
    participant_id: 'user-1',
    participant_type: 'comedian',
    split_percentage: 30,
    split_type: 'percentage' as const,
    approval_status: 'pending' as const,
    gst_mode: 'inclusive' as const,
  };

  const mockDealDetails = {
    deal_name: 'Comedy Night Gig',
    deal_type: 'Headline Show',
    total_amount: 1000,
    description: 'A great comedy show at the best venue',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Terms Display', () => {
    it('should render deal name and type', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Comedy Night Gig')).toBeInTheDocument();
      expect(screen.getByText(/Headline Show/)).toBeInTheDocument();
      expect(screen.getByText(/comedian/)).toBeInTheDocument();
    });

    it('should display split percentage correctly', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Split Percentage:')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('should display flat fee amount when split_type is flat_fee', () => {
      const flatFeeParticipant = {
        ...mockDealParticipant,
        split_type: 'flat_fee' as const,
        flat_fee_amount: 500,
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={flatFeeParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Fixed Payment:')).toBeInTheDocument();
      // The amount appears twice (in the terms and in expected payment)
      const amounts = screen.getAllByText('$500.00');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('should display GST mode badge', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('GST Mode:')).toBeInTheDocument();
      expect(screen.getByText('INCLUSIVE')).toBeInTheDocument();
    });

    it('should display deal description when provided', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('A great comedy show at the best venue')).toBeInTheDocument();
    });

    it('should display participant notes when provided', () => {
      const participantWithNotes = {
        ...mockDealParticipant,
        notes: 'Please review the updated terms',
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={participantWithNotes}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Please review the updated terms')).toBeInTheDocument();
    });

    it('should calculate expected payment for percentage split without manager commission', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      // 1000 * 30% = 300
      expect(screen.getByText('$300.00')).toBeInTheDocument();
    });

    it('should calculate expected payment with manager commission', () => {
      const managerCommission = {
        rate: 10,
        amount: 30, // 10% of 300
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          managerCommission={managerCommission}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Manager Commission: 10%')).toBeInTheDocument();
      expect(screen.getByText('-$30.00')).toBeInTheDocument();
      // 300 - 30 = 270
      expect(screen.getByText('$270.00')).toBeInTheDocument();
    });

    it('should calculate expected payment for flat fee without manager commission', () => {
      const flatFeeParticipant = {
        ...mockDealParticipant,
        split_type: 'flat_fee' as const,
        flat_fee_amount: 500,
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={flatFeeParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Expected Payment:')).toBeInTheDocument();
      // The amount appears twice (in the terms and in expected payment)
      const amounts = screen.getAllByText('$500.00');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('should calculate expected payment for flat fee with manager commission', () => {
      const flatFeeParticipant = {
        ...mockDealParticipant,
        split_type: 'flat_fee' as const,
        flat_fee_amount: 500,
      };

      const managerCommission = {
        rate: 15,
        amount: 75, // 15% of 500
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={flatFeeParticipant}
          dealDetails={mockDealDetails}
          managerCommission={managerCommission}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Manager Commission: 15%')).toBeInTheDocument();
      expect(screen.getByText('-$75.00')).toBeInTheDocument();
      // 500 - 75 = 425
      expect(screen.getByText('$425.00')).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('should show pending status badge for pending approval', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should show approved status badge when approved', () => {
      const approvedParticipant = {
        ...mockDealParticipant,
        approval_status: 'approved' as const,
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={approvedParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should show declined status badge when declined', () => {
      const declinedParticipant = {
        ...mockDealParticipant,
        approval_status: 'declined' as const,
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={declinedParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Declined')).toBeInTheDocument();
    });

    it('should show changes requested status badge', () => {
      const changesRequestedParticipant = {
        ...mockDealParticipant,
        approval_status: 'changes_requested' as const,
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={changesRequestedParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByText('Changes Requested')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render all three action buttons when status is pending', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByRole('button', { name: /approve deal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decline deal/i })).toBeInTheDocument();
    });

    it('should disable buttons when status is not pending', () => {
      const approvedParticipant = {
        ...mockDealParticipant,
        approval_status: 'approved' as const,
      };

      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={approvedParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByRole('button', { name: /approve deal/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /request changes/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /decline deal/i })).toBeDisabled();
    });

    it('should disable buttons when isLoading is true', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /request changes/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /decline deal/i })).toBeDisabled();
    });

    it('should show loading text when isLoading is true', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
          isLoading={true}
        />
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should call onApprove when approve button clicked', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /approve deal/i }));
      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request Changes Modal', () => {
    it('should open request changes modal when button clicked', async () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /request changes/i }));
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      // Text appears in button and dialog title
      const requestChangesTexts = screen.getAllByText('Request Changes');
      expect(requestChangesTexts.length).toBeGreaterThan(0);
    });

    it('should validate edit notes minimum length', async () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /request changes/i }));

      const editNotesInput = screen.getByPlaceholderText(/Explain what changes/i);
      fireEvent.change(editNotesInput, { target: { value: 'short' } });

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/edit notes must be at least 10 characters/i)).toBeInTheDocument();
      });

      expect(mockOnRequestChanges).not.toHaveBeenCalled();
    });

    it('should submit request changes with valid edit notes', async () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /request changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const editNotesInput = screen.getByPlaceholderText(/Explain what changes/i);
      fireEvent.change(editNotesInput, {
        target: { value: 'I would like a higher split percentage' },
      });

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockOnRequestChanges).toHaveBeenCalledWith(
            'I would like a higher split percentage',
            undefined
          );
        },
        { timeout: 3000 }
      );
    });

    it('should submit request changes with edit notes and new split', async () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /request changes/i }));

      const editNotesInput = screen.getByPlaceholderText(/Explain what changes/i);
      fireEvent.change(editNotesInput, {
        target: { value: 'I would like a higher split percentage' },
      });

      const newSplitInput = screen.getByPlaceholderText(/e.g., 25/i);
      fireEvent.change(newSplitInput, { target: { value: '40' } });

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnRequestChanges).toHaveBeenCalledWith(
          'I would like a higher split percentage',
          40
        );
      });
    });

    it('should close modal when cancel button clicked', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /request changes/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Decline Confirmation', () => {
    it('should open decline confirmation when decline button clicked', async () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /decline deal/i }));

      await waitFor(() => {
        expect(screen.getAllByText('Decline Deal').length).toBeGreaterThan(0);
      });
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('should require decline reason', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /decline deal/i }));

      const confirmButton = screen.getByRole('button', { name: /confirm decline/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when reason provided', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /decline deal/i }));

      const reasonInput = screen.getByPlaceholderText(/Explain why/i);
      fireEvent.change(reasonInput, {
        target: { value: 'The terms are not acceptable' },
      });

      const confirmButton = screen.getByRole('button', { name: /confirm decline/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should call onDecline with reason when confirmed', () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /decline deal/i }));

      const reasonInput = screen.getByPlaceholderText(/Explain why/i);
      fireEvent.change(reasonInput, {
        target: { value: 'The terms are not acceptable' },
      });

      const confirmButton = screen.getByRole('button', { name: /confirm decline/i });
      fireEvent.click(confirmButton);

      expect(mockOnDecline).toHaveBeenCalledWith('The terms are not acceptable');
    });

    it('should close dialog when cancel clicked', async () => {
      renderWithProviders(
        <DealApprovalPanel
          dealParticipant={mockDealParticipant}
          dealDetails={mockDealDetails}
          onApprove={mockOnApprove}
          onRequestChanges={mockOnRequestChanges}
          onDecline={mockOnDecline}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /decline deal/i }));

      await waitFor(() => {
        expect(screen.getAllByText('Decline Deal').length).toBeGreaterThan(0);
      });

      const cancelButtons = screen.getAllByRole('button', { name: /^cancel$/i });
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        const declineTexts = screen.queryAllByText('Decline Deal');
        expect(declineTexts.length).toBe(1); // Only the button text remains
      });
    });
  });
});
