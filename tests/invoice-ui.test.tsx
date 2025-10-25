// Invoice UI Components Test Suite - Testing all React components and hooks
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { InvoiceCard } from '@/components/invoice/InvoiceCard';
import { InvoiceDetails } from '@/components/InvoiceDetails';
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { AuthContext } from '@/contexts/AuthContext';
import { Invoice } from '@/types/invoice';

// Mock hooks
jest.mock('@/hooks/useInvoices');
jest.mock('@/hooks/useInvoiceOperations');
jest.mock('@/hooks/use-toast');

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      data: [],
      error: null
    })
  }
}));

// Mock react-pdf
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children }: any) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }: any) => <div data-testid="pdf-view">{children}</div>,
  StyleSheet: { create: jest.fn() },
  PDFDownloadLink: ({ children }: any) => <button data-testid="pdf-download">{children}</button>
}));

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const mockAuthContext = {
    user: { id: 'test-user', email: 'test@example.com' },
    hasRole: jest.fn().mockReturnValue(true),
    loading: false,
    signOut: jest.fn()
  };

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

// Mock data
const mockInvoice: Invoice = {
  id: 'invoice-1',
  invoice_number: 'PRO-202501-0001',
  issue_date: '2025-01-09',
  due_date: '2025-02-09',
  status: 'sent',
  total_amount: 1000,
  currency: 'AUD',
  sender_name: 'Test Sender',
  sender_email: 'sender@example.com',
  sender_address: '123 Test St',
  sender_phone: '+61400000000',
  sender_abn: '12345678901',
  client_address: '456 Client St',
  client_mobile: '+61400000001',
  gst_treatment: 'inclusive',
  invoice_recipients: [
    {
      recipient_name: 'Test Recipient',
      recipient_email: 'recipient@example.com',
      recipient_mobile: '+61400000002'
    }
  ],
  deposit_amount: 500,
  deposit_percentage: 50,
  deposit_due_days_before_event: 7,
  deposit_due_date: '2025-01-13',
  deposit_status: 'pending',
  event_date: '2025-01-20'
};

const mockInvoices = [mockInvoice];

describe('Invoice UI Components Test Suite', () => {
  const mockUseInvoices = useInvoices as jest.MockedFunction<typeof useInvoices>;
  const mockUseInvoiceOperations = useInvoiceOperations as jest.MockedFunction<typeof useInvoiceOperations>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hooks default returns
    mockUseInvoices.mockReturnValue({
      invoices: mockInvoices,
      loading: false,
      error: null,
      deleteInvoice: jest.fn(),
      filterInvoices: jest.fn().mockReturnValue(mockInvoices),
      refetchInvoices: jest.fn()
    });

    mockUseInvoiceOperations.mockReturnValue({
      createInvoice: { mutate: jest.fn(), isPending: false },
      createFromTicketSales: { mutate: jest.fn(), isPending: false },
      syncToXero: { mutate: jest.fn(), isPending: false },
      recordPayment: { mutate: jest.fn(), isPending: false },
      connectToXero: jest.fn(),
      syncFromXero: { mutate: jest.fn(), isPending: false },
      generateRecurringInvoices: { mutate: jest.fn(), isPending: false },
      checkOverdueInvoices: { mutate: jest.fn(), isPending: false }
    });
  });

  describe('InvoiceManagement Component', () => {
    test('should render invoice management with invoices', () => {
      render(<InvoiceManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      expect(screen.getByText('Create Invoice')).toBeInTheDocument();
      expect(screen.getByText('PRO-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Recipient')).toBeInTheDocument();
    });

    test('should show loading state', () => {
      mockUseInvoices.mockReturnValue({
        invoices: [],
        loading: true,
        error: null,
        deleteInvoice: jest.fn(),
        filterInvoices: jest.fn().mockReturnValue([]),
        refetchInvoices: jest.fn()
      });

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      expect(screen.getByTestId('invoice-loading')).toBeInTheDocument();
    });

    test('should show error state', () => {
      mockUseInvoices.mockReturnValue({
        invoices: [],
        loading: false,
        error: 'Failed to load invoices',
        deleteInvoice: jest.fn(),
        filterInvoices: jest.fn().mockReturnValue([]),
        refetchInvoices: jest.fn()
      });

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Error Loading Invoices')).toBeInTheDocument();
      expect(screen.getByText('Failed to load invoices')).toBeInTheDocument();
    });

    test('should show empty state when no invoices', () => {
      mockUseInvoices.mockReturnValue({
        invoices: [],
        loading: false,
        error: null,
        deleteInvoice: jest.fn(),
        filterInvoices: jest.fn().mockReturnValue([]),
        refetchInvoices: jest.fn()
      });

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });

    test('should handle create invoice button click', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const createButton = screen.getByText('Create Invoice');
      fireEvent.click(createButton);

      expect(window.location.href).toBe('/invoices/new');

      window.location = originalLocation;
    });

    test('should handle invoice filtering', () => {
      const mockFilterInvoices = jest.fn().mockReturnValue([]);
      mockUseInvoices.mockReturnValue({
        invoices: mockInvoices,
        loading: false,
        error: null,
        deleteInvoice: jest.fn(),
        filterInvoices: mockFilterInvoices,
        refetchInvoices: jest.fn()
      });

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText('Search invoices...');
      fireEvent.change(searchInput, { target: { value: 'PRO-202501' } });

      expect(mockFilterInvoices).toHaveBeenCalledWith(
        'PRO-202501',
        'all',
        'all',
        expect.any(Object)
      );
    });
  });

  describe('InvoiceCard Component', () => {
    test('should render invoice card with all details', () => {
      const mockOnDelete = jest.fn();
      const mockOnView = jest.fn();

      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('PRO-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Recipient')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });

    test('should handle view button click', () => {
      const mockOnView = jest.fn();

      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={mockOnView}
        />,
        { wrapper: createWrapper() }
      );

      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);

      expect(mockOnView).toHaveBeenCalled();
    });

    test('should handle delete button click', async () => {
      const mockOnDelete = jest.fn();
      window.confirm = jest.fn().mockReturnValue(true);

      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={mockOnDelete}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('invoice-1');
      });
    });

    test('should show deposit information', () => {
      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Deposit: $500.00')).toBeInTheDocument();
      expect(screen.getByText('Deposit Status: Pending')).toBeInTheDocument();
    });

    test('should handle different invoice statuses', () => {
      const paidInvoice = { ...mockInvoice, status: 'paid' };

      render(
        <InvoiceCard
          invoice={paidInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Paid')).toBeInTheDocument();
    });
  });

  describe('InvoiceDetails Component', () => {
    test('should render invoice details modal', () => {
      const transformedInvoice = {
        id: mockInvoice.id,
        number: mockInvoice.invoice_number,
        clientName: mockInvoice.invoice_recipients[0].recipient_name,
        amount: mockInvoice.total_amount,
        dueDate: mockInvoice.due_date,
        createdDate: mockInvoice.issue_date,
        status: mockInvoice.status,
        currency: mockInvoice.currency
      };

      render(
        <InvoiceDetails
          invoice={transformedInvoice}
          isOpen={true}
          onClose={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Invoice PRO-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Recipient')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });

    test('should handle close button click', () => {
      const mockOnClose = jest.fn();
      const transformedInvoice = {
        id: mockInvoice.id,
        number: mockInvoice.invoice_number,
        clientName: mockInvoice.invoice_recipients[0].recipient_name,
        amount: mockInvoice.total_amount,
        dueDate: mockInvoice.due_date,
        createdDate: mockInvoice.issue_date,
        status: mockInvoice.status,
        currency: mockInvoice.currency
      };

      render(
        <InvoiceDetails
          invoice={transformedInvoice}
          isOpen={true}
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should not render when closed', () => {
      const transformedInvoice = {
        id: mockInvoice.id,
        number: mockInvoice.invoice_number,
        clientName: mockInvoice.invoice_recipients[0].recipient_name,
        amount: mockInvoice.total_amount,
        dueDate: mockInvoice.due_date,
        createdDate: mockInvoice.issue_date,
        status: mockInvoice.status,
        currency: mockInvoice.currency
      };

      render(
        <InvoiceDetails
          invoice={transformedInvoice}
          isOpen={false}
          onClose={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('Invoice PRO-202501-0001')).not.toBeInTheDocument();
    });
  });

  describe('PDF Generation Integration', () => {
    test('should render PDF download link', () => {
      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const pdfButton = screen.getByTestId('pdf-download');
      expect(pdfButton).toBeInTheDocument();
    });

    test('should handle PDF generation', async () => {
      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const pdfButton = screen.getByTestId('pdf-download');
      fireEvent.click(pdfButton);

      // PDF generation would be handled by react-pdf
      expect(pdfButton).toBeInTheDocument();
    });
  });

  describe('Xero Integration UI', () => {
    test('should show sync to Xero button', () => {
      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const syncButton = screen.getByText('Sync to Xero');
      expect(syncButton).toBeInTheDocument();
    });

    test('should handle Xero sync', async () => {
      const mockSyncToXero = jest.fn();
      mockUseInvoiceOperations.mockReturnValue({
        ...mockUseInvoiceOperations(),
        syncToXero: { mutate: mockSyncToXero, isPending: false }
      });

      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const syncButton = screen.getByText('Sync to Xero');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockSyncToXero).toHaveBeenCalledWith('invoice-1');
      });
    });

    test('should show loading state during Xero sync', () => {
      mockUseInvoiceOperations.mockReturnValue({
        ...mockUseInvoiceOperations(),
        syncToXero: { mutate: jest.fn(), isPending: true }
      });

      render(
        <InvoiceCard
          invoice={mockInvoice}
          onDelete={jest.fn()}
          onView={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });
  });

  describe('Payment Recording UI', () => {
    test('should show record payment form', () => {
      const transformedInvoice = {
        id: mockInvoice.id,
        number: mockInvoice.invoice_number,
        clientName: mockInvoice.invoice_recipients[0].recipient_name,
        amount: mockInvoice.total_amount,
        dueDate: mockInvoice.due_date,
        createdDate: mockInvoice.issue_date,
        status: mockInvoice.status,
        currency: mockInvoice.currency
      };

      render(
        <InvoiceDetails
          invoice={transformedInvoice}
          isOpen={true}
          onClose={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Record Payment')).toBeInTheDocument();
    });

    test('should handle payment recording', async () => {
      const mockRecordPayment = jest.fn();
      mockUseInvoiceOperations.mockReturnValue({
        ...mockUseInvoiceOperations(),
        recordPayment: { mutate: mockRecordPayment, isPending: false }
      });

      const transformedInvoice = {
        id: mockInvoice.id,
        number: mockInvoice.invoice_number,
        clientName: mockInvoice.invoice_recipients[0].recipient_name,
        amount: mockInvoice.total_amount,
        dueDate: mockInvoice.due_date,
        createdDate: mockInvoice.issue_date,
        status: mockInvoice.status,
        currency: mockInvoice.currency
      };

      render(
        <InvoiceDetails
          invoice={transformedInvoice}
          isOpen={true}
          onClose={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const recordButton = screen.getByText('Record Payment');
      fireEvent.click(recordButton);

      // Fill payment form
      const amountInput = screen.getByLabelText('Amount');
      const methodSelect = screen.getByLabelText('Payment Method');
      
      fireEvent.change(amountInput, { target: { value: '1000' } });
      fireEvent.change(methodSelect, { target: { value: 'credit_card' } });

      const submitButton = screen.getByText('Record');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPayment).toHaveBeenCalledWith({
          invoiceId: 'invoice-1',
          payment: expect.objectContaining({
            amount: 1000,
            payment_method: 'credit_card'
          })
        });
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toHaveAttribute('aria-label', 'Create new invoice');

      const searchInput = screen.getByPlaceholderText('Search invoices...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search invoices');
    });

    test('should support keyboard navigation', () => {
      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const createButton = screen.getByText('Create Invoice');
      createButton.focus();
      
      expect(document.activeElement).toBe(createButton);
    });

    test('should have proper heading structure', () => {
      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Invoice Management');
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toHaveClass('w-full');
    });

    test('should adapt to desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      render(<InvoiceManagement />, { wrapper: createWrapper() });

      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toHaveClass('sm:w-auto');
    });
  });
});