
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApplications } from '@/hooks/useApplications';
import { useComedianApplications } from '@/hooks/useComedianApplications';
import { useEvents } from '@/hooks/data/useEvents';
import { useSpotAssignment } from '@/hooks/useSpotAssignment';
import ApplicationStats from '@/components/admin/ApplicationStats';
import ApplicationList from '@/components/admin/ApplicationList';
import ApplicationFilters from '@/components/admin/ApplicationFilters';
import BulkApplicationActions from '@/components/admin/BulkApplicationActions';
import SpotAssignmentManager from '@/components/events/SpotAssignmentManager';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ProfileContextBadge } from '@/components/profile/ProfileContextBadge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

// Comedian view component for their own applications
const ComedianApplicationsView = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const {
    applications,
    isLoading,
    error,
    withdrawApplication,
    isWithdrawing,
    getPendingApplications,
    getAcceptedApplications,
    getRejectedApplications
  } = useComedianApplications();

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'withdrawn': return 'outline';
      default: return 'secondary';
    }
  };

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
          <p className="text-sm opacity-80">{error instanceof Error ? error.message : 'Failed to load applications'}</p>
        </div>
      </div>
    );
  }

  const pending = getPendingApplications();
  const accepted = getAcceptedApplications();
  const rejected = getRejectedApplications();

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Applications</h1>
            <ProfileContextBadge />
          </div>
          <p className={cn(
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            Track your gig applications and their status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-gray-800/60 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{applications.length}</div>
              <div className="text-sm text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/40 border-yellow-700/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">{pending.length}</div>
              <div className="text-sm text-yellow-300/70">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-green-900/40 border-green-700/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{accepted.length}</div>
              <div className="text-sm text-green-300/70">Accepted</div>
            </CardContent>
          </Card>
          <Card className="bg-red-900/40 border-red-700/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">{rejected.length}</div>
              <div className="text-sm text-red-300/70">Declined</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card className="bg-gray-800/60 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400 mb-4">You haven't applied to any gigs yet.</p>
              <Button onClick={() => navigate('/shows')} variant="secondary">
                Browse Available Gigs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="bg-gray-800/60 border-gray-700 hover:bg-gray-800/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Event Image */}
                    {app.event.banner_url && (
                      <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={app.event.banner_url}
                          alt={app.event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {app.event.title}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status || 'pending'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {app.event.event_date
                              ? format(new Date(app.event.event_date), 'EEEE, MMMM d, yyyy')
                              : 'Date TBA'}
                          </span>
                        </div>
                        {app.event.start_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{app.event.start_time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{app.event.venue}, {app.event.city}</span>
                        </div>
                      </div>

                      {/* Applied info & spot type */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>Applied {app.applied_at ? format(new Date(app.applied_at), 'MMM d, yyyy') : ''}</span>
                        {app.spot_type && (
                          <>
                            <span>•</span>
                            <span>Requested: {app.spot_type}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 sm:items-end">
                      {app.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => withdrawApplication(app.id)}
                          disabled={isWithdrawing}
                          className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                        >
                          Withdraw
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/events/${app.event_id}`)}
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Event
                      </Button>
                    </div>
                  </div>

                  {/* Application Message */}
                  {app.message && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Your message:</span> {app.message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Promoter/Manager view for managing incoming applications
const PromoterApplicationsView = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { activeProfile } = useProfile();
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
    return (userEvents || []).map(event => ({
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Applications Management</h1>
            <ProfileContextBadge />
          </div>
          <p className={cn(
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            {activeProfile === 'promoter'
              ? 'Review and manage comedian applications for your events'
              : activeProfile === 'manager'
                ? 'View applications for your managed clients'
                : 'Applications for your events'}
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

// Main Applications page - determines which view to show based on user role
const Applications = () => {
  const { hasRole } = useAuth();

  // Check if user is a comedian (comedian or comedian_lite role)
  const isComedian = hasRole('comedian') || hasRole('comedian_lite');

  // Comedians see their own applications
  // Others (organization owners, co-promoters, etc.) see the promoter/manager view
  // The useApplications hook handles filtering to only show events they manage
  if (isComedian) {
    return <ComedianApplicationsView />;
  }

  // Default to promoter view for event managers (organization owners, co-promoters)
  return <PromoterApplicationsView />;
};

export default Applications;
