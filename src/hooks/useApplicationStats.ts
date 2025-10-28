/**
 * useApplicationStats Hook
 *
 * Fetches and calculates application statistics for an event based on actual applications schema:
 * - Total applications count
 * - Applications by status (pending, confirmed, rejected)
 * - Applications by spot type (mc, feature, headliner, guest)
 *
 * Note: Uses 'applications' table which has spot_type field.
 * Shortlist tracking is handled separately via applicationService.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationData {
  id: string;
  status: string | null;
  spot_type: string | null;
}

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  confirmedApplications: number;
  rejectedApplications: number;
  shortlistedApplications: number; // Fetched from separate query in applicationService
  mcApplications: number;
  featureApplications: number;
  headlinerApplications: number;
  guestApplications: number;
}

export function useApplicationStats(eventId: string) {
  return useQuery<ApplicationStats>({
    queryKey: ['application-stats', eventId],
    queryFn: async () => {
      // Query applications table which has spot_type field
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('id, status, spot_type')
        .eq('event_id', eventId);

      if (appsError) {
        console.error('Failed to fetch application stats:', appsError);
        throw new Error(`Failed to fetch application stats: ${appsError.message}`);
      }

      // Query shortlisted applications via service query pattern
      const { data: shortlistData, error: shortlistError } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('is_shortlisted', true);

      // If is_shortlisted column doesn't exist, default to 0
      const shortlistedApplications = shortlistError ? 0 : (shortlistData || 0);

      const applications = (appsData || []) as ApplicationData[];

      // Calculate statistics
      const totalApplications = applications.length;

      const pendingApplications = applications.filter(
        (app) => app.status === 'pending'
      ).length;

      const confirmedApplications = applications.filter(
        (app) => app.status === 'confirmed' || app.status === 'accepted'
      ).length;

      const rejectedApplications = applications.filter(
        (app) => app.status === 'rejected'
      ).length;

      const mcApplications = applications.filter(
        (app) => app.spot_type === 'mc'
      ).length;

      const featureApplications = applications.filter(
        (app) => app.spot_type === 'feature'
      ).length;

      const headlinerApplications = applications.filter(
        (app) => app.spot_type === 'headliner'
      ).length;

      const guestApplications = applications.filter(
        (app) => app.spot_type === 'guest'
      ).length;

      return {
        totalApplications,
        pendingApplications,
        confirmedApplications,
        rejectedApplications,
        shortlistedApplications,
        mcApplications,
        featureApplications,
        headlinerApplications,
        guestApplications,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
