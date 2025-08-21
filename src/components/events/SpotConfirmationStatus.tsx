import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  CalendarClock,
  User
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useEventSpots } from '@/hooks/useEventSpots';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SpotConfirmationStatusProps {
  eventId: string;
  onRefresh?: () => void;
}

interface SpotWithComedian {
  id: string;
  spot_name: string;
  comedian_id: string | null;
  confirmation_status: string | null;
  confirmation_deadline: string | null;
  confirmed_at: string | null;
  declined_at: string | null;
  comedian?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    stage_name: string | null;
    profile_picture: string | null;
    email: string | null;
  };
}

const SpotConfirmationStatus: React.FC<SpotConfirmationStatusProps> = ({ 
  eventId,
  onRefresh 
}) => {
  // Fetch spots with comedian details
  const { data: spotsWithComedians, isLoading, refetch } = useQuery({
    queryKey: ['spots-with-comedians', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          *,
          comedian:profiles!event_spots_comedian_id_fkey(
            id,
            first_name,
            last_name,
            stage_name,
            profile_picture,
            email
          )
        `)
        .eq('event_id', eventId)
        .not('comedian_id', 'is', null)
        .order('spot_order', { ascending: true });

      if (error) throw error;
      return data as SpotWithComedian[];
    }
  });

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const getStatusIcon = (status: string | null, deadline: string | null) => {
    if (!status || status === 'pending') {
      const isPastDeadline = deadline && isPast(new Date(deadline));
      if (isPastDeadline) {
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      }
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    if (status === 'confirmed') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (status === 'declined') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  const getStatusBadge = (spot: SpotWithComedian) => {
    const { confirmation_status, confirmation_deadline } = spot;
    
    if (!confirmation_status || confirmation_status === 'pending') {
      const deadline = confirmation_deadline ? new Date(confirmation_deadline) : null;
      const isPastDeadline = deadline && isPast(deadline);
      
      if (isPastDeadline) {
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      }
      
      return (
        <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    
    if (confirmation_status === 'confirmed') {
      return (
        <Badge variant="success" className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    }
    
    if (confirmation_status === 'declined') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      );
    }
    
    return null;
  };

  const getComedianName = (comedian: SpotWithComedian['comedian']) => {
    if (!comedian) return 'Unknown';
    return comedian.stage_name || `${comedian.first_name || ''} ${comedian.last_name || ''}`.trim() || 'Unnamed';
  };

  const pendingConfirmations = spotsWithComedians?.filter(
    spot => !spot.confirmation_status || spot.confirmation_status === 'pending'
  ) || [];

  const confirmedSpots = spotsWithComedians?.filter(
    spot => spot.confirmation_status === 'confirmed'
  ) || [];

  const declinedSpots = spotsWithComedians?.filter(
    spot => spot.confirmation_status === 'declined'
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            Spot Confirmations
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{pendingConfirmations.length}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{confirmedSpots.length}</div>
              <div className="text-sm text-green-600">Confirmed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{declinedSpots.length}</div>
              <div className="text-sm text-red-600">Declined</div>
            </div>
          </div>

          {/* Pending Confirmations */}
          {pendingConfirmations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Awaiting Confirmation</h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {pendingConfirmations.map(spot => {
                    const deadline = spot.confirmation_deadline ? new Date(spot.confirmation_deadline) : null;
                    const isPastDeadline = deadline && isPast(deadline);
                    
                    return (
                      <div
                        key={spot.id}
                        className={`p-4 rounded-lg border ${
                          isPastDeadline ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={spot.comedian?.profile_picture || undefined} />
                              <AvatarFallback>
                                <User className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getComedianName(spot.comedian)}</p>
                              <p className="text-sm text-gray-600">{spot.spot_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(spot)}
                            {deadline && (
                              <p className="text-xs text-gray-500 mt-1">
                                {isPastDeadline ? 'Expired ' : 'Due '}
                                {formatDistanceToNow(deadline, { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Confirmed Spots */}
          {confirmedSpots.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Confirmed</h3>
              <div className="space-y-2">
                {confirmedSpots.map(spot => (
                  <div key={spot.id} className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{getComedianName(spot.comedian)}</span>
                        <span className="text-sm text-gray-600">• {spot.spot_name}</span>
                      </div>
                      {spot.confirmed_at && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(spot.confirmed_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No assignments */}
          {spotsWithComedians?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No spots have been assigned yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotConfirmationStatus;