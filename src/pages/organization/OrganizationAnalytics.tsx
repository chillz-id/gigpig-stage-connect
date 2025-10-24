import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationStats, useOrganizationEventAnalytics, useOrganizationTaskAnalytics, useOrganizationTeamAnalytics } from '@/hooks/organization/useOrganizationAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TrendingUp, Calendar, CheckSquare, Users } from 'lucide-react';

export default function OrganizationAnalytics() {
  const { organization } = useOrganization();
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: eventAnalytics, isLoading: eventLoading } = useOrganizationEventAnalytics();
  const { data: taskAnalytics, isLoading: taskLoading } = useOrganizationTaskAnalytics();
  const { data: teamAnalytics, isLoading: teamLoading } = useOrganizationTeamAnalytics();

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  const isLoading = statsLoading || eventLoading || taskLoading || teamLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-gray-600">{organization.organization_name}'s performance metrics</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.upcoming_events || 0} upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_tasks || 0}</div>
            <p className="text-xs text-muted-foreground">of {stats?.total_tasks || 0} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.team_members || 0}</div>
            <p className="text-xs text-muted-foreground">{teamAnalytics?.admins || 0} admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_media || 0}</div>
            <p className="text-xs text-muted-foreground">in library</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
            <CardDescription>Distribution of events by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Upcoming</span>
              <span className="font-medium">{eventAnalytics?.upcoming || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Published</span>
              <span className="font-medium">{eventAnalytics?.published || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Draft</span>
              <span className="font-medium">{eventAnalytics?.draft || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Past Events</span>
              <span className="font-medium">{eventAnalytics?.past || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Current task distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">To Do</span>
              <span className="font-medium">{taskAnalytics?.todo || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">In Progress</span>
              <span className="font-medium">{taskAnalytics?.in_progress || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium">{taskAnalytics?.completed || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Urgent</span>
              <span className="font-medium text-red-600">{taskAnalytics?.urgent || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
