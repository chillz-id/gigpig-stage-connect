import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { bulkInvoiceService } from '@/services/bulkInvoiceService';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
import { BulkOperationProgress } from '@/types/bulkOperations';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    functions: {
      invoke: jest.fn()
    }
  }
}));

describe('Bulk Invoice Operations', () => {
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoice_number: 'INV-001',
      invoice_type: 'promoter',
      issue_date: '2024-01-01',
      due_date: '2024-01-31',
      status: 'sent',
      total_amount: 1000,
      currency: 'AUD',
      invoice_recipients: [
        {
          recipient_name: 'Test Client 1',
          recipient_email: 'client1@test.com'
        }
      ]
    },
    {
      id: '2',
      invoice_number: 'INV-002',
      invoice_type: 'comedian',
      issue_date: '2024-01-02',
      due_date: '2024-02-01',
      status: 'draft',
      total_amount: 2000,
      currency: 'AUD',
      invoice_recipients: [
        {
          recipient_name: 'Test Client 2',
          recipient_email: 'client2@test.com'
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkSendEmails', () => {
    it('should send emails for non-draft invoices', async () => {
      const invoiceIds = ['1', '2'];
      const mockProgress: BulkOperationProgress[] = [];

      // Mock database query
      const mockSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: mockInvoices,
          error: null
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      // Mock email function
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null
      });

      const result = await bulkInvoiceService.bulkSendEmails(
        invoiceIds,
        {},
        { batchSize: 2, delayBetweenBatches: 0, maxRetries: 0, continueOnError: true },
        (progress) => mockProgress.push(progress)
      );

      expect(result.operation).toBe('send-email');
      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(1); // Only non-draft invoice
      expect(result.failed).toBe(1); // Draft invoice should fail
    });
  });

  describe('bulkMarkAsPaid', () => {
    it('should mark invoices as paid', async () => {
      const invoiceIds = ['1'];

      // Mock database query
      const mockSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [mockInvoices[0]],
          error: null
        })
      });

      const mockInsert = jest.fn().mockReturnValue({
        data: null,
        error: null
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'invoices') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        }
        if (table === 'invoice_payments') {
          return {
            insert: mockInsert
          };
        }
      });

      const result = await bulkInvoiceService.bulkMarkAsPaid(invoiceIds);

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('bulkExportCSV', () => {
    it('should export invoices to CSV format', async () => {
      const invoiceIds = ['1', '2'];

      // Mock database query
      const mockSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockInvoices,
            error: null
          })
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const csv = await bulkInvoiceService.bulkExportCSV(invoiceIds);

      expect(csv).toContain('Invoice Number,Status,Issue Date');
      expect(csv).toContain('INV-001');
      expect(csv).toContain('INV-002');
    });
  });

  describe('Performance Optimizations', () => {
    it('should process large batches efficiently', async () => {
      const largeInvoiceSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockInvoices[0],
        id: `invoice-${i}`,
        invoice_number: `INV-${i.toString().padStart(3, '0')}`
      }));

      const invoiceIds = largeInvoiceSet.map(inv => inv.id);

      // Mock batch queries
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockImplementation((field, ids) => ({
            data: largeInvoiceSet.filter(inv => ids.includes(inv.id)),
            error: null
          }))
        })
      });

      const startTime = Date.now();
      
      await bulkInvoiceService.preloadInvoiceData(invoiceIds);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time for 100 invoices
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Error Handling', () => {
    it('should handle partial failures gracefully', async () => {
      const invoiceIds = ['1', '2', '3'];
      
      // Mock one successful and two failed operations
      const mockInvoicesWithError = [
        mockInvoices[0],
        { ...mockInvoices[1], id: '2' },
        { ...mockInvoices[0], id: '3', invoice_number: 'INV-003' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockInvoicesWithError,
            error: null
          })
        })
      });

      // Mock email function to fail for second invoice
      let callCount = 0;
      (supabase.functions.invoke as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.resolve({ data: null, error: new Error('Email service error') });
        }
        return Promise.resolve({ data: { success: true }, error: null });
      });

      const result = await bulkInvoiceService.bulkSendEmails(
        invoiceIds,
        {},
        { batchSize: 10, delayBetweenBatches: 0, maxRetries: 0, continueOnError: true }
      );

      expect(result.processed).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should support operation cancellation', async () => {
      const invoiceIds = Array.from({ length: 50 }, (_, i) => `invoice-${i}`);
      
      // Start operation
      const operationPromise = bulkInvoiceService.bulkMarkAsPaid(invoiceIds);
      
      // Cancel after a short delay
      setTimeout(() => {
        bulkInvoiceService.cancelCurrentOperation();
      }, 10);

      const result = await operationPromise;
      
      expect(result.processed).toBeLessThan(50);
      expect(bulkInvoiceService.getCurrentOperation()).toBeNull();
    });
  });
});