
export interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  currency: string;
  invoice_recipients: Array<{
    recipient_name: string;
    recipient_email: string;
  }>;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DateFilter = 'all' | 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'overdue';
export type AmountFilter = 'all' | '0-100' | '100-500' | '500-1000' | '1000+';
