import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Plus, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShowCard } from '@/components/ShowCard';
import { EditGigDialog } from '@/components/comedian/EditGigDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useComedianGigs } from '@/hooks/useComedianGigs';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { manualGigsService } from '@/services/gigs/manual-gigs-service';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ComedianUpcomingShowsProps {
  comedianId: string;
  isOwnProfile?: boolean;
}

const ComedianUpcomingShows: React.FC<ComedianUpcomingShowsProps> = ({
  comedianId,
  isOwnProfile: isOwnProfileProp
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { gigs, isLoading, getUpcomingGigs } = useComedianGigs(comedianId);
  const [api, setApi] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [editingGig, setEditingGig] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use prop if provided, fallback to calculation for backward compatibility
  const isOwnProfile = isOwnProfileProp ?? (user?.id === comedianId);

  // Fetch manual gigs (self-created shows)
  const { data: manualGigs } = useQuery({
    queryKey: ['manual-gigs', comedianId],
    queryFn: () => manualGigsService.getUserManualGigs(comedianId),
    enabled: !!comedianId,
  });

  // Combine calendar events and manual gigs
  const upcomingCalendarGigs = getUpcomingGigs();
  const upcomingManualGigs = manualGigs?.filter(gig =>
    new Date(gig.start_datetime) >= new Date()
  ) || [];

  // Merge both sources
  const allUpcomingGigs = [
    ...upcomingCalendarGigs,
    ...upcomingManualGigs.map(gig => ({
      id: gig.id,
      comedian_id: gig.user_id,
      title: gig.title,
      event_date: gig.start_datetime,
      venue: gig.venue_name || 'TBA',
      status: 'confirmed' as const,
      banner_url: gig.banner_url,
      ticket_link: gig.ticket_link,
      description: gig.description,
      created_at: gig.created_at,
      updated_at: gig.updated_at,
      calendar_sync_status: 'pending' as const,
      is_manual_gig: true, // Flag to identify manual gigs
    }))
  ].sort((a, b) =>
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  const upcomingGigs = allUpcomingGigs;

  // Filter to only show confirmed shows and self-created shows (no pending)
  const confirmedShows = useMemo(() => {
    return upcomingGigs
      .filter(gig => {
        // Show if status is confirmed OR if it's a self-created show (no event_id)
        return gig.status === 'confirmed' || !gig.event_id;
      })
      .map(gig => ({
        id: gig.id,
        title: gig.title,
        venue: gig.venue,
        location: gig.event?.city ? `${gig.event.city}, ${gig.event.state}` : 'Location TBA',
        date: gig.event_date.split('T')[0],
        time: gig.event?.start_time || '19:00',
        start_time: gig.event?.start_time || '19:00',
        type: gig.event_spot?.spot_name || 'Performance',
        status: gig.status,
        image_url: gig.banner_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
        banner_url: gig.banner_url,
        payment: gig.event_spot?.is_paid ? gig.event_spot.payment_amount : null,
        ticket_url: gig.ticket_link,
        external_ticket_url: gig.ticket_link,
        duration: gig.event_spot?.duration_minutes,
        event_id: gig.event_id,
        supabaseEventId: gig.event_id,
        promoter_id: null, // Self-created shows don't have promoters - forces "Get tickets" button
        is_manual_gig: (gig as any).is_manual_gig || false, // Preserve manual gig flag
      }));
  }, [upcomingGigs]);

  // Auto-scroll carousel every 5 seconds (loop is enabled, so scrollNext always works)
  useEffect(() => {
    if (!api || isPaused || confirmedShows.length <= 1) return;

    scrollIntervalRef.current = setInterval(() => {
      // With loop: true, scrollNext() will automatically wrap to the beginning
      api.scrollNext();
    }, 5000); // 5 seconds

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [api, isPaused, confirmedShows.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day}${getOrdinalSuffix(day)} ${month}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleShowClick = (show: any) => {
    if (show.event_id) {
      navigate(`/events/${show.event_id}`);
    }
  };

  const handleAddGig = () => {
    navigate('/dashboard/gigs/add');
  };

  const handleEditGig = (show: any) => {
    // Only allow editing manual gigs (self-created shows)
    if (!show.is_manual_gig) {
      toast({
        title: 'Cannot Edit',
        description: 'This show is linked to a promoter event and cannot be edited directly.',
        variant: 'default',
      });
      return;
    }

    // Find the original manual gig data
    const originalGig = manualGigs?.find(gig => gig.id === show.id);
    if (originalGig) {
      setEditingGig({
        id: originalGig.id,
        title: originalGig.title,
        venue_name: originalGig.venue_name,
        venue_address: originalGig.venue_address,
        start_datetime: originalGig.start_datetime,
        end_datetime: originalGig.end_datetime,
        description: originalGig.description,
        ticket_link: originalGig.ticket_link,
        banner_url: originalGig.banner_url,
      });
      setIsEditDialogOpen(true);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-xl sm:text-2xl">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            Upcoming Shows
          </CardTitle>
          {isOwnProfile && (
            <Button
              onClick={handleAddGig}
              className="professional-button flex items-center gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Add Show
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="text-center text-gray-400 py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-lg">Loading shows...</p>
          </div>
        )}

        {!isLoading && confirmedShows.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No upcoming shows</p>
            {isOwnProfile && (
              <>
                <p className="text-sm mb-4">Start building your comedy career by adding your first show</p>
                <Button onClick={handleAddGig} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Show
                </Button>
              </>
            )}
          </div>
        )}

        {!isLoading && confirmedShows.length > 0 && (
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative"
          >
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {confirmedShows.map((show) => (
                  <CarouselItem
                    key={show.id}
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <ShowCard
                      show={show}
                      isFavorited={false}
                      onToggleFavorite={() => {}}
                      onApply={() => {}}
                      onBuyTickets={(show) => {
                        if (show.ticket_url) {
                          window.open(show.ticket_url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      onShowDetails={() => handleShowClick(show)}
                      onGetDirections={() => {}}
                      isOwner={isOwnProfile}
                      onEdit={handleEditGig}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation Arrows */}
              {confirmedShows.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 bg-purple-600 hover:bg-purple-700 text-white border-0" />
                  <CarouselNext className="right-2 bg-purple-600 hover:bg-purple-700 text-white border-0" />
                </>
              )}
            </Carousel>

            {/* Pause indicator */}
            {isPaused && confirmedShows.length > 1 && (
              <div className="absolute top-2 right-12 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Paused
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Gig Dialog */}
      {editingGig && (
        <EditGigDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          gig={editingGig}
        />
      )}
    </Card>
  );
};

export default ComedianUpcomingShows;
