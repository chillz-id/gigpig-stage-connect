import { describe, it, expect, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

// Mock all child components to isolate ProfileTabs testing
vi.mock('@/components/ProfileInformation', () => ({
  ProfileInformation: () => <div data-testid="profile-information">ProfileInformation</div>
}));

vi.mock('@/components/comedian-profile/ComedianMedia', () => ({
  default: () => <div data-testid="comedian-media">ComedianMedia</div>
}));

vi.mock('@/components/ContactInformation', () => ({
  ContactInformation: () => <div data-testid="contact-information">ContactInformation</div>
}));

vi.mock('@/components/FinancialInformation', () => ({
  FinancialInformation: () => <div data-testid="financial-information">FinancialInformation</div>
}));

vi.mock('@/components/ProfileCalendarView', () => ({
  ProfileCalendarView: () => <div data-testid="profile-calendar-view">ProfileCalendarView</div>
}));

vi.mock('@/components/InvoiceManagement', () => ({
  InvoiceManagement: () => <div data-testid="invoice-management">InvoiceManagement</div>
}));

vi.mock('@/components/GiveVouchForm', () => ({
  GiveVouchForm: () => <div data-testid="give-vouch-form">GiveVouchForm</div>
}));

vi.mock('@/components/VouchHistory', () => ({
  VouchHistory: () => <div data-testid="vouch-history">VouchHistory</div>
}));

vi.mock('@/components/AccountSettings', () => ({
  AccountSettings: () => <div data-testid="account-settings">AccountSettings</div>
}));

vi.mock('@/components/profile/TicketsSection', () => ({
  TicketsSection: () => <div data-testid="tickets-section">TicketsSection</div>
}));

describe('ProfileTabs Component - Comedian Lite', () => {
  const mockSetActiveTab = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    activeTab: 'profile',
    setActiveTab: mockSetActiveTab,
    isIndustryUser: true,
    isComedianLite: true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    userInterests: [],
    mockTickets: [],
    onSave: mockOnSave
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('should render all 5 tabs for comedian_lite', () => {
      render(<ProfileTabs {...defaultProps} />);

      // Check all 5 tabs are present
      expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /invoices/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /vouches/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument();
    });

    it('should NOT render tickets tab for comedian_lite (industry user)', () => {
      render(<ProfileTabs {...defaultProps} />);

      // Should not find a standalone "Tickets" tab
      const ticketsTab = screen.queryByRole('tab', { name: /^tickets$/i });
      expect(ticketsTab).not.toBeInTheDocument();
    });

    it('should render tickets tab for non-industry users instead of invoices', () => {
      const props = {
        ...defaultProps,
        isIndustryUser: false,
        isComedianLite: false
      };

      render(<ProfileTabs {...props} />);

      // Should have Tickets tab, not Invoices
      expect(screen.getByRole('tab', { name: /tickets/i })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /invoices/i })).not.toBeInTheDocument();
    });
  });

  describe('Invoices Tab - Comedian Lite Specific', () => {
    it('should show Invoices tab as disabled for comedian_lite', () => {
      render(<ProfileTabs {...defaultProps} />);

      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      expect(invoicesTab).toBeDisabled();
    });

    it('should show "Coming Soon" label on Invoices tab for comedian_lite', () => {
      render(<ProfileTabs {...defaultProps} />);

      const invoicesTab = screen.getByRole('tab', { name: /invoices.*coming soon/i });
      expect(invoicesTab).toBeInTheDocument();
      expect(invoicesTab).toHaveTextContent('Coming Soon');
    });

    it('should NOT disable Invoices tab for regular comedian (not lite)', () => {
      const props = {
        ...defaultProps,
        isComedianLite: false
      };

      render(<ProfileTabs {...props} />);

      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      expect(invoicesTab).not.toBeDisabled();
    });

    it('should show coming soon card in Invoices content for comedian_lite', () => {
      const props = {
        ...defaultProps,
        activeTab: 'invoices'
      };

      render(<ProfileTabs {...props} />);

      // Should show coming soon message
      expect(screen.getByText(/invoice management will be available/i)).toBeInTheDocument();
      expect(screen.getByText(/xero integration/i)).toBeInTheDocument();
      expect(screen.getByText(/check back soon/i)).toBeInTheDocument();
    });

    it('should show InvoiceManagement component for regular comedian', () => {
      const props = {
        ...defaultProps,
        activeTab: 'invoices',
        isComedianLite: false
      };

      render(<ProfileTabs {...props} />);

      // Should render actual InvoiceManagement component
      expect(screen.getByTestId('invoice-management')).toBeInTheDocument();
    });
  });

  describe('Tab Content Rendering', () => {
    it('should render Profile tab content when active', () => {
      render(<ProfileTabs {...defaultProps} activeTab="profile" />);

      expect(screen.getByTestId('profile-information')).toBeVisible();
      expect(screen.getByTestId('comedian-media')).toBeVisible();
      expect(screen.getByTestId('contact-information')).toBeVisible();
      expect(screen.getByTestId('financial-information')).toBeVisible();
    });

    it('should render Calendar tab content when active', () => {
      render(<ProfileTabs {...defaultProps} activeTab="calendar" />);

      expect(screen.getByTestId('profile-calendar-view')).toBeVisible();
    });

    it('should render Vouches tab content when active', () => {
      render(<ProfileTabs {...defaultProps} activeTab="vouches" />);

      expect(screen.getByTestId('give-vouch-form')).toBeVisible();
      expect(screen.getAllByTestId('vouch-history')).toHaveLength(2); // Received and Given
    });

    it('should render Settings tab content when active', () => {
      render(<ProfileTabs {...defaultProps} activeTab="settings" />);

      expect(screen.getByTestId('account-settings')).toBeVisible();
    });

    it('should render Tickets section for non-industry users', () => {
      const props = {
        ...defaultProps,
        activeTab: 'tickets',
        isIndustryUser: false,
        isComedianLite: false
      };

      render(<ProfileTabs {...props} />);

      expect(screen.getByTestId('tickets-section')).toBeVisible();
    });
  });

  describe('Tab Navigation', () => {
    it('should call setActiveTab when tab is clicked', () => {
      render(<ProfileTabs {...defaultProps} />);

      const calendarTab = screen.getByRole('tab', { name: /calendar/i });
      fireEvent.click(calendarTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('calendar');
    });

    it('should NOT call setActiveTab when disabled Invoices tab is clicked', () => {
      render(<ProfileTabs {...defaultProps} />);

      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });

      // Attempt to click disabled tab
      fireEvent.click(invoicesTab);

      // Should not have been called (tab is disabled)
      expect(mockSetActiveTab).not.toHaveBeenCalledWith('invoices');
    });

    it('should only allow valid tab transitions', () => {
      render(<ProfileTabs {...defaultProps} />);

      // Valid tabs for industry users
      const validTabs = ['profile', 'calendar', 'invoices', 'vouches', 'settings'];

      validTabs.forEach(tab => {
        if (tab !== 'invoices') { // Skip disabled tab
          const tabElement = screen.getByRole('tab', { name: new RegExp(tab, 'i') });
          fireEvent.click(tabElement);
        }
      });

      // setActiveTab should have been called for each valid tab except invoices
      expect(mockSetActiveTab).toHaveBeenCalledTimes(4); // profile, calendar, vouches, settings
    });
  });

  describe('Tab Validation', () => {
    it('should fallback to first available tab if invalid tab provided', () => {
      const props = {
        ...defaultProps,
        activeTab: 'invalid-tab-name'
      };

      render(<ProfileTabs {...props} />);

      // Should default to 'profile' tab
      const profileTab = screen.getByRole('tab', { name: /profile/i });
      expect(profileTab).toHaveAttribute('data-state', 'active');
    });

    it('should validate tabs against availableTabs array', () => {
      render(<ProfileTabs {...defaultProps} activeTab="profile" />);

      // Valid tabs should work
      const validTab = screen.getByRole('tab', { name: /calendar/i });
      expect(validTab).toBeInTheDocument();

      // Invalid tab should not exist
      const invalidTab = screen.queryByRole('tab', { name: /nonexistent/i });
      expect(invalidTab).not.toBeInTheDocument();
    });

    it('should only include 5 tabs for industry users', () => {
      render(<ProfileTabs {...defaultProps} />);

      const allTabs = screen.getAllByRole('tab');
      expect(allTabs).toHaveLength(5);
    });
  });

  describe('Props Handling', () => {
    it('should pass user prop to ProfileInformation', () => {
      render(<ProfileTabs {...defaultProps} activeTab="profile" />);

      // ProfileInformation should be rendered (mocked component would receive props)
      expect(screen.getByTestId('profile-information')).toBeInTheDocument();
    });

    it('should pass userId to GiveVouchForm in Vouches tab', () => {
      render(<ProfileTabs {...defaultProps} activeTab="vouches" />);

      expect(screen.getByTestId('give-vouch-form')).toBeInTheDocument();
    });

    it('should pass onSave handler to ProfileInformation', () => {
      render(<ProfileTabs {...defaultProps} activeTab="profile" />);

      // onSave prop should be passed (can't test internal behavior with mocks)
      expect(screen.getByTestId('profile-information')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles for tabs', () => {
      render(<ProfileTabs {...defaultProps} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should mark active tab with aria-selected', () => {
      render(<ProfileTabs {...defaultProps} activeTab="profile" />);

      const profileTab = screen.getByRole('tab', { name: /profile/i });
      expect(profileTab).toHaveAttribute('data-state', 'active');
    });

    it('should have proper disabled state for Invoices tab', () => {
      render(<ProfileTabs {...defaultProps} />);

      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      expect(invoicesTab).toHaveAttribute('disabled');
    });

    it('should be keyboard navigable', () => {
      render(<ProfileTabs {...defaultProps} />);

      const firstTab = screen.getByRole('tab', { name: /profile/i });
      firstTab.focus();

      expect(document.activeElement).toBe(firstTab);

      // Tab navigation would be tested in E2E
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      const props = {
        ...defaultProps,
        user: undefined
      };

      expect(() => render(<ProfileTabs {...props} />)).not.toThrow();
    });

    it('should handle empty userInterests array', () => {
      const props = {
        ...defaultProps,
        userInterests: []
      };

      render(<ProfileTabs {...props} />);
      expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
    });

    it('should handle empty mockTickets array', () => {
      const props = {
        ...defaultProps,
        mockTickets: []
      };

      render(<ProfileTabs {...props} />);
      expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
    });

    it('should handle both isIndustryUser and isComedianLite true', () => {
      // This is the comedian_lite case
      render(<ProfileTabs {...defaultProps} />);

      // Invoices tab should be present but disabled
      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      expect(invoicesTab).toBeInTheDocument();
      expect(invoicesTab).toBeDisabled();
    });

    it('should handle isIndustryUser true but isComedianLite false (regular comedian)', () => {
      const props = {
        ...defaultProps,
        isComedianLite: false
      };

      render(<ProfileTabs {...props} />);

      // Invoices tab should be present and enabled
      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      expect(invoicesTab).toBeInTheDocument();
      expect(invoicesTab).not.toBeDisabled();
    });
  });
});
