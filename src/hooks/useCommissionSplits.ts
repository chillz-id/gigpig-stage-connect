import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export interface CommissionSplit {
  id: string;
  payment_record_id: string;
  recipient_type: 'platform' | 'agency' | 'comedian' | 'promoter' | 'venue';
  recipient_id?: string;
  split_percentage: number;
  split_amount: number;
  split_status: 'pending' | 'processing' | 'completed' | 'failed';
  payout_method?: string;
  payout_date?: string;
  payout_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRule {
  id?: string;
  user_id: string;
  rule_name: string;
  platform_rate: number;
  agency_rate: number;
  venue_rate?: number;
  is_active: boolean;
  applies_to_event_types?: string[];
  minimum_amount?: number;
  maximum_amount?: number;
}

export interface PayoutBatch {
  id: string;
  batch_name: string;
  split_ids: string[];
  total_amount: number;
  payout_method: string;
  payout_reference?: string;
  processed_at?: string;
  created_by: string;
  created_at: string;
}

export const useCommissionSplits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSplits, setSelectedSplits] = useState<string[]>([]);

  // Fetch commission splits for user
  const { data: commissionSplits, isLoading: isLoadingSplits } = useQuery({
    queryKey: ['commission-splits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('commission_splits')
        .select(`
          *,
          payment_records!inner(
            amount,
            currency,
            payment_date,
            invoices!inner(
              invoice_number,
              promoter_id,
              comedian_id
            )
          ),
          profiles!commission_splits_recipient_id_fkey(
            name,
            email
          )
        `)
        .or(`recipient_id.eq.${user.id},payment_records.invoices.promoter_id.eq.${user.id},payment_records.invoices.comedian_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommissionSplit[];
    },
    enabled: !!user?.id,
  });

  // Fetch commission rules
  const { data: commissionRules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['commission-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error; // Ignore table not found error
      return data as CommissionRule[] || [];
    },
    enabled: !!user?.id,
  });

  // Fetch payout batches
  const { data: payoutBatches, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['payout-batches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('payout_batches')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error; // Ignore table not found error
      return data as PayoutBatch[] || [];
    },
    enabled: !!user?.id,
  });

  // Calculate commission splits for a payment
  const calculateSplitsMutation = useMutation({
    mutationFn: async ({ 
      paymentRecordId, 
      platformRate = 2.5, 
      agencyRate = 10.0 
    }: { 
      paymentRecordId: string; 
      platformRate?: number; 
      agencyRate?: number; 
    }) => {
      const { data, error } = await supabase.rpc('calculate_commission_splits', {
        payment_record_id_param: paymentRecordId,
        platform_rate: platformRate,
        agency_rate: agencyRate
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Commission splits calculated successfully');
      queryClient.invalidateQueries({ queryKey: ['commission-splits'] });
    },
    onError: (error) => {
      console.error('Failed to calculate commission splits:', error);
      toast.error('Failed to calculate commission splits');
    },
  });

  // Process individual payout
  const processPayoutMutation = useMutation({
    mutationFn: async ({ 
      splitId, 
      payoutMethod, 
      payoutReference 
    }: { 
      splitId: string; 
      payoutMethod: string; 
      payoutReference?: string; 
    }) => {
      const { error } = await supabase
        .from('commission_splits')
        .update({
          split_status: 'completed',
          payout_method: payoutMethod,
          payout_date: new Date().toISOString(),
          payout_reference: payoutReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', splitId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payout processed successfully');
      queryClient.invalidateQueries({ queryKey: ['commission-splits'] });
    },
    onError: (error) => {
      console.error('Failed to process payout:', error);
      toast.error('Failed to process payout');
    },
  });

  // Process bulk payout
  const processBulkPayoutMutation = useMutation({
    mutationFn: async ({ 
      splitIds, 
      payoutMethod, 
      payoutReference,
      batchName 
    }: { 
      splitIds: string[]; 
      payoutMethod: string; 
      payoutReference?: string;
      batchName?: string;
    }) => {
      // Create payout batch record first
      const { data: batch, error: batchError } = await supabase
        .from('payout_batches')
        .insert({
          batch_name: batchName || `Bulk payout ${new Date().toLocaleDateString()}`,
          split_ids: splitIds,
          payout_method: payoutMethod,
          payout_reference: payoutReference,
          created_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Calculate total amount
      const { data: splitsData, error: splitsError } = await supabase
        .from('commission_splits')
        .select('split_amount')
        .in('id', splitIds);

      if (splitsError) throw splitsError;

      const totalAmount = splitsData.reduce((sum, split) => sum + split.split_amount, 0);

      // Update batch with total amount
      await supabase
        .from('payout_batches')
        .update({ total_amount: totalAmount })
        .eq('id', batch.id);

      // Update all commission splits
      const { error } = await supabase
        .from('commission_splits')
        .update({
          split_status: 'completed',
          payout_method: payoutMethod,
          payout_date: new Date().toISOString(),
          payout_reference: payoutReference || batch.id,
          updated_at: new Date().toISOString()
        })
        .in('id', splitIds);

      if (error) throw error;

      return { batchId: batch.id, totalAmount };
    },
    onSuccess: (result) => {
      toast.success(`Bulk payout processed: $${result.totalAmount.toFixed(2)}`);
      queryClient.invalidateQueries({ queryKey: ['commission-splits'] });
      queryClient.invalidateQueries({ queryKey: ['payout-batches'] });
      setSelectedSplits([]);
    },
    onError: (error) => {
      console.error('Failed to process bulk payout:', error);
      toast.error('Failed to process bulk payout');
    },
  });

  // Create commission rule
  const createCommissionRuleMutation = useMutation({
    mutationFn: async (rule: Omit<CommissionRule, 'id' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .insert({
          ...rule,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Commission rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (error) => {
      console.error('Failed to create commission rule:', error);
      toast.error('Failed to create commission rule');
    },
  });

  // Update commission rule
  const updateCommissionRuleMutation = useMutation({
    mutationFn: async ({ 
      ruleId, 
      updates 
    }: { 
      ruleId: string; 
      updates: Partial<CommissionRule> 
    }) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Commission rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (error) => {
      console.error('Failed to update commission rule:', error);
      toast.error('Failed to update commission rule');
    },
  });

  // Helper functions
  const calculateSplits = useCallback(async (
    paymentRecordId: string, 
    platformRate?: number, 
    agencyRate?: number
  ) => {
    return calculateSplitsMutation.mutateAsync({ paymentRecordId, platformRate, agencyRate });
  }, [calculateSplitsMutation]);

  const processPayout = useCallback(async (
    splitId: string, 
    payoutMethod: string, 
    payoutReference?: string
  ) => {
    return processPayoutMutation.mutateAsync({ splitId, payoutMethod, payoutReference });
  }, [processPayoutMutation]);

  const processBulkPayout = useCallback(async (
    splitIds: string[], 
    payoutMethod: string, 
    payoutReference?: string,
    batchName?: string
  ) => {
    return processBulkPayoutMutation.mutateAsync({ 
      splitIds, 
      payoutMethod, 
      payoutReference, 
      batchName 
    });
  }, [processBulkPayoutMutation]);

  const createCommissionRule = useCallback(async (rule: Omit<CommissionRule, 'id' | 'user_id'>) => {
    return createCommissionRuleMutation.mutateAsync(rule);
  }, [createCommissionRuleMutation]);

  const updateCommissionRule = useCallback(async (ruleId: string, updates: Partial<CommissionRule>) => {
    return updateCommissionRuleMutation.mutateAsync({ ruleId, updates });
  }, [updateCommissionRuleMutation]);

  // Statistics calculations
  const statistics = {
    totalSplits: commissionSplits?.length || 0,
    pendingCount: commissionSplits?.filter(split => split.split_status === 'pending').length || 0,
    completedCount: commissionSplits?.filter(split => split.split_status === 'completed').length || 0,
    pendingAmount: commissionSplits?.filter(split => split.split_status === 'pending')
      .reduce((sum, split) => sum + split.split_amount, 0) || 0,
    completedAmount: commissionSplits?.filter(split => split.split_status === 'completed')
      .reduce((sum, split) => sum + split.split_amount, 0) || 0,
    totalAmount: commissionSplits?.reduce((sum, split) => sum + split.split_amount, 0) || 0,
    selectedAmount: commissionSplits?.filter(split => selectedSplits.includes(split.id))
      .reduce((sum, split) => sum + split.split_amount, 0) || 0,
  };

  // Filtering functions
  const getPendingSplits = () => commissionSplits?.filter(split => split.split_status === 'pending') || [];
  const getCompletedSplits = () => commissionSplits?.filter(split => split.split_status === 'completed') || [];
  const getSplitsByRecipientType = (type: string) => 
    commissionSplits?.filter(split => split.recipient_type === type) || [];

  return {
    // Data
    commissionSplits: commissionSplits || [],
    commissionRules: commissionRules || [],
    payoutBatches: payoutBatches || [],
    statistics,
    selectedSplits,

    // Loading states
    isLoadingSplits,
    isLoadingRules,
    isLoadingBatches,

    // Selection management
    setSelectedSplits,
    selectSplit: (splitId: string) => {
      setSelectedSplits(prev => 
        prev.includes(splitId) 
          ? prev.filter(id => id !== splitId)
          : [...prev, splitId]
      );
    },
    selectAllPending: () => {
      const pendingSplitIds = getPendingSplits().map(split => split.id);
      setSelectedSplits(selectedSplits.length === pendingSplitIds.length ? [] : pendingSplitIds);
    },
    clearSelection: () => setSelectedSplits([]),

    // Actions
    calculateSplits,
    processPayout,
    processBulkPayout,
    createCommissionRule,
    updateCommissionRule,

    // Mutation states
    isCalculatingSplits: calculateSplitsMutation.isPending,
    isProcessingPayout: processPayoutMutation.isPending,
    isProcessingBulkPayout: processBulkPayoutMutation.isPending,
    isCreatingRule: createCommissionRuleMutation.isPending,
    isUpdatingRule: updateCommissionRuleMutation.isPending,

    // Helper functions
    getPendingSplits,
    getCompletedSplits,
    getSplitsByRecipientType,
  };
};