
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventsForListing } from '@/hooks/data/useEvents';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { FeaturedEventsCarousel } from '@/components/FeaturedEventsCarousel';
import { EventFilters } from '@/components/events/EventFilters';
import { ShowCard } from '@/components/ShowCard';
import { MonthFilter } from '@/components/MonthFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ApplicationForm } from '@/components/ApplicationForm';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Users, AlertCircle, Clock, Filter, Eye } from 'lucide-react';

const Shows = () => {
  const { theme } = useTheme();
  const { user, hasRole } = useAuth();
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showDateRange, setShowDateRange] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showMyDrafts, setShowMyDrafts] = useState(false);
  const [showOnlyMyEvents, setShowOnlyMyEvents] = useState(false);

  // Check if user can see drafts (promoters and admins)
  const canSeeDrafts = hasRole('promoter') || hasRole('admin');

  const { events, isLoading, error } = useEventsForListing({
    include_past: showPastEvents,
    include_drafts: showMyDrafts && canSeeDrafts,
    owner_id: showMyDrafts ? user?.id : undefined,
    my_events: showOnlyMyEvents
  });
  
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
    handleGetDirections,
    selectedEventForApplication,
    showApplicationForm,
    handleSubmitApplication,
    setShowApplicationForm
  } = useBrowseLogic();

  // Filter events based on selected month/year, date range, and other filters
  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      
      // Date filtering logic - use date range if set, otherwise use month/year
      let matchesDate = true;
      if (useAdvancedFilters && (dateRange.start || dateRange.end)) {
        // Custom date range filtering
        if (dateRange.start && eventDate < dateRange.start) {
          matchesDate = false;
        }
        if (dateRange.end && eventDate > dateRange.end) {
          matchesDate = false;
        }
      } else if (!useAdvancedFilters) {
        // Month/year filtering (default behavior)
        matchesDate = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
      }
      
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === '' || 
        event.city?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesType = typeFilter === '' || event.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      
      // Filter drafts for non-owners
      const canViewEvent = event.status !== 'draft' || 
        (showMyDrafts && (event.promoter_id === user?.id || event.co_promoter_ids?.includes(user?.id || '')));
      
      return matchesDate && matchesSearch && matchesLocation && matchesType && matchesStatus && canViewEvent;
    }).sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      
      switch (sortBy) {
        case 'date':
          return dateA - dateB;
        case 'date-desc':
          return dateB - dateA;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'popularity':
          // Sort by tickets sold or applications count
          const popularityA = (a.tickets_sold || 0) + (a.applications?.length || 0);
          const popularityB = (b.tickets_sold || 0) + (b.applications?.length || 0);
          return popularityB - popularityA;
        case 'applications':
          return (b.applications?.length || 0) - (a.applications?.length || 0);
        default:
          return dateA - dateB;
      }
    });
  }, [events, selectedMonth, selectedYear, dateRange, searchTerm, locationFilter, typeFilter, statusFilter, sortBy, useAdvancedFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setStatusFilter('all');
    setSortBy('date');
    setDateRange({ start: null, end: null });
    setShowDateRange(false);
    setUseAdvancedFilters(false);
    setShowPastEvents(false);
    setShowMyDrafts(false);
    setShowOnlyMyEvents(false);
  };

  // Calculate active filters count
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (locationFilter) count++;
    if (typeFilter) count++;
    if (statusFilter !== 'all') count++;
    if (sortBy !== 'date') count++;
    if (dateRange.start || dateRange.end) count++;
    return count;
  }, [searchTerm, locationFilter, typeFilter, statusFilter, sortBy, dateRange]);

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

        {/* Filter Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Discover Events</h2>
            <div className="flex gap-2">
              {/* Additional filter buttons */}
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2",
                  showPastEvents
                    ? theme === 'pleasure' 
                      ? 'bg-purple-500/30 hover:bg-purple-500/40 text-white border border-purple-400/30'
                      : 'bg-red-600/30 hover:bg-red-600/40 text-white border border-red-600/30'
                    : theme === 'pleasure' 
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                )}
              >
                <Clock size={14} />
                {showPastEvents ? 'Hide Past' : 'Show Past'}
              </button>
              
              {canSeeDrafts && (
                <button
                  onClick={() => setShowMyDrafts(!showMyDrafts)}
                  className={cn(
                    "px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2",
                    showMyDrafts
                      ? theme === 'pleasure' 
                        ? 'bg-purple-500/30 hover:bg-purple-500/40 text-white border border-purple-400/30'
                        : 'bg-red-600/30 hover:bg-red-600/40 text-white border border-red-600/30'
                      : theme === 'pleasure' 
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  )}
                >
                  <Eye size={14} />
                  {showMyDrafts ? 'Hide Drafts' : 'My Drafts'}
                </button>
              )}
              
              {user && (
                <button
                  onClick={() => setShowOnlyMyEvents(!showOnlyMyEvents)}
                  className={cn(
                    "px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2",
                    showOnlyMyEvents
                      ? theme === 'pleasure' 
                        ? 'bg-purple-500/30 hover:bg-purple-500/40 text-white border border-purple-400/30'
                        : 'bg-red-600/30 hover:bg-red-600/40 text-white border border-red-600/30'
                      : theme === 'pleasure' 
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  )}
                >
                  <Filter size={14} />
                  {showOnlyMyEvents ? 'All Events' : 'My Events'}
                </button>
              )}
              
              <button
                onClick={() => {
                  setUseAdvancedFilters(!useAdvancedFilters);
                  if (!useAdvancedFilters) {
                    // Reset date range when switching to advanced filters
                    setDateRange({ start: null, end: null });
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                  theme === 'pleasure' 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                )}
              >
                {useAdvancedFilters ? 'Use Month View' : 'Advanced Filters'}
              </button>
            </div>
          </div>

          {/* Show either Month Filter or Advanced Filters */}
          {!useAdvancedFilters ? (
            <MonthFilter 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={handleMonthChange}
              events={events || []}
            />
          ) : (
            <EventFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          )}
        </div>

        {/* Results Summary */}
        {filteredEvents.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-white/80">
              Found <span className="font-semibold">{filteredEvents.length}</span> events
              {activeFiltersCount > 0 && ` matching your filters`}
              {showPastEvents && ' (including past events)'}
              {showMyDrafts && ' (including your drafts)'}
              {showOnlyMyEvents && ' (your events only)'}
            </p>
            {filteredEvents.length > 10 && (
              <p className="text-white/60 text-sm">
                Showing all results
              </p>
            )}
          </div>
        )}

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredEvents.map((event) => {
              const isPast = event.is_past;
              const isDraft = event.status === 'draft';
              const isCancelled = event.status === 'cancelled';
              
              return (
                <div key={event.id} className="relative">
                  {/* Status badges */}
                  {(isPast || isDraft || isCancelled) && (
                    <div className="absolute top-2 left-2 z-10 flex gap-2">
                      {isPast && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-800/80 text-gray-300 rounded-full backdrop-blur-sm">
                          Past Event
                        </span>
                      )}
                      {isDraft && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-600/80 text-yellow-100 rounded-full backdrop-blur-sm">
                          Draft
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-600/80 text-white rounded-full backdrop-blur-sm">
                          Cancelled
                        </span>
                      )}
                    </div>
                  )}
                  <ShowCard 
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={cn(
              "rounded-2xl p-12 max-w-2xl mx-auto",
              theme === 'pleasure' 
                ? 'bg-white/[0.08] backdrop-blur-md border border-white/[0.20]'
                : 'bg-gray-800/60 backdrop-blur-md border border-gray-600'
            )}>
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className={cn("text-2xl font-bold mb-3",
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-200'
              )}>
                No Events Found
              </h3>
              <p className={cn("text-base mb-6 max-w-md mx-auto",
                theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'
              )}>
                {activeFiltersCount > 0 
                  ? "No events match your current filters. Try adjusting your search criteria."
                  : showPastEvents
                    ? "No past or upcoming events found. Check back later for new shows!"
                    : showOnlyMyEvents
                      ? "You don't have any events yet. Create your first event to get started!"
                      : showMyDrafts
                        ? "You don't have any draft events. Start creating an event to see it here!"
                        : "No upcoming events found for this period. Try showing past events or selecting a different date range."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className={cn("px-6 py-3 rounded-lg transition-colors font-medium",
                      theme === 'pleasure' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    )}
                  >
                    Clear All Filters
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className={cn("px-6 py-3 rounded-lg transition-colors font-medium",
                    theme === 'pleasure' 
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  )}
                >
                  Refresh Page
                </button>
              </div>
              
              {activeFiltersCount === 0 && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-3">Quick tips:</p>
                  <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Try browsing different months using the month selector above</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Events are added regularly across all major cities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Follow us for updates on new shows and events</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Application Form Dialog */}
      {selectedEventForApplication && (
        <ApplicationForm
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
          eventId={selectedEventForApplication.id}
          eventTitle={selectedEventForApplication.title}
          onSubmit={handleSubmitApplication}
          isSubmitting={isApplying}
        />
      )}
    </div>
  );
};

export default Shows;
