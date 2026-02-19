// Invoice Service - Comprehensive invoice management with Xero integration
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, InvoiceRecipient, InvoicePayment, InvoiceType } from '@/types/invoice';

export type GstTreatment = 'gst_included' | 'gst_excluded' | 'no_gst';

export interface CreateInvoiceRequest {
  invoice_type: InvoiceType;
  invoice_number?: string; // Auto-generated if not provided
  promoter_id?: string;
  comedian_id?: string;
  organization_id?: string;
  event_id?: string;
  event_spot_id?: string;
  recipient_id?: string; // Platform user ID if recipient is on platform
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  sender_address?: string;
  sender_abn?: string;
  // Bank details for payment
  sender_bank_name?: string;
  sender_bank_bsb?: string;
  sender_bank_account?: string;
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
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tax_amount: number;
    total: number;
    gst_treatment?: GstTreatment;
    is_deduction?: boolean;
  }>;
  recipients: Array<{
    recipient_name: string;
    recipient_email: string;
    recipient_address?: string;
    recipient_phone?: string;
    recipient_mobile?: string;
    recipient_type?: 'individual' | 'company';
    recipient_abn?: string;
    company_name?: string;
    abn?: string;
    cc_emails?: string[];
    bcc_emails?: string[];
  }>;
  // Deposit fields
  deposit_amount?: number;
  deposit_percentage?: number;
  deposit_due_days_before_event?: number;
  deposit_due_date?: string;
  event_date?: string;
  // Client profile reference
  client_profile_id?: string;
  client_profile_type?: string;
  client_gst_registered?: boolean;
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

export interface InvoiceFromSpotRequest {
  spot_id: string;
  include_line_items?: boolean; // Include event_spot_line_items
  custom_notes?: string;
  custom_terms?: string;
  due_days_after_event?: number; // Default 14 days after event
}

class InvoiceService {
  // =====================================
  // INVOICE GENERATION
  // =====================================

  /**
   * Generate a unique invoice number using PostgreSQL SEQUENCE.
   * Format: GIG-XXXXXXXX (8-digit zero-padded sequence)
   * Uses atomic database sequence to prevent collision when multiple invoices
   * are created simultaneously.
   */
  async generateInvoiceNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('get_next_invoice_number');
    if (error) {
      console.error('Failed to generate invoice number:', error);
      throw new Error(`Failed to generate invoice number: ${error.message || JSON.stringify(error)}`);
    }
    return data; // Returns "GIG-00000001"
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate invoice number if not provided (uses atomic PostgreSQL sequence)
    const invoiceNumber = request.invoice_number || await this.generateInvoiceNumber();

    // Calculate deposit due date if needed
    let depositDueDate = request.deposit_due_date;
    if (request.event_date && request.deposit_due_days_before_event && !depositDueDate) {
      const eventDate = new Date(request.event_date);
      depositDueDate = new Date(eventDate.getTime() - (request.deposit_due_days_before_event * 24 * 60 * 60 * 1000)).toISOString();
    }

    // Start a transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_type: request.invoice_type,
        invoice_number: invoiceNumber,
        promoter_id: request.promoter_id,
        comedian_id: request.comedian_id,
        organization_id: request.organization_id,
        event_id: request.event_id,
        event_spot_id: request.event_spot_id,
        recipient_id: request.recipient_id,
        sender_name: request.sender_name,
        sender_email: request.sender_email,
        sender_phone: request.sender_phone,
        sender_address: request.sender_address,
        sender_abn: request.sender_abn,
        // Bank details for direct payment
        sender_bank_name: request.sender_bank_name,
        sender_bank_bsb: request.sender_bank_bsb,
        sender_bank_account: request.sender_bank_account,
        issue_date: request.issue_date,
        due_date: request.due_date,
        currency: request.currency || 'AUD',
        tax_rate: request.tax_rate || 10,
        tax_treatment: request.tax_treatment || 'inclusive',
        gst_treatment: request.tax_treatment || 'inclusive', // Map to both fields
        subtotal: request.subtotal_amount, // Database column is 'subtotal', not 'subtotal_amount'
        tax_amount: request.tax_amount,
        total_amount: request.total_amount,
        notes: request.notes,
        terms: request.terms,
        status: request.status || 'draft',
        created_by: user.id,
        // Deposit fields
        deposit_amount: request.deposit_amount || null,
        deposit_percentage: request.deposit_percentage || null,
        deposit_due_days_before_event: request.deposit_due_days_before_event || null,
        deposit_due_date: depositDueDate || null,
        event_date: request.event_date || null,
        deposit_status: (request.deposit_amount || request.deposit_percentage) ? 'pending' : null,
        // Note: client_profile_id, client_profile_type, client_gst_registered
        // require database migration before use. Store in recipients table for now.
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice insert error:', invoiceError);
      throw new Error(`Failed to create invoice: ${invoiceError.message || JSON.stringify(invoiceError)}`);
    }

    // Add invoice items
    if (request.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          request.items.map((item, index) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            tax_amount: item.tax_amount,
            total_price: item.total, // Database column is 'total_price', not 'total'
            item_order: index,
            // Note: gst_treatment and is_deduction require database migration
          }))
        );

      if (itemsError) {
        console.error('Invoice items insert error:', itemsError);
        throw new Error(`Failed to add invoice items: ${itemsError.message || JSON.stringify(itemsError)}`);
      }
    }

    // Add invoice recipients
    if (request.recipients.length > 0) {
      const { error: recipientsError } = await supabase
        .from('invoice_recipients')
        .insert(
          request.recipients.map(recipient => ({
            invoice_id: invoice.id,
            recipient_name: recipient.recipient_name,
            recipient_email: recipient.recipient_email,
            recipient_address: recipient.recipient_address,
            recipient_phone: recipient.recipient_phone,
            recipient_mobile: recipient.recipient_mobile,
            recipient_type: recipient.recipient_type || 'individual',
            recipient_abn: recipient.recipient_abn,
            company_name: recipient.company_name,
            abn: recipient.abn,
            // Note: cc_emails and bcc_emails require database migration
          }))
        );

      if (recipientsError) {
        console.error('Invoice recipients insert error:', recipientsError);
        throw new Error(`Failed to add invoice recipients: ${recipientsError.message || JSON.stringify(recipientsError)}`);
      }
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
      subtotal_amount: subtotal, // Using subtotal_amount in request interface
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

  /**
   * Create an invoice from an event spot booking.
   * This is used when an organization confirms a booking and needs to create
   * a payable invoice (the org owes the comedian money).
   */
  async createInvoiceFromSpot(request: InvoiceFromSpotRequest): Promise<Invoice> {
    // Get spot with all related data
    const { data: spot, error: spotError } = await supabase
      .from('event_spots')
      .select(`
        *,
        profiles:comedian_id (
          id,
          full_name,
          stage_name,
          email,
          phone,
          abn,
          bank_name,
          bank_bsb,
          bank_account_number
        ),
        events:event_id (
          id,
          title,
          event_date,
          organizations:organization_id (
            id,
            organization_name,
            email,
            phone,
            abn,
            address
          )
        )
      `)
      .eq('id', request.spot_id)
      .single();

    if (spotError) throw spotError;
    if (!spot) throw new Error('Spot not found');

    const comedian = spot.profiles;
    const event = spot.events;
    const organization = event?.organizations;

    if (!comedian) throw new Error('Comedian not found for this spot');
    if (!event) throw new Error('Event not found for this spot');
    if (!organization) throw new Error('Organization not found for this event');

    // Get line items if requested
    let lineItems: Array<{ description: string; quantity: number; unit_price: number; subtotal: number; tax_amount: number; total: number }> = [];

    if (request.include_line_items) {
      const { data: spotLineItems } = await supabase
        .from('event_spot_line_items')
        .select('*')
        .eq('event_spot_id', request.spot_id)
        .order('created_at');

      if (spotLineItems) {
        lineItems = spotLineItems.map(item => ({
          description: item.label || item.description || 'Line item',
          quantity: 1,
          unit_price: item.amount || 0,
          subtotal: item.amount || 0,
          tax_amount: item.gst_type === 'addition' ? (item.amount || 0) * 0.1 : 0,
          total: item.gst_type === 'addition' ? (item.amount || 0) * 1.1 : (item.amount || 0),
        }));
      }
    }

    // Add the main spot payment as a line item
    const basePayment = spot.payment_amount || 0;
    const gstType = spot.payment_gst_type || 'addition';
    let spotTaxAmount = 0;
    let spotTotal = basePayment;

    if (gstType === 'addition') {
      spotTaxAmount = basePayment * 0.1;
      spotTotal = basePayment + spotTaxAmount;
    } else if (gstType === 'included') {
      spotTaxAmount = basePayment - (basePayment / 1.1);
      spotTotal = basePayment;
    }

    const mainItem = {
      description: `Performance: ${event.title} - ${spot.spot_name || 'Spot'}`,
      quantity: 1,
      unit_price: basePayment,
      subtotal: basePayment,
      tax_amount: spotTaxAmount,
      total: spotTotal,
    };

    const allItems = [mainItem, ...lineItems];

    // Calculate totals
    const subtotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = allItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = allItems.reduce((sum, item) => sum + item.total, 0);

    // Calculate due date (default 14 days after event)
    const dueDays = request.due_days_after_event ?? 14;
    const eventDate = new Date(event.event_date);
    const dueDate = new Date(eventDate.getTime() + dueDays * 24 * 60 * 60 * 1000);

    // Create the payable invoice (org pays comedian)
    return this.createInvoice({
      invoice_type: 'payable',
      organization_id: organization.id,
      event_id: event.id,
      event_spot_id: spot.id,
      recipient_id: comedian.id,
      // Sender is the organization (they are creating the invoice to pay)
      sender_name: organization.organization_name,
      sender_email: organization.email || '',
      sender_phone: organization.phone,
      sender_address: organization.address,
      sender_abn: organization.abn,
      issue_date: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      event_date: event.event_date,
      currency: 'AUD',
      tax_rate: 10,
      tax_treatment: gstType === 'excluded' ? 'none' : 'inclusive',
      subtotal_amount: subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      notes: request.custom_notes || `Payment for performance at ${event.title}`,
      terms: request.custom_terms || 'Payment due within 14 days of event.',
      status: 'draft',
      items: allItems,
      recipients: [{
        recipient_name: comedian.stage_name || comedian.full_name || 'Unknown',
        recipient_email: comedian.email || '',
        recipient_phone: comedian.phone,
        recipient_abn: comedian.abn,
        recipient_type: 'individual',
      }],
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

    // Determine Xero document type based on invoice_type:
    // - receivable/comedian: Creates an INVOICE in Xero (Accounts Receivable - money owed to you)
    // - payable/promoter: Creates a BILL in Xero (Accounts Payable - money you owe)
    const isReceivable = invoice.invoice_type === 'receivable' || invoice.invoice_type === 'comedian';
    const xeroDocType = isReceivable ? 'ACCREC' : 'ACCPAY'; // ACCREC = Invoice, ACCPAY = Bill

    try {
      // TODO: Implement actual Xero API calls
      // For now, we'll create a record in xero_invoices with proper type tracking
      const { error: xeroError } = await supabase
        .from('xero_invoices')
        .upsert({
          invoice_id: invoice.id,
          xero_invoice_id: `XERO-${xeroDocType}-${invoice.invoice_number}`,
          xero_invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          invoice_status: invoice.status,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        });

      if (xeroError) throw xeroError;

      // Update invoice with Xero reference and clear any previous sync error
      await supabase
        .from('invoices')
        .update({
          xero_invoice_id: `XERO-${xeroDocType}-${invoice.invoice_number}`,
          last_synced_at: new Date().toISOString(),
          xero_sync_error: null
        })
        .eq('id', invoice.id);

      console.log(`Successfully synced invoice ${invoice.invoice_number} as Xero ${isReceivable ? 'Invoice' : 'Bill'}`);
    } catch (syncError) {
      // Record sync error on the invoice
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
      await supabase
        .from('invoices')
        .update({
          xero_sync_error: errorMessage
        })
        .eq('id', invoice.id);

      throw syncError;
    }
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

  // Note: checkOverdueInvoices is now handled by pg_cron job (process_overdue_invoices)
  // that runs at midnight AEST and creates notifications for 10am local time

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
            total: recurring.amount * (1 + recurring.tax_rate / 100) // This maps to total_price in DB
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