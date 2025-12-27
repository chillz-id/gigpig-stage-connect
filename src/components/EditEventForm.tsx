import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/data/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { EventBasicInfo } from './EventBasicInfo';
import { EventDateTimeSection } from './EventDateTimeSection';
import { EventRequirementsSection } from './EventRequirementsSection';
import { EventSpotManagerDraggable } from './EventSpotManagerDraggable';
import { EventBannerUpload } from './EventBannerUpload';
import { EventTicketSection } from './EventTicketSection';
import { EventCostsSection } from './EventCostsSection';
import { EventFormData, RecurringSettings, EventSpot, EventCost } from '@/types/eventTypes';
import { Event } from '@/types/event';
import { validateEventForm } from '@/utils/eventValidation';
import { prepareEventData } from '@/utils/eventDataMapper';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface EditEventFormProps {
  event: Event;
}

export const EditEventForm: React.FC<EditEventFormProps> = ({ event }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { update: updateEvent, publishEvent, unpublishEvent, closeEvent, cancelEvent } = useEvents();
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert event data to form data
  const [formData, setFormData] = useState<EventFormData>({
    title: event.title || '',
    venue: event.venue as string || '',
    address: event.address || '',
    city: event.city || '',
    state: event.state || '',
    country: event.country || 'Australia',
    date: event.event_date?.split('T')[0] || event.date || '',
    time: event.start_time || '',
    endTime: event.end_time || '',
    type: event.type || '',
    spots: event.spots || event.total_spots || 5,
    description: event.description || '',
    requirements: event.requirements?.split('\n').filter(r => r) || [],
    isVerifiedOnly: false,
    isPaid: false,
    allowRecording: false,
    ageRestriction: '18+',
    dresscode: 'Casual',
    imageUrl: event.image_url || '',
    showLevel: '',
    showType: event.type || '',
    customShowType: '',
    ticketingType: 'external',
    externalTicketUrl: '',
    tickets: [],
    feeHandling: 'absorb',
    capacity: event.capacity || 0,
  });

  const [eventSpots, setEventSpots] = useState<EventSpot[]>([]);
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [recurringSettings, setRecurringSettings] = useState<RecurringSettings>({
    isRecurring: false,
    pattern: 'weekly',
    endDate: '',
    customDates: []
  });

  // Load event spots
  useEffect(() => {
    const loadEventSpots = async () => {
      const { data: spots, error } = await supabase
        .from('event_spots')
        .select('*')
        .eq('event_id', event.id)
        .order('order_number');
      
      if (!error && spots) {
        setEventSpots(spots.map((spot, index) => ({
          id: `spot-${index}`,
          performerName: '',
          duration: spot.duration_minutes || 5,
          type: spot.performance_type || 'spot',
          order: spot.order_number || index + 1
        })));
      }
    };

    loadEventSpots();
  }, [event.id]);

  const handleFormDataChange = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateEvent = async (newStatus?: 'draft' | 'open' | 'closed' | 'cancelled') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update the event.",
        variant: "destructive"
      });
      return;
    }

    const validation = validateEventForm(formData, recurringSettings);
    if (!validation.isValid) {
      toast({
        title: "Missing required fields",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const eventData = prepareEventData(formData, recurringSettings, eventSpots, user.id);
      
      // If status is being changed, update it
      if (newStatus) {
        eventData.status = newStatus;
      }

      const { error } = await updateEvent(event.id, eventData);
      
      if (error) {
        throw error;
      }

      toast({
        title: newStatus ? `Event ${newStatus}` : "Event updated",
        description: `The event has been ${newStatus ? `changed to ${newStatus}` : 'updated'} successfully.`,
      });

      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'open' | 'closed' | 'cancelled') => {
    setIsUpdating(true);
    try {
      let result;
      switch (newStatus) {
        case 'open':
          result = await publishEvent(event.id);
          break;
        case 'draft':
          result = await unpublishEvent(event.id);
          break;
        case 'closed':
          result = await closeEvent(event.id);
          break;
        case 'cancelled':
          result = await cancelEvent(event.id);
          break;
      }

      toast({
        title: "Status updated",
        description: `Event status changed to ${newStatus}.`,
      });
      
      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error('Status change error:', error);
      toast({
        title: "Status update failed",
        description: "Failed to update event status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      draft: 'bg-gray-500',
      open: 'bg-green-500',
      closed: 'bg-orange-500',
      cancelled: 'bg-red-500',
      completed: 'bg-blue-500'
    };

    return (
      <Badge className={`${statusColors[event.status]} text-white`}>
        {event.status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleUpdateEvent(); }} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Event Status:</h2>
          {getStatusBadge()}
        </div>
        <div className="flex gap-2">
          {event.status === 'draft' && (
            <Button
              type="button"
              onClick={() => handleStatusChange('open')}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              Publish Event
            </Button>
          )}
          {event.status === 'open' && (
            <>
              <Button
                type="button"
                onClick={() => handleStatusChange('closed')}
                disabled={isUpdating}
                className="professional-button"
              >
                Mark as Sold Out
              </Button>
              <Button
                type="button"
                onClick={() => handleStatusChange('draft')}
                disabled={isUpdating}
                className="professional-button"
              >
                Unpublish
              </Button>
            </>
          )}
          {event.status === 'closed' && (
            <Button
              type="button"
              onClick={() => handleStatusChange('open')}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              Reopen Event
            </Button>
          )}
          {event.status !== 'cancelled' && event.status !== 'completed' && (
            <Button
              type="button"
              onClick={() => handleStatusChange('cancelled')}
              disabled={isUpdating}
              variant="destructive"
            >
              Cancel Event
            </Button>
          )}
        </div>
      </div>

      <EventBannerUpload
        bannerUrl={formData.imageUrl}
        bannerPosition={formData.bannerPosition}
        onBannerChange={(data) => handleFormDataChange({
          imageUrl: data.url,
          bannerPosition: data.position
        })}
      />

      <EventBasicInfo
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      <EventDateTimeSection
        formData={formData}
        recurringSettings={recurringSettings}
        onFormDataChange={handleFormDataChange}
        onRecurringSettingsChange={setRecurringSettings}
      />

      <EventSpotManagerDraggable 
        spots={eventSpots} 
        onSpotsChange={setEventSpots}
      />

      <EventTicketSection
        ticketingType={formData.ticketingType}
        externalTicketUrl={formData.externalTicketUrl}
        tickets={formData.tickets}
        feeHandling={formData.feeHandling}
        onTicketingTypeChange={(type) => handleFormDataChange({ ticketingType: type })}
        onExternalTicketUrlChange={(url) => handleFormDataChange({ externalTicketUrl: url })}
        onTicketsChange={(tickets) => handleFormDataChange({ tickets })}
        onFeeHandlingChange={(handling) => handleFormDataChange({ feeHandling: handling })}
      />

      <EventCostsSection
        costs={eventCosts}
        onCostsChange={setEventCosts}
      />

      <EventRequirementsSection
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      <div className="flex gap-4 justify-end">
        <Button 
          type="button" 
          variant="destructive"
          onClick={() => navigate(`/events/${event.id}`)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isUpdating}
          className="bg-primary hover:bg-primary/90"
        >
          {isUpdating ? 'Updating...' : 'Update Event'}
        </Button>
      </div>
    </form>
  );
};