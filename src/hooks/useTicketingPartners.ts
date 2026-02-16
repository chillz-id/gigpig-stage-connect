import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TicketingPartner {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  commission_rate: number;
  is_active: boolean;
  is_system: boolean;
  logo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketingPartnerInsert {
  name: string;
  slug: string;
  website_url?: string | null;
  commission_rate: number;
  is_active?: boolean;
  logo_url?: string | null;
  notes?: string | null;
}

export interface TicketingPartnerUpdate {
  name?: string;
  slug?: string;
  website_url?: string | null;
  commission_rate?: number;
  is_active?: boolean;
  logo_url?: string | null;
  notes?: string | null;
}

export const useTicketingPartners = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all partners
  const {
    data: partners = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['ticketing-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticketing_partners')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TicketingPartner[];
    }
  });

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: TicketingPartnerInsert) => {
      const { data, error } = await supabase
        .from('ticketing_partners')
        .insert(partnerData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-partners'] });
      toast({
        title: "Partner Created",
        description: "Ticketing partner has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create partner",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Update partner mutation
  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TicketingPartnerUpdate }) => {
      const { data: result, error } = await supabase
        .from('ticketing_partners')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-partners'] });
      toast({
        title: "Partner Updated",
        description: "Ticketing partner has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update partner",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete partner mutation
  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticketing_partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-partners'] });
      toast({
        title: "Partner Deleted",
        description: "Ticketing partner has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete partner",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Helper to get active partners only
  const activePartners = partners.filter(p => p.is_active);

  return {
    partners,
    activePartners,
    isLoading,
    error,
    createPartner: createPartnerMutation.mutate,
    updatePartner: updatePartnerMutation.mutate,
    deletePartner: deletePartnerMutation.mutate,
    isCreating: createPartnerMutation.isPending,
    isUpdating: updatePartnerMutation.isPending,
    isDeleting: deletePartnerMutation.isPending
  };
};
