import { filterInvoicesByCriteria, matchesAmountRange, matchesDateFilter } from '@/hooks/useInvoicesFilters';
import { AmountRange, Invoice } from '@/types/invoice';

describe('useInvoices filtering helpers', () => {
  const baseInvoice: Invoice = {
    id: '1',
    invoice_number: 'INV-001',
    issue_date: '2025-01-05T00:00:00.000Z',
    due_date: '2025-01-20T00:00:00.000Z',
    status: 'sent',
    total_amount: 500,
    currency: 'AUD',
    invoice_recipients: [
      {
        recipient_name: 'Alice Johnson',
        recipient_email: 'alice@example.com'
      }
    ]
  };

  const referenceDate = new Date('2025-01-25T00:00:00.000Z');

  describe('matchesDateFilter', () => {
    it('returns true for all filter', () => {
      expect(matchesDateFilter(baseInvoice, 'all')).toBe(true);
    });

    it('detects invoices issued this month', () => {
      expect(matchesDateFilter(baseInvoice, 'this-month', referenceDate)).toBe(true);
    });

    it('detects invoices issued last month', () => {
      const lastMonthInvoice: Invoice = {
        ...baseInvoice,
        id: '2',
        invoice_number: 'INV-002',
        issue_date: '2024-12-15T00:00:00.000Z',
        due_date: '2024-12-30T00:00:00.000Z'
      };

      expect(matchesDateFilter(lastMonthInvoice, 'last-month', referenceDate)).toBe(true);
      expect(matchesDateFilter(lastMonthInvoice, 'this-month', referenceDate)).toBe(false);
    });

    it('flags overdue invoices that are not paid', () => {
      const overdueInvoice: Invoice = {
        ...baseInvoice,
        id: '3',
        invoice_number: 'INV-003',
        due_date: '2025-01-10T00:00:00.000Z',
        status: 'sent'
      };

      expect(matchesDateFilter(overdueInvoice, 'overdue', referenceDate)).toBe(true);
    });

    it('ignores invoices that are already paid when checking overdue', () => {
      const paidInvoice: Invoice = {
        ...baseInvoice,
        id: '4',
        invoice_number: 'INV-004',
        due_date: '2025-01-10T00:00:00.000Z',
        status: 'paid'
      };

      expect(matchesDateFilter(paidInvoice, 'overdue', referenceDate)).toBe(false);
    });
  });

  describe('matchesAmountRange', () => {
    it('includes invoices within the provided range', () => {
      const amountRange: AmountRange = { min: 100, max: 600 };
      expect(matchesAmountRange(baseInvoice, amountRange)).toBe(true);
    });

    it('excludes invoices outside the provided range', () => {
      const amountRange: AmountRange = { min: 600, max: 1000 };
      expect(matchesAmountRange(baseInvoice, amountRange)).toBe(false);
    });
  });

  describe('filterInvoicesByCriteria', () => {
    const invoices: Invoice[] = [
      baseInvoice,
      {
        ...baseInvoice,
        id: '5',
        invoice_number: 'INV-005',
        total_amount: 1200,
        status: 'draft',
        invoice_recipients: [
          {
            recipient_name: 'Bob Smith',
            recipient_email: 'bob@example.com'
          }
        ]
      },
      {
        ...baseInvoice,
        id: '6',
        invoice_number: 'INV-006',
        total_amount: 900,
        status: 'sent',
        issue_date: '2024-12-10T00:00:00.000Z',
        due_date: '2024-12-31T00:00:00.000Z',
        invoice_recipients: [
          {
            recipient_name: 'Carol Davis',
            recipient_email: 'carol@example.com'
          }
        ]
      }
    ];

    it('filters by search term across invoice number and recipient', () => {
      const resultsByNumber = filterInvoicesByCriteria(invoices, 'inv-005', 'all', 'all', { min: 0, max: 5000 }, referenceDate);
      expect(resultsByNumber).toHaveLength(1);
      expect(resultsByNumber[0].invoice_number).toBe('INV-005');

      const resultsByRecipient = filterInvoicesByCriteria(invoices, 'alice', 'all', 'all', { min: 0, max: 5000 }, referenceDate);
      expect(resultsByRecipient).toHaveLength(1);
      expect(resultsByRecipient[0].invoice_number).toBe('INV-001');
    });

    it('applies status, date, and amount filters together', () => {
      const amountRange: AmountRange = { min: 400, max: 800 };
      const results = filterInvoicesByCriteria(invoices, '', 'sent', 'this-month', amountRange, referenceDate);

      expect(results).toHaveLength(1);
      expect(results[0].invoice_number).toBe('INV-001');
    });

    it('returns an empty array when no invoices match all filters', () => {
      const amountRange: AmountRange = { min: 0, max: 300 };
      const results = filterInvoicesByCriteria(invoices, '', 'sent', 'this-month', amountRange, referenceDate);

      expect(results).toHaveLength(0);
    });
  });
});
