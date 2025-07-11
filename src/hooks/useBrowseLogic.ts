
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEventApplications } from '@/hooks/useEventApplications';

export const useBrowseLogic = () => {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userApplications, applyToEvent, isApplying } = useEventApplications();
  
  const [selectedEventForTickets, setSelectedEventForTickets] = useState<any>(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);
  const [showTicketPage, setShowTicketPage] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [showRecurringDateSelector, setShowRecurringDateSelector] = useState(false);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());

  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;

  // Check if user has already applied to an event
  const hasAppliedToEvent = (eventId: string) => {
    return userApplications.some((app: any) => app.event_id === eventId);
  };

  // Get application status for an event
  const getApplicationStatus = (eventId: string) => {
    const application = userApplications.find((app: any) => app.event_id === eventId);
    return application?.status || null;
  };

  const handleApply = async (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    if (!hasRole('comedian')) {
      toast({
        title: "Comedian access required",
        description: "Only comedians can apply to perform at shows.",
        variant: "destructive",
      });
      return;
    }

    // Check if already applied
    if (hasAppliedToEvent(event.id)) {
      const status = getApplicationStatus(event.id);
      toast({
        title: "Already applied",
        description: `You have already applied to this show. Status: ${status}`,
        variant: "destructive",
      });
      return;
    }

    if (event.is_verified_only && !profile?.is_verified) {
      toast({
        title: "Verification required",
        description: "This show requires verified comedians only. Get verified to apply!",
        variant: "destructive",
      });
      return;
    }

    if (event.status === 'full') {
      toast({
        title: "Show is full",
        description: "This show has reached its maximum capacity.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Apply to the event using the hook
      applyToEvent({
        event_id: event.id,
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to apply to event:', error);
    }
  };

  const handleBuyTickets = (event: any) => {
    if (event.is_recurring && !event.external_ticket_url) {
      setSelectedEventForTickets(event);
      setShowRecurringDateSelector(true);
    } else {
      setSelectedEventForTickets(event);
      setShowTicketPage(true);
    }
  };

  const handleToggleInterested = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark events as interested.",
        variant: "destructive",
      });
      return;
    }

    const newInterestedEvents = new Set(interestedEvents);
    if (interestedEvents.has(event.id)) {
      newInterestedEvents.delete(event.id);
      toast({
        title: "Removed from interested",
        description: `"${event.title}" has been removed from your interested events.`,
      });
    } else {
      newInterestedEvents.add(event.id);
      toast({
        title: "Added to interested!",
        description: `"${event.title}" has been added to your calendar as an interested event.`,
      });
    }
    setInterestedEvents(newInterestedEvents);
  };

  const handleGetDirections = (event: any) => {
    if (event.address) {
      const encodedAddress = encodeURIComponent(event.address);
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      toast({
        title: "Address not available",
        description: "No address provided for this venue.",
        variant: "destructive",
      });
    }
  };

  const handleShowDetails = (event: any) => {
    navigate(`/events/${event.id}`);
  };

  const handleDateSelected = (selectedDate: Date) => {
    setShowRecurringDateSelector(false);
    setShowTicketPage(true);
  };

  return {
    selectedEventForTickets,
    selectedEventForDetails,
    showTicketPage,
    showEventDetailsDialog,
    showRecurringDateSelector,
    interestedEvents,
    isIndustryUser,
    isConsumerUser,
    userApplications,
    hasAppliedToEvent,
    getApplicationStatus,
    isApplying,
    handleApply,
    handleBuyTickets,
    handleToggleInterested,
    handleGetDirections,
    handleShowDetails,
    handleDateSelected,
    setShowTicketPage,
    setShowEventDetailsDialog,
    setShowRecurringDateSelector,
  };
};
