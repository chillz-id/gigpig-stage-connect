// Enhanced Invoice Operations Hook - Complete invoice management with Xero
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoiceService';
import { xeroService } from '@/services/xeroService';
import { toast } from '@/hooks/use-toast';

export const useInvoiceOperations = () => {
  const queryClient = useQueryClient();

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Invoice Created",
        description: `Invoice ${invoice.invoice_number} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Create invoice from ticket sales
  const createFromTicketSales = useMutation({
    mutationFn: invoiceService.createInvoiceFromTicketSales,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoice.invoice_number} has been generated from ticket sales.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  // Sync to Xero mutation
  const syncToXero = useMutation({
    mutationFn: xeroService.syncInvoiceToXero,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['xero-invoices'] });
      toast({
        title: "Synced to Xero",
        description: "Invoice has been synced to Xero successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync to Xero",
        variant: "destructive",
      });
    },
  });

  // Record payment mutation
  const recordPayment = useMutation({
    mutationFn: ({ invoiceId, payment }: any) => invoiceService.recordPayment(invoiceId, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Payment Recorded",
        description: "Payment has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Recording Failed",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  // Connect to Xero
  const connectToXero = () => {
    const authUrl = xeroService.getAuthorizationUrl();
    window.location.href = authUrl;
  };

  // Sync from Xero mutation
  const syncFromXero = useMutation({
    mutationFn: xeroService.syncInvoicesFromXero,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['xero-invoices'] });
      toast({
        title: "Sync Complete",
        description: "Invoices have been synced from Xero.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync from Xero",
        variant: "destructive",
      });
    },
  });

  // Generate recurring invoices
  const generateRecurringInvoices = useMutation({
    mutationFn: invoiceService.generateRecurringInvoices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Invoices Generated",
        description: "Recurring invoices have been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate recurring invoices",
        variant: "destructive",
      });
    },
  });

  // Check overdue invoices
  const checkOverdueInvoices = useMutation({
    mutationFn: invoiceService.checkOverdueInvoices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Check Complete",
        description: "Overdue invoices have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Check Failed",
        description: error instanceof Error ? error.message : "Failed to check overdue invoices",
        variant: "destructive",
      });
    },
  });

  return {
    createInvoice,
    createFromTicketSales,
    syncToXero,
    recordPayment,
    connectToXero,
    syncFromXero,
    generateRecurringInvoices,
    checkOverdueInvoices,
  };
};