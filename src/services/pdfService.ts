// PDF Service - Generate professional invoice PDFs
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface InvoicePDFData {
  id: string;
  invoice_number: string;
  invoice_type?: 'promoter' | 'comedian' | 'other' | 'receivable' | 'payable';
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_address?: string;
  sender_abn?: string;
  sender_bank_name?: string;
  sender_bank_bsb?: string;
  sender_bank_account?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  currency: string;
  status: string;
  notes?: string;
  terms?: string;
  invoice_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  invoice_recipients: Array<{
    recipient_name: string;
    recipient_email: string;
    recipient_phone?: string;
    recipient_address?: string;
    recipient_abn?: string;
  }>;
  deposit_amount?: number;
  deposit_percentage?: number;
  deposit_due_date?: string;
  event_date?: string;
}

interface PDFGenerationOptions {
  filename?: string;
  download?: boolean;
  returnBlob?: boolean;
}

class PDFService {
  // Default GigPigs brand colors
  private defaultColors = {
    primary: '#DC2626', // Red
    secondary: '#7C3AED', // Purple
    accent: '#F59E0B', // Amber
    dark: '#1F2937',
    light: '#6B7280',
    background: '#FFFFFF',
    border: '#E5E7EB'
  };

  /**
   * Validate that invoice data has required fields for PDF generation
   */
  validateInvoiceData(invoice: Invoice | InvoicePDFData): void {
    if (!invoice) {
      throw new Error('Invoice data is required');
    }
    if (!invoice.invoice_number) {
      throw new Error('Invoice number is required');
    }
    if (!invoice.total_amount && invoice.total_amount !== 0) {
      throw new Error('Invoice total amount is required');
    }
  }

  /**
   * Generate a filename for the PDF
   */
  formatFilename(invoice: Invoice | InvoicePDFData): string {
    const invoiceNumber = invoice.invoice_number || 'invoice';
    const sanitized = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `invoice-${sanitized}.pdf`;
  }

  /**
   * Generate invoice PDF - supports multiple calling conventions:
   * 1. generateInvoicePDF(invoiceData, config) - returns base64 string
   * 2. generateInvoicePDF(invoice, items, options) - handles download/blob based on options
   */
  async generateInvoicePDF(
    invoiceOrData: Invoice | InvoicePDFData,
    itemsOrConfig?: InvoiceItem[] | InvoiceTemplateConfig,
    options?: PDFGenerationOptions
  ): Promise<string | Blob | void> {
    // Determine which signature was used
    let invoiceData: InvoicePDFData;
    let pdfOptions: PDFGenerationOptions = {};

    if (Array.isArray(itemsOrConfig)) {
      const invoice = invoiceOrData as Invoice;
      const items = itemsOrConfig;
      pdfOptions = options || {};
      invoiceData = this.convertToInvoicePDFData(invoice, items);
    } else {
      invoiceData = invoiceOrData as InvoicePDFData;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set up the document
    this.setupDocument(doc, invoiceData);

    // Clean professional layout
    let yPos = 20;

    // Header
    yPos = this.addCleanHeader(doc, invoiceData, yPos);

    // From/To section
    yPos = this.addContactSection(doc, invoiceData, yPos);

    // Dates
    yPos = this.addDatesLine(doc, invoiceData, yPos);

    // Items table
    yPos = this.addCleanItemsTable(doc, invoiceData, yPos);

    // Totals
    yPos = this.addCleanTotals(doc, invoiceData, yPos);

    // Payment details
    yPos = this.addCleanPaymentDetails(doc, invoiceData, yPos);

    // Notes (if any)
    yPos = this.addCleanNotes(doc, invoiceData, yPos);

    // Footer
    this.addCleanFooter(doc);

    // Handle return based on options
    if (pdfOptions.returnBlob) {
      return doc.output('blob');
    }

    if (pdfOptions.download) {
      const filename = pdfOptions.filename || this.formatFilename(invoiceData);
      doc.save(filename);
      return;
    }

    // Default: return as base64 string
    return doc.output('datauristring').split(',')[1];
  }

  // ============ MUZEEK-STYLE DESIGN METHODS ============

  private addCleanHeader(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    // LEFT SIDE: "Invoice" title with status badge
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 20, yPos);

    // Status badge next to "Invoice"
    const statusText = invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1);
    const statusWidth = doc.getTextWidth(statusText) + 6;
    doc.setFontSize(9);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.roundedRect(58, yPos - 6, statusWidth, 8, 2, 2, 'S');
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(statusText, 61, yPos - 1);

    // RIGHT SIDE: Sender name, ABN, country
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.sender_name || 'Invoice', pageWidth - 20, yPos - 8, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    if (invoiceData.sender_abn) {
      doc.text(`ABN: ${invoiceData.sender_abn}`, pageWidth - 20, yPos - 2, { align: 'right' });
    }
    doc.text('Australia', pageWidth - 20, yPos + 4, { align: 'right' });

    yPos += 12;

    // Generated date
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const generatedDate = new Date().toLocaleDateString('en-AU', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Generated on ${generatedDate}`, 20, yPos);

    return yPos + 15;
  }

  private addContactSection(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const midPoint = pageWidth / 2;
    let yPos = startY;

    // Summary section header
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPos);

    // Line under Summary
    yPos += 3;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 10;

    // LEFT COLUMN
    let leftY = yPos;

    // Invoice No
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice No:', 20, leftY);
    leftY += 4;
    doc.setTextColor(30, 30, 30);
    doc.text(invoiceData.invoice_number, 20, leftY);
    leftY += 8;

    // Due Date
    doc.setTextColor(100, 100, 100);
    doc.text('Due Date:', 20, leftY);
    leftY += 4;
    doc.setTextColor(30, 30, 30);
    const dueDate = new Date(invoiceData.due_date).toLocaleDateString('en-AU', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(dueDate, 20, leftY);
    leftY += 8;

    // From
    doc.setTextColor(100, 100, 100);
    doc.text('From:', 20, leftY);
    leftY += 4;
    doc.setTextColor(30, 30, 30);
    if (invoiceData.sender_abn) {
      doc.text(`${invoiceData.sender_name} (ABN: ${invoiceData.sender_abn})`, 20, leftY);
    } else {
      doc.text(invoiceData.sender_name || '', 20, leftY);
    }
    leftY += 4;
    doc.text(invoiceData.sender_name || '', 20, leftY);

    // RIGHT COLUMN
    let rightY = yPos;

    // Event (we don't have event data, so skip or use notes)
    // For now, skip Event section since we don't have that data

    // Event Date (skip if no event_date)
    if (invoiceData.event_date) {
      doc.setTextColor(100, 100, 100);
      doc.text('Event Date:', midPoint, rightY);
      rightY += 4;
      doc.setTextColor(30, 30, 30);
      const eventDate = new Date(invoiceData.event_date).toLocaleDateString('en-AU', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.text(eventDate, midPoint, rightY);
      rightY += 8;
    }

    // To - Full client details
    const recipient = invoiceData.invoice_recipients?.[0];
    if (recipient) {
      doc.setTextColor(100, 100, 100);
      doc.text('To:', midPoint, rightY);
      rightY += 4;

      // Recipient name (bold)
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(recipient.recipient_name || '', midPoint, rightY);
      rightY += 5;

      // Reset to normal for details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Email
      if (recipient.recipient_email) {
        doc.setTextColor(80, 80, 80);
        doc.text(recipient.recipient_email, midPoint, rightY);
        rightY += 4;
      }

      // Phone
      if (recipient.recipient_phone) {
        doc.setTextColor(80, 80, 80);
        doc.text(recipient.recipient_phone, midPoint, rightY);
        rightY += 4;
      }

      // ABN
      if (recipient.recipient_abn) {
        doc.setTextColor(80, 80, 80);
        doc.text(`ABN: ${recipient.recipient_abn}`, midPoint, rightY);
        rightY += 4;
      }

      // Address
      if (recipient.recipient_address) {
        doc.setTextColor(80, 80, 80);
        const addressLines = doc.splitTextToSize(recipient.recipient_address, 70);
        doc.text(addressLines, midPoint, rightY);
        rightY += addressLines.length * 4;
      }
    }

    return Math.max(leftY, rightY) + 15;
  }

  private addDatesLine(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    // Not needed in Muzeek style - dates are in Summary section
    return startY;
  }

  private addCleanItemsTable(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Track deduction rows for styling
    const deductionRows: number[] = [];

    // Calculate GST for each item (assume 10%)
    const taxRate = invoiceData.tax_rate ?? 10;

    // Prepare table data - Muzeek style: Description | Sub Total | GST (10%) | Total
    const headers = [['Description', 'Sub Total', `GST (${taxRate}%)`, 'Total']];
    const data = invoiceData.invoice_items.map((item, index) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.unit_price ?? 0;
      const subtotal = quantity * unitPrice;
      const gst = subtotal * (taxRate / 100);
      const total = item.total ?? (subtotal + gst);
      const isDeduction = total < 0;

      if (isDeduction) deductionRows.push(index);

      const desc = quantity > 1
        ? `${item.description || ''} (x${quantity})`
        : (item.description || '');

      return [
        isDeduction ? `${desc} (Deduction)` : desc,
        isDeduction ? `-$${Math.abs(subtotal).toFixed(0)}` : `$${subtotal.toFixed(0)}`,
        isDeduction ? `-$${Math.abs(gst).toFixed(0)}` : `$${gst.toFixed(0)}`,
        isDeduction ? `-$${Math.abs(total).toFixed(0)}` : `$${total.toFixed(0)}`
      ];
    });

    doc.autoTable({
      head: headers,
      body: data,
      startY: startY,
      margin: { left: 20, right: 20 },
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [30, 30, 30],
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 }
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [30, 30, 30],
        cellPadding: { top: 4, bottom: 4 }
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      // Apply right alignment to header cells for numeric columns
      didParseCell: (hookData: any) => {
        // Align numeric column headers to the right
        if (hookData.section === 'head' && hookData.column.index > 0) {
          hookData.cell.styles.halign = 'right';
        }
        // Style deduction rows with red text
        if (hookData.section === 'body' && deductionRows.includes(hookData.row.index)) {
          hookData.cell.styles.textColor = [220, 38, 38];
        }
        // Add bottom border to header
        if (hookData.section === 'head') {
          hookData.cell.styles.lineWidth = { bottom: 0.5 };
          hookData.cell.styles.lineColor = [200, 200, 200];
        }
      }
    });

    return doc.lastAutoTable?.finalY + 2 || startY + 30;
  }

  private addCleanTotals(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - 20;
    let yPos = startY;

    const subtotal = invoiceData.subtotal ?? 0;
    const taxAmount = invoiceData.tax_amount ?? 0;
    const taxRate = invoiceData.tax_rate ?? 10;
    const total = invoiceData.total_amount ?? (subtotal + taxAmount);
    const currency = invoiceData.currency || 'AUD';

    // Sub total row with line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.text('Sub total', 20, yPos);
    doc.text(`$${subtotal.toFixed(0)}`, rightX - 60, yPos, { align: 'right' });
    doc.text(`$${taxAmount.toFixed(0)}`, rightX - 30, yPos, { align: 'right' });
    doc.text(`$${total.toFixed(0)}`, rightX, yPos, { align: 'right' });

    // Total owed line
    yPos += 12;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total owed to ${invoiceData.sender_name}`, 20, yPos);

    // Big total amount
    doc.setFontSize(28);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${total.toFixed(0)}`, rightX, yPos + 2, { align: 'right' });

    // Currency label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(currency, rightX, yPos + 8, { align: 'right' });

    // Amount Due section
    yPos += 20;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount Due', 20, yPos);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${total.toFixed(0)} ${currency}`, rightX, yPos, { align: 'right' });

    // Line under Amount Due
    yPos += 5;
    doc.setDrawColor(230, 230, 230);
    doc.line(20, yPos, pageWidth - 20, yPos);

    return yPos + 15;
  }

  private addCleanPaymentDetails(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const hasBankDetails = invoiceData.sender_bank_name ||
                           invoiceData.sender_bank_bsb ||
                           invoiceData.sender_bank_account;

    if (!hasBankDetails) return startY;

    let yPos = startY;

    // Section title
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 20, yPos);

    // Line under title
    yPos += 3;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 80, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Bank Account Name
    if (invoiceData.sender_bank_name) {
      doc.setTextColor(100, 100, 100);
      doc.text('Bank Account Name:', 20, yPos);
      yPos += 5;
      doc.setTextColor(30, 30, 30);
      doc.text(invoiceData.sender_bank_name, 20, yPos);
      yPos += 8;
    }

    // Bank Account Number
    if (invoiceData.sender_bank_account) {
      doc.setTextColor(100, 100, 100);
      doc.text('Bank Account Number:', 20, yPos);
      yPos += 5;
      doc.setTextColor(30, 30, 30);
      doc.text(invoiceData.sender_bank_account, 20, yPos);
      yPos += 8;
    }

    // BSB
    if (invoiceData.sender_bank_bsb) {
      doc.setTextColor(100, 100, 100);
      doc.text('Bank Code (Eg. BSB, Sort, Routing No.):', 20, yPos);
      yPos += 5;
      doc.setTextColor(30, 30, 30);
      doc.text(invoiceData.sender_bank_bsb, 20, yPos);
      yPos += 8;
    }

    return yPos + 5;
  }

  private addCleanNotes(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    if (!invoiceData.notes) return startY;

    let yPos = startY;

    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', 20, yPos);

    yPos += 3;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 50, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(invoiceData.notes, 170);
    doc.text(lines, 20, yPos);

    return yPos + (lines.length * 5) + 8;
  }

  private addCleanFooter(doc: jsPDF): void {
    // Muzeek style has no footer - clean and minimal
    // Just leave blank space at bottom
  }

  /**
   * Convert Invoice type to InvoicePDFData format
   */
  private convertToInvoicePDFData(invoice: Invoice, items: InvoiceItem[] = []): InvoicePDFData {
    // Use provided items or invoice's items
    const invoiceItems = items.length > 0 ? items : (invoice.invoice_items || []);

    return {
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
      subtotal: invoice.subtotal || invoiceItems.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unit_price), 0),
      tax_amount: invoice.tax_amount || 0,
      tax_rate: invoice.tax_rate || 10,
      currency: invoice.currency || 'AUD',
      status: invoice.status,
      notes: invoice.notes,
      terms: invoice.terms,
      invoice_items: invoiceItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total || item.subtotal || (item.quantity * item.unit_price),
      })),
      invoice_recipients: invoice.invoice_recipients?.map(r => ({
        recipient_name: r.recipient_name,
        recipient_email: r.recipient_email,
        recipient_phone: r.recipient_phone,
        recipient_address: r.recipient_address,
        recipient_abn: r.recipient_abn,
      })) || [],
      deposit_amount: invoice.deposit_amount,
      deposit_percentage: invoice.deposit_percentage,
      deposit_due_date: invoice.deposit_due_date,
      event_date: invoice.event_date,
    };
  }

  /**
   * Generate PDF and return as URL for preview
   */
  async generateInvoicePDFURL(invoice: Invoice, items: InvoiceItem[] = []): Promise<string> {
    const invoiceData = this.convertToInvoicePDFData(invoice, items);
    const base64 = await this.generateInvoicePDF(invoiceData) as string;
    return `data:application/pdf;base64,${base64}`;
  }

  private setupDocument(doc: jsPDF, invoiceData: InvoicePDFData): void {
    // Set document properties
    doc.setProperties({
      title: `Invoice ${invoiceData.invoice_number}`,
      subject: 'Invoice',
      author: invoiceData.sender_name,
      creator: 'GigPigs',
      producer: 'GigPigs Invoice System'
    });

    // Set default font
    doc.setFont('helvetica');
  }

  private addWatermark(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add subtle watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    
    // Center and rotate text
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    const text = 'GIGPIGS';
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth / 2 - textWidth / 2, pageHeight / 2, {
      angle: -45
    });
    doc.restoreGraphicsState();
  }

  private addEnhancedHeader(
    doc: jsPDF, 
    invoiceData: InvoicePDFData,
    config?: InvoiceTemplateConfig
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const colors = config?.branding.colors || this.defaultColors;
    let yPos = config?.branding.layout.marginTop || 20;

    // Modern gradient header with brand colors (clean design, no diagonal lines)
    const headerHeight = 35;

    // Solid header background
    doc.setFillColor(colors.primary);
    doc.rect(15, yPos, pageWidth - 30, headerHeight, 'F');

    // Sender name (who is invoicing)
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const senderName = invoiceData.sender_name || 'Invoice';
    doc.text(senderName, 25, yPos + 22);

    // Invoice number badge
    const invoiceNumText = `INVOICE #${invoiceData.invoice_number}`;
    const invoiceNumWidth = doc.getTextWidth(invoiceNumText) + 10;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      pageWidth - invoiceNumWidth - 25, 
      yPos + 10, 
      invoiceNumWidth, 
      15, 
      3, 
      3, 
      'F'
    );
    
    doc.setTextColor(colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceNumText, pageWidth - invoiceNumWidth - 20, yPos + 19);

    yPos += headerHeight + 10;

    // Sender information
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text('From:', 20, yPos);
    yPos += 5;

    doc.setFontSize(10);
    doc.text(invoiceData.sender_name, 20, yPos);
    yPos += 4;

    if (invoiceData.sender_email) {
      doc.text(invoiceData.sender_email, 20, yPos);
      yPos += 4;
    }

    if (invoiceData.sender_phone) {
      doc.text(invoiceData.sender_phone, 20, yPos);
      yPos += 4;
    }

    if (invoiceData.sender_address) {
      const addressLines = doc.splitTextToSize(invoiceData.sender_address, 80);
      doc.text(addressLines, 20, yPos);
      yPos += addressLines.length * 4;
    }

    if (invoiceData.sender_abn) {
      doc.text(`ABN: ${invoiceData.sender_abn}`, 20, yPos);
      yPos += 4;
    }

    // Recipient information
    const recipient = invoiceData.invoice_recipients[0];
    if (recipient) {
      const recipientX = pageWidth - 80;
      let recipientY = 70;

      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('To:', recipientX, recipientY);
      recipientY += 5;

      doc.setFontSize(10);
      doc.text(recipient.recipient_name, recipientX, recipientY);
      recipientY += 4;

      if (recipient.recipient_email) {
        doc.text(recipient.recipient_email, recipientX, recipientY);
        recipientY += 4;
      }

      if (recipient.recipient_phone) {
        doc.text(recipient.recipient_phone, recipientX, recipientY);
        recipientY += 4;
      }

      if (recipient.recipient_address) {
        const addressLines = doc.splitTextToSize(recipient.recipient_address, 80);
        doc.text(addressLines, recipientX, recipientY);
        recipientY += addressLines.length * 4;
      }

      if (recipient.recipient_abn) {
        doc.text(`ABN: ${recipient.recipient_abn}`, recipientX, recipientY);
      }
    }

    // Return the current Y position plus a small margin (removed forced minimum of 120 that created gap)
    return yPos + 10;
  }

  private addInvoiceDetails(doc: jsPDF, invoiceData: InvoicePDFData, startY: number, colors: any): number {
    // Simplified - just show dates inline, no box (totals shown in totals section)
    const pageWidth = doc.internal.pageSize.getWidth();
    const yPos = startY;

    doc.setFontSize(9);
    doc.setTextColor(colors.light);

    const issueDate = new Date(invoiceData.issue_date).toLocaleDateString('en-AU');
    const dueDate = new Date(invoiceData.due_date).toLocaleDateString('en-AU');

    doc.text(`Issue Date: ${issueDate}  |  Due Date: ${dueDate}  |  Status: ${invoiceData.status.toUpperCase()}`, 20, yPos);

    return yPos + 8;
  }

  private addEnhancedItemsTable(
    doc: jsPDF, 
    invoiceData: InvoicePDFData, 
    startY: number,
    config?: InvoiceTemplateConfig
  ): number {
    const colors = config?.branding.colors || this.defaultColors;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    // Section title with icon
    doc.setFontSize(14);
    doc.setTextColor(colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Services', 20, yPos);
    
    // Draw decorative line
    doc.setDrawColor(colors.primary);
    doc.setLineWidth(2);
    doc.line(20, yPos + 2, 50, yPos + 2);
    
    yPos += 15;

    // Table headers
    const headers = [
      ['Description', 'Qty', 'Rate', 'Amount']
    ];

    // Track which rows are deductions for styling
    const deductionRows: number[] = [];

    // Table data - detect deductions by negative total
    const data = invoiceData.invoice_items.map((item, index) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.unit_price ?? 0;
      const total = item.total ?? (quantity * unitPrice);
      const isDeduction = total < 0;

      if (isDeduction) {
        deductionRows.push(index);
      }

      // Format amounts - show negative amounts with minus sign
      const formattedUnitPrice = isDeduction
        ? `-$${Math.abs(unitPrice).toFixed(2)}`
        : `$${unitPrice.toFixed(2)}`;
      const formattedTotal = isDeduction
        ? `-$${Math.abs(total).toFixed(2)}`
        : `$${total.toFixed(2)}`;
      const description = isDeduction
        ? `${item.description || ''} (Deduction)`
        : (item.description || '');

      return [
        description,
        quantity.toString(),
        formattedUnitPrice,
        formattedTotal
      ];
    });

    // Add table with autoTable
    doc.autoTable({
      head: headers,
      body: data,
      startY: yPos,
      margin: { left: 20, right: 20 },
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: '#FFFFFF',
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: colors.dark
      },
      alternateRowStyles: {
        fillColor: '#F9FAFB'
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (hookData: any) => {
        // Style deduction rows with red text and light red background
        if (hookData.section === 'body' && deductionRows.includes(hookData.row.index)) {
          hookData.cell.styles.textColor = [220, 38, 38]; // Red text
          hookData.cell.styles.fillColor = [254, 242, 242]; // Light red background
          hookData.cell.styles.fontStyle = 'italic';
        }
      },
      didDrawCell: (cellData: any) => {
        // Add subtle borders
        if (cellData.section === 'body') {
          doc.setDrawColor(colors.border);
          doc.setLineWidth(0.1);
          doc.line(
            cellData.cell.x,
            cellData.cell.y + cellData.cell.height,
            cellData.cell.x + cellData.cell.width,
            cellData.cell.y + cellData.cell.height
          );
        }
      }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  private addItemsTable(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    // Table header
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text('Invoice Items', 20, yPos);
    yPos += 10;

    // Table headers
    const tableStart = 20;
    const tableWidth = pageWidth - 40;
    const colWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.175, tableWidth * 0.175];
    const colPositions = [
      tableStart,
      tableStart + colWidths[0],
      tableStart + colWidths[0] + colWidths[1],
      tableStart + colWidths[0] + colWidths[1] + colWidths[2]
    ];

    // Header background
    doc.setFillColor(103, 126, 234);
    doc.rect(tableStart, yPos, tableWidth, 8, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Description', colPositions[0] + 2, yPos + 5);
    doc.text('Qty', colPositions[1] + 2, yPos + 5);
    doc.text('Rate', colPositions[2] + 2, yPos + 5);
    doc.text('Total', colPositions[3] + 2, yPos + 5);

    yPos += 8;

    // Table rows
    doc.setTextColor(51, 51, 51);
    invoiceData.invoice_items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      
      // Alternate row background
      if (isEven) {
        doc.setFillColor(248, 249, 250);
        doc.rect(tableStart, yPos, tableWidth, 8, 'F');
      }

      // Item data
      const descriptionLines = doc.splitTextToSize(item.description || '', colWidths[0] - 4);
      const unitPrice = item.unit_price ?? 0;
      const itemTotal = item.total ?? (item.quantity * unitPrice);
      doc.text(descriptionLines, colPositions[0] + 2, yPos + 5);
      doc.text((item.quantity ?? 1).toString(), colPositions[1] + 2, yPos + 5);
      doc.text(`$${unitPrice.toFixed(2)}`, colPositions[2] + 2, yPos + 5);
      doc.text(`$${itemTotal.toFixed(2)}`, colPositions[3] + 2, yPos + 5);

      yPos += Math.max(8, descriptionLines.length * 4);
    });

    // Table border
    doc.setDrawColor(200, 200, 200);
    doc.rect(tableStart, startY + 10, tableWidth, yPos - (startY + 10), 'S');

    return yPos + 10;
  }

  private addEnhancedTotals(
    doc: jsPDF, 
    invoiceData: InvoicePDFData, 
    startY: number,
    colors: any
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    // Create professional totals box
    const boxX = pageWidth - 100;
    const boxWidth = 80;
    
    // Background for totals section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(boxX - 5, yPos, boxWidth + 10, 45, 3, 3, 'F');
    
    // Draw border
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX - 5, yPos, boxWidth + 10, 45, 3, 3, 'S');

    const totalsX = pageWidth - 30;
    const labelX = totalsX - 60;

    doc.setFontSize(10);
    doc.setTextColor(colors.light);
    yPos += 8;

    // Subtotal
    const subtotal = invoiceData.subtotal ?? 0;
    const taxAmount = invoiceData.tax_amount ?? 0;
    const taxRate = invoiceData.tax_rate ?? 10;
    const totalAmount = invoiceData.total_amount ?? (subtotal + taxAmount);
    const currency = invoiceData.currency || 'AUD';

    doc.text('Subtotal:', labelX, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, totalsX, yPos, { align: 'right' });
    yPos += 6;

    // Tax with percentage
    doc.text(`Tax (${taxRate}%):`, labelX, yPos);
    doc.text(`$${taxAmount.toFixed(2)}`, totalsX, yPos, { align: 'right' });
    yPos += 8;

    // Separator line
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.5);
    doc.line(labelX, yPos - 2, totalsX, yPos - 2);

    // Total with emphasis
    doc.setFontSize(14);
    doc.setTextColor(colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', labelX, yPos + 6);
    doc.text(`${currency} $${totalAmount.toFixed(2)}`, totalsX, yPos + 6, { align: 'right' });
    
    return startY + 55;
  }

  private addTotals(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    const totalsX = pageWidth - 80;
    const labelX = totalsX - 40;

    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);

    // Handle null values
    const subtotal = invoiceData.subtotal ?? 0;
    const taxAmount = invoiceData.tax_amount ?? 0;
    const taxRate = invoiceData.tax_rate ?? 10;
    const totalAmount = invoiceData.total_amount ?? (subtotal + taxAmount);
    const currency = invoiceData.currency || 'AUD';

    // Subtotal
    doc.text('Subtotal:', labelX, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, totalsX, yPos);
    yPos += 6;

    // Tax
    doc.text(`Tax (${taxRate}%):`, labelX, yPos);
    doc.text(`$${taxAmount.toFixed(2)}`, totalsX, yPos);
    yPos += 6;

    // Total
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text('Total:', labelX, yPos);
    doc.setTextColor(103, 126, 234);
    doc.text(`${currency} $${totalAmount.toFixed(2)}`, totalsX, yPos);
    yPos += 10;

    return yPos;
  }

  private addDepositInfo(doc: jsPDF, invoiceData: InvoicePDFData, startY: number, colors: any): number {
    let yPos = startY;

    if (invoiceData.deposit_amount || invoiceData.deposit_percentage) {
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Deposit section header with icon
      doc.setFontSize(12);
      doc.setTextColor(colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('Deposit Information', 20, yPos);
      
      // Draw decorative line
      doc.setDrawColor(colors.primary);
      doc.setLineWidth(1);
      doc.line(20, yPos + 2, 65, yPos + 2);
      
      yPos += 10;

      // Modern deposit box with gradient effect
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
      doc.setDrawColor(colors.accent);
      doc.setLineWidth(1);
      doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'S');

      yPos += 5;

      doc.setFontSize(10);
      doc.setTextColor(133, 100, 4);

      const totalAmt = invoiceData.total_amount ?? 0;
      const curr = invoiceData.currency || 'AUD';
      const depositAmount = invoiceData.deposit_amount ||
        (invoiceData.deposit_percentage && totalAmt * (invoiceData.deposit_percentage / 100));

      if (depositAmount) {
        doc.text(`Deposit Required: ${curr} $${depositAmount.toFixed(2)}`, 20, yPos + 5);

        if (invoiceData.deposit_due_date) {
          doc.text(`Due by: ${new Date(invoiceData.deposit_due_date).toLocaleDateString('en-AU')}`, 20, yPos + 10);
        }

        const remainingBalance = totalAmt - depositAmount;
        doc.text(`Remaining Balance: ${curr} $${remainingBalance.toFixed(2)}`, 20, yPos + 15);
      }

      yPos += 30;
    }

    return yPos;
  }

  private addPaymentDetails(doc: jsPDF, invoiceData: InvoicePDFData, startY: number, colors: any): number {
    let yPos = startY;

    // Only show bank details if present
    const hasBankDetails = invoiceData.sender_bank_name ||
                           invoiceData.sender_bank_bsb ||
                           invoiceData.sender_bank_account;

    if (!hasBankDetails) {
      return yPos;
    }

    const pageWidth = doc.internal.pageSize.getWidth();

    // Payment section header
    doc.setFontSize(11);
    doc.setTextColor(colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 20, yPos);

    // Draw decorative line
    doc.setDrawColor(colors.primary);
    doc.setLineWidth(1);
    doc.line(20, yPos + 2, 65, yPos + 2);

    yPos += 8;

    // Calculate box height based on content
    const boxHeight = 35;
    const boxStartY = yPos;

    // Payment details box with professional styling
    doc.setFillColor(240, 253, 244); // Light green background
    doc.roundedRect(15, boxStartY, pageWidth - 30, boxHeight, 2, 2, 'F');
    doc.setDrawColor(34, 197, 94); // Green border
    doc.setLineWidth(0.5);
    doc.roundedRect(15, boxStartY, pageWidth - 30, boxHeight, 2, 2, 'S');

    // Content inside box
    let contentY = boxStartY + 7;

    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('Please transfer payment to:', 20, contentY);

    contentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);

    // Bank details on one line
    const bankDetails = [];
    if (invoiceData.sender_bank_name) bankDetails.push(`Account: ${invoiceData.sender_bank_name}`);
    if (invoiceData.sender_bank_bsb) bankDetails.push(`BSB: ${invoiceData.sender_bank_bsb}`);
    if (invoiceData.sender_bank_account) bankDetails.push(`Acc: ${invoiceData.sender_bank_account}`);

    doc.text(bankDetails.join('  |  '), 20, contentY);

    contentY += 6;

    // Reference on next line
    doc.setFontSize(8);
    doc.setTextColor(colors.light);
    const refText = `Reference: ${invoiceData.invoice_number}`;
    if (invoiceData.sender_abn) {
      doc.text(`${refText}  |  ABN: ${invoiceData.sender_abn}`, 20, contentY);
    } else {
      doc.text(refText, 20, contentY);
    }

    return boxStartY + boxHeight + 5;
  }

  private addNotesAndTerms(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    let yPos = startY;

    // Notes section
    if (invoiceData.notes) {
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('Notes', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      const notesLines = doc.splitTextToSize(invoiceData.notes, 170);
      doc.text(notesLines, 20, yPos);
      yPos += notesLines.length * 4 + 10;
    }

    // Terms section
    if (invoiceData.terms) {
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('Terms & Conditions', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      const termsLines = doc.splitTextToSize(invoiceData.terms, 170);
      doc.text(termsLines, 20, yPos);
      yPos += termsLines.length * 4 + 10;
    }

    return yPos;
  }

  private addEnhancedFooter(
    doc: jsPDF,
    invoiceData: InvoicePDFData,
    startY: number,
    config?: InvoiceTemplateConfig
  ): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const colors = config?.branding.colors || this.defaultColors;

    // Footer ALWAYS goes after content - never overlap
    const footerY = startY + 10;

    // If we'd go off page, add a new page
    if (footerY > pageHeight - 15) {
      doc.addPage();
      // Draw footer at top of new page
      const newFooterY = 20;
      this.drawFooterContent(doc, newFooterY, pageWidth, colors);
    } else {
      this.drawFooterContent(doc, footerY, pageWidth, colors);
    }
  }

  private drawFooterContent(doc: jsPDF, footerY: number, pageWidth: number, colors: any): void {
    // Simple footer line
    doc.setDrawColor(colors.primary);
    doc.setLineWidth(1);
    doc.line(15, footerY, pageWidth - 15, footerY);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(colors.light);
    doc.setFont('helvetica', 'normal');

    const textY = footerY + 6;
    doc.text('Thank you for your business with GigPigs!', 15, textY);
    doc.text('www.gigpigs.app', pageWidth / 2, textY, { align: 'center' });
    doc.text(`Page 1 of 1 | © ${new Date().getFullYear()} GigPigs`, pageWidth - 15, textY, { align: 'right' });
  }

  private addFooter(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Footer position
    const footerY = Math.max(startY + 20, pageHeight - 30);

    // Footer separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY, pageWidth - 20, footerY);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.text('Thank you for your business!', 20, footerY + 8);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-AU')}`, 20, footerY + 14);
    
    // Contact information
    doc.text('GigPigs', pageWidth - 80, footerY + 8);
    doc.text(`© ${new Date().getFullYear()} GigPigs. All rights reserved.`, pageWidth - 80, footerY + 14);
  }

  async fetchInvoiceData(invoiceId: string): Promise<InvoicePDFData> {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        invoice_recipients (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw new Error(`Failed to fetch invoice: ${error.message}`);
    if (!invoice) throw new Error('Invoice not found');

    return invoice as InvoicePDFData;
  }

  async generateAndDownloadInvoice(invoiceId: string): Promise<void> {
    const invoiceData = await this.fetchInvoiceData(invoiceId);
    const pdfBase64 = await this.generateInvoicePDF(invoiceData);
    
    // Convert base64 to blob and trigger download
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceData.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const pdfService = new PDFService();