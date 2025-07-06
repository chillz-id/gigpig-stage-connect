import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { 
  flexPayService, 
  PaymentRequest, 
  PaymentResponse, 
  PaymentGateway, 
  PaymentGatewayConfig 
} from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_gateway: PaymentGateway;
  gateway_transaction_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  payment_date?: string;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  refund_amount: number;
  processor_fee: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RecurringInvoice {
  id: string;
  promoter_id?: string;
  comedian_id?: string;
  subscription_name: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  next_billing_date: string;
  is_active: boolean;
  auto_send: boolean;
  invoice_count: number;
  max_invoices?: number;
  created_at: string;
}

export const usePayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize payment gateways
  useEffect(() => {
    if (user?.id) {
      flexPayService.initializeGateways(user.id).catch(console.error);
    }
  }, [user?.id]);

  // Fetch payment records for user's invoices
  const { data: paymentRecords, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payment-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          invoices!inner(promoter_id, comedian_id)
        `)
        .or(`invoices.promoter_id.eq.${user.id},invoices.comedian_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentRecord[];
    },
    enabled: !!user?.id,
  });

  // Fetch recurring invoices
  const { data: recurringInvoices, isLoading: isLoadingRecurring } = useQuery({
    queryKey: ['recurring-invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*')
        .or(`promoter_id.eq.${user.id},comedian_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecurringInvoice[];
    },
    enabled: !!user?.id,
  });

  // Fetch payment gateway settings
  const { data: gatewaySettings, isLoading: isLoadingGateways } = useQuery({
    queryKey: ['gateway-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await flexPayService.getGatewaySettings(user.id);
    },
    enabled: !!user?.id,
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (request: PaymentRequest): Promise<PaymentResponse> => {
      setIsProcessing(true);
      return await flexPayService.processPayment(request);
    },
    onSuccess: (response, request) => {
      if (response.success) {
        toast.success('Payment processed successfully');
        queryClient.invalidateQueries({ queryKey: ['payment-records'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        
        // Auto-calculate commission splits for completed payments
        if (response.status === 'completed' && response.paymentRecordId) {
          flexPayService.calculateCommissionSplits(response.paymentRecordId)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['commission-splits'] });
            })
            .catch(console.error);
        }
      } else {
        toast.error(response.error || 'Payment processing failed');
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Payment processing failed:', error);
      toast.error('Payment processing failed');
      setIsProcessing(false);
    },
  });

  // Update gateway settings mutation
  const updateGatewayMutation = useMutation({
    mutationFn: async ({ 
      gatewayName, 
      config 
    }: { 
      gatewayName: PaymentGateway; 
      config: Partial<PaymentGatewayConfig> 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await flexPayService.updateGatewaySettings(user.id, gatewayName, config);
    },
    onSuccess: () => {
      toast.success('Payment gateway settings updated');
      queryClient.invalidateQueries({ queryKey: ['gateway-settings'] });
    },
    onError: (error) => {
      console.error('Failed to update gateway settings:', error);
      toast.error('Failed to update gateway settings');
    },
  });

  // Create recurring invoice mutation
  const createRecurringInvoiceMutation = useMutation({
    mutationFn: async (recurringInvoice: Omit<RecurringInvoice, 'id' | 'created_at' | 'invoice_count'>) => {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .insert(recurringInvoice)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Recurring invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
    onError: (error) => {
      console.error('Failed to create recurring invoice:', error);
      toast.error('Failed to create recurring invoice');
    },
  });

  // Update recurring invoice mutation
  const updateRecurringInvoiceMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<RecurringInvoice> 
    }) => {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Recurring invoice updated successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
    onError: (error) => {
      console.error('Failed to update recurring invoice:', error);
      toast.error('Failed to update recurring invoice');
    },
  });

  // Generate recurring invoice mutation
  const generateRecurringInvoiceMutation = useMutation({
    mutationFn: async (recurringInvoiceId: string) => {
      const { data, error } = await supabase.rpc('generate_recurring_invoice', {
        recurring_invoice_id_param: recurringInvoiceId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Invoice generated from recurring template');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
    onError: (error) => {
      console.error('Failed to generate recurring invoice:', error);
      toast.error('Failed to generate recurring invoice');
    },
  });

  // Refund payment mutation
  const refundPaymentMutation = useMutation({
    mutationFn: async ({ 
      paymentRecordId, 
      amount 
    }: { 
      paymentRecordId: string; 
      amount?: number 
    }) => {
      // Get payment record details
      const { data: payment, error: paymentError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('id', paymentRecordId)
        .single();

      if (paymentError) throw paymentError;

      const refundAmount = amount || payment.amount;
      
      // Update payment record with refund
      const { error } = await supabase
        .from('payment_records')
        .update({
          status: amount && amount < payment.amount ? 'completed' : 'refunded',
          refund_amount: (payment.refund_amount || 0) + refundAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecordId);

      if (error) throw error;

      // In a real implementation, you would also call the gateway's refund API
      return { success: true, refundAmount };
    },
    onSuccess: (result) => {
      toast.success(`Refund of $${result.refundAmount} processed successfully`);
      queryClient.invalidateQueries({ queryKey: ['payment-records'] });
    },
    onError: (error) => {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
    },
  });

  // Helper functions
  const processPayment = useCallback(async (request: PaymentRequest): Promise<PaymentResponse> => {
    return processPaymentMutation.mutateAsync(request);
  }, [processPaymentMutation]);

  const updateGatewaySettings = useCallback(async (
    gatewayName: PaymentGateway, 
    config: Partial<PaymentGatewayConfig>
  ) => {
    return updateGatewayMutation.mutateAsync({ gatewayName, config });
  }, [updateGatewayMutation]);

  const createRecurringInvoice = useCallback(async (
    recurringInvoice: Omit<RecurringInvoice, 'id' | 'created_at' | 'invoice_count'>
  ) => {
    return createRecurringInvoiceMutation.mutateAsync(recurringInvoice);
  }, [createRecurringInvoiceMutation]);

  const updateRecurringInvoice = useCallback(async (
    id: string, 
    updates: Partial<RecurringInvoice>
  ) => {
    return updateRecurringInvoiceMutation.mutateAsync({ id, updates });
  }, [updateRecurringInvoiceMutation]);

  const generateRecurringInvoice = useCallback(async (recurringInvoiceId: string) => {
    return generateRecurringInvoiceMutation.mutateAsync(recurringInvoiceId);
  }, [generateRecurringInvoiceMutation]);

  const refundPayment = useCallback(async (paymentRecordId: string, amount?: number) => {
    return refundPaymentMutation.mutateAsync({ paymentRecordId, amount });
  }, [refundPaymentMutation]);

  // Calculate payment statistics
  const paymentStats = {
    totalPayments: paymentRecords?.length || 0,
    totalAmount: paymentRecords?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
    totalCommission: paymentRecords?.reduce((sum, payment) => sum + payment.commission_amount, 0) || 0,
    totalRefunds: paymentRecords?.reduce((sum, payment) => sum + payment.refund_amount, 0) || 0,
    activeRecurringInvoices: recurringInvoices?.filter(invoice => invoice.is_active).length || 0,
  };

  return {
    // Data
    paymentRecords: paymentRecords || [],
    recurringInvoices: recurringInvoices || [],
    gatewaySettings: gatewaySettings || [],
    paymentStats,

    // Loading states
    isLoadingPayments,
    isLoadingRecurring,
    isLoadingGateways,
    isProcessing,

    // Mutations
    processPayment,
    updateGatewaySettings,
    createRecurringInvoice,
    updateRecurringInvoice,
    generateRecurringInvoice,
    refundPayment,

    // Mutation states
    isProcessingPayment: processPaymentMutation.isPending,
    isUpdatingGateway: updateGatewayMutation.isPending,
    isCreatingRecurring: createRecurringInvoiceMutation.isPending,
    isUpdatingRecurring: updateRecurringInvoiceMutation.isPending,
    isGeneratingRecurring: generateRecurringInvoiceMutation.isPending,
    isRefunding: refundPaymentMutation.isPending,
  };
};