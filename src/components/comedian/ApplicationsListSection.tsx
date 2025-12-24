import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEventApplications } from '@/hooks/useEventApplications';
import { CalendarDays, Clock, MapPin, Filter, ExternalLink, XCircle } from 'lucide-react';
import { generateGoogleMapsUrl } from '@/utils/maps';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type ApplicationStatus = 'all' | 'pending' | 'accepted' | 'rejected';

export const ApplicationsListSection = () => {
  const { userApplications, isLoadingUserApplications, updateApplication, isUpdating } = useEventApplications();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('all');
  const navigate = useNavigate();

  const handleWithdraw = (applicationId: string) => {
    updateApplication({
      id: applicationId,
      status: 'withdrawn',
    });
  };

  // Filter applications: only upcoming events + status filter, sorted by event date
  const today = new Date().toISOString().split('T')[0];
  const filteredApplications = (userApplications?.filter(app => {
    // Only show upcoming events
    const eventDate = app.event?.event_date;
    if (!eventDate || eventDate < today) return false;

    // Apply status filter
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  }) || []).sort((a, b) => {
    // Sort chronologically by event date and start time
    const dateA = a.event?.event_date || '';
    const dateB = b.event?.event_date || '';
    const timeA = a.event?.start_time || '00:00';
    const timeB = b.event?.start_time || '00:00';
    return `${dateA}T${timeA}`.localeCompare(`${dateB}T${timeB}`);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Not Selected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>;
      case 'withdrawn':
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge className="professional-button">{status}</Badge>;
    }
  };

  // Get upcoming applications for counts
  const upcomingApplications = userApplications?.filter(app => {
    const eventDate = app.event?.event_date;
    return eventDate && eventDate >= today;
  }) || [];

  const getStatusCount = (status: ApplicationStatus) => {
    if (status === 'all') return upcomingApplications.length;
    return upcomingApplications.filter(app => app.status === status).length;
  };

  if (isLoadingUserApplications) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
          <CardDescription>Loading your event applications...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Track your event applications and their status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ApplicationStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({getStatusCount('all')})</SelectItem>
                <SelectItem value="pending">Pending ({getStatusCount('pending')})</SelectItem>
                <SelectItem value="accepted">Accepted ({getStatusCount('accepted')})</SelectItem>
                <SelectItem value="rejected">Not Selected ({getStatusCount('rejected')})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {statusFilter === 'all' 
                ? "You haven't applied to any events yet."
                : `No ${statusFilter} applications found.`}
            </p>
            <Button onClick={() => navigate('/shows')}>
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">
                        {application.event?.title || 'Event'}
                      </h4>
                      {getStatusBadge(application.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{application.event?.venue || 'Venue'}</span>
                        {(() => {
                          const mapsUrl = generateGoogleMapsUrl({
                            address: application.event?.address,
                            venue: application.event?.venue,
                            city: application.event?.city,
                            state: application.event?.state,
                          });
                          return mapsUrl ? (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:text-primary/80"
                              title="Open in Google Maps"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null;
                        })()}
                      </div>

                      {application.event?.event_date && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>
                            {format(new Date(application.event.event_date), 'MMM d, yyyy')}
                            {application.event?.start_time && ` • ${application.event.start_time.substring(0, 5)}`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Applied {format(new Date(application.applied_at), 'MMM d')}</span>
                      </div>
                    </div>

                    {application.message && (
                      <p className="text-sm text-muted-foreground italic">
                        "{application.message}"
                      </p>
                    )}

                    {application.responded_at && application.status !== 'pending' && (
                      <p className="text-xs text-muted-foreground">
                        Response received on {format(new Date(application.responded_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  {application.status === 'pending' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleWithdraw(application.id)}
                      disabled={isUpdating}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};