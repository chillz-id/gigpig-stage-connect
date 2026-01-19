
export type InvoiceType = 'promoter' | 'comedian' | 'other' | 'receivable' | 'payable';

export interface Invoice {
  id: string;
  invoice_type: InvoiceType;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  currency: string;
  promoter_id?: string;
  comedian_id?: string;
  organization_id?: string;
  event_id?: string;
  event_spot_id?: string;
  recipient_id?: string;
  sender_name?: string;
  sender_email?: string;
  sender_address?: string;
  sender_phone?: string;
  sender_abn?: string;
  sender_bank_name?: string;
  sender_bank_bsb?: string;
  sender_bank_account?: string;
  client_address?: string;
  client_mobile?: string;
  gst_treatment?: 'inclusive' | 'exclusive' | 'none';
  tax_treatment?: 'inclusive' | 'exclusive' | 'none';
  subtotal?: number;
  tax_amount?: number;
  tax_rate?: number;
  notes?: string;
  terms?: string;
  xero_invoice_id?: string;
  xero_sync_error?: string;
  last_synced_at?: string;
  sent_at?: string;
  paid_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  invoice_recipients: InvoiceRecipient[];
  invoice_items?: InvoiceItem[];
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
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  item_order?: number;
  created_at?: string;
}

export interface InvoiceRecipient {
  id?: string;
  invoice_id?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_address?: string;
  recipient_phone?: string;
  recipient_mobile?: string;
  recipient_type?: 'individual' | 'company';
  recipient_abn?: string;
  company_name?: string;
  abn?: string;
  created_at?: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed';
  is_deposit?: boolean;
  recorded_by?: string;
  created_at: string;
}
