
export interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  currency: string;
  promoter_id?: string;
  comedian_id?: string;
  sender_name?: string;
  sender_email?: string;
  sender_address?: string;
  sender_phone?: string;
  sender_abn?: string;
  client_address?: string;
  client_mobile?: string;
  gst_treatment?: 'inclusive' | 'exclusive' | 'none';
  invoice_recipients: Array<{
    recipient_name: string;
    recipient_email: string;
    recipient_mobile?: string;
  }>;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DateFilter = 'all' | 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'overdue';
export type AmountFilter = 'all' | '0-100' | '100-500' | '500-1000' | '1000+';

// New type for slider-based amount filtering
export interface AmountRange {
  min: number;
  max: number;
}

export const DEFAULT_AMOUNT_RANGE: AmountRange = { min: 0, max: 10000 };
