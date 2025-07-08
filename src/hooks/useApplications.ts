import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Application {
  id: string;
  event_id: string;
  comedian_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  show_type?: string;
  created_at: string;
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

  // Fetch applications for promoter's events
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get all events for this promoter
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .or(`stage_manager_id.eq.${user.id},co_promoter_ids.cs.{${user.id}}`);

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) return [];

      // Then get all applications for those events
      const eventIds = events.map(e => e.id);
      const { data, error } = await supabase
        .from('event_applications')
        .select(`
          id,
          event_id,
          comedian_id,
          status,
          message,
          show_type,
          created_at,
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to match our interface
      return (data || []).map(app => ({
        id: app.id,
        event_id: app.event_id,
        comedian_id: app.comedian_id,
        status: app.status,
        message: app.message,
        show_type: app.show_type,
        created_at: app.created_at,
        event: app.events,
        comedian: app.profiles
      })) as Application[];
    },
    enabled: !!user
  });

  // Update application status
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('event_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      const application = applications.find(app => app.id === variables.applicationId);
      const action = variables.status === 'accepted' ? 'approved' : 'declined';
      
      toast({
        title: `Application ${action}`,
        description: `${application?.comedian?.name || 'Comedian'}'s application has been ${action}.`,
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
    mutationFn: async ({ applicationIds, status }: { applicationIds: string[]; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('event_applications')
        .update({ status })
        .in('id', applicationIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      const action = variables.status === 'accepted' ? 'approved' : 'declined';
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