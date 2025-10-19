import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';

export interface ComedianApplication {
  id: string;
  event_id: string;
  status: string | null;
  message?: string | null;
  spot_type?: string | null;
  availability_confirmed?: boolean | null;
  requirements_acknowledged?: boolean | null;
  applied_at: string | null;
  responded_at?: string | null;
  event: {
    id: string;
    title: string;
    venue: string;
    address?: string;
    event_date: string;
    start_time?: string;
    city: string;
    state: string;
    status: string;
    banner_url?: string;
    promoter?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  };
}

export const useComedianApplications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch comedian's applications
  const {
    data: applications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['comedian-applications', user?.id],
    queryFn: async (): Promise<ComedianApplication[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          event_id,
          status,
          message,
          spot_type,
          availability_confirmed,
          requirements_acknowledged,
          applied_at,
          responded_at,
          events!inner (
            id,
            title,
            venue,
            address,
            event_date,
            start_time,
            city,
            state,
            status,
            banner_url,
            promoter_id
          )
        `)
        .eq('comedian_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      return (data || []).map(app => ({
        id: app.id,
        event_id: app.event_id,
        status: app.status,
        message: app.message,
        spot_type: app.spot_type,
        availability_confirmed: app.availability_confirmed,
        requirements_acknowledged: app.requirements_acknowledged,
        applied_at: app.applied_at,
        responded_at: app.responded_at,
        event: {
          ...app.events,
          promoter: undefined // Promoter data not available without FK
        }
      })) as ComedianApplication[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches platform standard)
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Withdraw application
  const withdrawApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'withdrawn',
          responded_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('comedian_id', user?.id);

      if (error) throw error;
    },
    onSuccess: async (_, applicationId) => {
      // Get application details for notification
      try {
        const application = applications.find(app => app.id === applicationId);
        if (application) {
          const { data: comedianData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user?.id)
            .single();

          if (comedianData) {
            await notificationService.notifyApplicationWithdrawn(
              application.event.promoter?.id || '',
              application.event_id,
              application.event.title,
              comedianData.name
            );
          }
        }
      } catch (error) {
        console.error('Failed to send withdrawal notification:', error);
      }

      queryClient.invalidateQueries({ queryKey: ['comedian-applications'] });
      queryClient.invalidateQueries({ queryKey: ['event-applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      
      toast({
        title: "Application withdrawn",
        description: "Your application has been withdrawn successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to withdraw application",
        description: error.message || "An error occurred while withdrawing your application",
        variant: "destructive"
      });
    }
  });

  // Update application
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ 
      applicationId, 
      updates 
    }: { 
      applicationId: string; 
      updates: {
        message?: string;
        spot_type?: string;
        availability_confirmed?: boolean;
        requirements_acknowledged?: boolean;
      }
    }) => {
      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', applicationId)
        .eq('comedian_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-details'] });
      
      toast({
        title: "Application updated",
        description: "Your application has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update application",
        description: error.message || "An error occurred while updating your application",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getPendingApplications = () => 
    applications.filter(app => app.status === 'pending');

  const getAcceptedApplications = () => 
    applications.filter(app => app.status === 'accepted');

  const getRejectedApplications = () => 
    applications.filter(app => app.status === 'rejected' || app.status === 'declined');

  const getUpcomingGigs = () => 
    applications.filter(app => 
      app.status === 'accepted' && 
      new Date(app.event.event_date) >= new Date()
    );

  const hasAppliedToEvent = (eventId: string) =>
    applications.some(app => app.event_id === eventId);

  return {
    applications,
    isLoading,
    error,
    withdrawApplication: withdrawApplicationMutation.mutate,
    updateApplication: updateApplicationMutation.mutate,
    isWithdrawing: withdrawApplicationMutation.isPending,
    isUpdating: updateApplicationMutation.isPending,
    // Helper functions
    getPendingApplications,
    getAcceptedApplications,
    getRejectedApplications,
    getUpcomingGigs,
    hasAppliedToEvent
  };
};