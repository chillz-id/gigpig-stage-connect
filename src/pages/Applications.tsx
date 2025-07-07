
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useApplications } from '@/hooks/useApplications';
import { useEvents } from '@/hooks/data/useEvents';
import ApplicationStats from '@/components/admin/ApplicationStats';
import ApplicationList from '@/components/admin/ApplicationList';
import ApplicationFilters from '@/components/admin/ApplicationFilters';
import BulkApplicationActions from '@/components/admin/BulkApplicationActions';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

const Applications = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Fetch real data
  const { applications, isLoading, updateApplication, bulkUpdateApplications } = useApplications();
  const { userEvents } = useEvents();
  
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [sortBy, setSortBy] = useState('applied_at_desc');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Transform applications to match the expected format
  const transformedApplications = useMemo(() => {
    return applications.map(app => ({
      id: app.id,
      comedian_id: app.comedian_id,
      comedian_name: app.comedian?.name || 'Unknown',
      comedian_avatar: app.comedian?.avatar_url,
      comedian_experience: app.comedian?.years_experience ? `${app.comedian.years_experience} years` : undefined,
      comedian_rating: undefined, // Not available in current schema
      event_id: app.event_id,
      event_title: app.event?.title || 'Unknown Event',
      event_venue: app.event?.venue || 'Unknown Venue',
      event_date: app.event?.event_date || '',
      applied_at: app.created_at,
      status: app.status,
      message: app.message,
      show_type: app.show_type || 'Spot',
    }));
  }, [applications]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    return transformedApplications
      .filter(app => {
        const matchesSearch = app.comedian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             app.event_title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEvent = eventFilter === 'all' || app.event_id === eventFilter;
        
        // Date range filter
        let matchesDateRange = true;
        if (dateRange.from || dateRange.to) {
          const appliedDate = new Date(app.applied_at);
          if (dateRange.from && appliedDate < dateRange.from) matchesDateRange = false;
          if (dateRange.to && appliedDate > dateRange.to) matchesDateRange = false;
        }
        
        return matchesSearch && matchesEvent && matchesDateRange;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'applied_at_desc':
            return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
          case 'applied_at_asc':
            return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
          case 'comedian_name':
            return a.comedian_name.localeCompare(b.comedian_name);
          case 'event_date':
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          default:
            return 0;
        }
      });
  }, [transformedApplications, searchTerm, eventFilter, sortBy, dateRange]);

  // Calculate stats
  const stats = useMemo(() => ({
    mc: transformedApplications.filter(app => app.show_type === 'MC').length,
    headliner: transformedApplications.filter(app => app.show_type === 'Headliner').length,
    unread: transformedApplications.filter(app => app.status === 'pending').length,
  }), [transformedApplications]);

  const handleSelectApplication = (applicationId: string, selected: boolean) => {
    setSelectedApplications(prev => 
      selected 
        ? [...prev, applicationId]
        : prev.filter(id => id !== applicationId)
    );
  };

  const handleBulkApprove = async (applicationIds: string[]) => {
    bulkUpdateApplications({ applicationIds, status: 'accepted' });
    setSelectedApplications([]);
  };

  const handleBulkHide = async (applicationIds: string[]) => {
    bulkUpdateApplications({ applicationIds, status: 'declined' });
    setSelectedApplications([]);
  };

  const handleApprove = (applicationId: string) => {
    updateApplication({ applicationId, status: 'accepted' });
  };

  const handleHide = (applicationId: string) => {
    updateApplication({ applicationId, status: 'declined' });
  };

  const handleViewProfile = (comedianId: string) => {
    // Find the application and use the comedian's profile_slug
    const application = applications.find(app => app.comedian_id === comedianId);
    if (application?.comedian?.profile_slug) {
      navigate(`/comedian/${application.comedian.profile_slug}`);
    } else {
      // Fallback: create slug from comedian name
      const transformedApp = transformedApplications.find(app => app.comedian_id === comedianId);
      if (transformedApp) {
        const fallbackSlug = transformedApp.comedian_name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/comedian/${fallbackSlug}`);
      }
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setEventFilter('all');
    setSortBy('applied_at_desc');
    setDateRange({ from: undefined, to: undefined });
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  // Transform events for the filter
  const eventOptions = useMemo(() => {
    return userEvents.map(event => ({
      id: event.id,
      title: event.title
    }));
  }, [userEvents]);

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Applications Management</h1>
          <p className={cn(
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            Review and manage comedian applications for your events
          </p>
        </div>

        <ApplicationStats stats={stats} />
        
        <ApplicationFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          eventFilter={eventFilter}
          setEventFilter={setEventFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          dateRange={dateRange}
          setDateRange={setDateRange}
          events={eventOptions}
          onClearFilters={handleClearFilters}
        />

        <BulkApplicationActions
          selectedApplications={selectedApplications}
          onBulkApprove={handleBulkApprove}
          onBulkHide={handleBulkHide}
          onClearSelection={() => setSelectedApplications([])}
        />

        <ApplicationList
          applications={filteredApplications}
          selectedApplications={selectedApplications}
          onSelectApplication={handleSelectApplication}
          onApprove={handleApprove}
          onHide={handleHide}
          onViewProfile={handleViewProfile}
        />
      </div>
    </div>
  );
};

export default Applications;
