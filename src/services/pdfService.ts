// PDF Service - Generate professional invoice PDFs
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';
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
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_address?: string;
  sender_abn?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  subtotal: number; // Match database column name
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
  // Deposit fields
  deposit_amount?: number;
  deposit_percentage?: number;
  deposit_due_date?: string;
  event_date?: string;
}

class PDFService {
  // Default Stand Up Sydney brand colors
  private defaultColors = {
    primary: '#DC2626', // Red
    secondary: '#7C3AED', // Purple
    accent: '#F59E0B', // Amber
    dark: '#1F2937',
    light: '#6B7280',
    background: '#FFFFFF',
    border: '#E5E7EB'
  };

  async generateInvoicePDF(
    invoiceData: InvoicePDFData, 
    config?: InvoiceTemplateConfig
  ): Promise<string> {
    const doc = new jsPDF({
      orientation: config?.branding.layout.orientation || 'portrait',
      unit: 'mm',
      format: config?.branding.layout.pageSize?.toLowerCase() || 'a4'
    });

    // Use template config colors or defaults
    const colors = config?.branding.colors || this.defaultColors;
    
    // Set up the document
    this.setupDocument(doc, invoiceData);
    
    // Add watermark for Stand Up Sydney branding
    this.addWatermark(doc);
    
    // Add header with custom branding
    const yPos = this.addEnhancedHeader(doc, invoiceData, config);
    
    // Add invoice details
    const afterDetailsY = this.addInvoiceDetails(doc, invoiceData, yPos, colors);
    
    // Add items table with better formatting
    const afterItemsY = this.addEnhancedItemsTable(doc, invoiceData, afterDetailsY, config);
    
    // Add totals
    const afterTotalsY = this.addEnhancedTotals(doc, invoiceData, afterItemsY, colors);
    
    // Add deposit information if applicable
    const afterDepositY = this.addDepositInfo(doc, invoiceData, afterTotalsY, colors);
    
    // Add notes and terms
    const afterNotesY = this.addNotesAndTerms(doc, invoiceData, afterDepositY);
    
    // Add footer
    this.addEnhancedFooter(doc, invoiceData, afterNotesY, config);

    // Return as base64 string
    return doc.output('datauristring').split(',')[1];
  }

  private setupDocument(doc: jsPDF, invoiceData: InvoicePDFData): void {
    // Set document properties
    doc.setProperties({
      title: `Invoice ${invoiceData.invoice_number}`,
      subject: 'Invoice',
      author: invoiceData.sender_name,
      creator: 'Stand Up Sydney',
      producer: 'Stand Up Sydney Invoice System'
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
    const text = 'STAND UP SYDNEY';
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

    // Modern gradient header with brand colors
    const headerHeight = 35;
    
    // Create gradient effect with rectangles
    doc.setFillColor(colors.primary);
    doc.rect(15, yPos, pageWidth - 30, headerHeight, 'F');
    
    // Add subtle pattern overlay
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.1);
    for (let i = 0; i < 5; i++) {
      doc.line(
        15 + i * 20, 
        yPos, 
        15 + i * 20 + 10, 
        yPos + headerHeight
      );
    }

    // Company name with custom font
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const companyName = invoiceData.sender_name || 'Stand Up Sydney';
    doc.text(companyName, 25, yPos + 18);

    // Tagline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Comedy Entertainment', 25, yPos + 25);

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

    return Math.max(yPos + 10, 120);
  }

  private addInvoiceDetails(doc: jsPDF, invoiceData: InvoicePDFData, startY: number, colors: any): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    // Invoice details box
    doc.setFillColor(248, 249, 250);
    doc.rect(15, yPos, pageWidth - 30, 30, 'F');
    
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, yPos, pageWidth - 30, 30, 'S');

    yPos += 5;

    // Date information
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    
    const leftCol = 20;
    const rightCol = pageWidth - 80;

    doc.text('Issue Date:', leftCol, yPos + 5);
    doc.text(new Date(invoiceData.issue_date).toLocaleDateString('en-AU'), leftCol, yPos + 10);

    doc.text('Due Date:', rightCol, yPos + 5);
    doc.text(new Date(invoiceData.due_date).toLocaleDateString('en-AU'), rightCol, yPos + 10);

    doc.text('Status:', leftCol, yPos + 18);
    doc.text(invoiceData.status.toUpperCase(), leftCol, yPos + 23);

    doc.text('Total Amount:', rightCol, yPos + 18);
    doc.setFontSize(12);
    doc.setTextColor(103, 126, 234);
    doc.text(`${invoiceData.currency} $${invoiceData.total_amount.toFixed(2)}`, rightCol, yPos + 23);

    return yPos + 40;
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

    // Table data
    const headers = [
      ['Description', 'Qty', 'Rate', 'Amount']
    ];
    
    const data = invoiceData.invoice_items.map((item, index) => [
      item.description,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total.toFixed(2)}`
    ]);

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
      didDrawCell: (data: any) => {
        // Add subtle borders
        if (data.section === 'body') {
          doc.setDrawColor(colors.border);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
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
      const descriptionLines = doc.splitTextToSize(item.description, colWidths[0] - 4);
      doc.text(descriptionLines, colPositions[0] + 2, yPos + 5);
      doc.text(item.quantity.toString(), colPositions[1] + 2, yPos + 5);
      doc.text(`$${item.unit_price.toFixed(2)}`, colPositions[2] + 2, yPos + 5);
      doc.text(`$${item.total.toFixed(2)}`, colPositions[3] + 2, yPos + 5);

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
    doc.text('Subtotal:', labelX, yPos);
    doc.text(`$${invoiceData.subtotal.toFixed(2)}`, totalsX, yPos, { align: 'right' });
    yPos += 6;

    // Tax with percentage
    doc.text(`Tax (${invoiceData.tax_rate}%):`, labelX, yPos);
    doc.text(`$${invoiceData.tax_amount.toFixed(2)}`, totalsX, yPos, { align: 'right' });
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
    doc.text(`${invoiceData.currency} $${invoiceData.total_amount.toFixed(2)}`, totalsX, yPos + 6, { align: 'right' });
    
    return startY + 55;
  }

  private addTotals(doc: jsPDF, invoiceData: InvoicePDFData, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = startY;

    const totalsX = pageWidth - 80;
    const labelX = totalsX - 40;

    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);

    // Subtotal
    doc.text('Subtotal:', labelX, yPos);
    doc.text(`$${invoiceData.subtotal.toFixed(2)}`, totalsX, yPos);
    yPos += 6;

    // Tax
    doc.text(`Tax (${invoiceData.tax_rate}%):`, labelX, yPos);
    doc.text(`$${invoiceData.tax_amount.toFixed(2)}`, totalsX, yPos);
    yPos += 6;

    // Total
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text('Total:', labelX, yPos);
    doc.setTextColor(103, 126, 234);
    doc.text(`${invoiceData.currency} $${invoiceData.total_amount.toFixed(2)}`, totalsX, yPos);
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

      const depositAmount = invoiceData.deposit_amount || 
        (invoiceData.deposit_percentage && invoiceData.total_amount * (invoiceData.deposit_percentage / 100));

      if (depositAmount) {
        doc.text(`Deposit Required: ${invoiceData.currency} $${depositAmount.toFixed(2)}`, 20, yPos + 5);
        
        if (invoiceData.deposit_due_date) {
          doc.text(`Due by: ${new Date(invoiceData.deposit_due_date).toLocaleDateString('en-AU')}`, 20, yPos + 10);
        }

        const remainingBalance = invoiceData.total_amount - depositAmount;
        doc.text(`Remaining Balance: ${invoiceData.currency} $${remainingBalance.toFixed(2)}`, 20, yPos + 15);
      }

      yPos += 30;
    }

    return yPos;
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
    
    // Footer position with margin
    const footerY = Math.max(startY + 20, pageHeight - (config?.branding.layout.marginBottom || 30));

    // Modern footer with gradient background
    const footerHeight = 25;
    doc.setFillColor(248, 249, 250);
    doc.rect(0, footerY, pageWidth, footerHeight, 'F');
    
    // Top border with brand color
    doc.setDrawColor(colors.primary);
    doc.setLineWidth(2);
    doc.line(0, footerY, pageWidth, footerY);

    // Footer content
    doc.setFontSize(9);
    doc.setTextColor(colors.light);
    doc.setFont('helvetica', 'normal');
    
    // Left side - Thank you message
    const footerText = config?.branding.footer.text || 'Thank you for your business with Stand Up Sydney!';
    doc.text(footerText, 20, footerY + 10);
    
    // Center - Contact info
    const centerX = pageWidth / 2;
    doc.setFontSize(8);
    doc.text('www.standupsydney.com', centerX, footerY + 8, { align: 'center' });
    doc.text('info@standupsydney.com', centerX, footerY + 14, { align: 'center' });
    
    // Right side - Page info and copyright
    doc.setFontSize(8);
    doc.text(`Page 1 of 1`, pageWidth - 20, footerY + 8, { align: 'right' });
    doc.text(`© ${new Date().getFullYear()} Stand Up Sydney`, pageWidth - 20, footerY + 14, { align: 'right' });
    
    // Add small brand accent
    doc.setFillColor(colors.primary);
    doc.circle(pageWidth / 2, footerY + footerHeight - 5, 2, 'F');
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
    doc.text('Stand Up Sydney', pageWidth - 80, footerY + 8);
    doc.text('© 2024 Stand Up Sydney. All rights reserved.', pageWidth - 80, footerY + 14);
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