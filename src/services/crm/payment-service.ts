import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type { PaymentGateway } from '@/services/paymentService';

const supabaseClient = supabase as any;

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_gateway: PaymentGateway;
  gateway_transaction_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  payment_date?: string | null;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  refund_amount: number;
  processor_fee: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  invoices?: {
    promoter_id?: string | null;
    comedian_id?: string | null;
  };
}

export interface RecurringInvoice {
  id: string;
  promoter_id?: string | null;
  comedian_id?: string | null;
  subscription_name: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  start_date: string;
  end_date?: string | null;
  next_billing_date: string;
  is_active: boolean;
  auto_send: boolean;
  invoice_count: number;
  max_invoices?: number | null;
  created_at: string;
}

export type RecurringInvoiceInput = Omit<
  RecurringInvoice,
  'id' | 'created_at' | 'invoice_count'
>;

const filterByUser = (userId: string) =>
  supabaseClient
    .from('payment_records')
    .select(
      `
        *,
        invoices!inner(promoter_id, comedian_id)
      `
    )
    .or(`invoices.promoter_id.eq.${userId},invoices.comedian_id.eq.${userId}`)
    .order('created_at', { ascending: false });

const recurringInvoicesQuery = (userId: string) =>
  supabaseClient
    .from('recurring_invoices')
    .select('*')
    .or(`promoter_id.eq.${userId},comedian_id.eq.${userId}`)
    .order('created_at', { ascending: false });

const normalizeMetadata = (metadata: unknown): Record<string, unknown> => {
  if (!metadata || typeof metadata !== 'object') return {};
  return metadata as Record<string, unknown>;
};

export const paymentService = {
  async listPaymentRecordsForUser(userId: string): Promise<PaymentRecord[]> {
    const { data, error } = await filterByUser(userId);

    if (error) throw error;

    return (data || []).map((record: PaymentRecord) => ({
      ...record,
      metadata: normalizeMetadata(record.metadata),
    }));
  },

  async listRecurringInvoicesForUser(userId: string): Promise<RecurringInvoice[]> {
    const { data, error } = await recurringInvoicesQuery(userId);
    if (error) throw error;
    return (data || []) as RecurringInvoice[];
  },

  async createRecurringInvoice(
    invoice: RecurringInvoiceInput
  ): Promise<RecurringInvoice> {
    const { data, error } = await supabaseClient
      .from('recurring_invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) throw error;

    return data as RecurringInvoice;
  },

  async updateRecurringInvoice(
    id: string,
    updates: Partial<RecurringInvoice>
  ): Promise<RecurringInvoice> {
    const { data, error } = await supabaseClient
      .from('recurring_invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as RecurringInvoice;
  },

  async generateRecurringInvoice(recurringInvoiceId: string) {
    const { data, error } = await supabaseClient.rpc(
      'generate_recurring_invoice',
      {
        recurring_invoice_id_param: recurringInvoiceId,
      }
    );

    if (error) throw error;

    return data;
  },

  async getPaymentRecordById(paymentRecordId: string): Promise<PaymentRecord> {
    const { data, error } = await supabaseClient
      .from('payment_records')
      .select('*')
      .eq('id', paymentRecordId)
      .single();

    if (error) throw error;

    const record = data as PaymentRecord;
    return {
      ...record,
      metadata: normalizeMetadata(record.metadata),
    };
  },

  async refundPayment(paymentRecordId: string, amount?: number) {
    const payment = await paymentService.getPaymentRecordById(paymentRecordId);
    const refundAmount = amount ?? payment.amount;

    const nextRefundAmount = (payment.refund_amount || 0) + refundAmount;
    const status = amount && amount < payment.amount ? 'completed' : 'refunded';

    const { error } = await supabaseClient
      .from('payment_records')
      .update({
        status,
        refund_amount: nextRefundAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecordId);

    if (error) throw error;

    return {
      success: true,
      refundAmount,
    };
  },
};

export type PaymentServiceError = PostgrestError;
export type PaymentService = typeof paymentService;
