
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvents } from '@/hooks/useEvents';
import { CalendarView } from '@/components/CalendarView';
import { MapView } from '@/components/MapView';
import { TicketPage } from '@/components/TicketPage';
import { EventDetailsPopup } from '@/components/EventDetailsPopup';
import { RecurringEventDateSelector } from '@/components/RecurringEventDateSelector';
import { ShowCard } from '@/components/ShowCard';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { useViewMode } from '@/contexts/ViewModeContext';
import { mockEvents } from '@/data/mockEvents';

const Browse = () => {
  const { isMemberView } = useViewMode();
  const { events, isLoading } = useEvents();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const {
    selectedEventForTickets,
    selectedEventForDetails,
    showTicketPage,
    showEventDetailsDialog,
    showRecurringDateSelector,
    interestedEvents,
    isIndustryUser,
    isConsumerUser,
    handleApply,
    handleBuyTickets,
    handleToggleInterested,
    handleGetDirections,
    handleShowDetails,
    handleDateSelected,
    setShowTicketPage,
    setShowEventDetailsDialog,
    setShowRecurringDateSelector,
  } = useBrowseLogic();

  // Combine real events with mock events - this ensures consistency across all views
  const allEvents = [...events, ...mockEvents];

  // Filter to show only upcoming events (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  // Always use upcoming events for all views
  const eventsToShow = upcomingEvents;

  const filteredShows = eventsToShow.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${event.city}, ${event.state}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || locationFilter === 'all' || 
                           `${event.city}, ${event.state}`.includes(locationFilter);
    const matchesType = !typeFilter || typeFilter === 'all' || 
                       (event.type && event.type.toLowerCase().includes(typeFilter.toLowerCase()));
    
    return matchesSearch && matchesLocation && matchesType;
  });

  const ListView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading ? (
        <div className="col-span-full text-center py-8">
          <div className="text-xl text-muted-foreground">Loading events...</div>
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="col-span-full">
          <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No shows found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        filteredShows.map((show) => (
          <ShowCard
            key={show.id}
            show={show}
            interestedEvents={interestedEvents}
            onToggleInterested={handleToggleInterested}
            onApply={handleApply}
            onBuyTickets={handleBuyTickets}
            onShowDetails={handleShowDetails}
            onGetDirections={handleGetDirections}
          />
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Browse Shows</h1>
            <p className="text-muted-foreground">
              {isMemberView ? 'Find shows to attend and buy tickets' : 'Find gigs near you'}
            </p>
          </div>

          <SearchAndFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
          />

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {isMemberView ? 'Events' : 'Card View'}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              <ListView />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <CalendarView />
            </TabsContent>
            
            <TabsContent value="map" className="mt-6">
              <MapView />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <EventDetailsPopup
        event={selectedEventForDetails}
        isOpen={showEventDetailsDialog}
        onClose={() => setShowEventDetailsDialog(false)}
        onApply={handleApply}
        onBuyTickets={handleBuyTickets}
        onGetDirections={handleGetDirections}
        isIndustryUser={isIndustryUser}
        isConsumerUser={isConsumerUser}
      />

      <RecurringEventDateSelector
        event={selectedEventForTickets}
        isOpen={showRecurringDateSelector}
        onClose={() => setShowRecurringDateSelector(false)}
        onDateSelected={handleDateSelected}
      />

      <TicketPage
        event={selectedEventForTickets}
        isOpen={showTicketPage}
        onClose={() => setShowTicketPage(false)}
      />
    </>
  );
};

export default Browse;
