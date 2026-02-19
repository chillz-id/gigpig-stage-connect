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
import { pdfService, InvoicePDFData } from './pdfService';
import {
  invoiceCache,
  emailRateLimiter,
  pdfRateLimiter,
  chunkArray,
  processInParallel,
  ProgressThrottler
} from '@/utils/bulkOperationOptimizations';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

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

  async bulkExportPDFCombined(
    invoiceIds: string[],
    options: BulkExportOptions = {},
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<Blob> {
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
      // Fetch all invoices with related data
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*),
          invoice_recipients (*)
        `)
        .in('id', invoiceIds)
        .order('invoice_number');

      if (error) throw error;
      if (!invoices || invoices.length === 0) throw new Error('No invoices found');

      // Create combined PDF
      const combinedDoc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];

        // Add new page for each invoice after the first
        if (i > 0) {
          combinedDoc.addPage();
        }

        // Convert to PDF data format
        const pdfData: InvoicePDFData = {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          invoice_type: invoice.invoice_type,
          sender_name: invoice.sender_name || 'GigPigs',
          sender_email: invoice.sender_email || '',
          sender_phone: invoice.sender_phone,
          sender_address: invoice.sender_address,
          sender_abn: invoice.sender_abn,
          sender_bank_name: invoice.sender_bank_name,
          sender_bank_bsb: invoice.sender_bank_bsb,
          sender_bank_account: invoice.sender_bank_account,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          total_amount: invoice.total_amount,
          subtotal: invoice.subtotal || 0,
          tax_amount: invoice.tax_amount || 0,
          tax_rate: invoice.tax_rate || 10,
          currency: invoice.currency || 'AUD',
          status: invoice.status,
          notes: invoice.notes,
          terms: invoice.terms,
          invoice_items: (invoice.invoice_items || []).map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total_price || item.subtotal || (item.quantity * item.unit_price),
          })),
          invoice_recipients: (invoice.invoice_recipients || []).map((r: any) => ({
            recipient_name: r.recipient_name,
            recipient_email: r.recipient_email,
            recipient_phone: r.recipient_phone,
            recipient_address: r.recipient_address,
            recipient_abn: r.recipient_abn,
          })),
          event_date: invoice.event_date,
        };

        // Generate PDF pages for this invoice into the combined document
        // We'll use a temporary doc and copy pages
        const tempPdfBase64 = await pdfService.generateInvoicePDF(pdfData) as string;

        // For combined PDF, we need to render directly
        // Since jsPDF doesn't easily merge, we'll generate each invoice separately
        // and use the pdfService methods directly on our combined doc
        // Actually, let's generate individual PDFs and merge them

        progress.processed++;
        progress.succeeded++;
        if (onProgress) onProgress({ ...progress });
      }

      // Since jsPDF can't easily merge PDFs, let's use a different approach:
      // Generate individual PDFs as base64 and use pdf-lib to merge
      // For now, let's generate a simpler combined PDF by regenerating on the same doc

      // Reset and regenerate properly
      const finalDoc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];

        if (i > 0) {
          finalDoc.addPage();
        }

        // Add invoice content to this page
        this.renderInvoiceToDoc(finalDoc, invoice);
      }

      progress.status = 'completed';
      progress.completedAt = new Date();
      if (onProgress) onProgress(progress);

      return finalDoc.output('blob');
    } catch (error) {
      progress.status = 'error';
      progress.failed = invoiceIds.length - progress.succeeded;
      if (onProgress) onProgress(progress);
      throw error;
    }
  }

  async bulkExportPDFZip(
    invoiceIds: string[],
    options: BulkExportOptions = {},
    onProgress?: (progress: BulkOperationProgress) => void
  ): Promise<Blob> {
    const progress: BulkOperationProgress = {
      operation: 'export-pdf-zip',
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
          invoice_recipients (*)
        `)
        .in('id', invoiceIds)
        .order('invoice_number');

      if (error) throw error;
      if (!invoices || invoices.length === 0) throw new Error('No invoices found');

      const zip = new JSZip();

      for (const invoice of invoices) {
        try {
          // Convert to PDF data format
          const pdfData: InvoicePDFData = {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_type: invoice.invoice_type,
            sender_name: invoice.sender_name || 'GigPigs',
            sender_email: invoice.sender_email || '',
            sender_phone: invoice.sender_phone,
            sender_address: invoice.sender_address,
            sender_abn: invoice.sender_abn,
            sender_bank_name: invoice.sender_bank_name,
            sender_bank_bsb: invoice.sender_bank_bsb,
            sender_bank_account: invoice.sender_bank_account,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            total_amount: invoice.total_amount,
            subtotal: invoice.subtotal || 0,
            tax_amount: invoice.tax_amount || 0,
            tax_rate: invoice.tax_rate || 10,
            currency: invoice.currency || 'AUD',
            status: invoice.status,
            notes: invoice.notes,
            terms: invoice.terms,
            invoice_items: (invoice.invoice_items || []).map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total_price || item.subtotal || (item.quantity * item.unit_price),
            })),
            invoice_recipients: (invoice.invoice_recipients || []).map((r: any) => ({
              recipient_name: r.recipient_name,
              recipient_email: r.recipient_email,
              recipient_phone: r.recipient_phone,
              recipient_address: r.recipient_address,
              recipient_abn: r.recipient_abn,
            })),
            event_date: invoice.event_date,
          };

          // Generate PDF as base64
          const pdfBase64 = await pdfService.generateInvoicePDF(pdfData) as string;

          // Convert base64 to binary and add to ZIP
          const pdfBinary = atob(pdfBase64);
          const pdfArray = new Uint8Array(pdfBinary.length);
          for (let i = 0; i < pdfBinary.length; i++) {
            pdfArray[i] = pdfBinary.charCodeAt(i);
          }

          // Add to ZIP with invoice number as filename
          const filename = `invoice-${invoice.invoice_number}.pdf`;
          zip.file(filename, pdfArray);

          progress.succeeded++;
        } catch (err) {
          progress.failed++;
          progress.errors.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            error: err instanceof Error ? err.message : 'Failed to generate PDF'
          });
        }

        progress.processed++;
        if (onProgress) onProgress({ ...progress });
      }

      progress.status = 'completed';
      progress.completedAt = new Date();
      if (onProgress) onProgress(progress);

      // Generate ZIP file
      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
      progress.status = 'error';
      progress.failed = invoiceIds.length - progress.succeeded;
      if (onProgress) onProgress(progress);
      throw error;
    }
  }

  // Helper to render invoice content directly to a jsPDF doc
  private renderInvoiceToDoc(doc: jsPDF, invoice: any): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 20, yPos);

    // Invoice number
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoice_number}`, 20, yPos + 8);

    // Sender name on right
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.sender_name || 'GigPigs', pageWidth - 20, yPos, { align: 'right' });

    yPos += 25;

    // Recipient
    const recipient = invoice.invoice_recipients?.[0];
    if (recipient) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('To:', 20, yPos);
      doc.setTextColor(30, 30, 30);
      doc.text(recipient.recipient_name || '', 35, yPos);
    }

    // Dates
    doc.setTextColor(100, 100, 100);
    doc.text('Due:', pageWidth / 2, yPos);
    doc.setTextColor(30, 30, 30);
    const dueDate = new Date(invoice.due_date).toLocaleDateString('en-AU');
    doc.text(dueDate, pageWidth / 2 + 15, yPos);

    yPos += 15;

    // Items table header
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Description', 22, yPos + 5);
    doc.text('Amount', pageWidth - 22, yPos + 5, { align: 'right' });

    yPos += 12;

    // Items
    doc.setTextColor(30, 30, 30);
    for (const item of invoice.invoice_items || []) {
      const total = item.total_price || item.subtotal || (item.quantity * item.unit_price);
      doc.text(item.description || '', 22, yPos);
      doc.text(`$${total.toFixed(2)}`, pageWidth - 22, yPos, { align: 'right' });
      yPos += 6;
    }

    yPos += 10;

    // Total
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - 60, yPos);
    doc.text(`$${invoice.total_amount.toFixed(2)}`, pageWidth - 22, yPos, { align: 'right' });
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