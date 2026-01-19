import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
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

interface OrgXeroIntegration {
  id: string;
  organization_id: string;
  connection_status: string;
  created_at: string;
  last_sync_at: string | null;
  tenant_id: string;
  tenant_name?: string;
  settings?: Partial<XeroSettings>;
}

export const useOrgXeroIntegration = () => {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ['org-xero-integration', organization?.id],
    queryFn: async (): Promise<OrgXeroIntegration | null> => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from('xero_integrations')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const connectToXero = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization selected');

      // Store org ID in session for the callback to use
      sessionStorage.setItem('xero_oauth_org_id', organization.id);

      // Redirect to Xero OAuth authorization page
      const authUrl = xeroService.getAuthorizationUrl();
      window.location.href = authUrl;

      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-xero-integration', organization?.id] });
    },
  });

  const disconnectFromXero = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !integration?.id) throw new Error('No integration found');

      const { error } = await supabase
        .from('xero_integrations')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-xero-integration', organization?.id] });
      queryClient.setQueryData(['org-xero-integration', organization?.id], null);
    },
  });

  const syncData = useMutation({
    mutationFn: async () => {
      if (!integration?.id) throw new Error('No integration found');

      // Sync invoices from Xero for this org
      await xeroService.syncInvoicesFromXero();

      const { error } = await supabase
        .from('xero_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-xero-integration', organization?.id] });
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
