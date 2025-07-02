
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { FeaturedEventsCarousel } from '@/components/FeaturedEventsCarousel';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { ShowCard } from '@/components/ShowCard';
import { MonthFilter } from '@/components/MonthFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const Shows = () => {
  const { theme } = useTheme();
  const location = useLocation();
  
  // Get month from URL params
  const searchParams = new URLSearchParams(location.search);
  const monthParam = searchParams.get('month');
  const initialDate = monthParam ? new Date(monthParam) : new Date();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const { events, isLoading, error } = useEvents();
  
  // Get browse logic handlers
  const {
    interestedEvents,
    hasAppliedToEvent,
    getApplicationStatus,
    isApplying,
    handleToggleInterested,
    handleApply,
    handleBuyTickets,
    handleShowDetails,
    handleGetDirections
  } = useBrowseLogic();

  // Filter events based on selected month/year and other filters
  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      const matchesMonth = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === '' || 
        event.city?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesType = typeFilter === '' || event.type === typeFilter;
      
      return matchesMonth && matchesSearch && matchesLocation && matchesType;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [events, selectedMonth, selectedYear, searchTerm, locationFilter, typeFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setSortBy('date');
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    
    // Update URL
    const url = new URL(window.location.href);
    const dateStr = new Date(year, month).toISOString().slice(0, 7);
    url.searchParams.set('month', dateStr);
    window.history.replaceState({}, '', url.toString());
  };

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", 
        theme === 'pleasure' 
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4",
        theme === 'pleasure' 
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-300">We couldn't load the events. Please try again later.</p>
        </div>
      </div>
    );
  }

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">

        {/* Featured Events Carousel */}
        <div className="mb-6 sm:mb-8">
          <FeaturedEventsCarousel />
        </div>

        {/* Month Filter */}
        <div className="mb-6">
          <MonthFilter 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            events={events || []}
          />
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredEvents.map((event) => (
              <ShowCard 
                key={event.id}
                show={event}
                interestedEvents={interestedEvents}
                onToggleInterested={handleToggleInterested}
                onApply={handleApply}
                onBuyTickets={handleBuyTickets}
                onShowDetails={handleShowDetails}
                onGetDirections={handleGetDirections}
                hasAppliedToEvent={hasAppliedToEvent}
                getApplicationStatus={getApplicationStatus}
                isApplying={isApplying}
              />
            ))
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={cn("text-xl font-semibold mb-2",
              theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
            )}>
              No shows found
            </div>
            <p className={cn("text-sm sm:text-base mb-4",
              theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'
            )}>
              Try adjusting your filters or check back later for new shows.
            </p>
            <button
              onClick={clearFilters}
              className={cn("px-4 py-2 rounded-lg transition-colors",
                theme === 'pleasure' 
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              )}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shows;
