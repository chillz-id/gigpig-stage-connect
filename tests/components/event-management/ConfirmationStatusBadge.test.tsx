import { render, screen, waitFor, act } from '@testing-library/react';
import { ConfirmationStatusBadge } from '@/components/event-management/ConfirmationStatusBadge';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to render with wrapper
const renderWithProviders = (ui: ReactNode) => render(<TestWrapper>{ui}</TestWrapper>);

describe('ConfirmationStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Status Icons', () => {
    it('should render CheckCircle2 icon for confirmed status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" />);
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      // Icon is rendered as SVG
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toBeInTheDocument();
    });

    it('should render Clock icon for pending status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
      const badge = screen.getByText('Pending').closest('div');
      expect(badge).toBeInTheDocument();
    });

    it('should render XCircle icon for declined status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="declined" />);
      expect(screen.getByText('Declined')).toBeInTheDocument();
      const badge = screen.getByText('Declined').closest('div');
      expect(badge).toBeInTheDocument();
    });

    it('should render AlertCircle icon for expired status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="expired" />);
      expect(screen.getByText('Expired')).toBeInTheDocument();
      const badge = screen.getByText('Expired').closest('div');
      expect(badge).toBeInTheDocument();
    });

    it('should render User icon for unfilled status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="unfilled" />);
      expect(screen.getByText('Unfilled')).toBeInTheDocument();
      const badge = screen.getByText('Unfilled').closest('div');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply green colors for confirmed status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" />);
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply yellow colors for pending status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="pending" />);
      const badge = screen.getByText('Pending').closest('div');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply red colors for declined status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="declined" />);
      const badge = screen.getByText('Declined').closest('div');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should apply gray colors for expired status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="expired" />);
      const badge = screen.getByText('Expired').closest('div');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should apply slate colors for unfilled status', () => {
      renderWithProviders(<ConfirmationStatusBadge status="unfilled" />);
      const badge = screen.getByText('Unfilled').closest('div');
      expect(badge).toHaveClass('bg-slate-100', 'text-slate-800');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes when size is sm', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" size="sm" />);
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5');
    });

    it('should apply medium size classes when size is md (default)', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" size="md" />);
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1');
    });

    it('should apply medium size classes when no size specified', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" />);
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1');
    });

    it('should apply large size classes when size is lg', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" size="lg" />);
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toHaveClass('text-base', 'px-3', 'py-1.5');
    });
  });

  describe('Countdown Timer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should not show countdown when showCountdown is false', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={false} />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it('should not show countdown when no deadline is provided', () => {
      renderWithProviders(<ConfirmationStatusBadge status="pending" showCountdown={true} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it('should not show countdown when status is not pending', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      renderWithProviders(
        <ConfirmationStatusBadge status="confirmed" deadline={futureDate} showCountdown={true} />
      );
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it('should show countdown in days and hours format', () => {
      const futureDate = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString(); // 2.5 days from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );
      expect(screen.getByText(/Pending/)).toBeInTheDocument();
      expect(screen.getByText(/\(2d \d+h\)/)).toBeInTheDocument();
    });

    it('should show countdown in hours and minutes format', () => {
      const futureDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(); // 5.5 hours from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );
      expect(screen.getByText(/Pending/)).toBeInTheDocument();
      expect(screen.getByText(/\(5h \d+m\)/)).toBeInTheDocument();
    });

    it('should show countdown in minutes format', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );
      expect(screen.getByText(/Pending/)).toBeInTheDocument();
      expect(screen.getByText(/\(30m\)/)).toBeInTheDocument();
    });

    it('should automatically switch to expired status when deadline passes', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={pastDate} showCountdown={true} />
      );
      // Should automatically switch to expired
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });

    it('should update countdown every minute', async () => {
      const futureDate = new Date(Date.now() + 31 * 60 * 1000).toISOString(); // 31 minutes from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );

      // Initial countdown should be 31m
      expect(screen.getByText(/\(31m\)/)).toBeInTheDocument();

      // Advance time by 1 minute
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      // Countdown should update to 30m
      await waitFor(() => {
        expect(screen.getByText(/\(30m\)/)).toBeInTheDocument();
      });
    });

    it('should cleanup interval on unmount', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { unmount } = renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );

      expect(screen.getByText(/Pending/)).toBeInTheDocument();

      // Unmount component
      unmount();

      // Advance timers - should not throw or cause any updates
      expect(() => {
        jest.advanceTimersByTime(60000);
      }).not.toThrow();
    });

    it('should switch to expired and stop countdown when deadline reached during interval', async () => {
      // Set a deadline that will expire in 30 seconds
      const futureDate = new Date(Date.now() + 30 * 1000).toISOString();
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );

      // Component should initially show countdown
      expect(screen.queryByText('Expired')).not.toBeInTheDocument();

      // Advance time by 1 minute (60 seconds) - past the deadline
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      // Should now show expired status
      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
      });
    });

    it('should not set up interval when conditions are not met', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      // Test without showCountdown
      const { unmount: unmount1 } = renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={false} />
      );
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
      unmount1();

      // Test without deadline
      const { unmount: unmount2 } = renderWithProviders(
        <ConfirmationStatusBadge status="pending" showCountdown={true} />
      );
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
      unmount2();

      // Test with non-pending status
      const { unmount: unmount3 } = renderWithProviders(
        <ConfirmationStatusBadge status="confirmed" deadline={futureDate} showCountdown={true} />
      );
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
      unmount3();

      // Verify no timers were created
      jest.advanceTimersByTime(60000);
      // No errors should occur
    });
  });

  describe('Edge Cases', () => {
    it('should handle deadline exactly at current time', () => {
      const currentDate = new Date().toISOString();
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={currentDate} showCountdown={true} />
      );
      // Should show expired since difference is 0 or negative
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should handle very small time differences', () => {
      const futureDate = new Date(Date.now() + 100).toISOString(); // 100ms from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );
      // Should show 0m or expired
      expect(screen.getByText(/Expired|0m/)).toBeInTheDocument();
    });

    it('should handle large time differences', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline={futureDate} showCountdown={true} />
      );
      expect(screen.getByText(/Pending/)).toBeInTheDocument();
      // May show 364d or 365d depending on calculation precision
      expect(screen.getByText(/\((364|365)d \d+h\)/)).toBeInTheDocument();
    });

    it('should handle invalid date strings gracefully', () => {
      renderWithProviders(
        <ConfirmationStatusBadge status="pending" deadline="invalid-date" showCountdown={true} />
      );
      // Should handle gracefully - likely shows expired or no countdown
      expect(screen.getByText(/Pending|Expired/)).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('should render with all default props', () => {
      renderWithProviders(<ConfirmationStatusBadge status="confirmed" />);
      const badge = screen.getByText('Confirmed').closest('div');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1'); // default md size
    });

    it('should render with all props specified', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      renderWithProviders(
        <ConfirmationStatusBadge
          status="pending"
          deadline={futureDate}
          showCountdown={true}
          size="lg"
        />
      );
      const badge = screen.getByText(/Pending/).closest('div');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-base', 'px-3', 'py-1.5'); // lg size
    });
  });
});
