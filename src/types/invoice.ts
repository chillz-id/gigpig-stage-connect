
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
  // Deposit fields
  deposit_amount?: number;
  deposit_percentage?: number;
  deposit_due_days_before_event?: number;
  deposit_due_date?: string;
  deposit_status?: 'not_required' | 'pending' | 'paid' | 'overdue' | 'partial';
  deposit_paid_date?: string;
  deposit_paid_amount?: number;
  event_date?: string;
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

// Deposit-specific types
export type DepositStatus = 'not_required' | 'pending' | 'paid' | 'overdue' | 'partial';

export interface DepositSettings {
  requireDeposit: boolean;
  depositType: 'amount' | 'percentage';
  depositAmount?: number;
  depositPercentage?: number;
  depositDueDaysBeforeEvent?: number;
  eventDate?: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface InvoiceRecipient {
  id?: string;
  invoice_id?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  recipient_address?: string;
  recipient_abn?: string;
  recipient_type?: 'business' | 'individual';
  created_at?: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  is_deposit?: boolean;
  created_at: string;
}
