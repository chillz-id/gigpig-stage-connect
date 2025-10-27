import React, { useState, useMemo } from 'react';
import { useEventsForListing } from '@/hooks/data/useEvents';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';
import { ShowCard } from '@/components/ShowCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ApplicationForm } from '@/components/ApplicationForm';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AlertCircle, Calendar } from 'lucide-react';
import { ShowTypeFilter, type ShowType } from '@/components/shows/ShowTypeFilter';
import { AgeRestrictionToggle, type AgeRestriction } from '@/components/shows/AgeRestrictionToggle';
import { ComedianSearchFilter } from '@/components/shows/ComedianSearchFilter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Shows page - Browse comedian shows and organization shows
// Displays shows posted by comedians and organizations
// Includes filters for show type, age restriction, and comedian search
const Shows = () => {
  const { theme } = useTheme();
  const { user, hasRole } = useAuth();

  // Filter states
  const [showType, setShowType] = useState<ShowType>('all');
  const [ageRestriction, setAgeRestriction] = useState<AgeRestriction>('all');
  const [comedianSearch, setComedianSearch] = useState('');
  const [showPastShows, setShowPastShows] = useState(false);

  // Fetch events
  const { events, isLoading, error } = useEventsForListing({
    include_past: showPastShows,
    include_drafts: false, // Only show published shows
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

  // Filter events based on show type, age restriction, and comedian search
  const filteredShows = useMemo(() => {
    if (!events) return [];

    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      const now = new Date();

      // Filter past shows
      if (!showPastShows && eventDate < now) {
        return false;
      }

      // Filter by show type
      if (showType !== 'all') {
        const eventType = event.type?.toLowerCase();
        if (eventType !== showType) {
          return false;
        }
      }

      // Filter by age restriction
      if (ageRestriction !== 'all') {
        const eventAgeRestriction = event.age_restriction?.toLowerCase();
        if (ageRestriction === 'over_18') {
          // Show only 18+ events
          if (!eventAgeRestriction || !eventAgeRestriction.includes('18+')) {
            return false;
          }
        } else if (ageRestriction === 'under_18') {
          // Show only under 18 / all ages events
          if (eventAgeRestriction && eventAgeRestriction.includes('18+')) {
            return false;
          }
        }
      }

      // Filter by comedian search
      if (comedianSearch) {
        const searchLower = comedianSearch.toLowerCase();
        const eventName = event.name?.toLowerCase() || '';
        const eventTitle = event.title?.toLowerCase() || '';
        const eventDescription = event.description?.toLowerCase() || '';

        // Search in event name, title, and description
        const matchesSearch =
          eventName.includes(searchLower) ||
          eventTitle.includes(searchLower) ||
          eventDescription.includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [events, showType, ageRestriction, comedianSearch, showPastShows]);

  // Sort by date (upcoming first)
  const sortedShows = useMemo(() => {
    return [...filteredShows].sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      return dateA - dateB;
    });
  }, [filteredShows]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error Loading Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen',
      theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-br from-purple-50 to-pink-50'
    )}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={cn(
            'text-4xl font-bold mb-2',
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          )}>
            Comedy Shows
          </h1>
          <p className={cn(
            'text-lg',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Discover comedian shows and organization events
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Shows</CardTitle>
            <CardDescription>
              Narrow down shows by type, age restriction, or search for specific comedians
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ShowTypeFilter value={showType} onChange={setShowType} />
              <AgeRestrictionToggle value={ageRestriction} onChange={setAgeRestriction} />
              <ComedianSearchFilter value={comedianSearch} onChange={setComedianSearch} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="show-past-shows"
                checked={showPastShows}
                onChange={(e) => setShowPastShows(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="show-past-shows" className="text-sm cursor-pointer">
                Show past shows
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : sortedShows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Shows Found</h3>
              <p className="text-gray-600">
                {comedianSearch || showType !== 'all' || ageRestriction !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Check back soon for upcoming shows!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {sortedShows.length} {sortedShows.length === 1 ? 'show' : 'shows'} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedShows.map((event) => (
                <ShowCard
                  key={event.id}
                  event={event}
                  onToggleInterested={handleToggleInterested}
                  onApply={handleApply}
                  onBuyTickets={handleBuyTickets}
                  onShowDetails={handleShowDetails}
                  onGetDirections={handleGetDirections}
                  isInterested={interestedEvents.has(event.id)}
                  hasApplied={hasAppliedToEvent(event.id)}
                  applicationStatus={getApplicationStatus(event.id)}
                  isApplying={isApplying}
                />
              ))}
            </div>
          </>
        )}

        {/* Application Form Modal */}
        {showApplicationForm && selectedEventForApplication && (
          <ApplicationForm
            event={selectedEventForApplication}
            onClose={() => setShowApplicationForm(false)}
            onSubmit={handleSubmitApplication}
          />
        )}
      </div>
    </div>
  );
};

export default Shows;
