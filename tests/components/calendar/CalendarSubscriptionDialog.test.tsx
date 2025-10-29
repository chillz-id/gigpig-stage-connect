import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/contexts/ThemeContext';
import React from 'react';

// Mock the hook BEFORE importing the component
jest.mock('@/hooks/useCalendarSubscription', () => ({
  getSupabaseUrl: jest.fn(() => 'http://localhost:54321'),
  useCalendarSubscription: jest.fn(),
}));

import { CalendarSubscriptionDialog } from '@/components/calendar/CalendarSubscriptionDialog';
import { useCalendarSubscription } from '@/hooks/useCalendarSubscription';

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

const mockUseCalendarSubscription = useCalendarSubscription as jest.MockedFunction<typeof useCalendarSubscription>;

describe('CalendarSubscriptionDialog', () => {
  const mockSubscription = {
    id: 'sub-123',
    token: 'test-token-456',
    created_at: '2025-10-29T10:00:00Z',
    last_accessed_at: '2025-10-29T10:30:00Z',
  };

  const mockHookReturn = {
    subscription: mockSubscription,
    isLoading: false,
    regenerateToken: jest.fn(),
    isRegenerating: false,
    getSubscriptionUrl: jest.fn((token: string, format: 'webcal' | 'https' = 'webcal') => {
      const protocol = format === 'webcal' ? 'webcal://' : 'https://';
      return `${protocol}localhost:54321/functions/v1/calendar-feed/${token}.ics`;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCalendarSubscription.mockReturnValue(mockHookReturn);

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it('should not render when closed', () => {
    renderWithProviders(<CalendarSubscriptionDialog open={false} onOpenChange={jest.fn()} />);
    expect(screen.queryByText('Subscribe to Your Calendar')).not.toBeInTheDocument();
  });

  it('should not render when loading', () => {
    mockUseCalendarSubscription.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });

    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.queryByText('Subscribe to Your Calendar')).not.toBeInTheDocument();
  });

  it('should not render when no subscription', () => {
    mockUseCalendarSubscription.mockReturnValue({
      ...mockHookReturn,
      subscription: null,
    });

    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.queryByText('Subscribe to Your Calendar')).not.toBeInTheDocument();
  });

  it('should render dialog with subscription URL when open', () => {
    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    expect(screen.getByText('Subscribe to Your Calendar')).toBeInTheDocument();
    expect(screen.getByDisplayValue('webcal://localhost:54321/functions/v1/calendar-feed/test-token-456.ics')).toBeInTheDocument();
  });

  it('should have copy button present', () => {
    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    // Find the copy button by finding all buttons and selecting the icon-only one next to input
    const buttons = screen.getAllByRole('button');
    const copyButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.classList.contains('h-10'); // Icon buttons have h-10 class
    });

    expect(copyButton).toBeDefined();
  });

  it('should show platform-specific instructions', () => {
    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    // Check tabs are present
    expect(screen.getByRole('tab', { name: /apple/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /outlook/i })).toBeInTheDocument();

    // Apple instructions should be visible by default
    expect(screen.getByText('Apple Calendar (Mac/iPhone/iPad)')).toBeInTheDocument();
  });

  it('should switch between platform tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    // Click Google tab
    const googleTab = screen.getByRole('tab', { name: /google/i });
    await user.click(googleTab);

    // Google instructions should now be visible
    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText(/Google Calendar uses HTTPS/i)).toBeInTheDocument();
    });

    // Click Outlook tab
    const outlookTab = screen.getByRole('tab', { name: /outlook/i });
    await user.click(outlookTab);

    // Outlook instructions should now be visible
    await waitFor(() => {
      expect(screen.getByText('Outlook (Desktop/Web)')).toBeInTheDocument();
    });
  });

  it('should show HTTPS URL for Google Calendar instructions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    // Switch to Google tab
    const googleTab = screen.getByRole('tab', { name: /google/i });
    await user.click(googleTab);

    // The HTTPS URL should be in the Google tab content
    await waitFor(() => {
      const httpsUrl = 'https://localhost:54321/functions/v1/calendar-feed/test-token-456.ics';
      expect(screen.getByText(httpsUrl, { exact: false })).toBeInTheDocument();
    });
  });

  it('should call regenerateToken when regenerate button clicked', async () => {
    const user = userEvent.setup();
    const mockRegenerateToken = jest.fn();
    mockUseCalendarSubscription.mockReturnValue({
      ...mockHookReturn,
      regenerateToken: mockRegenerateToken,
    });

    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    await user.click(regenerateButton);

    expect(mockRegenerateToken).toHaveBeenCalledTimes(1);
  });

  it('should disable regenerate button when regenerating', () => {
    mockUseCalendarSubscription.mockReturnValue({
      ...mockHookReturn,
      isRegenerating: true,
    });

    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    expect(regenerateButton).toBeDisabled();
  });

  it('should show spinning icon when regenerating', () => {
    mockUseCalendarSubscription.mockReturnValue({
      ...mockHookReturn,
      isRegenerating: true,
    });

    renderWithProviders(<CalendarSubscriptionDialog open={true} onOpenChange={jest.fn()} />);

    // Check for spinning animation class
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    const icon = regenerateButton.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });
});
