import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Organization statistics from get_organization_stats() RPC function
 */
export interface OrganizationStats {
  total_events: number;
  upcoming_events: number;
  total_tasks: number;
  pending_tasks: number;
  team_members: number;
  total_media: number;
  vouches_received: number;
}

/**
 * Hook to fetch organization statistics
 *
 * Calls the get_organization_stats(org_id) database function to retrieve
 * aggregated statistics for the current organization including events,
 * tasks, team members, media, and vouches.
 *
 * @example
 * ```tsx
 * function OrganizationDashboard() {
 *   const { data: stats, isLoading } = useOrganizationStats();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       <StatCard label="Total Events" value={stats?.total_events} />
 *       <StatCard label="Upcoming Events" value={stats?.upcoming_events} />
 *       <StatCard label="Pending Tasks" value={stats?.pending_tasks} />
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationStats = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-stats', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .rpc('get_organization_stats', { org_id: orgId });

      if (error) {
        console.error('Error fetching organization stats:', error);
        throw error;
      }

      return data as OrganizationStats;
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes - stats don't change frequently
  });
};

/**
 * Hook to fetch organization event analytics
 *
 * Returns aggregated event data including total events, upcoming events,
 * past events, and events by status/visibility.
 *
 * @example
 * ```tsx
 * function EventsAnalytics() {
 *   const { data: analytics } = useOrganizationEventAnalytics();
 *
 *   return (
 *     <div>
 *       <h3>Event Analytics</h3>
 *       <p>Total: {analytics?.total}</p>
 *       <p>Upcoming: {analytics?.upcoming}</p>
 *       <p>Draft: {analytics?.draft}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationEventAnalytics = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-event-analytics', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const now = new Date().toISOString();

      // Fetch event counts in parallel
      const [totalResult, upcomingResult, pastResult, publishedResult, draftResult] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).gte('event_date', now),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).lt('event_date', now),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'published'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'draft'),
      ]);

      if (totalResult.error) throw totalResult.error;
      if (upcomingResult.error) throw upcomingResult.error;
      if (pastResult.error) throw pastResult.error;
      if (publishedResult.error) throw publishedResult.error;
      if (draftResult.error) throw draftResult.error;

      return {
        total: totalResult.count ?? 0,
        upcoming: upcomingResult.count ?? 0,
        past: pastResult.count ?? 0,
        published: publishedResult.count ?? 0,
        draft: draftResult.count ?? 0,
      };
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to fetch organization task analytics
 *
 * Returns task counts by status and priority for the organization.
 *
 * @example
 * ```tsx
 * function TasksAnalytics() {
 *   const { data: analytics } = useOrganizationTaskAnalytics();
 *
 *   return (
 *     <div>
 *       <h3>Task Analytics</h3>
 *       <p>To Do: {analytics?.todo}</p>
 *       <p>In Progress: {analytics?.in_progress}</p>
 *       <p>Completed: {analytics?.completed}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationTaskAnalytics = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-task-analytics', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Fetch task counts by status in parallel
      const [totalResult, todoResult, inProgressResult, completedResult, urgentResult] = await Promise.all([
        supabase.from('organization_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('organization_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'todo'),
        supabase.from('organization_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'in_progress'),
        supabase.from('organization_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed'),
        supabase.from('organization_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('priority', 'urgent'),
      ]);

      if (totalResult.error) throw totalResult.error;
      if (todoResult.error) throw todoResult.error;
      if (inProgressResult.error) throw inProgressResult.error;
      if (completedResult.error) throw completedResult.error;
      if (urgentResult.error) throw urgentResult.error;

      return {
        total: totalResult.count ?? 0,
        todo: todoResult.count ?? 0,
        in_progress: inProgressResult.count ?? 0,
        completed: completedResult.count ?? 0,
        urgent: urgentResult.count ?? 0,
      };
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to fetch organization team analytics
 *
 * Returns team member counts by role.
 *
 * @example
 * ```tsx
 * function TeamAnalytics() {
 *   const { data: analytics } = useOrganizationTeamAnalytics();
 *
 *   return (
 *     <div>
 *       <h3>Team Analytics</h3>
 *       <p>Total Members: {analytics?.total}</p>
 *       <p>Admins: {analytics?.admins}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationTeamAnalytics = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-team-analytics', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Fetch team member counts by role
      const [totalResult, adminResult, memberResult] = await Promise.all([
        supabase.from('organization_team_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('organization_team_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('role', 'admin'),
        supabase.from('organization_team_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('role', 'member'),
      ]);

      if (totalResult.error) throw totalResult.error;
      if (adminResult.error) throw adminResult.error;
      if (memberResult.error) throw memberResult.error;

      return {
        total: totalResult.count ?? 0,
        admins: adminResult.count ?? 0,
        members: memberResult.count ?? 0,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes - team changes less frequently
  });
};
