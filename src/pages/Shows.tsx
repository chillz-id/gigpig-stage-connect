
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventsForListing } from '@/hooks/data/useEvents';
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
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showDateRange, setShowDateRange] = useState(false);

  const { events, isLoading, error } = useEventsForListing();
  
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

  // Filter events based on selected month/year, date range, and other filters
  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      
      // Date filtering logic - use date range if set, otherwise use month/year
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        // Custom date range filtering
        if (dateRange.start && eventDate < dateRange.start) {
          matchesDate = false;
        }
        if (dateRange.end && eventDate > dateRange.end) {
          matchesDate = false;
        }
      } else {
        // Month/year filtering (default behavior)
        matchesDate = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
      }
      
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === '' || 
        event.city?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesType = typeFilter === '' || event.type === typeFilter;
      
      return matchesDate && matchesSearch && matchesLocation && matchesType;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [events, selectedMonth, selectedYear, dateRange, searchTerm, locationFilter, typeFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setSortBy('date');
    setDateRange({ start: null, end: null });
    setShowDateRange(false);
  };

  const handleDateRangeChange = (range: { start: Date | null; end: Date | null }) => {
    setDateRange(range);
    // Clear month/year selection when using custom date range
    if (range.start || range.end) {
      // Don't update month/year when using custom range
    } else {
      // Reset to current month when clearing date range
      const now = new Date();
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    }
  };

  const toggleDateRangeMode = () => {
    setShowDateRange(!showDateRange);
    if (!showDateRange) {
      // Clear existing date range when switching to date range mode
      setDateRange({ start: null, end: null });
    }
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

        {/* Date Filters */}
        <div className="mb-6 space-y-4">
          {/* Toggle between Month Filter and Date Range */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDateRangeMode}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                theme === 'pleasure' 
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              )}
            >
              {showDateRange ? 'Use Month Filter' : 'Use Date Range'}
            </button>
            
            {(dateRange.start || dateRange.end || showDateRange) && (
              <button
                onClick={() => {
                  setDateRange({ start: null, end: null });
                  setShowDateRange(false);
                }}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors text-sm",
                  theme === 'pleasure' 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30'
                    : 'bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-600/30'
                )}
              >
                Clear Date Filter
              </button>
            )}
          </div>
          
          {/* Show either Month Filter or Date Range based on mode */}
          {!showDateRange ? (
            <MonthFilter 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={handleMonthChange}
              events={events || []}
            />
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/[0.20]">
              <h3 className="text-lg font-semibold text-white mb-3">Custom Date Range</h3>
              <div className="max-w-md">
                <SearchAndFilters
                  searchTerm=""
                  setSearchTerm={() => {}}
                  locationFilter=""
                  setLocationFilter={() => {}}
                  typeFilter=""
                  setTypeFilter={() => {}}
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  showDateRange={true}
                />
              </div>
              {(dateRange.start || dateRange.end) && (
                <div className="mt-3 text-sm text-white/80">
                  Showing events {dateRange.start ? `from ${dateRange.start.toLocaleDateString()}` : ''}
                  {dateRange.start && dateRange.end ? ' ' : ''}
                  {dateRange.end ? `to ${dateRange.end.toLocaleDateString()}` : ''}
                </div>
              )}
            </div>
          )}
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
            ))}
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
