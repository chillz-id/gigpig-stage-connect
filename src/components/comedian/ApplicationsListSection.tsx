import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEventApplications } from '@/hooks/useEventApplications';
import { CalendarDays, Clock, MapPin, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type ApplicationStatus = 'all' | 'pending' | 'accepted' | 'rejected';

export const ApplicationsListSection = () => {
  const { userApplications, isLoadingUserApplications } = useEventApplications();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('all');
  const navigate = useNavigate();

  // Filter applications based on status
  const filteredApplications = userApplications?.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  }) || [];

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

  const getStatusCount = (status: ApplicationStatus) => {
    if (status === 'all') return userApplications?.length || 0;
    return userApplications?.filter(app => app.status === status).length || 0;
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
                className="group relative p-4 border rounded-lg hover:bg-accent/50 transition-all cursor-pointer"
                onClick={() => navigate(`/events/${application.event_id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {application.events?.title || 'Event'}
                      </h4>
                      {getStatusBadge(application.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{application.events?.venue || 'Venue'}</span>
                      </div>
                      
                      {application.events?.event_date && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(new Date(application.events.event_date), 'MMM d, yyyy')}</span>
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
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};