
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { xeroService } from '@/services/xeroService';

interface XeroSettings {
  invoiceStatus: 'AUTHORISED' | 'DRAFT';
  bookingInvoiceType: 'ACCREC' | 'ACCPAY';
  pdfAttachment: boolean;
  bookingInvoiceAccount: string;
  commissionInvoiceAccount: string;
  overrideCommissionInvoice: 'auto' | 'sales' | 'bill';
  rosterInvoiceAccount: string;
  lineItemInvoiceAccount: string;
  depositInvoiceAccount: string;
}

interface UserXeroIntegration {
  id: string;
  connection_status: string;
  created_at: string;
  last_sync_at: string | null;
  tenant_id: string;
  tenant_name?: string;
  settings?: Partial<XeroSettings>;
}

export const useUserXeroIntegration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ['user-xero-integration', user?.id],
    queryFn: async (): Promise<UserXeroIntegration | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('xero_integrations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const connectToXero = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Redirect to Xero OAuth authorization page
      const authUrl = xeroService.getAuthorizationUrl();
      window.location.href = authUrl;

      // This won't actually return since we're redirecting
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-xero-integration', user?.id] });
    },
  });

  const disconnectFromXero = useMutation({
    mutationFn: async () => {
      if (!user?.id || !integration?.id) throw new Error('No integration found');

      // Completely remove the integration record when disconnecting
      const { error } = await supabase
        .from('xero_integrations')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-xero-integration', user?.id] });
      // Also clear the local cache to immediately update UI
      queryClient.setQueryData(['user-xero-integration', user?.id], null);
    },
  });

  const syncData = useMutation({
    mutationFn: async () => {
      if (!integration?.id) throw new Error('No integration found');

      // Sync invoices from Xero
      await xeroService.syncInvoicesFromXero();

      // Update last sync time
      const { error } = await supabase
        .from('xero_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-xero-integration', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    integration,
    isLoading,
    isConnected: integration?.connection_status === 'active',
    connectToXero: connectToXero.mutateAsync,
    disconnectFromXero: disconnectFromXero.mutateAsync,
    syncData: syncData.mutateAsync,
  };
};
