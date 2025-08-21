// Bulk Invoice Service - Handles batch operations for invoices
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { 
  BulkOperation, 
  BulkOperationProgress, 
  BulkOperationResult,
  BulkExportOptions,
  BulkEmailOptions,
  BatchProcessingOptions,
  DEFAULT_BATCH_OPTIONS
} from '@/types/bulkOperations';
import { invoiceService } from './invoiceService';
import { 
  invoiceCache, 
  emailRateLimiter, 
  pdfRateLimiter,
  chunkArray,
  processInParallel,
  ProgressThrottler
} from '@/utils/bulkOperationOptimizations';

class BulkInvoiceService {
  private currentOperation: BulkOperationProgress | null = null;
  private abortController: AbortController | null = null;

  // =====================================
  // BULK EMAIL OPERATIONS
  // =====================================

  async bulkSendEmails(
    invoiceIds: string[], 
    options: BulkEmailOptions = {},
    batchOptions: BatchProcessingOptions = DEFAULT_BATCH_OPTIONS,
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<BulkOperationResult> {
    return this.processBulkOperation(
      'send-email',
      invoiceIds,
      async (invoice) => {
        // Check if invoice is in a sendable state
        if (invoice.status === 'draft') {
          throw new Error('Cannot send draft invoice');
        }

        // Apply rate limiting for email operations
        await emailRateLimiter.acquire();

        // Call the edge function to send email
        const { error } = await supabase.functions.invoke('send-invoice-email', {
          body: {
            invoiceId: invoice.id,
            subject: options.subject || `Invoice ${invoice.invoice_number}`,
            message: options.message,
            attachPdf: options.attachPdf !== false,
            cc: options.cc,
            bcc: options.bcc
          }
        });

        if (error) throw error;

        // Update invoice status to 'sent' if it was draft
        if (invoice.status === 'draft') {
          await supabase
            .from('invoices')
            .update({ status: 'sent' })
            .eq('id', invoice.id);
        }
      },
      batchOptions,
      onProgress
    );
  }

  // =====================================
  // BULK STATUS UPDATES
  // =====================================

  async bulkMarkAsPaid(
    invoiceIds: string[],
    batchOptions: BatchProcessingOptions = DEFAULT_BATCH_OPTIONS,
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<BulkOperationResult> {
    return this.processBulkOperation(
      'mark-paid',
      invoiceIds,
      async (invoice) => {
        if (invoice.status === 'paid') {
          return; // Already paid, skip
        }

        // Record full payment
        await invoiceService.recordPayment(invoice.id, {
          amount: invoice.total_amount,
          payment_date: new Date().toISOString(),
          payment_method: 'bulk_update',
          status: 'completed',
          notes: 'Marked as paid via bulk operation'
        });
      },
      batchOptions,
      onProgress
    );
  }

  async bulkMarkAsUnpaid(
    invoiceIds: string[],
    batchOptions: BatchProcessingOptions = DEFAULT_BATCH_OPTIONS,
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<BulkOperationResult> {
    return this.processBulkOperation(
      'mark-unpaid',
      invoiceIds,
      async (invoice) => {
        if (invoice.status !== 'paid') {
          return; // Not paid, skip
        }

        // Delete all payments and update status
        await supabase
          .from('invoice_payments')
          .delete()
          .eq('invoice_id', invoice.id);

        await supabase
          .from('invoices')
          .update({ 
            status: 'sent',
            paid_at: null
          })
          .eq('id', invoice.id);
      },
      batchOptions,
      onProgress
    );
  }

  async bulkUpdateStatus(
    invoiceIds: string[],
    newStatus: InvoiceStatus,
    batchOptions: BatchProcessingOptions = DEFAULT_BATCH_OPTIONS,
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<BulkOperationResult> {
    return this.processBulkOperation(
      'update-status',
      invoiceIds,
      async (invoice) => {
        const updates: any = { status: newStatus };
        
        if (newStatus === 'paid' && !invoice.paid_at) {
          updates.paid_at = new Date().toISOString();
        } else if (newStatus !== 'paid' && invoice.paid_at) {
          updates.paid_at = null;
        }

        const { error } = await supabase
          .from('invoices')
          .update(updates)
          .eq('id', invoice.id);

        if (error) throw error;
      },
      batchOptions,
      onProgress
    );
  }

  // =====================================
  // BULK DELETE OPERATIONS
  // =====================================

  async bulkDeleteDrafts(
    invoiceIds: string[],
    batchOptions: BatchProcessingOptions = DEFAULT_BATCH_OPTIONS,
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<BulkOperationResult> {
    return this.processBulkOperation(
      'delete-draft',
      invoiceIds,
      async (invoice) => {
        if (invoice.status !== 'draft') {
          throw new Error('Can only delete draft invoices');
        }

        // Delete related records first (due to foreign key constraints)
        await supabase
          .from('invoice_payments')
          .delete()
          .eq('invoice_id', invoice.id);

        await supabase
          .from('invoice_recipients')
          .delete()
          .eq('invoice_id', invoice.id);

        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoice.id);

        // Delete the invoice
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoice.id);

        if (error) throw error;
      },
      batchOptions,
      onProgress
    );
  }

  // =====================================
  // BULK EXPORT OPERATIONS
  // =====================================

  async bulkExportCSV(
    invoiceIds: string[],
    options: BulkExportOptions = {},
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<string> {
    const progress: BulkOperationProgress = {
      operation: 'export-csv',
      total: invoiceIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      status: 'processing',
      startedAt: new Date()
    };

    try {
      // Fetch all invoices with related data
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*),
          invoice_recipients (*),
          invoice_payments (*)
        `)
        .in('id', invoiceIds)
        .order('invoice_number');

      if (error) throw error;

      // Build CSV content
      const headers = [
        'Invoice Number',
        'Status',
        'Issue Date',
        'Due Date',
        'Client Name',
        'Client Email',
        'Subtotal',
        'Tax',
        'Total',
        'Currency',
        'Paid Amount',
        'Balance'
      ];

      if (options.includeItems) {
        headers.push('Items');
      }

      const rows = invoices?.map(invoice => {
        const recipient = invoice.invoice_recipients[0];
        const paidAmount = invoice.invoice_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const balance = invoice.total_amount - paidAmount;

        const row = [
          invoice.invoice_number,
          invoice.status,
          new Date(invoice.issue_date).toLocaleDateString(),
          new Date(invoice.due_date).toLocaleDateString(),
          recipient?.recipient_name || '',
          recipient?.recipient_email || '',
          invoice.subtotal?.toFixed(2) || '0.00',
          invoice.tax_amount?.toFixed(2) || '0.00',
          invoice.total_amount.toFixed(2),
          invoice.currency,
          paidAmount.toFixed(2),
          balance.toFixed(2)
        ];

        if (options.includeItems) {
          const itemsText = invoice.invoice_items
            .map(item => `${item.description} (${item.quantity} x $${item.unit_price})`)
            .join('; ');
          row.push(itemsText);
        }

        return row;
      }) || [];

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      progress.processed = invoiceIds.length;
      progress.succeeded = invoiceIds.length;
      progress.status = 'completed';
      progress.completedAt = new Date();

      if (onProgress) onProgress(progress);

      return csvContent;
    } catch (error) {
      progress.status = 'error';
      progress.failed = invoiceIds.length;
      if (onProgress) onProgress(progress);
      throw error;
    }
  }

  async bulkExportPDF(
    invoiceIds: string[],
    options: BulkExportOptions = {},
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<Blob> {
    // For PDF export, we'll need to generate individual PDFs and combine them
    // This would typically be done server-side
    const progress: BulkOperationProgress = {
      operation: 'export-pdf',
      total: invoiceIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      status: 'processing',
      startedAt: new Date()
    };

    try {
      // Call edge function to generate combined PDF
      const { data, error } = await supabase.functions.invoke('generate-bulk-pdf', {
        body: {
          invoiceIds,
          options
        }
      });

      if (error) throw error;

      progress.processed = invoiceIds.length;
      progress.succeeded = invoiceIds.length;
      progress.status = 'completed';
      progress.completedAt = new Date();

      if (onProgress) onProgress(progress);

      return data as Blob;
    } catch (error) {
      progress.status = 'error';
      progress.failed = invoiceIds.length;
      if (onProgress) onProgress(progress);
      throw error;
    }
  }

  // =====================================
  // CORE PROCESSING ENGINE
  // =====================================

  private async processBulkOperation(
    operation: BulkOperation,
    invoiceIds: string[],
    processInvoice: (invoice: Invoice) => Promise<void>,
    batchOptions: BatchProcessingOptions,
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<BulkOperationResult> {
    this.abortController = new AbortController();
    const progressThrottler = new ProgressThrottler(100); // Update every 100ms max

    const progress: BulkOperationProgress = {
      operation,
      total: invoiceIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      status: 'processing',
      startedAt: new Date()
    };

    this.currentOperation = progress;

    try {
      // Preload invoice data for better performance
      if (invoiceIds.length > 20) {
        await this.preloadInvoiceData(invoiceIds);
      }

      // Process in optimized batches
      const batches = chunkArray(invoiceIds, batchOptions.batchSize);
      
      for (const batchIds of batches) {
        if (this.abortController.signal.aborted) {
          progress.status = 'cancelled';
          break;
        }

        // Check cache first, then fetch missing invoices
        const cachedInvoices: Invoice[] = [];
        const missingIds: string[] = [];

        for (const id of batchIds) {
          const cached = invoiceCache.get(id);
          if (cached) {
            cachedInvoices.push(cached);
          } else {
            missingIds.push(id);
          }
        }

        let fetchedInvoices: Invoice[] = [];
        if (missingIds.length > 0) {
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .in('id', missingIds);

          if (error) throw error;
          fetchedInvoices = data || [];
          
          // Cache fetched invoices
          fetchedInvoices.forEach(inv => invoiceCache.set(inv.id, inv));
        }

        const allInvoices = [...cachedInvoices, ...fetchedInvoices];

        // Process invoices with controlled concurrency
        await processInParallel(
          allInvoices,
          async (invoice) => {
            try {
              await this.retryOperation(
                () => processInvoice(invoice),
                batchOptions.maxRetries
              );
              progress.succeeded++;
            } catch (error) {
              progress.failed++;
              progress.errors.push({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                error: error instanceof Error ? error.message : 'Unknown error'
              });

              if (!batchOptions.continueOnError) {
                throw error;
              }
            } finally {
              progress.processed++;
              
              // Throttle progress updates
              if (onProgress && progressThrottler.shouldUpdate()) {
                onProgress({ ...progress });
              }
            }
          },
          5 // Process 5 invoices concurrently
        );

        // Delay between batches
        if (batches.indexOf(batchIds) < batches.length - 1) {
          await this.delay(batchOptions.delayBetweenBatches);
        }
      }

      progress.status = progress.status === 'cancelled' ? 'cancelled' : 'completed';
      progress.completedAt = new Date();

      // Force final progress update
      if (onProgress) {
        progressThrottler.forceUpdate();
        onProgress({ ...progress });
      }

    } catch (error) {
      progress.status = 'error';
      console.error('Bulk operation error:', error);
    }

    this.currentOperation = null;
    this.abortController = null;

    return {
      operation,
      success: progress.failed === 0,
      processed: progress.processed,
      succeeded: progress.succeeded,
      failed: progress.failed,
      errors: progress.errors.length > 0 ? progress.errors : undefined
    };
  }

  private async retryOperation(
    operation: () => Promise<void>,
    maxRetries: number
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries) {
          await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================
  // OPERATION CONTROL
  // =====================================

  cancelCurrentOperation(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  getCurrentOperation(): BulkOperationProgress | null {
    return this.currentOperation;
  }

  // =====================================
  // CACHE MANAGEMENT
  // =====================================

  async preloadInvoiceData(invoiceIds: string[]): Promise<void> {
    // Preload invoices in chunks to improve performance
    const chunks = chunkArray(invoiceIds, 50);
    
    await processInParallel(
      chunks,
      async (chunk) => {
        const { data } = await supabase
          .from('invoices')
          .select(`
            *,
            invoice_items (*),
            invoice_recipients (*),
            invoice_payments (*)
          `)
          .in('id', chunk);

        // Cache the fetched data
        if (data) {
          data.forEach(invoice => invoiceCache.set(invoice.id, invoice));
        }
      },
      3 // Process 3 chunks concurrently
    );
  }
}

export const bulkInvoiceService = new BulkInvoiceService();