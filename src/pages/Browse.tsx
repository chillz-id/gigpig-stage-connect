
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { ModernEventCard } from '@/components/ModernEventCard';
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Shows</h1>
            <p className="text-gray-600 text-lg">
              Find amazing comedy events near you
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search events, venues, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white rounded-xl"
              />
            </div>

            <MonthFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Event Cards Grid */}
          <div className="mb-8">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="text-xl text-gray-500">Finding amazing shows...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">No shows found</h3>
                  <p className="text-gray-600 text-lg">
                    Try selecting a different month or adjusting your search
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEvents.map((show) => (
                  <ModernEventCard
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
