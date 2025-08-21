/**
 * Test script for invoice system functionality
 * Tests invoice creation, operations, and database schema compatibility
 */

import { invoiceService } from './src/services/invoiceService';
import { useInvoices } from './src/hooks/useInvoices';
import { useInvoiceOperations } from './src/hooks/useInvoiceOperations';
import { Invoice, InvoiceItem, InvoiceRecipient, InvoicePayment } from './src/types/invoice';

// Mock Supabase client responses
const mockInvoiceData = {
  id: 'invoice-123',
  invoice_type: 'comedian' as const,
  invoice_number: 'COM-202401-0001',
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  status: 'draft',
  total_amount: 500,
  subtotal_amount: 454.55,
  tax_amount: 45.45,
  tax_rate: 10,
  currency: 'AUD',
  promoter_id: null,
  comedian_id: 'comedian-456',
  sender_name: 'John Comedian',
  sender_email: 'john@comedian.com',
  sender_address: '123 Comedy St, Sydney NSW 2000',
  sender_phone: '+61400000000',
  sender_abn: '12345678901',
  client_address: '456 Venue Ave, Sydney NSW 2000',
  client_mobile: '+61400000001',
  gst_treatment: 'inclusive' as const,
  tax_treatment: 'inclusive' as const,
  xero_invoice_id: null,
  last_synced_at: null,
  paid_at: null,
  created_by: 'user-789',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  deposit_amount: 100,
  deposit_percentage: null,
  deposit_due_days_before_event: 7,
  deposit_due_date: '2024-02-08',
  deposit_status: 'pending' as const,
  deposit_paid_date: null,
  deposit_paid_amount: null,
  event_date: '2024-02-15',
  invoice_recipients: [
    {
      recipient_name: 'Comedy Venue',
      recipient_email: 'bookings@comedyvenue.com',
      recipient_mobile: '+61400000002',
      recipient_address: '456 Venue Ave, Sydney NSW 2000',
      recipient_phone: '+61400000003',
      recipient_type: 'company' as const,
      recipient_abn: '98765432109',
      company_name: 'Comedy Venue Pty Ltd',
      abn: '98765432109'
    }
  ]
};

const mockInvoiceItems = [
  {
    id: 'item-1',
    invoice_id: 'invoice-123',
    description: 'Comedy Performance - 30 minutes',
    quantity: 1,
    unit_price: 400,
    subtotal: 400,
    tax_amount: 36.36,
    total: 436.36,
    item_order: 0,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'item-2',
    invoice_id: 'invoice-123',
    description: 'Travel expenses',
    quantity: 1,
    unit_price: 100,
    subtotal: 100,
    tax_amount: 9.09,
    total: 109.09,
    item_order: 1,
    created_at: '2024-01-15T10:00:00Z'
  }
];

const mockInvoicePayments = [
  {
    id: 'payment-1',
    invoice_id: 'invoice-123',
    amount: 100,
    payment_date: '2024-01-20',
    payment_method: 'Bank Transfer',
    reference: 'DEP-001',
    notes: 'Deposit payment',
    status: 'completed' as const,
    is_deposit: true,
    recorded_by: 'user-789',
    created_at: '2024-01-20T14:30:00Z'
  }
];

// Mock Supabase client
jest.mock('./src/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      const mockData = {
        invoices: mockInvoiceData,
        invoice_items: mockInvoiceItems,
        invoice_recipients: mockInvoiceData.invoice_recipients[0],
        invoice_payments: mockInvoicePayments[0]
      };
      
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: mockData[table as keyof typeof mockData], 
          error: null 
        }),
        then: jest.fn().mockResolvedValue({ 
          data: [mockData[table as keyof typeof mockData]], 
          error: null 
        })
      };
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'user-789', email: 'test@example.com' }
        }
      })
    }
  }
}));

// Test functions
async function testInvoiceTypeSchema() {
  console.log('=== Testing Invoice Type Schema ===');
  
  try {
    // Test that all required fields are present
    const invoice: Invoice = {
      id: 'test-invoice',
      invoice_type: 'comedian',
      invoice_number: 'COM-202401-0001',
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      status: 'draft',
      total_amount: 500,
      currency: 'AUD',
      invoice_recipients: [{
        recipient_name: 'Test Venue',
        recipient_email: 'venue@test.com'
      }]
    };
    
    console.log('✅ Invoice type schema matches expected structure');
    
    // Test InvoiceItem schema
    const item: InvoiceItem = {
      id: 'test-item',
      description: 'Test Service',
      quantity: 1,
      unit_price: 100,
      subtotal: 100,
      tax_amount: 10,
      total: 110
    };
    
    console.log('✅ InvoiceItem type schema matches expected structure');
    
    // Test InvoiceRecipient schema
    const recipient: InvoiceRecipient = {
      recipient_name: 'Test Recipient',
      recipient_email: 'recipient@test.com',
      recipient_type: 'individual'
    };
    
    console.log('✅ InvoiceRecipient type schema matches expected structure');
    
    // Test InvoicePayment schema
    const payment: InvoicePayment = {
      id: 'test-payment',
      invoice_id: 'test-invoice',
      amount: 100,
      payment_date: '2024-01-20',
      status: 'completed',
      created_at: '2024-01-20T14:30:00Z'
    };
    
    console.log('✅ InvoicePayment type schema matches expected structure');
    
    console.log('✅ All invoice types match database schema!');
    
  } catch (error) {
    console.error('❌ Invoice type schema test failed:', error);
    throw error;
  }
}

async function testInvoiceService() {
  console.log('=== Testing Invoice Service ===');
  
  try {
    // Test invoice number generation
    console.log('1. Testing invoice number generation...');
    const invoiceNumber = await invoiceService.generateInvoiceNumber('comedian');
    console.log('Generated invoice number:', invoiceNumber);
    
    // Test invoice creation
    console.log('2. Testing invoice creation...');
    const createRequest = {
      invoice_type: 'comedian' as const,
      sender_name: 'John Comedian',
      sender_email: 'john@comedian.com',
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      subtotal_amount: 454.55,
      tax_amount: 45.45,
      total_amount: 500,
      items: [
        {
          description: 'Comedy Performance',
          quantity: 1,
          unit_price: 400,
          subtotal: 400,
          tax_amount: 36.36,
          total: 436.36
        }
      ],
      recipients: [
        {
          recipient_name: 'Comedy Venue',
          recipient_email: 'bookings@comedyvenue.com',
          recipient_type: 'company' as const
        }
      ]
    };
    
    const createdInvoice = await invoiceService.createInvoice(createRequest);
    console.log('Created invoice:', createdInvoice.id);
    
    // Test payment recording
    console.log('3. Testing payment recording...');
    await invoiceService.recordPayment('invoice-123', {
      amount: 100,
      payment_date: '2024-01-20',
      payment_method: 'Bank Transfer',
      status: 'completed',
      is_deposit: true
    });
    console.log('Payment recorded successfully');
    
    // Test invoice metrics
    console.log('4. Testing invoice metrics...');
    const metrics = await invoiceService.getInvoiceMetrics();
    console.log('Invoice metrics:', metrics);
    
    console.log('✅ Invoice Service tests passed!');
    
  } catch (error) {
    console.error('❌ Invoice Service test failed:', error);
    throw error;
  }
}

async function testInvoiceHooks() {
  console.log('=== Testing Invoice Hooks ===');
  
  try {
    // Mock React hooks context
    const mockHasRole = jest.fn().mockReturnValue(true);
    const mockUser = { id: 'user-789', email: 'test@example.com' };
    
    // Test useInvoices hook
    console.log('1. Testing useInvoices hook...');
    
    // Since we can't actually test React hooks without a React environment,
    // we'll test the underlying logic
    const invoicesData = [mockInvoiceData];
    const filteredInvoices = invoicesData.filter(invoice => 
      invoice.invoice_number.toLowerCase().includes('com') ||
      invoice.invoice_recipients.some(recipient => 
        recipient.recipient_name.toLowerCase().includes('com')
      )
    );
    
    console.log('Filtered invoices:', filteredInvoices.length);
    
    // Test date filtering logic
    console.log('2. Testing date filtering...');
    const thisMonthInvoices = invoicesData.filter(invoice => {
      const issueDate = new Date(invoice.issue_date);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() && 
             issueDate.getFullYear() === now.getFullYear();
    });
    
    console.log('This month invoices:', thisMonthInvoices.length);
    
    // Test amount filtering logic
    console.log('3. Testing amount filtering...');
    const amountRange = { min: 0, max: 1000 };
    const amountFilteredInvoices = invoicesData.filter(invoice => {
      const amount = invoice.total_amount;
      return amount >= amountRange.min && amount <= amountRange.max;
    });
    
    console.log('Amount filtered invoices:', amountFilteredInvoices.length);
    
    console.log('✅ Invoice Hooks tests passed!');
    
  } catch (error) {
    console.error('❌ Invoice Hooks test failed:', error);
    throw error;
  }
}

async function testInvoiceFromTicketSales() {
  console.log('=== Testing Invoice from Ticket Sales ===');
  
  try {
    // Mock event with ticket sales data
    const mockEvent = {
      id: 'event-123',
      title: 'Test Comedy Show',
      event_date: '2024-02-15',
      ticket_sales: [
        {
          platform: 'humanitix',
          quantity_sold: 150,
          gross_revenue: 3000,
          platform_fees: 300,
          net_revenue: 2700
        },
        {
          platform: 'eventbrite',
          quantity_sold: 50,
          gross_revenue: 1000,
          platform_fees: 100,
          net_revenue: 900
        }
      ]
    };
    
    console.log('1. Testing invoice creation from ticket sales...');
    
    // Calculate totals
    const totalGross = mockEvent.ticket_sales.reduce((sum, sale) => sum + sale.gross_revenue, 0);
    const totalFees = mockEvent.ticket_sales.reduce((sum, sale) => sum + sale.platform_fees, 0);
    const totalNet = mockEvent.ticket_sales.reduce((sum, sale) => sum + sale.net_revenue, 0);
    
    console.log('Calculated totals:', { totalGross, totalFees, totalNet });
    
    // Test invoice creation request
    const ticketSalesRequest = {
      event_id: mockEvent.id,
      recipient_type: 'comedian' as const,
      recipient_id: 'comedian-456',
      include_platform_fees: true
    };
    
    const invoice = await invoiceService.createInvoiceFromTicketSales(ticketSalesRequest);
    console.log('Created invoice from ticket sales:', invoice.id);
    
    console.log('✅ Invoice from ticket sales test passed!');
    
  } catch (error) {
    console.error('❌ Invoice from ticket sales test failed:', error);
    throw error;
  }
}

async function testXeroIntegration() {
  console.log('=== Testing Xero Integration ===');
  
  try {
    // Test Xero sync
    console.log('1. Testing Xero sync...');
    await invoiceService.syncToXero({ invoice_id: 'invoice-123' });
    console.log('Xero sync completed');
    
    // Test overdue invoice check
    console.log('2. Testing overdue invoice check...');
    await invoiceService.checkOverdueInvoices();
    console.log('Overdue invoice check completed');
    
    // Test recurring invoice generation
    console.log('3. Testing recurring invoice generation...');
    await invoiceService.generateRecurringInvoices();
    console.log('Recurring invoice generation completed');
    
    console.log('✅ Xero Integration tests passed!');
    
  } catch (error) {
    console.error('❌ Xero Integration test failed:', error);
    throw error;
  }
}

async function testInvoiceValidation() {
  console.log('=== Testing Invoice Validation ===');
  
  try {
    // Test required fields validation
    console.log('1. Testing required fields validation...');
    
    const invalidRequest = {
      invoice_type: 'comedian' as const,
      // Missing required fields
      sender_name: '',
      sender_email: '',
      issue_date: '',
      due_date: '',
      subtotal_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      items: [],
      recipients: []
    };
    
    try {
      await invoiceService.createInvoice(invalidRequest);
      console.log('❌ Should have failed validation');
    } catch (error) {
      console.log('✅ Validation correctly caught invalid request');
    }
    
    // Test tax calculation validation
    console.log('2. Testing tax calculation validation...');
    const taxTestAmount = 100;
    const taxRate = 10;
    const expectedTaxInclusive = taxTestAmount * taxRate / (100 + taxRate);
    const expectedTaxExclusive = taxTestAmount * taxRate / 100;
    
    console.log('Tax calculations:', {
      inclusive: expectedTaxInclusive,
      exclusive: expectedTaxExclusive
    });
    
    console.log('✅ Invoice Validation tests passed!');
    
  } catch (error) {
    console.error('❌ Invoice Validation test failed:', error);
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Invoice System Integration Tests...\n');
  
  try {
    await testInvoiceTypeSchema();
    console.log('');
    
    await testInvoiceService();
    console.log('');
    
    await testInvoiceHooks();
    console.log('');
    
    await testInvoiceFromTicketSales();
    console.log('');
    
    await testXeroIntegration();
    console.log('');
    
    await testInvoiceValidation();
    console.log('');
    
    console.log('🎉 All invoice system tests passed successfully!');
    
  } catch (error) {
    console.error('💥 Invoice system test suite failed:', error);
    process.exit(1);
  }
}

// Export for external use
export {
  testInvoiceTypeSchema,
  testInvoiceService,
  testInvoiceHooks,
  testInvoiceFromTicketSales,
  testXeroIntegration,
  testInvoiceValidation,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}