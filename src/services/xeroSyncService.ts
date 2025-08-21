// Xero Sync Service - Handles bidirectional synchronization
import { supabase } from '@/integrations/supabase/client';
import { xeroService } from './xeroService';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class XeroSyncService {
  private isRunning = false;
  private lastSyncTime: Date | null = null;

  // =====================================
  // INVOICE SYNC
  // =====================================

  async syncAllInvoices(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Sync invoices to Xero
      const toXeroResult = await this.syncInvoicesToXero();
      result.synced += toXeroResult.synced;
      result.failed += toXeroResult.failed;
      result.errors.push(...toXeroResult.errors);

      // Sync invoices from Xero
      const fromXeroResult = await this.syncInvoicesFromXero();
      result.synced += fromXeroResult.synced;
      result.failed += fromXeroResult.failed;
      result.errors.push(...fromXeroResult.errors);

      result.success = result.failed === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  private async syncInvoicesToXero(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    // Get invoices that need syncing
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        invoice_recipients (*),
        xero_invoices (*)
      `)
      .or('xero_invoice_id.is.null,last_synced_at.lt.updated_at')
      .eq('status', 'sent');

    if (error) {
      result.errors.push(`Failed to fetch invoices: ${error.message}`);
      return result;
    }

    // Sync each invoice
    for (const invoice of invoices || []) {
      try {
        await xeroService.syncInvoiceToXero(invoice.id);
        result.synced++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Invoice ${invoice.invoice_number}: ${error.message}`);
      }
    }

    return result;
  }

  private async syncInvoicesFromXero(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get last sync time
      const { data: integration } = await supabase
        .from('xero_integrations')
        .select('last_sync_at')
        .eq('connection_status', 'active')
        .single();

      const modifiedSince = integration?.last_sync_at 
        ? new Date(integration.last_sync_at) 
        : undefined;

      // Get invoices from Xero
      const xeroInvoices = await xeroService.getInvoices(modifiedSince);

      // Process each invoice
      for (const xeroInvoice of xeroInvoices) {
        try {
          await this.processXeroInvoice(xeroInvoice);
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`Xero invoice ${xeroInvoice.InvoiceNumber}: ${error.message}`);
        }
      }

      // Update last sync time
      await supabase
        .from('xero_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('connection_status', 'active');

    } catch (error: any) {
      result.errors.push(`Failed to sync from Xero: ${error.message}`);
    }

    return result;
  }

  private async processXeroInvoice(xeroInvoice: any): Promise<void> {
    // Check if we already have this invoice
    const { data: existingSync } = await supabase
      .from('xero_invoices')
      .select('invoice_id')
      .eq('xero_invoice_id', xeroInvoice.InvoiceID)
      .single();

    if (existingSync) {
      // Update existing invoice
      await this.updateInvoiceFromXero(existingSync.invoice_id, xeroInvoice);
    } else {
      // Check if this is an invoice we should import
      if (this.shouldImportXeroInvoice(xeroInvoice)) {
        await this.createInvoiceFromXero(xeroInvoice);
      }
    }
  }

  private shouldImportXeroInvoice(xeroInvoice: any): boolean {
    // Only import invoices that are related to our system
    // Check for specific reference patterns or contact types
    return xeroInvoice.Reference?.startsWith('SUS-') || 
           xeroInvoice.Contact?.Name?.includes('Stand Up Sydney');
  }

  private async updateInvoiceFromXero(invoiceId: string, xeroInvoice: any): Promise<void> {
    const updates: any = {
      status: this.mapXeroStatusToLocal(xeroInvoice.Status),
      last_synced_at: new Date().toISOString()
    };

    // Update payment status if paid
    if (xeroInvoice.AmountPaid > 0 && xeroInvoice.AmountDue === 0) {
      updates.paid_at = xeroInvoice.FullyPaidOnDate || new Date().toISOString();
    }

    await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);

    // Update sync record
    await supabase
      .from('xero_invoices')
      .update({
        invoice_status: xeroInvoice.Status,
        total_amount: xeroInvoice.Total,
        last_sync_at: new Date().toISOString()
      })
      .eq('invoice_id', invoiceId);
  }

  private async createInvoiceFromXero(xeroInvoice: any): Promise<void> {
    // Create invoice in our system
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: xeroInvoice.InvoiceNumber,
        issue_date: xeroInvoice.Date,
        due_date: xeroInvoice.DueDate,
        status: this.mapXeroStatusToLocal(xeroInvoice.Status),
        subtotal: xeroInvoice.SubTotal,
        tax_amount: xeroInvoice.TotalTax,
        total_amount: xeroInvoice.Total,
        currency: xeroInvoice.CurrencyCode,
        xero_invoice_id: xeroInvoice.InvoiceID,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Create sync record
    await supabase
      .from('xero_invoices')
      .insert({
        invoice_id: invoice.id,
        xero_invoice_id: xeroInvoice.InvoiceID,
        xero_invoice_number: xeroInvoice.InvoiceNumber,
        total_amount: xeroInvoice.Total,
        invoice_status: xeroInvoice.Status,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString()
      });
  }

  private mapXeroStatusToLocal(xeroStatus: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'draft',
      'SUBMITTED': 'sent',
      'AUTHORISED': 'sent',
      'PAID': 'paid',
      'VOIDED': 'cancelled',
      'DELETED': 'cancelled'
    };
    return statusMap[xeroStatus] || 'draft';
  }

  // =====================================
  // CONTACT SYNC
  // =====================================

  async syncAllContacts(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Sync comedians and promoters as Xero contacts
      const comediansResult = await this.syncComediansToXero();
      result.synced += comediansResult.synced;
      result.failed += comediansResult.failed;
      result.errors.push(...comediansResult.errors);

      const promotersResult = await this.syncPromotersToXero();
      result.synced += promotersResult.synced;
      result.failed += promotersResult.failed;
      result.errors.push(...promotersResult.errors);

      result.success = result.failed === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  private async syncComediansToXero(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    // Get comedians who need syncing
    const { data: comedians, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'comedian')
      .is('xero_contact_id', null);

    if (error) {
      result.errors.push(`Failed to fetch comedians: ${error.message}`);
      return result;
    }

    // Sync each comedian
    for (const comedian of comedians || []) {
      try {
        const xeroContact = await xeroService.createOrUpdateContact({
          name: comedian.name || comedian.stage_name,
          email: comedian.email,
          phone: comedian.phone,
          taxNumber: comedian.abn
        });

        // Update profile with Xero contact ID
        await supabase
          .from('profiles')
          .update({ xero_contact_id: xeroContact.ContactID })
          .eq('id', comedian.id);

        result.synced++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Comedian ${comedian.name}: ${error.message}`);
      }
    }

    return result;
  }

  private async syncPromotersToXero(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    // Get promoters who need syncing
    const { data: promoters, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'promoter')
      .is('xero_contact_id', null);

    if (error) {
      result.errors.push(`Failed to fetch promoters: ${error.message}`);
      return result;
    }

    // Sync each promoter
    for (const promoter of promoters || []) {
      try {
        const xeroContact = await xeroService.createOrUpdateContact({
          name: promoter.business_name || promoter.name,
          email: promoter.email,
          phone: promoter.phone,
          address: promoter.address,
          taxNumber: promoter.abn
        });

        // Update profile with Xero contact ID
        await supabase
          .from('profiles')
          .update({ xero_contact_id: xeroContact.ContactID })
          .eq('id', promoter.id);

        result.synced++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Promoter ${promoter.name}: ${error.message}`);
      }
    }

    return result;
  }

  // =====================================
  // SCHEDULED SYNC
  // =====================================

  startScheduledSync(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      console.log('Xero sync already running');
      return;
    }

    this.isRunning = true;
    
    // Run initial sync
    this.runSync();

    // Schedule periodic syncs
    setInterval(() => {
      this.runSync();
    }, intervalMinutes * 60 * 1000);
  }

  private async runSync(): Promise<void> {
    console.log('Starting Xero sync...');
    const startTime = Date.now();

    try {
      // Check if integration is active
      const { data: integration } = await supabase
        .from('xero_integrations')
        .select('*')
        .eq('connection_status', 'active')
        .single();

      if (!integration) {
        console.log('No active Xero integration found');
        return;
      }

      // Sync invoices
      const invoiceResult = await this.syncAllInvoices();
      console.log(`Invoice sync: ${invoiceResult.synced} synced, ${invoiceResult.failed} failed`);

      // Sync contacts
      const contactResult = await this.syncAllContacts();
      console.log(`Contact sync: ${contactResult.synced} synced, ${contactResult.failed} failed`);

      this.lastSyncTime = new Date();
      const duration = Date.now() - startTime;
      console.log(`Xero sync completed in ${duration}ms`);

    } catch (error) {
      console.error('Xero sync failed:', error);
    }
  }

  stopScheduledSync(): void {
    this.isRunning = false;
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}

export const xeroSyncService = new XeroSyncService();