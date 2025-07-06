// Invoice Service - Comprehensive invoice management with Xero integration
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, InvoiceRecipient, InvoicePayment } from '@/types/invoice';

export interface CreateInvoiceRequest {
  invoice_type: 'promoter' | 'comedian';
  invoice_number?: string; // Auto-generated if not provided
  promoter_id?: string;
  comedian_id?: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_address?: string;
  sender_abn?: string;
  issue_date: string;
  due_date: string;
  currency?: string;
  tax_rate?: number;
  tax_treatment?: 'inclusive' | 'exclusive' | 'none';
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
  recipients: Omit<InvoiceRecipient, 'id' | 'invoice_id' | 'created_at'>[];
}

export interface XeroSyncRequest {
  invoice_id: string;
  xero_contact_id?: string;
  sync_payments?: boolean;
}

export interface InvoiceFromTicketSalesRequest {
  event_id: string;
  recipient_type: 'promoter' | 'comedian';
  recipient_id: string;
  include_platform_fees?: boolean;
  custom_line_items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
}

class InvoiceService {
  // =====================================
  // INVOICE GENERATION
  // =====================================

  async generateInvoiceNumber(type: 'promoter' | 'comedian'): Promise<string> {
    const prefix = type === 'promoter' ? 'PRO' : 'COM';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the last invoice number for this prefix and month
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}-${year}${month}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate invoice number if not provided
    const invoiceNumber = request.invoice_number || await this.generateInvoiceNumber(request.invoice_type);

    // Start a transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_type: request.invoice_type,
        invoice_number: invoiceNumber,
        promoter_id: request.promoter_id,
        comedian_id: request.comedian_id,
        sender_name: request.sender_name,
        sender_email: request.sender_email,
        sender_phone: request.sender_phone,
        sender_address: request.sender_address,
        sender_abn: request.sender_abn,
        issue_date: request.issue_date,
        due_date: request.due_date,
        currency: request.currency || 'AUD',
        tax_rate: request.tax_rate || 10,
        tax_treatment: request.tax_treatment || 'inclusive',
        subtotal_amount: request.subtotal_amount,
        tax_amount: request.tax_amount,
        total_amount: request.total_amount,
        notes: request.notes,
        terms: request.terms,
        status: request.status || 'draft',
        created_by: user.id
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice items
    if (request.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          request.items.map(item => ({
            ...item,
            invoice_id: invoice.id
          }))
        );

      if (itemsError) throw itemsError;
    }

    // Add invoice recipients
    if (request.recipients.length > 0) {
      const { error: recipientsError } = await supabase
        .from('invoice_recipients')
        .insert(
          request.recipients.map(recipient => ({
            ...recipient,
            invoice_id: invoice.id
          }))
        );

      if (recipientsError) throw recipientsError;
    }

    // If Xero is connected, sync the invoice
    if (request.status !== 'draft') {
      await this.syncToXero({ invoice_id: invoice.id });
    }

    return invoice;
  }

  async createInvoiceFromTicketSales(request: InvoiceFromTicketSalesRequest): Promise<Invoice> {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        ticket_sales (
          platform,
          quantity_sold,
          gross_revenue,
          platform_fees,
          net_revenue
        )
      `)
      .eq('id', request.event_id)
      .single();

    if (eventError) throw eventError;
    if (!event) throw new Error('Event not found');

    // Calculate totals from ticket sales
    const ticketSales = event.ticket_sales || [];
    const totalGross = ticketSales.reduce((sum, sale) => sum + (sale.gross_revenue || 0), 0);
    const totalFees = ticketSales.reduce((sum, sale) => sum + (sale.platform_fees || 0), 0);
    const totalNet = ticketSales.reduce((sum, sale) => sum + (sale.net_revenue || 0), 0);

    // Build line items
    const items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[] = [];

    // Group ticket sales by platform
    const salesByPlatform = ticketSales.reduce((acc, sale) => {
      if (!acc[sale.platform]) {
        acc[sale.platform] = {
          quantity: 0,
          gross: 0,
          fees: 0,
          net: 0
        };
      }
      acc[sale.platform].quantity += sale.quantity_sold || 0;
      acc[sale.platform].gross += sale.gross_revenue || 0;
      acc[sale.platform].fees += sale.platform_fees || 0;
      acc[sale.platform].net += sale.net_revenue || 0;
      return acc;
    }, {} as Record<string, any>);

    // Add line items for each platform
    Object.entries(salesByPlatform).forEach(([platform, data]) => {
      items.push({
        description: `Ticket Sales - ${platform} (${data.quantity} tickets)`,
        quantity: data.quantity,
        unit_price: data.gross / data.quantity,
        subtotal: data.gross,
        tax_amount: 0, // Tickets are usually GST-free
        total: data.gross
      });

      if (request.include_platform_fees && data.fees > 0) {
        items.push({
          description: `${platform} Platform Fees`,
          quantity: 1,
          unit_price: -data.fees,
          subtotal: -data.fees,
          tax_amount: 0,
          total: -data.fees
        });
      }
    });

    // Add any custom line items
    if (request.custom_line_items) {
      items.push(...request.custom_line_items);
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal + taxAmount;

    // Get recipient details
    let senderName = '';
    let senderEmail = '';
    let recipientName = '';
    let recipientEmail = '';

    if (request.recipient_type === 'promoter') {
      // Invoice TO the promoter (from the venue/platform)
      senderName = 'Stand Up Sydney';
      senderEmail = 'billing@standupSydney.com';
      
      const { data: promoter } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', request.recipient_id)
        .single();

      if (promoter) {
        recipientName = promoter.full_name || 'Unknown Promoter';
        recipientEmail = promoter.email || '';
      }
    } else {
      // Invoice FROM the comedian (to the venue)
      const { data: comedian } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', request.recipient_id)
        .single();

      if (comedian) {
        senderName = comedian.full_name || 'Unknown Comedian';
        senderEmail = comedian.email || '';
      }

      recipientName = event.title || 'Event';
      recipientEmail = 'events@standupSydney.com';
    }

    // Create the invoice
    return this.createInvoice({
      invoice_type: request.recipient_type,
      promoter_id: request.recipient_type === 'promoter' ? request.recipient_id : undefined,
      comedian_id: request.recipient_type === 'comedian' ? request.recipient_id : undefined,
      sender_name: senderName,
      sender_email: senderEmail,
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      currency: 'AUD',
      tax_rate: 10,
      tax_treatment: 'inclusive',
      subtotal_amount: subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      notes: `Invoice for ${event.title} - ${new Date(event.date).toLocaleDateString()}`,
      status: 'draft',
      items,
      recipients: [{
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_type: request.recipient_type === 'promoter' ? 'business' : 'individual'
      }]
    });
  }

  // =====================================
  // XERO INTEGRATION
  // =====================================

  async syncToXero(request: XeroSyncRequest): Promise<void> {
    // Check if Xero is connected
    const { data: integration } = await supabase
      .from('xero_integrations')
      .select('*')
      .eq('connection_status', 'active')
      .single();

    if (!integration) {
      console.log('Xero not connected, skipping sync');
      return;
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        invoice_recipients (*)
      `)
      .eq('id', request.invoice_id)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error('Invoice not found');

    // TODO: Implement actual Xero API calls
    // For now, we'll create a record in xero_invoices
    const { error: xeroError } = await supabase
      .from('xero_invoices')
      .upsert({
        invoice_id: invoice.id,
        xero_invoice_id: `XERO-${invoice.invoice_number}`,
        xero_invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        invoice_status: invoice.status,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString()
      });

    if (xeroError) throw xeroError;

    // Update invoice with Xero reference
    await supabase
      .from('invoices')
      .update({
        xero_invoice_id: `XERO-${invoice.invoice_number}`,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', invoice.id);
  }

  async syncFromXero(): Promise<void> {
    // TODO: Implement webhook handler for Xero updates
    console.log('Syncing from Xero - not yet implemented');
  }

  // =====================================
  // PAYMENT PROCESSING
  // =====================================

  async recordPayment(invoiceId: string, payment: Omit<InvoicePayment, 'id' | 'invoice_id' | 'created_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Record the payment
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        ...payment,
        invoice_id: invoiceId,
        recorded_by: user.id
      });

    if (paymentError) throw paymentError;

    // Get invoice and check if fully paid
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        total_amount,
        invoice_payments (amount)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoice) {
      const totalPaid = invoice.invoice_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      
      if (totalPaid >= invoice.total_amount) {
        // Mark invoice as paid
        await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', invoiceId);
      }
    }
  }

  // =====================================
  // REPORTING & ANALYTICS
  // =====================================

  async getInvoiceMetrics(dateRange?: { from: Date; to: Date }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('invoices')
      .select('status, total_amount, currency, created_at');

    // Filter by user's invoices
    query = query.or(`promoter_id.eq.${user.id},comedian_id.eq.${user.id}`);

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    // Calculate metrics
    const metrics = {
      total: invoices?.length || 0,
      totalAmount: 0,
      paid: 0,
      paidAmount: 0,
      pending: 0,
      pendingAmount: 0,
      overdue: 0,
      overdueAmount: 0,
      draft: 0,
      draftAmount: 0
    };

    invoices?.forEach(invoice => {
      metrics.totalAmount += invoice.total_amount;

      switch (invoice.status) {
        case 'paid':
          metrics.paid++;
          metrics.paidAmount += invoice.total_amount;
          break;
        case 'sent':
          metrics.pending++;
          metrics.pendingAmount += invoice.total_amount;
          break;
        case 'overdue':
          metrics.overdue++;
          metrics.overdueAmount += invoice.total_amount;
          break;
        case 'draft':
          metrics.draft++;
          metrics.draftAmount += invoice.total_amount;
          break;
      }
    });

    return metrics;
  }

  // =====================================
  // AUTOMATION
  // =====================================

  async checkOverdueInvoices(): Promise<void> {
    const today = new Date().toISOString();

    // Find all sent invoices past due date
    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('status', 'sent')
      .lt('due_date', today)
      .select();

    if (error) throw error;

    // TODO: Send overdue notifications
    console.log(`Marked ${overdueInvoices?.length || 0} invoices as overdue`);
  }

  async generateRecurringInvoices(): Promise<void> {
    // Get all active recurring invoices due today
    const today = new Date();
    
    const { data: recurringInvoices, error } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('is_active', true)
      .lte('next_invoice_date', today.toISOString());

    if (error) throw error;

    for (const recurring of recurringInvoices || []) {
      try {
        // Generate invoice from template
        await this.createInvoice({
          invoice_type: recurring.invoice_type,
          promoter_id: recurring.promoter_id,
          comedian_id: recurring.comedian_id,
          sender_name: recurring.sender_name,
          sender_email: recurring.sender_email,
          issue_date: today.toISOString(),
          due_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          currency: recurring.currency,
          tax_rate: recurring.tax_rate,
          subtotal_amount: recurring.amount,
          tax_amount: recurring.amount * (recurring.tax_rate / 100),
          total_amount: recurring.amount * (1 + recurring.tax_rate / 100),
          notes: recurring.description,
          status: 'sent',
          items: [{
            description: recurring.description,
            quantity: 1,
            unit_price: recurring.amount,
            subtotal: recurring.amount,
            tax_amount: recurring.amount * (recurring.tax_rate / 100),
            total: recurring.amount * (1 + recurring.tax_rate / 100)
          }],
          recipients: [] // TODO: Get from recurring invoice template
        });

        // Update next invoice date
        const nextDate = new Date(today);
        switch (recurring.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'fortnightly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'annually':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        await supabase
          .from('recurring_invoices')
          .update({ 
            next_invoice_date: nextDate.toISOString(),
            last_generated_at: today.toISOString()
          })
          .eq('id', recurring.id);

      } catch (error) {
        console.error(`Failed to generate recurring invoice ${recurring.id}:`, error);
      }
    }
  }
}

export const invoiceService = new InvoiceService();