import { Link } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationStats, useOrganizationEventAnalytics, useOrganizationTaskAnalytics } from '@/hooks/organization/useOrganizationAnalytics';
import { useOrganizationUpcomingEvents } from '@/hooks/organization/useOrganizationEvents';
import { useOrganizationTasks } from '@/hooks/organization/useOrganizationTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, Users, CheckSquare, Image, Award, TrendingUp, Plus } from 'lucide-react';
import { getOrgTypeLabels, type OrgType } from '@/config/organizationTypes';

export default function OrganizationDashboard() {
  const { organization, orgId, isLoading: orgLoading } = useOrganization();
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: eventAnalytics, isLoading: eventAnalyticsLoading } = useOrganizationEventAnalytics();
  const { data: taskAnalytics, isLoading: taskAnalyticsLoading } = useOrganizationTaskAnalytics();
  const { data: upcomingEvents, isLoading: eventsLoading } = useOrganizationUpcomingEvents();
  const { data: tasks, isLoading: tasksLoading } = useOrganizationTasks();

  const isLoading = orgLoading || statsLoading || eventAnalyticsLoading || taskAnalyticsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
        <p className="text-gray-600">Could not load organization details.</p>
      </div>
    );
  }

  const pendingTasks = tasks?.filter(t => t.status === 'todo' || t.status === 'in_progress') || [];
  const nextUpcomingEvents = upcomingEvents?.slice(0, 3) || [];

  // Use slug-based URLs for navigation
  const orgSlug = organization.url_slug;
  const baseUrl = `/org/${orgSlug}`;

  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{organization.organization_name}</h1>
          <p className="mt-1 text-gray-600">{getOrgTypeLabels((organization.organization_type || []) as OrgType[])} Dashboard</p>
        </div>
        <div className="flex gap-3">
          <Link to={`${baseUrl}/events/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
          <Link to={baseUrl}>
            <Button className="professional-button">Edit Profile</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.upcoming_events || 0} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_tasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.total_tasks || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.team_members || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Library</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_media || 0}</div>
            <p className="text-xs text-muted-foreground">
              Files uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Next events on your calendar</CardDescription>
              </div>
              <Link to={`${baseUrl}/events`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : nextUpcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-4">
                {nextUpcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={event.source === 'native' ? `/events/${event.id}` : event.ticket_link || '#'}
                    target={event.source !== 'native' ? '_blank' : undefined}
                    rel={event.source !== 'native' ? 'noopener noreferrer' : undefined}
                    className="block rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{event.event_name || 'Untitled Event'}</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(event.event_date).toLocaleDateString('en-AU', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        {event.venue && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                            {event.venue.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {event.is_published ? (
                          <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs text-green-800 dark:text-green-300">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-800 dark:text-gray-300">
                            Draft
                          </span>
                        )}
                        {event.source !== 'native' && (
                          <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-1 text-xs text-purple-800 dark:text-purple-300 capitalize">
                            {event.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Tasks</CardTitle>
                <CardDescription>Tasks requiring attention</CardDescription>
              </div>
              <Link to={`${baseUrl}/tasks`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No pending tasks
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <p className="mt-2 text-xs text-gray-500">
                            Due: {new Date(task.due_date).toLocaleDateString('en-AU')}
                          </p>
                        )}
                      </div>
                      <span
                        className={`ml-3 rounded-full px-2 py-1 text-xs ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to={`${baseUrl}/events/create`}>
              <Button className="professional-button w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
            <Link to={`${baseUrl}/book-comedian`}>
              <Button className="professional-button w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Book Comedian
              </Button>
            </Link>
            <Link to={`${baseUrl}/team`}>
              <Button className="professional-button w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Team
              </Button>
            </Link>
            <Link to={`${baseUrl}/analytics`}>
              <Button className="professional-button w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      {eventAnalytics && taskAnalytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Published Events</span>
                  <span className="font-medium">{eventAnalytics.published}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Draft Events</span>
                  <span className="font-medium">{eventAnalytics.draft}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Past Events</span>
                  <span className="font-medium">{eventAnalytics.past}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To Do</span>
                  <span className="font-medium">{taskAnalytics.todo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium">{taskAnalytics.in_progress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{taskAnalytics.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Urgent</span>
                  <span className="font-medium text-red-600">{taskAnalytics.urgent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
