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
    mutationFn: (gig: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>) =>
      manualGigsService.createManualGig(gig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
      toast({
        title: 'Success',
        description: 'Gig added successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add gig',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteGigMutation = useMutation({
    mutationFn: (gigId: string) => manualGigsService.deleteManualGig(gigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-gigs'] });
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

  return {
    manualGigs: manualGigs || [],
    isLoading,
    createGig: createGigMutation.mutate,
    deleteGig: deleteGigMutation.mutate,
    isCreating: createGigMutation.isPending,
    isDeleting: deleteGigMutation.isPending,
  };
}
