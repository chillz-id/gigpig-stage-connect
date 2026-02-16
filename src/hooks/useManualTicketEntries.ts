import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TicketingPartner } from './useTicketingPartners';

export interface ManualTicketEntry {
  id: string;
  event_id: string;
  partner_id: string;
  ticket_count: number;
  gross_revenue: number;
  commission_rate: number;
  commission_amount: number;
  net_revenue: number;
  entry_date: string;
  notes: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  partner?: TicketingPartner;
}

export interface ManualTicketEntryInsert {
  event_id: string;
  partner_id: string;
  ticket_count: number;
  gross_revenue: number;
  commission_rate: number;
  entry_date?: string;
  notes?: string | null;
  reference_id?: string | null;
}

export interface ManualTicketEntryUpdate {
  ticket_count?: number;
  gross_revenue?: number;
  commission_rate?: number;
  entry_date?: string;
  notes?: string | null;
  reference_id?: string | null;
}

export const useManualTicketEntries = (eventId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch entries for an event
  const {
    data: entries = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['manual-ticket-entries', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_ticket_entries')
        .select(`
          *,
          partner:ticketing_partners(*)
        `)
        .eq('event_id', eventId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data as ManualTicketEntry[];
    },
    enabled: !!eventId
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: ManualTicketEntryInsert) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('manual_ticket_entries')
        .insert({
          ...entryData,
          created_by: user?.id || null
        })
        .select(`
          *,
          partner:ticketing_partners(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-ticket-entries', eventId] });
      toast({
        title: "Entry Created",
        description: "Manual ticket entry has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ManualTicketEntryUpdate }) => {
      const { data: result, error } = await supabase
        .from('manual_ticket_entries')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          partner:ticketing_partners(*)
        `)
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-ticket-entries', eventId] });
      toast({
        title: "Entry Updated",
        description: "Manual ticket entry has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('manual_ticket_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-ticket-entries', eventId] });
      toast({
        title: "Entry Deleted",
        description: "Manual ticket entry has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Calculate totals
  const totals = entries.reduce(
    (acc, entry) => ({
      ticketCount: acc.ticketCount + entry.ticket_count,
      grossRevenue: acc.grossRevenue + Number(entry.gross_revenue),
      commissionAmount: acc.commissionAmount + Number(entry.commission_amount),
      netRevenue: acc.netRevenue + Number(entry.net_revenue)
    }),
    { ticketCount: 0, grossRevenue: 0, commissionAmount: 0, netRevenue: 0 }
  );

  // Group by partner for breakdown
  const breakdownByPartner = entries.reduce((acc, entry) => {
    const partnerId = entry.partner_id;
    const partnerName = entry.partner?.name || 'Unknown';

    if (!acc[partnerId]) {
      acc[partnerId] = {
        partnerId,
        partnerName,
        ticketCount: 0,
        grossRevenue: 0,
        commissionAmount: 0,
        netRevenue: 0
      };
    }

    acc[partnerId].ticketCount += entry.ticket_count;
    acc[partnerId].grossRevenue += Number(entry.gross_revenue);
    acc[partnerId].commissionAmount += Number(entry.commission_amount);
    acc[partnerId].netRevenue += Number(entry.net_revenue);

    return acc;
  }, {} as Record<string, {
    partnerId: string;
    partnerName: string;
    ticketCount: number;
    grossRevenue: number;
    commissionAmount: number;
    netRevenue: number;
  }>);

  return {
    entries,
    isLoading,
    error,
    totals,
    breakdownByPartner: Object.values(breakdownByPartner),
    createEntry: createEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    isCreating: createEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending
  };
};
