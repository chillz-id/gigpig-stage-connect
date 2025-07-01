
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

const Browse = () => {
  const { theme } = useTheme();
  const location = useLocation();
  
  // Get month from URL params
  const searchParams = new URLSearchParams(location.search);
  const monthParam = searchParams.get('month');
  const initialMonth = monthParam ? new Date(monthParam) : new Date();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialMonth);

  const { data: events, isLoading, error } = useEvents();
  
  const {
    filteredEvents,
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    showTypeFilter,
    setShowTypeFilter,
    sortBy,
    setSortBy,
    clearFilters,
  } = useBrowseLogic(events || [], selectedMonth);

  // Update URL when month changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('month', selectedMonth.toISOString().slice(0, 7));
    window.history.replaceState({}, '', url.toString());
  }, [selectedMonth]);

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
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Comedy Shows</h1>
          <p className={cn("text-sm sm:text-base", 
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            Discover amazing comedy shows happening around Sydney
          </p>
        </div>

        {/* Featured Events Carousel */}
        <div className="mb-6 sm:mb-8">
          <FeaturedEventsCarousel events={events || []} />
        </div>

        {/* Month Filter */}
        <div className="mb-6">
          <MonthFilter 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          showTypeFilter={showTypeFilter}
          setShowTypeFilter={setShowTypeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onClearFilters={clearFilters}
          totalResults={filteredEvents.length}
        />

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.map((event) => (
              <ShowCard key={event.id} event={event} />
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

export default Browse;
