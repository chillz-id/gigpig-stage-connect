import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApplicationDetails {
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
  event: {
    id: string;
    title: string;
    venue: string;
    venue_address?: string;
    event_date: string;
    event_time?: string;
    city: string;
    state: string;
    description?: string;
    requirements?: string;
    total_spots?: number;
    available_spots?: number;
  };
  comedian: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    bio?: string;
    years_experience?: number;
    performance_count?: number;
    rating?: number;
  };
}

export const useApplicationDetails = (applicationId: string | undefined) => {
  return useQuery({
    queryKey: ['application-details', applicationId],
    queryFn: async (): Promise<ApplicationDetails | null> => {
      if (!applicationId) return null;

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
            venue_address,
            event_date,
            event_time,
            city,
            state,
            description,
            requirements,
            total_spots,
            available_spots
          ),
          profiles!comedian_id (
            id,
            name,
            email,
            avatar_url,
            bio,
            years_experience,
            performance_count,
            rating
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error) {
        console.error('Error fetching application details:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        event_id: data.event_id,
        comedian_id: data.comedian_id,
        status: data.status,
        message: data.message,
        spot_type: data.spot_type,
        availability_confirmed: data.availability_confirmed,
        requirements_acknowledged: data.requirements_acknowledged,
        applied_at: data.applied_at,
        responded_at: data.responded_at,
        event: data.events,
        comedian: data.profiles
      } as ApplicationDetails;
    },
    enabled: !!applicationId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });
};