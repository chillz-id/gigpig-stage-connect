import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventApplications } from '@/hooks/useEventApplications';
import { CalendarDays, Clock, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const PendingConfirmationsSection = () => {
  const { userApplications, isLoadingUserApplications, updateApplication, isUpdating } = useEventApplications();
  const navigate = useNavigate();

  // Filter for accepted applications that need confirmation
  const pendingConfirmations = userApplications?.filter(app => 
    app.status === 'accepted' && !app.availability_confirmed
  ) || [];

  const getDeadlineStatus = (eventDate: string | null) => {
    if (!eventDate) return { status: 'unknown', text: 'Date TBD', color: 'text-gray-500' };
    
    const event = parseISO(eventDate);
    const now = new Date();
    
    // Assume confirmation deadline is 48 hours before event
    const confirmationDeadline = new Date(event.getTime() - (48 * 60 * 60 * 1000));
    
    if (isAfter(now, confirmationDeadline)) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-500' };
    }
    
    const hoursLeft = differenceInHours(confirmationDeadline, now);
    const daysLeft = differenceInDays(confirmationDeadline, now);
    
    if (hoursLeft <= 24) {
      return { 
        status: 'urgent', 
        text: `${hoursLeft}h left`, 
        color: 'text-red-500' 
      };
    } else if (daysLeft <= 3) {
      return { 
        status: 'soon', 
        text: `${daysLeft}d left`, 
        color: 'text-yellow-500' 
      };
    } else {
      return { 
        status: 'normal', 
        text: `${daysLeft}d left`, 
        color: 'text-green-500' 
      };
    }
  };

  const getDeadlineIcon = (status: string) => {
    switch (status) {
      case 'overdue':
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-green-500" />;
    }
  };

  const handleConfirmation = async (applicationId: string, confirm: boolean) => {
    updateApplication({
      id: applicationId,
      availability_confirmed: confirm,
      responded_at: new Date().toISOString()
    });
  };

  if (isLoadingUserApplications) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Confirmations</CardTitle>
          <CardDescription>Loading confirmation requests...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (pendingConfirmations.length === 0) {
    return null; // Don't show the section if no pending confirmations
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Pending Confirmations
              <Badge variant="outline" className="ml-2">
                {pendingConfirmations.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              You've been accepted! Please confirm your availability for these spots.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingConfirmations.map((application) => {
            const deadline = getDeadlineStatus(application.events?.event_date);
            
            return (
              <div
                key={application.id}
                className={cn(
                  "group relative p-4 border rounded-lg transition-all",
                  deadline.status === 'overdue' && "border-red-200 bg-red-50",
                  deadline.status === 'urgent' && "border-yellow-200 bg-yellow-50",
                  deadline.status === 'soon' && "border-yellow-100 bg-yellow-25",
                  deadline.status === 'normal' && "border-green-100 bg-green-25"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">
                        {application.events?.title || 'Event'}
                      </h4>
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        Accepted
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{application.events?.venue || 'Venue'}</span>
                      </div>
                      
                      {application.events?.event_date && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(new Date(application.events.event_date), 'MMM d, yyyy • h:mm a')}</span>
                        </div>
                      )}
                      
                      {application.spot_type && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Spot:</span>
                          <span className="capitalize">{application.spot_type}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {getDeadlineIcon(deadline.status)}
                      <span className="text-sm font-medium">
                        Confirmation deadline: 
                        <span className={cn("ml-1", deadline.color)}>
                          {deadline.text}
                        </span>
                      </span>
                    </div>

                    {deadline.status === 'overdue' && (
                      <div className="flex items-center gap-2 p-2 bg-red-100 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          This confirmation is overdue! Please respond immediately.
                        </span>
                      </div>
                    )}

                    {application.message && (
                      <p className="text-sm text-muted-foreground italic bg-gray-50 p-3 rounded-lg">
                        Original message: "{application.message}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/events/${application.event_id}`)}
                  >
                    View Event Details
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirmation(application.id, false)}
                      disabled={isUpdating}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleConfirmation(application.id, true)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm Availability
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};