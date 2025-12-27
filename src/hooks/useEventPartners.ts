/**
 * useEventPartners Hook
 *
 * React Query hook for managing event partners.
 * Partners are users/organizations with configurable permissions on events.
 * Partners can be added manually or auto-synced from deal participants.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getEventPartners,
  getPartner,
  addPartner,
  updatePartnerPermissions,
  removePartner,
  deactivatePartner,
  reactivatePartner,
  isUserEventPartner,
  getPartnerPermissions,
  getUserPartnerEvents,
  searchProfilesToAdd,
  type EventPartner,
  type EventPartnerWithProfile,
  type AddPartnerInput,
  type UpdatePartnerPermissionsInput,
  type PartnerPermissions
} from '@/services/eventPartnerService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const eventPartnersKeys = {
  all: ['event-partners'] as const,
  byEvent: (eventId: string) => [...eventPartnersKeys.all, 'event', eventId] as const,
  detail: (partnerId: string) => [...eventPartnersKeys.all, 'detail', partnerId] as const,
  permissions: (eventId: string, userId: string) => [...eventPartnersKeys.all, 'permissions', eventId, userId] as const,
  userPartnerEvents: (userId: string) => [...eventPartnersKeys.all, 'user-events', userId] as const,
  search: (eventId: string, query: string) => [...eventPartnersKeys.all, 'search', eventId, query] as const
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all partners for an event
 */
export function useEventPartners(eventId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: eventPartnersKeys.byEvent(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return getEventPartners(eventId);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false; // Don't retry on not found
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading partners',
          description: 'Failed to load event partners. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch a single partner by ID
 */
export function useEventPartner(partnerId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: eventPartnersKeys.detail(partnerId || ''),
    queryFn: async () => {
      if (!partnerId) throw new Error('Partner ID is required');
      return getPartner(partnerId);
    },
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading partner',
          description: 'Failed to load partner details. Please try again.'
        });
      }
    }
  });
}

/**
 * Check if current user is a partner on an event
 */
export function useIsUserEventPartner(eventId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: eventPartnersKeys.permissions(eventId || '', userId || ''),
    queryFn: async () => {
      if (!eventId || !userId) return false;
      return isUserEventPartner(eventId, userId);
    },
    enabled: !!eventId && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

/**
 * Get partner permissions for a user on an event
 */
export function usePartnerPermissions(eventId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: [...eventPartnersKeys.permissions(eventId || '', userId || ''), 'full'] as const,
    queryFn: async () => {
      if (!eventId || !userId) return null;
      return getPartnerPermissions(eventId, userId);
    },
    enabled: !!eventId && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

/**
 * Get all events where the current user is a partner
 */
export function useUserPartnerEvents(userId: string | undefined) {
  return useQuery({
    queryKey: eventPartnersKeys.userPartnerEvents(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      return getUserPartnerEvents(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

/**
 * Search for profiles to add as partners
 */
export function useSearchPartnersToAdd(eventId: string | undefined, query: string) {
  return useQuery({
    queryKey: eventPartnersKeys.search(eventId || '', query),
    queryFn: async () => {
      if (!eventId || !query || query.length < 2) return [];
      return searchProfilesToAdd(query, eventId);
    },
    enabled: !!eventId && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds (search results should be fresh)
    gcTime: 2 * 60 * 1000
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add a new partner to an event
 */
export function useAddPartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: AddPartnerInput) => addPartner(input),
    onSuccess: (data) => {
      // Invalidate partners list for the event
      queryClient.invalidateQueries({
        queryKey: eventPartnersKeys.byEvent(data.event_id)
      });
      toast({
        title: 'Partner added',
        description: data.status === 'pending_invite'
          ? 'Partner invitation has been sent.'
          : 'Partner has been added successfully.'
      });
    },
    onError: (error: any) => {
      // Check for unique constraint violation
      if (error?.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Partner already exists',
          description: 'This user is already a partner on this event.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error adding partner',
          description: error.message || 'Failed to add partner. Please try again.'
        });
      }
    },
    retry: 1
  });
}

/**
 * Update partner permissions
 */
export function useUpdatePartnerPermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdatePartnerPermissionsInput) => updatePartnerPermissions(input),
    onMutate: async ({ partner_id }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: eventPartnersKeys.detail(partner_id) });

      // Snapshot previous value
      const previousPartner = queryClient.getQueryData<EventPartnerWithProfile>(
        eventPartnersKeys.detail(partner_id)
      );

      return { previousPartner };
    },
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(eventPartnersKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventPartnersKeys.byEvent(data.event_id)
      });
      toast({
        title: 'Permissions updated',
        description: 'Partner permissions have been updated successfully.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPartner) {
        queryClient.setQueryData(
          eventPartnersKeys.detail(variables.partner_id),
          context.previousPartner
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error updating permissions',
        description: error.message || 'Failed to update permissions. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Remove a partner from an event (hard delete)
 */
export function useRemovePartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ partnerId, eventId }: { partnerId: string; eventId: string }) =>
      removePartner(partnerId).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate partners list
      queryClient.invalidateQueries({
        queryKey: eventPartnersKeys.byEvent(eventId)
      });
      toast({
        title: 'Partner removed',
        description: 'Partner has been removed from this event.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error removing partner',
        description: error.message || 'Failed to remove partner. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Deactivate a partner (soft delete)
 */
export function useDeactivatePartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ partnerId, eventId }: { partnerId: string; eventId: string }) =>
      deactivatePartner(partnerId).then((data) => ({ ...data, eventId })),
    onSuccess: ({ eventId, ...data }) => {
      // Update detail cache
      queryClient.setQueryData(eventPartnersKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventPartnersKeys.byEvent(eventId)
      });
      toast({
        title: 'Partner deactivated',
        description: 'Partner access has been deactivated.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error deactivating partner',
        description: error.message || 'Failed to deactivate partner. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Reactivate an inactive partner
 */
export function useReactivatePartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ partnerId, eventId }: { partnerId: string; eventId: string }) =>
      reactivatePartner(partnerId).then((data) => ({ ...data, eventId })),
    onSuccess: ({ eventId, ...data }) => {
      // Update detail cache
      queryClient.setQueryData(eventPartnersKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventPartnersKeys.byEvent(eventId)
      });
      toast({
        title: 'Partner reactivated',
        description: 'Partner access has been restored.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error reactivating partner',
        description: error.message || 'Failed to reactivate partner. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export type {
  EventPartner,
  EventPartnerWithProfile,
  AddPartnerInput,
  UpdatePartnerPermissionsInput,
  PartnerPermissions
};
