
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface XeroIntegration {
  id: string;
  connection_status: string;
  created_at: string;
  last_sync_at: string | null;
  tenant_id: string;
}

interface XeroInvoice {
  id: string;
  xero_invoice_number: string | null;
  total_amount: number;
  invoice_status: string;
  sync_status: string;
}

interface XeroBill {
  id: string;
  xero_bill_number: string | null;
  total_amount: number;
  bill_status: string;
  sync_status: string;
}

export const useXeroIntegration = () => {
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ['xero-integration'],
    queryFn: async (): Promise<XeroIntegration | null> => {
      const { data, error } = await supabase
        .from('xero_integrations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['xero-invoices'],
    queryFn: async (): Promise<XeroInvoice[]> => {
      const { data, error } = await supabase
        .from('xero_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: integration?.connection_status === 'active',
  });

  const { data: bills } = useQuery({
    queryKey: ['xero-bills'],
    queryFn: async (): Promise<XeroBill[]> => {
      const { data, error } = await supabase
        .from('xero_bills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: integration?.connection_status === 'active',
  });

  const connectToXero = useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // This would typically redirect to XERO OAuth flow
      // For now, we'll simulate a successful connection
      const { data, error } = await supabase
        .from('xero_integrations')
        .insert({
          user_id: user.id,
          tenant_id: 'demo-tenant-' + Date.now(),
          connection_status: 'active',
          access_token: 'demo-token',
          refresh_token: 'demo-refresh-token'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xero-integration'] });
    },
  });

  const syncData = useMutation({
    mutationFn: async () => {
      // Update last sync time
      const { error } = await supabase
        .from('xero_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration?.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xero-integration'] });
      queryClient.invalidateQueries({ queryKey: ['xero-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['xero-bills'] });
    },
  });

  return {
    integration,
    invoices,
    bills,
    isLoading,
    connectToXero: connectToXero.mutateAsync,
    syncData: syncData.mutateAsync,
  };
};
