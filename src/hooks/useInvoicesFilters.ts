import {
  isBefore,
  subMonths,
  isAfter,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameQuarter,
  isSameYear
} from 'date-fns';
import { Invoice, DateFilter, AmountRange } from '@/types/invoice';

export const matchesDateFilter = (
  invoice: Invoice,
  dateFilter: DateFilter,
  referenceDate: Date = new Date()
) => {
  if (dateFilter === 'all') return true;

  const issueDate = new Date(invoice.issue_date);
  const dueDate = new Date(invoice.due_date);

  switch (dateFilter) {
    case 'this-month':
      return isSameMonth(issueDate, referenceDate);
    case 'last-month': {
      const lastMonth = subMonths(referenceDate, 1);
      const lastMonthStart = startOfMonth(lastMonth);
      const lastMonthEnd = endOfMonth(lastMonth);
      return isAfter(issueDate, lastMonthStart) && isBefore(issueDate, lastMonthEnd);
    }
    case 'this-quarter':
      return isSameQuarter(issueDate, referenceDate);
    case 'this-year':
      return isSameYear(issueDate, referenceDate);
    case 'overdue':
      return isBefore(dueDate, referenceDate) && invoice.status !== 'paid';
    default:
      return true;
  }
};

export const matchesAmountRange = (invoice: Invoice, amountRange: AmountRange) => {
  const amount = invoice.total_amount;
  return amount >= amountRange.min && amount <= amountRange.max;
};

export const filterInvoicesByCriteria = (
  invoices: Invoice[],
  searchTerm: string,
  statusFilter: string,
  dateFilter: DateFilter,
  amountRange: AmountRange,
  referenceDate: Date = new Date()
) => {
  return invoices.filter(invoice => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(lowerSearch) ||
      invoice.invoice_recipients.some(recipient =>
        recipient.recipient_name.toLowerCase().includes(lowerSearch) ||
        recipient.recipient_email.toLowerCase().includes(lowerSearch)
      );

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDateFilter(invoice, dateFilter, referenceDate) &&
      matchesAmountRange(invoice, amountRange)
    );
  });
};
