import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;
const NO_ROWS_ERROR = 'PGRST116';

export interface XeroIntegrationRecord {
  id: string;
  user_id?: string;
  tenant_id: string;
  tenant_name?: string | null;
  connection_status: string;
  access_token?: string | null;
  refresh_token?: string | null;
  last_sync_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface XeroInvoiceRecord {
  id: string;
  xero_invoice_number?: string | null;
  total_amount?: number | null;
  invoice_status?: string | null;
  sync_status?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface XeroBillRecord {
  id: string;
  xero_bill_number?: string | null;
  total_amount?: number | null;
  bill_status?: string | null;
  sync_status?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface ConnectIntegrationInput {
  userId: string;
  tenantId?: string;
  accessToken?: string;
  refreshToken?: string;
  connectionStatus?: string;
  metadata?: Record<string, unknown>;
}

const withDefaultTenant = (tenantId?: string) =>
  tenantId ?? `tenant-${Date.now()}`;

export const xeroIntegrationService = {
  async getIntegration(): Promise<XeroIntegrationRecord | null> {
    const { data, error } = await supabaseClient
      .from('xero_integrations')
      .select('*')
      .maybeSingle();

    if (error && error.code !== NO_ROWS_ERROR) {
      throw error;
    }

    return (data as XeroIntegrationRecord | null) ?? null;
  },

  async getIntegrationForUser(userId: string): Promise<XeroIntegrationRecord | null> {
    const { data, error } = await supabaseClient
      .from('xero_integrations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== NO_ROWS_ERROR) {
      throw error;
    }

    return (data as XeroIntegrationRecord | null) ?? null;
  },

  async listInvoices(limit: number = 10): Promise<XeroInvoiceRecord[]> {
    const { data, error } = await supabaseClient
      .from('xero_invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as XeroInvoiceRecord[] | null) ?? [];
  },

  async listBills(limit: number = 10): Promise<XeroBillRecord[]> {
    const { data, error } = await supabaseClient
      .from('xero_bills')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as XeroBillRecord[] | null) ?? [];
  },

  async connectIntegration({
    userId,
    tenantId,
    accessToken,
    refreshToken,
    connectionStatus = 'active',
    metadata = {},
  }: ConnectIntegrationInput): Promise<XeroIntegrationRecord> {
    const { data, error } = await supabaseClient
      .from('xero_integrations')
      .upsert({
        user_id: userId,
        tenant_id: withDefaultTenant(tenantId),
        connection_status: connectionStatus,
        access_token: accessToken ?? 'demo-token',
        refresh_token: refreshToken ?? 'demo-refresh-token',
        ...metadata,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as XeroIntegrationRecord;
  },

  async updateLastSync(integrationId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('xero_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    if (error) throw error;
  },

  async disconnectIntegration(integrationId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('xero_integrations')
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
  },
};

export type XeroIntegrationService = typeof xeroIntegrationService;
