
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSessionCalendar } from '@/hooks/useSessionCalendar';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { EventFilters } from '@/components/events/EventFilters';
import { ShowCard } from '@/components/ShowCard';
import { MonthFilter } from '@/components/MonthFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ApplicationForm } from '@/components/ApplicationForm';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ProfileContextBadge } from '@/components/profile/ProfileContextBadge';
import { cn } from '@/lib/utils';
import { Calendar, CalendarDays, List, MapPin, Users, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { formatEventTime } from '@/utils/formatEventTime';
import { HorizontalAuthBanner } from '@/components/auth/HorizontalAuthBanner';
import { EventAvailabilityCard } from '@/components/comedian/EventAvailabilityCard';
import { useAvailabilitySelection } from '@/hooks/useAvailabilitySelection';
import { Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ImageCrop } from '@/components/ImageCrop';
import { CalendarGridView } from '@/components/gigs/CalendarGridView';
import { BrowseEventListView } from '@/components/gigs/BrowseEventListView';
import { DayOfWeekSelector } from '@/components/gigs/DayOfWeekSelector';
import { LoadMoreMonthButton } from '@/components/gigs/LoadMoreMonthButton';
import { MobileCalendarView } from '@/components/gigs/MobileCalendarView';
import { DayEventsModal } from '@/components/gigs/DayEventsModal';
import { CoinAnimationPortal, useCoinAnimation } from '@/components/gigs/CoinAnimation';
import { usePrefetchNextMonth } from '@/hooks/usePrefetchNextMonth';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { useFirstEventMonth } from '@/hooks/useFirstEventMonth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Gigs page - Browse and discover comedy gigs
// Previously called "Shows" - renamed to "Gigs" for clarity
// The /shows route will be used for a new feature showing comedian shows + organization shows
const Gigs = () => {
  const { theme } = useTheme();
  const { user, hasRole, signOut, profile } = useAuth();
  const { activeProfile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useMobileLayout();

  // Get month from URL params
  const searchParams = new URLSearchParams(location.search);
  const monthParam = searchParams.get('month');
  const initialDate = monthParam ? new Date(monthParam) : new Date();

  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear());

  // Progressive loading state - tracks start and end of loaded range
  // Initially: current month + next month
  const [loadedMonthsStart, setLoadedMonthsStart] = useState<Date>(() => {
    const now = new Date();
    return startOfMonth(now); // Start of current month
  });
  const [loadedMonthsEnd, setLoadedMonthsEnd] = useState<Date>(() => {
    const now = new Date();
    return endOfMonth(addMonths(now, 1)); // End of next month
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showDateRange, setShowDateRange] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('sydney'); // 'sydney' or 'melbourne'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Image upload states for ProfileHeader
  const [selectedImage, setSelectedImage] = useState('');
  const [showImageCrop, setShowImageCrop] = useState(false);

  // Day events modal state (for mobile calendar)
  const [dayModalState, setDayModalState] = useState<{
    isOpen: boolean;
    date: Date | null;
    events: Array<{
      id: string;
      title: string;
      event_date: string;
      start_time: string | null;
      venue: string | null;
    }>;
  }>({ isOpen: false, date: null, events: [] });

  // Coin animation hook (for single-event taps)
  const { animation: coinAnimation, triggerAnimation, clearAnimation } = useCoinAnimation();

  // Get first event month for the selected city (for auto-jump)
  const { firstEventMonth, hasEvents: cityHasEvents, isLoading: isLoadingFirstEvent } = useFirstEventMonth({
    city: selectedCity,
    enabled: true,
  });

  // Track which city we've already jumped for (prevents infinite loops)
  // Initialize to current city to prevent auto-jump on first load
  const hasJumpedForCityRef = useRef<string>(selectedCity);

  // Auto-jump to first month with events when switching cities
  useEffect(() => {
    // Wait for loading to complete and data to be available
    if (isLoadingFirstEvent) return;

    // Only jump if we have data and haven't already jumped for this city
    if (firstEventMonth && cityHasEvents && hasJumpedForCityRef.current !== selectedCity) {
      // Mark that we've handled this city
      hasJumpedForCityRef.current = selectedCity;

      const firstEventDate = startOfMonth(new Date(firstEventMonth.year, firstEventMonth.month, 1));

      // Update loaded range to first event month + next month
      const nextMonthEnd = endOfMonth(addMonths(firstEventDate, 1));
      setLoadedMonthsStart(firstEventDate);
      setLoadedMonthsEnd(nextMonthEnd);
      setSelectedMonth(firstEventMonth.month);
      setSelectedYear(firstEventMonth.year);

      toast({
        title: `Jumped to ${format(firstEventDate, 'MMMM yyyy')}`,
        description: `First available events for ${selectedCity === 'melbourne' ? 'Melbourne' : 'Sydney'}`,
      });
    }
  }, [selectedCity, firstEventMonth, cityHasEvents, isLoadingFirstEvent]);

  // Format a Date as yyyy-mm-dd using local time (not UTC) to avoid
  // timezone shifts where e.g. Jan 31 00:00 AEDT becomes Jan 30 in UTC.
  const toLocalDateString = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Calculate date range for session calendar based on view mode and filters
  const getDateRange = () => {
    if (useAdvancedFilters && (dateRange.start || dateRange.end)) {
      // Use custom date range from advanced filters
      const start = dateRange.start || new Date(selectedYear, selectedMonth, 1);
      const end = dateRange.end || new Date(selectedYear, selectedMonth + 1, 0);
      return {
        startDate: toLocalDateString(start),
        endDate: toLocalDateString(end)
      };
    } else if (viewMode === 'list') {
      // List view: Show from loadedMonthsStart to loadedMonthsEnd
      return {
        startDate: toLocalDateString(loadedMonthsStart),
        endDate: toLocalDateString(loadedMonthsEnd)
      };
    } else {
      // Calendar view: Use single month range
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0);
      return {
        startDate: toLocalDateString(start),
        endDate: toLocalDateString(end)
      };
    }
  };

  // Handler to load the next month (for progressive loading)
  const handleLoadNextMonth = useCallback(() => {
    setLoadedMonthsEnd(prevEnd => endOfMonth(addMonths(prevEnd, 1)));
  }, []);

  // Get the next month label for the "See More" button
  const getNextMonthLabel = () => {
    const nextMonth = addMonths(loadedMonthsEnd, 1);
    return format(nextMonth, 'MMMM');
  };

  const { startDate, endDate } = getDateRange();

  // Map selected city to timezone for API query
  const getTimezoneFromCity = (city: string): string => {
    switch (city) {
      case 'sydney':
        return 'Australia/Sydney';
      case 'melbourne':
        return 'Australia/Melbourne';
      default:
        return 'Australia/Sydney'; // Default to Sydney
    }
  };

  const selectedTimezone = getTimezoneFromCity(selectedCity);

  // Prefetch adjacent months for instant navigation
  const { prefetchAdjacentMonths } = usePrefetchNextMonth({
    currentMonth: new Date(selectedYear, selectedMonth),
    timezone: selectedTimezone,
  });

  // Trigger prefetch when month changes
  useEffect(() => {
    prefetchAdjacentMonths();
  }, [selectedMonth, selectedYear, prefetchAdjacentMonths]);

  // Handler for mobile calendar month change
  const handleMobileMonthChange = useCallback((newDate: Date) => {
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  }, []);

  const { events, isLoading, error } = useSessionCalendar({
    startDate,
    endDate,
    includePast: false,
    timezone: selectedTimezone
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

  // Availability selection hook (only for authenticated comedians)
  const isComedian = user && (hasRole('comedian') || hasRole('comedian_lite'));
  const { selectedEvents, toggleEvent, selectWeekday, isSaving, lastSaved, hasPendingChanges } = useAvailabilitySelection(
    isComedian && user ? user.id : null
  );

  // Handler for mobile calendar day clicks
  const handleMobileDayClick = useCallback((date: Date, dayEvents: Array<{
    id: string;
    title: string;
    event_date: string;
    start_time: string | null;
    venue: string | null;
  }>) => {
    if (dayEvents.length === 0) return;

    if (dayEvents.length === 1) {
      // Single event: Mark available + coin animation
      const event = dayEvents[0];
      if (isComedian && toggleEvent) {
        // Get the element position for animation
        const activeElement = document.activeElement;
        if (activeElement && 'getBoundingClientRect' in activeElement) {
          const eventTime = formatEventTime(event.event_date);
          triggerAnimation(eventTime, activeElement as HTMLElement);
        }
        toggleEvent(event.id);
      }
    } else {
      // Multiple events: Open modal
      setDayModalState({
        isOpen: true,
        date,
        events: dayEvents,
      });
    }
  }, [isComedian, toggleEvent, triggerAnimation]);

  // Filter events based on selected month/year, date range, and other filters
  const filteredEvents = React.useMemo(() => {
    if (!events) return [];

    return events.filter(event => {
      const eventDate = new Date(event.event_date);

      const now = new Date();

      // Date filtering already handled by useSessionCalendar (startDate/endDate)
      // No need for additional date filtering here

      // Note: Past events filtering is handled by useSessionCalendar via includePast option

      const matchesSearch = searchTerm === '' ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.venue?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === '' ||
        event.city?.toLowerCase().includes(locationFilter.toLowerCase());

      // Note: Scraped events don't have show type or age restriction data
      // These filters are not applicable for session_complete events

      return matchesSearch && matchesLocation;
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
          // Sort by tickets sold (from session_complete)
          const ticketsA = (a as any).total_ticket_count || 0;
          const ticketsB = (b as any).total_ticket_count || 0;
          return ticketsB - ticketsA;
        default:
          return dateA - dateB;
      }
    });
  }, [events, locationFilter, sortBy, useAdvancedFilters, searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setSortBy('date');
    setDateRange({ start: null, end: null });
    setShowDateRange(false);
    setUseAdvancedFilters(false);
  };

  // Calculate active filters count
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (locationFilter) count++;
    if (sortBy !== 'date') count++;
    if (dateRange.start || dateRange.end) count++;
    return count;
  }, [searchTerm, locationFilter, sortBy, dateRange]);

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

    // For list view, set the loaded range to clicked month + next month
    if (viewMode === 'list') {
      const clickedMonthStart = startOfMonth(new Date(year, month));
      const nextMonthEnd = endOfMonth(addMonths(clickedMonthStart, 1));
      setLoadedMonthsStart(clickedMonthStart);
      setLoadedMonthsEnd(nextMonthEnd);
    }

    // Update URL
    const url = new URL(window.location.href);
    const dateStr = new Date(year, month).toISOString().slice(0, 7);
    url.searchParams.set('month', dateStr);
    window.history.replaceState({}, '', url.toString());
  };

  // ProfileHeader handlers
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (croppedImage: string) => {
    try {
      // Convert base64 to blob
      const base64Response = await fetch(croppedImage);
      const blob = await base64Response.blob();

      // Create unique filename
      const fileExt = 'png';
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile Updated",
        description: "Your profile picture has been updated successfully."
      });

      setShowImageCrop(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out."
    });
    await signOut();
    navigate('/');
  };

  // Transform user data for ProfileHeader
  const userDataForProfile = user ? {
    id: user.id,
    email: user.email || '',
    name: profile?.name || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    stage_name: profile?.stage_name || '',
    name_display_preference: profile?.name_display_preference || 'real',
    bio: profile?.bio || '',
    location: profile?.location || '',
    phone: profile?.phone || '',
    instagram_url: profile?.instagram_url || '',
    twitter_url: profile?.twitter_url || '',
    website_url: profile?.website_url || '',
    youtube_url: profile?.youtube_url || '',
    facebook_url: profile?.facebook_url || '',
    tiktok_url: profile?.tiktok_url || '',
    custom_show_types: profile?.custom_show_types || [],
    avatar: profile?.avatar_url || '',
    role: hasRole('admin') ? 'admin' : 'comedian',
    isVerified: profile?.is_verified || false,
    membership: profile?.membership_tier || 'basic',
    joinDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : 'Recently',
    stats: {
      showsPerformed: profile?.shows_performed || 0
    }
  } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131b2b]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#131b2b]">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-300">We couldn't load the events. Please try again later.</p>
        </div>
      </div>
    );
  }

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-[#131b2b]';
    }
    return 'bg-[#131b2b]';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">

        {/* Auth/Profile Section */}
        {!user ? (
          <div className="mb-6">
            <HorizontalAuthBanner />
          </div>
        ) : userDataForProfile ? (
          <div className="mb-6">
            <ProfileHeader
              user={userDataForProfile}
              onImageSelect={handleImageSelect}
              onLogout={handleLogout}
            />
          </div>
        ) : null}

        {/* Day of Week Selector (comedians only, calendar view only) */}
        {isComedian && events && viewMode === 'calendar' && (
          <div className="mb-6">
            <DayOfWeekSelector
              events={events}
              selectedEventIds={selectedEvents}
              onSelectWeekday={selectWeekday}
            />
          </div>
        )}

        {/* Filter Mode Toggle */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                {activeProfile === 'comedian'
                  ? 'Find Gigs'
                  : activeProfile === 'promoter'
                    ? 'Manage Events'
                    : activeProfile === 'photographer' || activeProfile === 'videographer'
                      ? 'Browse Events'
                      : 'Discover Events'}
              </h2>
              <ProfileContextBadge size="sm" />
            </div>
            <div className="flex gap-2">
              {/* City filter dropdown */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger
                  className={cn(
                    "w-[140px] h-10 rounded-lg text-sm font-medium",
                    theme === 'pleasure'
                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                  )}
                >
                  <MapPin size={14} className="mr-1.5" />
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="sydney" className="text-white hover:bg-gray-700">
                    Sydney
                  </SelectItem>
                  <SelectItem value="melbourne" className="text-white hover:bg-gray-700">
                    Melbourne
                  </SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => {
                  setUseAdvancedFilters(!useAdvancedFilters);
                  if (!useAdvancedFilters) {
                    // Reset date range when switching to advanced filters
                    setDateRange({ start: null, end: null });
                  }
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  useAdvancedFilters
                    ? theme === 'pleasure'
                      ? 'bg-purple-600 text-white'
                      : 'bg-red-600 text-white'
                    : theme === 'pleasure'
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                )}
                title="Advanced Filters"
              >
                <SlidersHorizontal size={18} />
              </button>

              {/* View Mode Toggle */}
              <div className={cn(
                "flex gap-0.5 p-1 rounded-lg",
                theme === 'pleasure'
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-gray-700 border border-gray-600'
              )}>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'calendar'
                      ? theme === 'pleasure'
                        ? 'bg-purple-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                  title="Calendar View"
                >
                  <CalendarDays size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'list'
                      ? theme === 'pleasure'
                        ? 'bg-purple-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Month Filter - always shown, fetches events for selected city */}
          <MonthFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            city={selectedCity}
          />

          {/* Advanced Filters - shown below month filter when enabled */}
          {useAdvancedFilters && (
            <div className="mt-4">
              <EventFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredEvents.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-white/80">
              Found <span className="font-semibold">{filteredEvents.length}</span> events
              {activeFiltersCount > 0 && ` matching your filters`}
            </p>
            {filteredEvents.length > 10 && (
              <p className="text-white/60 text-sm">
                Showing all results
              </p>
            )}
          </div>
        )}

        {/* Save Status Indicator (for comedians only) */}
        {isComedian && (
          <div className="mb-4">
            {hasPendingChanges && !isSaving && (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <span>Pending changes...</span>
              </div>
            )}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Autosaving...</span>
              </div>
            )}
            {!isSaving && !hasPendingChanges && lastSaved && (
              <div className="text-sm text-green-400">
                Saved at {format(lastSaved, 'h:mma')}
              </div>
            )}
          </div>
        )}

        {/* Calendar or List View */}
        {filteredEvents.length > 0 ? (
          viewMode === 'calendar' ? (
            isMobile ? (
              <MobileCalendarView
                events={filteredEvents}
                selectedMonth={new Date(selectedYear, selectedMonth)}
                onMonthChange={handleMobileMonthChange}
                isComedian={isComedian ?? false}
                selectedEventIds={selectedEvents}
                onToggleAvailability={toggleEvent}
                onDayClick={handleMobileDayClick}
              />
            ) : (
              <CalendarGridView
                events={filteredEvents}
                selectedMonth={new Date(selectedYear, selectedMonth)}
                isComedian={isComedian}
                selectedEventIds={selectedEvents}
                onToggleAvailability={toggleEvent}
                onDayClick={handleMobileDayClick}
              />
            )
          ) : (
            <>
              <BrowseEventListView
                events={filteredEvents}
                isComedian={isComedian ?? false}
                selectedEventIds={selectedEvents}
                onToggleAvailability={toggleEvent}
              />
              {/* Load More Button for progressive loading */}
              <LoadMoreMonthButton
                nextMonthLabel={getNextMonthLabel()}
                onLoadMore={handleLoadNextMonth}
                isLoading={isLoading}
              />
            </>
          )
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
                  : "No upcoming events found for this period. Try selecting a different month or city."}
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

      {/* Image Crop Modal */}
      <ImageCrop
        isOpen={showImageCrop}
        onClose={() => setShowImageCrop(false)}
        onCrop={handleCroppedImage}
        imageUrl={selectedImage}
      />

      {/* Day Events Modal (for mobile calendar) */}
      <DayEventsModal
        isOpen={dayModalState.isOpen}
        onClose={() => setDayModalState(prev => ({ ...prev, isOpen: false }))}
        date={dayModalState.date}
        events={dayModalState.events}
        isComedian={isComedian ?? false}
        selectedEventIds={selectedEvents}
        onToggleAvailability={toggleEvent}
      />

      {/* Coin Animation Portal (for single-event taps) */}
      <CoinAnimationPortal
        animation={coinAnimation}
        onComplete={clearAnimation}
      />
    </div>
  );
};

export default Gigs;
