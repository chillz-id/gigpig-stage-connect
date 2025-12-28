
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, isThisMonth, isThisQuarter, isThisYear, isBefore, subMonths, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { Invoice, DateFilter, AmountRange } from '@/types/invoice';

export const useInvoices = () => {
  const { user, hasRole, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      console.log('=== NO USER FOR INVOICE FETCH ===');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('=== STARTING INVOICE FETCH ===', user.id);
      
      const { data, error } = await supabase
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
        .or(`promoter_id.eq.${user.id},comedian_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      console.log('=== INVOICE FETCH RESPONSE ===', { data, error });

      if (error) {
        console.error('=== INVOICE FETCH ERROR ===', error);
        throw error;
      }

      console.log('=== INVOICES FETCHED SUCCESSFULLY ===', data?.length || 0);
      
      // Type cast the data to match our Invoice interface
      const typedInvoices: Invoice[] = (data || []).map(invoice => ({
        ...invoice,
        gst_treatment: invoice.gst_treatment as 'inclusive' | 'exclusive' | 'none'
      }));
      
      setInvoices(typedInvoices);
    } catch (error) {
      console.error('=== ERROR FETCHING INVOICES ===', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load invoices';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to finish loading before making any decisions
    if (authLoading) {
      console.log('=== AUTH STILL LOADING, WAITING... ===');
      return;
    }

    const canAccessInvoices = hasRole('comedian') || hasRole('comedian_lite') || hasRole('admin');

    if (user && canAccessInvoices) {
      console.log('=== FETCHING INVOICES ===', user.id, {
        hasComedian: hasRole('comedian'),
        hasComedianLite: hasRole('comedian_lite'),
        hasAdmin: hasRole('admin')
      });
      fetchAttempted.current = true;
      fetchInvoices();
    } else if (!authLoading) {
      // Only clear/reset after auth is done loading
      console.log('=== NO USER OR INSUFFICIENT PERMISSIONS, CLEARING INVOICES ===', {
        hasUser: !!user,
        canAccessInvoices,
        authLoading
      });
      setInvoices([]);
      setLoading(false);
      setError(null);
    }
  }, [fetchInvoices, hasRole, user, authLoading]);

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

  const matchesAmountRange = (invoice: Invoice, amountRange: AmountRange) => {
    const amount = invoice.total_amount;
    return amount >= amountRange.min && amount <= amountRange.max;
  };

  const filterInvoices = (searchTerm: string, statusFilter: string, dateFilter: DateFilter, amountRange: AmountRange) => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_recipients.some(recipient => 
          recipient.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipient.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus && matchesDateFilter(invoice, dateFilter) && matchesAmountRange(invoice, amountRange);
    });
  };

  return {
    invoices,
    loading,
    error,
    deleteInvoice,
    filterInvoices,
    refetchInvoices: fetchInvoices
  };
};
