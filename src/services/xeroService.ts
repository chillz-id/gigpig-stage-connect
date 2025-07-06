// Xero Integration Service - Complete OAuth2 and API integration
import { supabase } from '@/integrations/supabase/client';

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface XeroTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  tenant_id: string;
}

export interface XeroInvoice {
  Type: 'ACCREC' | 'ACCPAY';
  Contact: {
    ContactID?: string;
    Name: string;
    EmailAddress?: string;
  };
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    AccountCode: string;
    TaxType?: string;
  }>;
  Date: string;
  DueDate: string;
  Reference?: string;
  Status: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED';
  LineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax';
}

class XeroService {
  private config: XeroConfig = {
    clientId: process.env.VITE_XERO_CLIENT_ID || '',
    clientSecret: process.env.VITE_XERO_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/auth/xero-callback`,
    scopes: [
      'accounting.transactions',
      'accounting.contacts',
      'accounting.settings',
      'offline_access'
    ]
  };

  // =====================================
  // OAUTH2 FLOW
  // =====================================

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: crypto.randomUUID()
    });

    // Store state in session for verification
    sessionStorage.setItem('xero_oauth_state', params.get('state') || '');

    return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    // Verify state
    const savedState = sessionStorage.getItem('xero_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);
    
    // Get tenant information
    const tenants = await this.getTenants(tokens.access_token);
    if (tenants.length === 0) {
      throw new Error('No Xero organizations found');
    }

    // Save integration
    await this.saveIntegration(tokens, tenants[0]);
  }

  private async exchangeCodeForTokens(code: string): Promise<XeroTokens> {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      tenant_id: ''
    };
  }

  private async refreshAccessToken(refreshToken: string): Promise<XeroTokens> {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      tenant_id: ''
    };
  }

  private async getTenants(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Xero tenants');
    }

    return response.json();
  }

  private async saveIntegration(tokens: XeroTokens, tenant: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('xero_integrations')
      .upsert({
        user_id: user.id,
        tenant_id: tenant.tenantId,
        tenant_name: tenant.tenantName,
        connection_status: 'active',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expires_at).toISOString()
      });

    if (error) throw error;
  }

  // =====================================
  // API HELPERS
  // =====================================

  private async getValidAccessToken(): Promise<string> {
    const { data: integration } = await supabase
      .from('xero_integrations')
      .select('*')
      .eq('connection_status', 'active')
      .single();

    if (!integration) {
      throw new Error('No active Xero integration found');
    }

    // Check if token is expired
    const expiresAt = new Date(integration.token_expires_at).getTime();
    if (Date.now() >= expiresAt - 60000) { // Refresh 1 minute before expiry
      const newTokens = await this.refreshAccessToken(integration.refresh_token);
      
      // Update stored tokens
      await supabase
        .from('xero_integrations')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          token_expires_at: new Date(newTokens.expires_at).toISOString()
        })
        .eq('id', integration.id);

      return newTokens.access_token;
    }

    return integration.access_token;
  }

  private async makeXeroRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const accessToken = await this.getValidAccessToken();
    
    const { data: integration } = await supabase
      .from('xero_integrations')
      .select('tenant_id')
      .eq('connection_status', 'active')
      .single();

    if (!integration) {
      throw new Error('No active Xero integration found');
    }

    const response = await fetch(`https://api.xero.com/api.xro/2.0/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-tenant-id': integration.tenant_id,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xero API error: ${error}`);
    }

    return response.json();
  }

  // =====================================
  // INVOICE OPERATIONS
  // =====================================

  async createInvoice(invoiceData: any): Promise<any> {
    // Transform our invoice format to Xero format
    const xeroInvoice: XeroInvoice = {
      Type: 'ACCREC',
      Contact: {
        Name: invoiceData.recipient_name,
        EmailAddress: invoiceData.recipient_email
      },
      LineItems: invoiceData.items.map((item: any) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unit_price,
        AccountCode: '200', // Default sales account
        TaxType: invoiceData.tax_rate > 0 ? 'OUTPUT' : 'EXEMPTOUTPUT'
      })),
      Date: invoiceData.issue_date,
      DueDate: invoiceData.due_date,
      Reference: invoiceData.invoice_number,
      Status: invoiceData.status === 'sent' ? 'AUTHORISED' : 'DRAFT',
      LineAmountTypes: invoiceData.tax_treatment === 'inclusive' ? 'Inclusive' : 'Exclusive'
    };

    const result = await this.makeXeroRequest('Invoices', 'POST', {
      Invoices: [xeroInvoice]
    });

    return result.Invoices[0];
  }

  async getInvoice(xeroInvoiceId: string): Promise<any> {
    const result = await this.makeXeroRequest(`Invoices/${xeroInvoiceId}`);
    return result.Invoices[0];
  }

  async updateInvoiceStatus(xeroInvoiceId: string, status: 'AUTHORISED' | 'VOIDED'): Promise<any> {
    const result = await this.makeXeroRequest(`Invoices/${xeroInvoiceId}`, 'POST', {
      Invoices: [{
        InvoiceID: xeroInvoiceId,
        Status: status
      }]
    });

    return result.Invoices[0];
  }

  async getInvoices(modifiedSince?: Date): Promise<any[]> {
    let endpoint = 'Invoices';
    if (modifiedSince) {
      endpoint += `?ModifiedAfter=${modifiedSince.toISOString()}`;
    }

    const result = await this.makeXeroRequest(endpoint);
    return result.Invoices;
  }

  // =====================================
  // CONTACT OPERATIONS
  // =====================================

  async createOrUpdateContact(contact: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
  }): Promise<any> {
    const xeroContact = {
      Name: contact.name,
      EmailAddress: contact.email,
      Phones: contact.phone ? [{
        PhoneType: 'DEFAULT',
        PhoneNumber: contact.phone
      }] : [],
      Addresses: contact.address ? [{
        AddressType: 'POBOX',
        AddressLine1: contact.address
      }] : [],
      TaxNumber: contact.taxNumber
    };

    const result = await this.makeXeroRequest('Contacts', 'POST', {
      Contacts: [xeroContact]
    });

    return result.Contacts[0];
  }

  async getContacts(searchTerm?: string): Promise<any[]> {
    let endpoint = 'Contacts';
    if (searchTerm) {
      endpoint += `?where=Name.Contains("${searchTerm}")`;
    }

    const result = await this.makeXeroRequest(endpoint);
    return result.Contacts;
  }

  // =====================================
  // SYNC OPERATIONS
  // =====================================

  async syncInvoiceToXero(invoiceId: string): Promise<void> {
    // Get invoice from our database
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        invoice_recipients (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    if (!invoice) throw new Error('Invoice not found');

    // Create or find contact
    const recipient = invoice.invoice_recipients[0];
    let contact;
    
    if (recipient) {
      const contacts = await this.getContacts(recipient.recipient_name);
      if (contacts.length > 0) {
        contact = contacts[0];
      } else {
        contact = await this.createOrUpdateContact({
          name: recipient.recipient_name,
          email: recipient.recipient_email,
          phone: recipient.recipient_phone,
          address: recipient.recipient_address,
          taxNumber: recipient.recipient_abn
        });
      }
    }

    // Create invoice in Xero
    const xeroInvoice = await this.createInvoice({
      ...invoice,
      recipient_name: recipient?.recipient_name,
      recipient_email: recipient?.recipient_email,
      contact_id: contact?.ContactID,
      items: invoice.invoice_items
    });

    // Update our database with Xero references
    await supabase
      .from('invoices')
      .update({
        xero_invoice_id: xeroInvoice.InvoiceID,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    // Create sync record
    await supabase
      .from('xero_invoices')
      .upsert({
        invoice_id: invoiceId,
        xero_invoice_id: xeroInvoice.InvoiceID,
        xero_invoice_number: xeroInvoice.InvoiceNumber,
        total_amount: xeroInvoice.Total,
        invoice_status: xeroInvoice.Status,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString()
      });
  }

  async syncInvoicesFromXero(): Promise<void> {
    // Get last sync time
    const { data: integration } = await supabase
      .from('xero_integrations')
      .select('last_sync_at')
      .eq('connection_status', 'active')
      .single();

    const modifiedSince = integration?.last_sync_at ? new Date(integration.last_sync_at) : undefined;
    
    // Get invoices from Xero
    const xeroInvoices = await this.getInvoices(modifiedSince);

    // Process each invoice
    for (const xeroInvoice of xeroInvoices) {
      // Check if we already have this invoice
      const { data: existingSync } = await supabase
        .from('xero_invoices')
        .select('invoice_id')
        .eq('xero_invoice_id', xeroInvoice.InvoiceID)
        .single();

      if (existingSync) {
        // Update existing invoice
        await supabase
          .from('invoices')
          .update({
            status: this.mapXeroStatus(xeroInvoice.Status),
            last_synced_at: new Date().toISOString()
          })
          .eq('id', existingSync.invoice_id);
      } else {
        // Create new invoice (if it doesn't exist in our system)
        console.log('New invoice from Xero:', xeroInvoice.InvoiceNumber);
        // TODO: Implement invoice creation from Xero data
      }
    }

    // Update last sync time
    await supabase
      .from('xero_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('connection_status', 'active');
  }

  private mapXeroStatus(xeroStatus: string): string {
    switch (xeroStatus) {
      case 'DRAFT':
        return 'draft';
      case 'SUBMITTED':
      case 'AUTHORISED':
        return 'sent';
      case 'PAID':
        return 'paid';
      case 'VOIDED':
        return 'cancelled';
      default:
        return 'draft';
    }
  }

  // =====================================
  // WEBHOOK HANDLING
  // =====================================

  async handleWebhook(payload: any): Promise<void> {
    // Verify webhook signature
    // TODO: Implement webhook signature verification

    // Process events
    for (const event of payload.events) {
      switch (event.eventType) {
        case 'CREATE':
          if (event.resourceType === 'INVOICE') {
            // Handle new invoice
            console.log('New invoice created in Xero:', event.resourceId);
          }
          break;
        
        case 'UPDATE':
          if (event.resourceType === 'INVOICE') {
            // Sync invoice updates
            const invoice = await this.getInvoice(event.resourceId);
            
            // Update our database
            const { data: sync } = await supabase
              .from('xero_invoices')
              .select('invoice_id')
              .eq('xero_invoice_id', event.resourceId)
              .single();

            if (sync) {
              await supabase
                .from('invoices')
                .update({
                  status: this.mapXeroStatus(invoice.Status),
                  last_synced_at: new Date().toISOString()
                })
                .eq('id', sync.invoice_id);

              // Check for payments
              if (invoice.AmountPaid > 0) {
                await supabase
                  .from('invoice_payments')
                  .upsert({
                    invoice_id: sync.invoice_id,
                    amount: invoice.AmountPaid,
                    payment_method: 'xero',
                    payment_date: invoice.FullyPaidOnDate || new Date().toISOString(),
                    reference: `XERO-${invoice.InvoiceNumber}`,
                    gateway: 'xero'
                  });
              }
            }
          }
          break;
      }
    }
  }
}

export const xeroService = new XeroService();