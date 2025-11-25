import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotConfirmationCard } from '@/components/spots/SpotConfirmationCard';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SpotConfirmationWithDetails, SpotConfirmationResponse, SpotConfirmationHistory } from '@/types/spotConfirmation';

export default function SpotConfirmationPage() {
  const { spotId, eventId } = useParams<{ spotId?: string; eventId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch spot confirmation details
  const { data: confirmation, isLoading, error } = useQuery({
    queryKey: ['spot-confirmation', spotId || eventId],
    queryFn: async () => {
      if ((!spotId && !eventId) || !user?.id) {
        throw new Error('Missing spot/event ID or user authentication');
      }

      // Build query based on available params
      let query = supabase
        .from('event_spots')
        .select(`
          *,
          event:events (
            id,
            title,
            event_date,
            start_time,
            end_time,
            venue,
            address,
            description,
            requirements,
            organization:organization_profiles!events_organization_id_fkey (
              id,
              organization_name,
              contact_email,
              contact_phone,
              logo_url
            )
          )
        `)
        .eq('comedian_id', user.id);

      // Add appropriate filter based on route params
      if (spotId) {
        query = query.eq('id', spotId);
      } else if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      // Transform the data to SpotConfirmationWithDetails format
      // Since we don't have confirmation fields in the DB, we'll derive the status from is_filled and comedian_id
      const confirmation: SpotConfirmationWithDetails = {
        id: `conf_${spotId}`,
        spot_id: spotId,
        comedian_id: user.id,
        status: data.is_filled ? 'confirmed' : (data.comedian_id ? 'pending' : 'declined'),
        // For deadline, we'll use 24 hours from when the spot was assigned (updated_at)
        response_deadline: new Date(new Date(data.updated_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        response_date: data.is_filled ? data.updated_at : undefined,
        notes: undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        spot: {
          id: data.id,
          spot_name: data.spot_name,
          payment_amount: data.payment_amount,
          currency: data.currency,
          duration_minutes: data.duration_minutes,
          spot_order: data.spot_order,
          event_id: data.event_id,
          event: data.event
        },
        comedian: {
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          stage_name: user.user_metadata?.stage_name,
          email: user.email || '',
          phone: user.user_metadata?.phone,
          avatar_url: user.user_metadata?.avatar_url
        }
      };

      return confirmation;
    },
    enabled: !!(spotId || eventId) && !!user?.id
  });

  // Fetch confirmation history
  const { data: history } = useQuery({
    queryKey: ['spot-confirmation-history', spotId || eventId],
    queryFn: async () => {
      if ((!spotId && !eventId) || !confirmation) return [];

      // Since we don't have a history table, we'll create a simple history based on the current state
      const historyItems: SpotConfirmationHistory[] = [];
      
      // Add invitation record
      historyItems.push({
        id: 'hist_invited',
        spot_id: confirmation.spot_id,
        comedian_id: user?.id || '',
        action: 'invited',
        notes: 'Invited to perform at this event',
        created_at: confirmation.created_at,
        created_by: confirmation.spot.event.promoter?.id || ''
      });
      
      // Add confirmation/decline record if applicable
      if (confirmation.status === 'confirmed') {
        historyItems.push({
          id: 'hist_confirmed',
          spot_id: confirmation.spot_id,
          comedian_id: user?.id || '',
          action: 'confirmed',
          notes: 'Confirmed spot assignment',
          created_at: confirmation.response_date || confirmation.updated_at,
          created_by: user?.id || ''
        });
      } else if (confirmation.status === 'declined') {
        historyItems.push({
          id: 'hist_declined',
          spot_id: confirmation.spot_id,
          comedian_id: user?.id || '',
          action: 'declined',
          notes: 'Declined spot assignment',
          created_at: confirmation.updated_at,
          created_by: user?.id || ''
        });
      }

      return historyItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!(spotId || eventId) && !!confirmation
  });

  // Handle confirmation response
  const confirmationMutation = useMutation({
    mutationFn: async (response: SpotConfirmationResponse) => {
      if ((!spotId && !eventId) || !user?.id || !confirmation) {
        throw new Error('Missing required data');
      }

      // Update the event spot based on response
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (response.status === 'confirmed') {
        updateData.is_filled = true;
      } else if (response.status === 'declined') {
        // When declining, remove the comedian assignment and mark as not filled
        updateData.is_filled = false;
        updateData.comedian_id = null;
      }

      const { error } = await supabase
        .from('event_spots')
        .update(updateData)
        .eq('id', confirmation.spot_id)
        .eq('comedian_id', user.id);

      if (error) {
        throw error;
      }

      // TODO: Send notification to promoter about the response
      // This would be handled by the notificationService in production
      
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['spot-confirmation', spotId || eventId] });
      queryClient.invalidateQueries({ queryKey: ['spot-confirmation-history', spotId || eventId] });
      
      toast({
        title: response.status === 'confirmed' ? 'Spot Confirmed!' : 'Spot Declined',
        description: response.status === 'confirmed' 
          ? 'Your spot has been confirmed. The promoter will be notified.'
          : 'Your spot has been declined. The promoter will be notified.',
        variant: response.status === 'confirmed' ? 'default' : 'destructive'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process response',
        variant: 'destructive'
      });
    }
  });

  const handleConfirmation = (response: SpotConfirmationResponse) => {
    confirmationMutation.mutate(response);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'invited':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-48 mb-4" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !confirmation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => navigate('/dashboard')}
            className="professional-button mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error instanceof Error ? error.message : 'Unable to load spot confirmation details. The spot may not exist or you may not have permission to view it.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button 
          onClick={() => navigate('/dashboard')}
          className="professional-button"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Main confirmation card */}
        <div className="mb-8">
          <SpotConfirmationCard
            confirmation={confirmation}
            onConfirmation={handleConfirmation}
            isLoading={confirmationMutation.isPending}
          />
        </div>

        {/* History section */}
        {history && history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Confirmation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(item.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="professional-button text-xs">
                          {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-700">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}