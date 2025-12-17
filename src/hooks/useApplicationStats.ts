/**
 * useApplicationStats Hook
 *
 * Fetches and calculates application statistics for an event based on actual applications schema:
 * - Total applications count
 * - Applications by status (pending, confirmed, rejected)
 * - Applications by spot type (mc, feature, headliner, guest)
 * - Shortlisted applications count
 *
 * Note: Uses 'applications' table which has spot_type field.
 * Now also matches availability-based applications via session_source_id.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationData {
  id: string;
  status: string | null;
  spot_type: string | null;
  is_shortlisted: boolean | null;
}

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  confirmedApplications: number;
  rejectedApplications: number;
  shortlistedApplications: number;
  mcApplications: number;
  featureApplications: number;
  headlinerApplications: number;
  guestApplications: number;
}

export function useApplicationStats(eventId: string) {
  return useQuery<ApplicationStats>({
    queryKey: ['application-stats', eventId],
    queryFn: async () => {
      // First, get the event's humanitix_event_id for matching availability-based applications
      const { data: eventData } = await supabase
        .from('events')
        .select('humanitix_event_id')
        .eq('id', eventId)
        .single();

      // Build OR filter: match by event_id OR by session_source_id
      let orFilter = `event_id.eq.${eventId}`;
      if (eventData?.humanitix_event_id) {
        orFilter += `,session_source_id.eq.${eventData.humanitix_event_id}`;
      }

      // Query applications table which has spot_type field
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('id, status, spot_type, is_shortlisted')
        .or(orFilter);

      if (appsError) {
        console.error('Failed to fetch application stats:', appsError);
        throw new Error(`Failed to fetch application stats: ${appsError.message}`);
      }

      // Count shortlisted (only pending - confirmed ones shouldn't count as "shortlisted")
      const shortlistedApplications = (appsData || []).filter(
        app => app.is_shortlisted && app.status === 'pending'
      ).length;

      const applications = (appsData || []) as ApplicationData[];

      // Calculate statistics
      const totalApplications = applications.length;

      const pendingApplications = applications.filter(
        (app) => app.status === 'pending'
      ).length;

      const confirmedApplications = applications.filter(
        (app) => app.status === 'accepted'
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
