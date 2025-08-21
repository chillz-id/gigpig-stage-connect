import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSpotAssignment } from '@/hooks/useSpotAssignment';
import { notificationService } from '@/services/notificationService';

export interface Application {
  id: string;
  event_id: string;
  comedian_id: string;
  status: string | null;
  message?: string | null;
  spot_type?: string | null;
  availability_confirmed?: boolean | null;
  requirements_acknowledged?: boolean | null;
  applied_at: string | null;
  responded_at?: string | null;
  event?: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    city: string;
    state: string;
  };
  comedian?: {
    id: string;
    name: string;
    avatar_url?: string;
    bio?: string;
    years_experience?: number;
  };
}

export const useApplications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { assignSpotAsync } = useSpotAssignment();

  // Fetch applications for promoter's events
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get all events for this promoter
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .or(`promoter_id.eq.${user.id},co_promoter_ids.cs.{${user.id}}`);

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) return [];

      // Then get all applications for those events
      const eventIds = events.map(e => e.id);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          event_id,
          comedian_id,
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
            event_date,
            city,
            state
          ),
          profiles!comedian_id (
            id,
            name,
            avatar_url,
            bio,
            years_experience,
            profile_slug
          )
        `)
        .in('event_id', eventIds)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Map the data to match our interface
      return (data || []).map(app => ({
        id: app.id,
        event_id: app.event_id,
        comedian_id: app.comedian_id,
        status: app.status,
        message: app.message,
        spot_type: app.spot_type,
        availability_confirmed: app.availability_confirmed,
        requirements_acknowledged: app.requirements_acknowledged,
        applied_at: app.applied_at,
        responded_at: app.responded_at,
        event: app.events,
        comedian: app.profiles
      })) as Application[];
    },
    enabled: !!user
  });

  // Update application status
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Start transaction for application approval
      if (status === 'accepted') {
        try {
          // First, try to assign a spot to the comedian
          await assignSpotAsync({
            eventId: application.event_id,
            comedianId: application.comedian_id,
            spotType: application.spot_type || 'Feature',
            confirmationDeadlineHours: 48
          });

          // If spot assignment succeeds, update application status
          const { error } = await supabase
            .from('applications')
            .update({ 
              status: 'accepted',
              responded_at: new Date().toISOString()
            })
            .eq('id', applicationId);

          if (error) throw error;

          // Send notification for accepted application
          try {
            await notificationService.notifyApplicationAccepted(
              application.comedian_id,
              application.event_id,
              application.event?.title || 'Event',
              application.event?.event_date || new Date().toISOString(),
              application.spot_type || 'Feature'
            );
          } catch (notificationError) {
            console.error('Failed to send acceptance notification:', notificationError);
          }
        } catch (spotError: any) {
          // If spot assignment fails, don't update application status
          throw new Error(`Cannot approve application: ${spotError.message}`);
        }
      } else {
        // For rejections, just update the application status
        const { error } = await supabase
          .from('applications')
          .update({ 
            status,
            responded_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (error) throw error;

        // Send notification for rejected application
        if (status === 'rejected') {
          try {
            await notificationService.notifyApplicationRejected(
              application.comedian_id,
              application.event_id,
              application.event?.title || 'Event',
              application.event?.event_date || new Date().toISOString()
            );
          } catch (notificationError) {
            console.error('Failed to send rejection notification:', notificationError);
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      const application = applications.find(app => app.id === variables.applicationId);
      const action = variables.status === 'accepted' ? 'approved' : 'rejected';
      
      toast({
        title: `Application ${action}`,
        description: variables.status === 'accepted' 
          ? `${application?.comedian?.name || 'Comedian'}'s application has been approved and spot assigned.`
          : `${application?.comedian?.name || 'Comedian'}'s application has been ${action}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating application",
        description: error.message || "Failed to update application status",
        variant: "destructive"
      });
    }
  });

  // Bulk update applications
  const bulkUpdateApplicationsMutation = useMutation({
    mutationFn: async ({ applicationIds, status }: { applicationIds: string[]; status: string }) => {
      if (status === 'accepted') {
        // For bulk approvals, we need to handle each application individually
        const applicationsToProcess = applications.filter(app => 
          applicationIds.includes(app.id)
        );

        const results = await Promise.allSettled(
          applicationsToProcess.map(async (application) => {
            try {
              // Try to assign a spot to the comedian
              await assignSpotAsync({
                eventId: application.event_id,
                comedianId: application.comedian_id,
                spotType: application.spot_type || 'Feature',
                confirmationDeadlineHours: 48
              });

              // If spot assignment succeeds, update application status
              const { error } = await supabase
                .from('applications')
                .update({ 
                  status: 'accepted',
                  responded_at: new Date().toISOString()
                })
                .eq('id', application.id);

              if (error) throw error;
              return { success: true, applicationId: application.id };
            } catch (error) {
              console.error(`Failed to approve application ${application.id}:`, error);
              return { 
                success: false, 
                applicationId: application.id, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              };
            }
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        if (failed > 0) {
          const failedResults = results
            .filter(r => r.status === 'fulfilled' && !r.value.success)
            .map(r => r.status === 'fulfilled' ? r.value : null)
            .filter(Boolean);
          
          throw new Error(`${successful} applications approved, ${failed} failed due to spot availability`);
        }
      } else {
        // For bulk rejections, use the original logic
        const { error } = await supabase
          .from('applications')
          .update({ 
            status,
            responded_at: new Date().toISOString()
          })
          .in('id', applicationIds);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      const action = variables.status === 'accepted' ? 'approved' : 'rejected';
      toast({
        title: `Applications ${action}`,
        description: `${variables.applicationIds.length} applications have been ${action}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating applications",
        description: error.message || "Failed to update applications",
        variant: "destructive"
      });
    }
  });

  return {
    applications,
    isLoading,
    error,
    updateApplication: updateApplicationMutation.mutate,
    bulkUpdateApplications: bulkUpdateApplicationsMutation.mutate,
    isUpdating: updateApplicationMutation.isPending || bulkUpdateApplicationsMutation.isPending
  };
};