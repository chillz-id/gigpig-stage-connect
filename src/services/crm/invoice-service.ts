import { supabase } from '@/integrations/supabase/client';
import type { Invoice } from '@/types/invoice';

const supabaseClient = supabase as any;

const mapInvoice = (invoice: Record<string, unknown>): Invoice => {
  const typed = invoice as unknown as Invoice;
  return {
    ...typed,
    gst_treatment: typed.gst_treatment ?? 'inclusive',
  };
};

export const invoiceService = {
  async listForUser(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabaseClient
      .from('invoices')
      .select(`
        id,
        invoice_type,
        invoice_number,
        issue_date,
        due_date,
        status,
        total_amount,
        subtotal,
        tax_amount,
        tax_rate,
        currency,
        promoter_id,
        comedian_id,
        sender_name,
        sender_email,
        sender_address,
        sender_phone,
        sender_abn,
        client_address,
        client_mobile,
        gst_treatment,
        tax_treatment,
        xero_invoice_id,
        last_synced_at,
        paid_at,
        created_by,
        created_at,
        updated_at,
        deposit_amount,
        deposit_percentage,
        deposit_due_days_before_event,
        deposit_due_date,
        deposit_status,
        deposit_paid_date,
        deposit_paid_amount,
        event_date,
        invoice_recipients (
          recipient_name,
          recipient_email,
          recipient_mobile,
          recipient_address,
          recipient_phone,
          recipient_type,
          recipient_abn,
          company_name,
          abn
        )
      `)
      .or(`promoter_id.eq.${userId},comedian_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return ((data ?? []) as Record<string, unknown>[]).map(mapInvoice);
  },

  async delete(invoiceId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  },
};

export type InvoiceService = typeof invoiceService;
