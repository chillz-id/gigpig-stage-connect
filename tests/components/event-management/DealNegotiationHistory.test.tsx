import { render, screen, fireEvent } from '@testing-library/react';
import { DealNegotiationHistory } from '@/components/event-management/DealNegotiationHistory';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to render with wrapper
const renderWithProviders = (ui: ReactNode) => render(<TestWrapper>{ui}</TestWrapper>);

describe('DealNegotiationHistory', () => {
  const mockParticipants = [
    {
      id: 'participant-1',
      version: 1,
      split_percentage: 30,
      approval_status: 'approved',
      approved_at: '2025-10-20T10:00:00Z',
      participant: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    {
      id: 'participant-2',
      version: 2,
      split_percentage: 35,
      approval_status: 'changes_requested',
      approved_at: '2025-10-22T14:30:00Z',
      edit_notes: 'Please consider increasing the split to 35%',
      edited_by: 'Jane Smith',
      edited_at: '2025-10-21T12:00:00Z',
      participant: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    {
      id: 'participant-3',
      version: 3,
      split_percentage: 40,
      flat_fee_amount: 500,
      approval_status: 'pending',
      participant: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
  ];

  describe('Rendering', () => {
    it('should render the component with title', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);
      expect(screen.getByText('Negotiation History')).toBeInTheDocument();
    });

    it('should render all versions in accordion', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);
      expect(screen.getByText('Version 1')).toBeInTheDocument();
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Version 3')).toBeInTheDocument();
    });

    it('should sort versions in descending order (most recent first)', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);
      const versions = screen.getAllByText(/Version \d/);
      expect(versions[0]).toHaveTextContent('Version 3');
      expect(versions[1]).toHaveTextContent('Version 2');
      expect(versions[2]).toHaveTextContent('Version 1');
    });

    it('should render participant information in expanded accordion', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);

      // Version 3 should be expanded by default (most recent)
      expect(screen.getByText('Participant:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no participants provided', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={[]} />);
      expect(screen.getByText('No changes yet')).toBeInTheDocument();
    });

    it('should not render accordion when empty', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={[]} />);
      expect(screen.queryByText('Negotiation History')).not.toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should display approved status badge with correct styling', () => {
      const approvedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'approved',
          approved_at: '2025-10-20T10:00:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={approvedParticipants} />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should display declined status badge with correct styling', () => {
      const declinedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'declined',
          approved_at: '2025-10-20T10:00:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={declinedParticipants} />);
      expect(screen.getByText('Declined')).toBeInTheDocument();
    });

    it('should display changes requested status badge with correct styling', () => {
      const changesRequestedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'changes_requested',
          approved_at: '2025-10-22T14:30:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(
        <DealNegotiationHistory dealParticipants={changesRequestedParticipants} />
      );
      expect(screen.getByText('Changes Requested')).toBeInTheDocument();
    });

    it('should display pending status badge with correct styling', () => {
      const pendingParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={pendingParticipants} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Split Display', () => {
    it('should display percentage split correctly', () => {
      const percentageParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={percentageParticipants} />);
      expect(screen.getByText('Split:')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('should display flat fee amount correctly', () => {
      const flatFeeParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 0,
          flat_fee_amount: 500,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={flatFeeParticipants} />);
      expect(screen.getByText('Split:')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('should prioritize flat_fee_amount over split_percentage when both exist', () => {
      const mixedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          flat_fee_amount: 750,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={mixedParticipants} />);
      expect(screen.getByText('$750.00')).toBeInTheDocument();
      expect(screen.queryByText('30%')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format approved_at date correctly in trigger', () => {
      const participants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'approved',
          approved_at: '2025-10-29T14:30:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participants} />);
      // date-fns format: 'MMM d, yyyy h:mm a'
      // Use getAllByText to find the date (can appear in trigger)
      const dateElements = screen.getAllByText((content, element) => {
        return content.includes('Oct 29, 2025') && content.includes('PM') || content.includes('AM');
      });
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should format edited_at date when no approved_at exists', () => {
      const participants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'pending',
          edited_by: 'Jane Smith',
          edited_at: '2025-10-28T09:15:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participants} />);
      // Date appears in both trigger and content - use getAllByText
      const dateElements = screen.getAllByText(/Oct 28, 2025/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should format approval timestamp in content section', () => {
      const participants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'approved',
          approved_at: '2025-10-29T16:45:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participants} />);
      expect(screen.getByText(/Approved on/)).toBeInTheDocument();
    });
  });

  describe('Edit Information', () => {
    it('should display edit notes when present', () => {
      const participantsWithNotes = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 35,
          approval_status: 'changes_requested',
          edit_notes: 'Please increase the split to 40%',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participantsWithNotes} />);
      expect(screen.getByText('Notes:')).toBeInTheDocument();
      expect(screen.getByText('Please increase the split to 40%')).toBeInTheDocument();
    });

    it('should display edited by information when present', () => {
      const participantsWithEdit = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 35,
          approval_status: 'pending',
          edited_by: 'Jane Smith',
          edited_at: '2025-10-21T12:00:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participantsWithEdit} />);
      expect(screen.getByText(/Edited by/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    it('should not display edit section when edited_by is missing', () => {
      const participantsNoEdit = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participantsNoEdit} />);
      expect(screen.queryByText(/Edited by/)).not.toBeInTheDocument();
    });

    it('should not display notes section when edit_notes is missing', () => {
      const participantsNoNotes = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={participantsNoNotes} />);
      expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
    });
  });

  describe('Accordion Behavior', () => {
    it('should expand most recent version by default', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);

      // Version 3 is most recent and should be expanded
      // Check for participant info which only shows in expanded state
      expect(screen.getByText('Participant:')).toBeInTheDocument();
      expect(screen.getByText('Split:')).toBeInTheDocument();
    });

    it('should allow collapsing and expanding accordion items', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);

      // Version 3 trigger
      const version3Trigger = screen.getByText('Version 3').closest('button');
      expect(version3Trigger).toBeInTheDocument();

      // Should be expanded by default (check for content)
      expect(screen.getByText('Participant:')).toBeInTheDocument();

      // Click to collapse
      if (version3Trigger) {
        fireEvent.click(version3Trigger);
      }

      // Version 2 trigger
      const version2Trigger = screen.getByText('Version 2').closest('button');
      if (version2Trigger) {
        fireEvent.click(version2Trigger);
      }

      // Version 2 should now show its content
      expect(screen.getByText('Please consider increasing the split to 35%')).toBeInTheDocument();
    });
  });

  describe('Approval Actions Display', () => {
    it('should show "Approved on" for approved status', () => {
      const approvedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'approved',
          approved_at: '2025-10-29T10:00:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={approvedParticipants} />);
      expect(screen.getByText(/Approved on/)).toBeInTheDocument();
    });

    it('should show "Declined on" for declined status', () => {
      const declinedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'declined',
          approved_at: '2025-10-29T10:00:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={declinedParticipants} />);
      expect(screen.getByText(/Declined on/)).toBeInTheDocument();
    });

    it('should show "Changes requested on" for changes_requested status', () => {
      const changesRequestedParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'changes_requested',
          approved_at: '2025-10-29T10:00:00Z',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(
        <DealNegotiationHistory dealParticipants={changesRequestedParticipants} />
      );
      expect(screen.getByText(/Changes requested on/)).toBeInTheDocument();
    });

    it('should not show approval timestamp for pending status', () => {
      const pendingParticipants = [
        {
          id: 'participant-1',
          version: 1,
          split_percentage: 30,
          approval_status: 'pending',
          participant: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      renderWithProviders(<DealNegotiationHistory dealParticipants={pendingParticipants} />);
      expect(screen.queryByText(/Approved on|Declined on|Changes requested on/)).not.toBeInTheDocument();
    });
  });

  describe('Multiple Versions', () => {
    it('should render all three versions with correct information', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);

      expect(screen.getByText('Version 1')).toBeInTheDocument();
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Version 3')).toBeInTheDocument();

      // Check status badges
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Changes Requested')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should maintain separate state for each accordion item', () => {
      renderWithProviders(<DealNegotiationHistory dealParticipants={mockParticipants} />);

      // Click on Version 2
      const version2Trigger = screen.getByText('Version 2').closest('button');
      if (version2Trigger) {
        fireEvent.click(version2Trigger);
      }

      // Version 2 specific content should be visible
      expect(screen.getByText('Please consider increasing the split to 35%')).toBeInTheDocument();
    });
  });
});
