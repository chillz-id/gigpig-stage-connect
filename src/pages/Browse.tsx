
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { ShowCard } from '@/components/ShowCard';
import { EventDetailsPopup } from '@/components/EventDetailsPopup';
import { RecurringEventDateSelector } from '@/components/RecurringEventDateSelector';
import { RecurringApplicationDateSelector } from '@/components/RecurringApplicationDateSelector';
import { TicketPage } from '@/components/TicketPage';
import { MonthFilter } from '@/components/MonthFilter';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { mockEvents } from '@/data/mockEvents';

const Browse = () => {
  const { events, isLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showRecurringApplicationSelector, setShowRecurringApplicationSelector] = useState(false);
  const [selectedRecurringEvent, setSelectedRecurringEvent] = useState<any>(null);

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

  // Combine real events with mock events
  const allEvents = [...events, ...mockEvents];

  // Filter to show only upcoming events (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  // Filter events by selected month/year and search term
  const filteredEvents = upcomingEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    const matchesMonth = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${event.city}, ${event.state}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesMonth && matchesSearch;
  });

  const handleRecurringApply = (event: any) => {
    setSelectedRecurringEvent(event);
    setShowRecurringApplicationSelector(true);
  };

  const handleRecurringApplicationSubmit = (event: any, selectedDates: Date[]) => {
    // Handle the application for multiple dates
    console.log('Applying for event:', event.title, 'on dates:', selectedDates);
    // This would normally make API calls for each selected date
    handleApply(event); // For now, just use the regular apply logic
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Browse Shows</h1>
            <p className="text-muted-foreground">
              Find gigs near you
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for events"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Month Filter */}
          <MonthFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
          />

          {/* Event Cards */}
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-xl text-muted-foreground">Loading events...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">No shows found</h3>
                  <p className="text-muted-foreground">
                    Try selecting a different month or adjusting your search
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((show) => (
                  <ShowCard
                    key={show.id}
                    show={show}
                    interestedEvents={interestedEvents}
                    onToggleInterested={handleToggleInterested}
                    onApply={handleApply}
                    onBuyTickets={handleBuyTickets}
                    onShowDetails={handleShowDetails}
                    onGetDirections={handleGetDirections}
                    onRecurringApply={handleRecurringApply}
                  />
                ))}
              </div>
            )}
          </div>
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

      <RecurringApplicationDateSelector
        event={selectedRecurringEvent}
        isOpen={showRecurringApplicationSelector}
        onClose={() => setShowRecurringApplicationSelector(false)}
        onApply={handleRecurringApplicationSubmit}
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
