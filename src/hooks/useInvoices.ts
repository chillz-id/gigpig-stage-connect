
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from '@/hooks/use-toast';
import { format, isThisMonth, isThisQuarter, isThisYear, isBefore, subMonths, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { Invoice, DateFilter, AmountFilter } from '@/types/invoice';

export const useInvoices = () => {
  const { user } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          issue_date,
          due_date,
          status,
          total_amount,
          currency,
          invoice_recipients (
            recipient_name,
            recipient_email
          )
        `)
        .eq('promoter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  const matchesDateFilter = (invoice: Invoice, dateFilter: DateFilter) => {
    if (dateFilter === 'all') return true;
    
    const issueDate = new Date(invoice.issue_date);
    const dueDate = new Date(invoice.due_date);
    
    switch (dateFilter) {
      case 'this-month':
        return isThisMonth(issueDate);
      case 'last-month':
        const lastMonth = subMonths(new Date(), 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);
        return isAfter(issueDate, lastMonthStart) && isBefore(issueDate, lastMonthEnd);
      case 'this-quarter':
        return isThisQuarter(issueDate);
      case 'this-year':
        return isThisYear(issueDate);
      case 'overdue':
        return isBefore(dueDate, new Date()) && invoice.status !== 'paid';
      default:
        return true;
    }
  };

  const matchesAmountFilter = (invoice: Invoice, amountFilter: AmountFilter) => {
    if (amountFilter === 'all') return true;
    
    const amount = invoice.total_amount;
    
    switch (amountFilter) {
      case '0-100':
        return amount >= 0 && amount <= 100;
      case '100-500':
        return amount > 100 && amount <= 500;
      case '500-1000':
        return amount > 500 && amount <= 1000;
      case '1000+':
        return amount > 1000;
      default:
        return true;
    }
  };

  const filterInvoices = (searchTerm: string, statusFilter: string, dateFilter: DateFilter, amountFilter: AmountFilter) => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_recipients.some(recipient => 
          recipient.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipient.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus && matchesDateFilter(invoice, dateFilter) && matchesAmountFilter(invoice, amountFilter);
    });
  };

  return {
    invoices,
    loading,
    deleteInvoice,
    filterInvoices,
    refetchInvoices: fetchInvoices
  };
};
