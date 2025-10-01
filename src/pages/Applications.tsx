
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useApplications } from '@/hooks/useApplications';
import { useEvents } from '@/hooks/data/useEvents';
import { useSpotAssignment } from '@/hooks/useSpotAssignment';
import ApplicationStats from '@/components/admin/ApplicationStats';
import ApplicationList from '@/components/admin/ApplicationList';
import ApplicationFilters from '@/components/admin/ApplicationFilters';
import BulkApplicationActions from '@/components/admin/BulkApplicationActions';
import SpotAssignmentManager from '@/components/events/SpotAssignmentManager';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Applications = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Fetch real data
  const { applications, isLoading, error, updateApplication, bulkUpdateApplications } = useApplications();
  const { userEvents } = useEvents();
  
  // Debug logging
  console.log('Applications page - isLoading:', isLoading);
  console.log('Applications page - error:', error);
  console.log('Applications page - applications:', applications?.length || 0);
  
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [sortBy, setSortBy] = useState('applied_at_desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [spotTypeFilter, setSpotTypeFilter] = useState('all');
  const [confirmationFilter, setConfirmationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  
  // Spot assignment dialog
  const [selectedApplicationForSpot, setSelectedApplicationForSpot] = useState<string | null>(null);
  const { assignSpotById } = useSpotAssignment();

  // Transform applications to match the expected format
  const transformedApplications = useMemo(() => {
    return applications.map(app => {
      // Check if comedian has an assigned spot for this event
      const assignedSpot = app.event?.event_spots?.find(
        spot => spot.comedian_id === app.comedian_id
      );
      
      return {
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
        applied_at: app.applied_at,
        status: app.status,
        message: app.message,
        spot_type: app.spot_type || 'Guest',
        availability_confirmed: app.availability_confirmed,
        requirements_acknowledged: app.requirements_acknowledged,
        // Spot assignment info
        spot_assigned: !!assignedSpot,
        spot_name: assignedSpot?.spot_name,
        confirmation_status: assignedSpot?.confirmation_status,
        confirmation_deadline: assignedSpot?.confirmation_deadline,
        confirmed_at: assignedSpot?.confirmed_at,
        declined_at: assignedSpot?.declined_at,
      };
    });
  }, [applications]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    return transformedApplications
      .filter(app => {
        const matchesSearch = app.comedian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             app.event_title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEvent = eventFilter === 'all' || app.event_id === eventFilter;
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        const matchesSpotType = spotTypeFilter === 'all' || app.spot_type === spotTypeFilter;
        
        // Confirmation status filter
        let matchesConfirmation = true;
        if (confirmationFilter !== 'all') {
          if (confirmationFilter === 'assigned') matchesConfirmation = app.spot_assigned;
          else if (confirmationFilter === 'unassigned') matchesConfirmation = !app.spot_assigned;
          else if (confirmationFilter === 'confirmed') matchesConfirmation = app.confirmation_status === 'confirmed';
          else if (confirmationFilter === 'pending') matchesConfirmation = app.spot_assigned && app.confirmation_status === 'pending';
          else if (confirmationFilter === 'declined') matchesConfirmation = app.confirmation_status === 'declined';
          else if (confirmationFilter === 'overdue') {
            matchesConfirmation = app.spot_assigned && 
              app.confirmation_status === 'pending' && 
              app.confirmation_deadline && 
              new Date(app.confirmation_deadline) < new Date();
          }
        }
        
        // Date range filter
        let matchesDateRange = true;
        if (dateRange.from || dateRange.to) {
          const appliedDate = new Date(app.applied_at);
          if (dateRange.from && appliedDate < dateRange.from) matchesDateRange = false;
          if (dateRange.to && appliedDate > dateRange.to) matchesDateRange = false;
        }
        
        return matchesSearch && matchesEvent && matchesStatus && matchesSpotType && matchesConfirmation && matchesDateRange;
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
  }, [confirmationFilter, dateRange, eventFilter, searchTerm, sortBy, spotTypeFilter, statusFilter, transformedApplications]);

  // Calculate stats
  const stats = useMemo(() => ({
    mc: transformedApplications.filter(app => app.spot_type === 'MC').length,
    feature: transformedApplications.filter(app => app.spot_type === 'Feature').length,
    headliner: transformedApplications.filter(app => app.spot_type === 'Headliner').length,
    guest: transformedApplications.filter(app => app.spot_type === 'Guest').length,
    pending: transformedApplications.filter(app => app.status === 'pending').length,
    accepted: transformedApplications.filter(app => app.status === 'accepted').length,
    rejected: transformedApplications.filter(app => app.status === 'rejected').length,
    withdrawn: transformedApplications.filter(app => app.status === 'withdrawn').length,
    assigned: transformedApplications.filter(app => app.spot_assigned).length,
    confirmed: transformedApplications.filter(app => app.confirmation_status === 'confirmed').length,
    overdue: transformedApplications.filter(app => 
      app.spot_assigned && 
      app.confirmation_status === 'pending' && 
      app.confirmation_deadline && 
      new Date(app.confirmation_deadline) < new Date()
    ).length,
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
    bulkUpdateApplications({ applicationIds, status: 'rejected' });
    setSelectedApplications([]);
  };

  const handleApprove = (applicationId: string) => {
    updateApplication({ applicationId, status: 'accepted' });
    toast({
      title: "Application Accepted",
      description: "The comedian has been notified of their acceptance."
    });
  };

  const handleHide = (applicationId: string) => {
    updateApplication({ applicationId, status: 'rejected' });
    toast({
      title: "Application Rejected",
      description: "The application has been rejected."
    });
  };
  
  const handleAssignSpot = (applicationId: string) => {
    setSelectedApplicationForSpot(applicationId);
  };
  
  const handleSpotAssigned = async (spotId: string) => {
    if (selectedApplicationForSpot) {
      const application = transformedApplications.find(app => app.id === selectedApplicationForSpot);
      if (application) {
        try {
          await assignSpotById(spotId, application.comedian_id);
          toast({
            title: "Spot Assigned",
            description: `${application.comedian_name} has been assigned to the spot and notified.`
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to assign spot. Please try again.",
            variant: "destructive"
          });
        }
      }
      setSelectedApplicationForSpot(null);
    }
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
    setStatusFilter('all');
    setSpotTypeFilter('all');
    setConfirmationFilter('all');
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
  
  if (error) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-2">Error Loading Applications</h2>
          <p className="text-sm opacity-80">{error.message || 'Failed to load applications'}</p>
        </div>
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
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          spotTypeFilter={spotTypeFilter}
          setSpotTypeFilter={setSpotTypeFilter}
          confirmationFilter={confirmationFilter}
          setConfirmationFilter={setConfirmationFilter}
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
          onAssignSpot={handleAssignSpot}
        />
        
        {/* Spot Assignment Dialog */}
        {selectedApplicationForSpot && (
          <Dialog open={!!selectedApplicationForSpot} onOpenChange={() => setSelectedApplicationForSpot(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assign Spot</DialogTitle>
              </DialogHeader>
              {(() => {
                const application = transformedApplications.find(app => app.id === selectedApplicationForSpot);
                if (!application) return null;
                
                return (
                  <SpotAssignmentManager
                    eventId={application.event_id}
                    onSpotAssigned={handleSpotAssigned}
                    preselectedComedianId={application.comedian_id}
                  />
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Applications;
