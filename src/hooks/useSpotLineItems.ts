/**
 * Hook for managing spot line items (Fee, Travel, Merch, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SpotLineItem, SpotLineItemInsert, SpotLineItemUpdate, GstType } from '@/types/spot';
import { GST_RATE } from '@/types/spot';

/**
 * Hook for fetching and managing line items for a specific spot
 * @param spotId - The spot ID to fetch line items for
 * @param eventId - Optional event ID for invalidating lineup stats
 */
export function useSpotLineItems(spotId: string | null, eventId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to invalidate related queries
  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['spot-line-items', spotId] });
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
    }
    // Also invalidate batch queries
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'spot-line-items-batch',
    });
  };

  // Fetch line items for a spot
  const {
    data: lineItems = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['spot-line-items', spotId],
    queryFn: async () => {
      if (!spotId) return [];
      const { data, error } = await supabase
        .from('event_spot_line_items')
        .select('*')
        .eq('event_spot_id', spotId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as SpotLineItem[];
    },
    enabled: !!spotId,
  });

  // Computed totals with GST breakdown
  const totals = useMemo(() => {
    if (!lineItems || lineItems.length === 0) {
      return {
        subtotal: 0,
        gstAmount: 0,
        grandTotal: 0,
        hasLineItems: false,
        hasGstItems: false,
      };
    }

    let subtotal = 0;
    let gstAmount = 0;

    for (const item of lineItems) {
      const amount = Number(item.amount);

      if (item.gst_type === 'excluded') {
        // No GST - just add the amount
        subtotal += amount;
      } else if (item.gst_type === 'included') {
        // GST is included in the amount - extract it
        // Amount = base + GST, so base = amount / 1.1, GST = amount - base
        const base = amount / (1 + GST_RATE);
        const gst = amount - base;
        subtotal += amount; // Total is the full amount (GST included)
        gstAmount += gst;   // Track GST portion for display
      } else if (item.gst_type === 'addition') {
        // GST is added on top - amount is the base, GST = amount * 0.1
        const gst = amount * GST_RATE;
        subtotal += amount + gst; // Total includes the added GST
        gstAmount += gst;
      }
    }

    return {
      subtotal,
      gstAmount,
      grandTotal: subtotal,
      hasLineItems: true,
      hasGstItems: lineItems.some(i => i.gst_type !== 'excluded'),
    };
  }, [lineItems]);

  // Add line item mutation
  const addLineItem = useMutation({
    mutationFn: async (item: Omit<SpotLineItemInsert, 'event_spot_id'>) => {
      if (!spotId) throw new Error('No spot ID provided');

      // Get next display order
      const maxOrder = lineItems.length > 0
        ? Math.max(...lineItems.map((i) => i.display_order))
        : 0;

      const { data, error } = await supabase
        .from('event_spot_line_items')
        .insert({
          ...item,
          event_spot_id: spotId,
          display_order: item.display_order ?? maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SpotLineItem;
    },
    onSuccess: () => {
      invalidateRelatedQueries();
      toast({
        title: 'Line item added',
        description: 'Payment item has been added to the spot',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add line item',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update line item mutation
  const updateLineItem = useMutation({
    mutationFn: async ({ id, ...updates }: SpotLineItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('event_spot_line_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SpotLineItem;
    },
    onSuccess: () => {
      invalidateRelatedQueries();
      toast({
        title: 'Line item updated',
        description: 'Payment item has been updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update line item',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Delete line item mutation
  const deleteLineItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_spot_line_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateRelatedQueries();
      toast({
        title: 'Line item deleted',
        description: 'Payment item has been removed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete line item',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  return {
    lineItems,
    isLoading,
    refetch,
    totals,
    addLineItem: addLineItem.mutate,
    addLineItemAsync: addLineItem.mutateAsync,
    updateLineItem: updateLineItem.mutate,
    updateLineItemAsync: updateLineItem.mutateAsync,
    deleteLineItem: deleteLineItem.mutate,
    deleteLineItemAsync: deleteLineItem.mutateAsync,
    isAdding: addLineItem.isPending,
    isUpdating: updateLineItem.isPending,
    isDeleting: deleteLineItem.isPending,
  };
}

/**
 * Hook for fetching line items for multiple spots at once
 * Useful for timeline display where we need all spots' line items
 */
export function useAllSpotLineItems(spotIds: string[]) {
  return useQuery({
    queryKey: ['spot-line-items-batch', spotIds.sort().join(',')],
    queryFn: async () => {
      if (!spotIds.length) return {};

      const { data, error } = await supabase
        .from('event_spot_line_items')
        .select('*')
        .in('event_spot_id', spotIds)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Group by spot ID
      const grouped: Record<string, SpotLineItem[]> = {};
      for (const item of (data as SpotLineItem[]) || []) {
        if (!grouped[item.event_spot_id]) {
          grouped[item.event_spot_id] = [];
        }
        grouped[item.event_spot_id].push(item);
      }

      return grouped;
    },
    enabled: spotIds.length > 0,
  });
}

/**
 * Quick add line item for a spot (used for inline adding)
 */
export function useAddSpotLineItem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: SpotLineItemInsert) => {
      const { data, error } = await supabase
        .from('event_spot_line_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as SpotLineItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['spot-line-items', variables.event_spot_id],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'spot-line-items-batch',
      });
      toast({
        title: 'Payment item added',
        description: 'Line item has been added',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add payment item',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}
