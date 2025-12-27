import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manualGigsService, type ManualGig } from '@/services/gigs/manual-gigs-service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useMyGigs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch manual gigs
  const { data: manualGigs, isLoading } = useQuery({
    queryKey: ['manual-gigs', user?.id],
    queryFn: () => manualGigsService.getUserManualGigs(user!.id),
    enabled: !!user?.id,
  });

  // Create mutation
  const createGigMutation = useMutation({
    mutationFn: (gig: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('🎭 [useMyGigs] Mutation triggered with:', gig);
      return manualGigsService.createManualGig(gig);
    },
    onSuccess: (data) => {
      console.log('✅ [useMyGigs] Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
      toast({
        title: 'Success',
        description: 'Gig added successfully'
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useMyGigs] Mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add gig',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateGigMutation = useMutation({
    mutationFn: ({ gigId, updates }: { gigId: string; updates: Partial<ManualGig> }) =>
      manualGigsService.updateManualGig(gigId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
      queryClient.invalidateQueries({ queryKey: ['comedian-gigs'] });
      toast({
        title: 'Success',
        description: 'Gig updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update gig',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteGigMutation = useMutation({
    mutationFn: (gigId: string) => manualGigsService.deleteManualGig(gigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
      queryClient.invalidateQueries({ queryKey: ['comedian-gigs'] });
      toast({
        title: 'Success',
        description: 'Gig deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete gig',
        variant: 'destructive',
      });
    },
  });

  // Create recurring gig mutation
  const createRecurringGigMutation = useMutation({
    mutationFn: (gig: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('🔄 [useMyGigs] Creating recurring gig:', gig);
      return manualGigsService.createRecurringGig(gig);
    },
    onSuccess: (result) => {
      console.log(`✅ [useMyGigs] Created recurring gig with ${result.count} instances`);
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
      toast({
        title: 'Success',
        description: `Recurring gig created with ${result.count} instances`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useMyGigs] Recurring gig creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create recurring gig',
        variant: 'destructive',
      });
    },
  });

  // Delete recurring gig mutation
  const deleteRecurringGigMutation = useMutation({
    mutationFn: ({ gigId, deleteFutureInstances = true }: { gigId: string; deleteFutureInstances?: boolean }) =>
      manualGigsService.deleteRecurringGig(gigId, deleteFutureInstances),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
      toast({
        title: 'Success',
        description: 'Recurring gig deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete recurring gig',
        variant: 'destructive',
      });
    },
  });

  return {
    manualGigs: manualGigs || [],
    isLoading,
    createGig: createGigMutation.mutate,
    updateGig: updateGigMutation.mutate,
    deleteGig: deleteGigMutation.mutate,
    createRecurringGig: createRecurringGigMutation.mutate,
    deleteRecurringGig: deleteRecurringGigMutation.mutate,
    isCreating: createGigMutation.isPending,
    isUpdating: updateGigMutation.isPending,
    isDeleting: deleteGigMutation.isPending,
    isCreatingRecurring: createRecurringGigMutation.isPending,
    isDeletingRecurring: deleteRecurringGigMutation.isPending,
  };
}
