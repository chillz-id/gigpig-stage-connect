import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Check, EyeOff, UserCheck, AlertCircle } from 'lucide-react';
import ApplicationCard from './ApplicationCard';
import BulkApplicationActions from './BulkApplicationActions';
import SpotAssignmentManager from '@/components/events/SpotAssignmentManager';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useSpotAssignment } from '@/hooks/useSpotAssignment';
import { ApplicationData } from '@/services/applicationService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface EventApplicationsPanelProps {
  eventId: string;
  eventTitle: string;
}

const EventApplicationsPanel: React.FC<EventApplicationsPanelProps> = ({
  eventId,
  eventTitle,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedApplicationForSpot, setSelectedApplicationForSpot] = useState<string | null>(null);
  
  const {
    applications,
    isLoading,
    updateApplication,
    isUpdating,
  } = useEventApplications(eventId);
  
  const { assignSpot } = useSpotAssignment();

  // Mock data - replace with real data from useEventApplications
  const mockApplications: ApplicationData[] = [
    {
      id: '1',
      comedian_id: '1',
      comedian_name: 'Sarah Mitchell',
      comedian_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      comedian_experience: '3 years',
      comedian_rating: 4.2,
      event_id: eventId,
      event_title: eventTitle,
      event_venue: 'Comedy Club',
      event_date: '2024-12-20',
      applied_at: '2024-12-18T10:00:00Z',
      status: 'pending' as const,
      message: 'I would love to perform my new 5-minute set about modern dating.',
      show_type: 'MC',
    },
    {
      id: '2',
      comedian_id: '2',
      comedian_name: 'Mike Chen',
      comedian_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      comedian_experience: '2 years',
      comedian_rating: 4.5,
      event_id: eventId,
      event_title: eventTitle,
      event_venue: 'Comedy Club',
      event_date: '2024-12-20',
      applied_at: '2024-12-17T15:30:00Z',
      status: 'accepted' as const,
      message: 'Excited to bring my tech humor to your show!',
      show_type: 'Headliner',
    },
    {
      id: '3',
      comedian_id: '3',
      comedian_name: 'Lisa Rodriguez',
      comedian_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      comedian_experience: '1 year',
      comedian_rating: 3.8,
      event_id: eventId,
      event_title: eventTitle,
      event_venue: 'Comedy Club',
      event_date: '2024-12-20',
      applied_at: '2024-12-16T14:20:00Z',
      status: 'rejected' as const,
      message: 'Looking forward to sharing my observational comedy style.',
      show_type: 'MC',
    },
  ];

  // Use real applications if available, otherwise use mock data
  const displayApplications = applications?.length > 0 ? applications : mockApplications;
  
  const stats = useMemo(() => {
    const apps = displayApplications;
    const assigned = apps.filter(app => 
      app.spot_assigned || (app as any).spot_name
    ).length;
    const confirmed = apps.filter(app => 
      (app as any).confirmation_status === 'confirmed'
    ).length;
    const overdue = apps.filter(app => {
      const deadline = (app as any).confirmation_deadline;
      return deadline && new Date(deadline) < new Date() && 
        (app as any).confirmation_status === 'pending';
    }).length;
    
    return {
      total: apps.length,
      pending: apps.filter(app => app.status === 'pending').length,
      accepted: apps.filter(app => app.status === 'accepted').length,
      rejected: apps.filter(app => app.status === 'rejected').length,
      assigned,
      confirmed,
      overdue,
    };
  }, [displayApplications]);

  const handleSelectApplication = (applicationId: string, selected: boolean) => {
    setSelectedApplications(prev => 
      selected 
        ? [...prev, applicationId]
        : prev.filter(id => id !== applicationId)
    );
  };

  const handleBulkApprove = async (applicationIds: string[]) => {
    for (const id of applicationIds) {
      await updateApplication({ id, status: 'accepted' });
    }
    setSelectedApplications([]);
  };

  const handleBulkHide = async (applicationIds: string[]) => {
    for (const id of applicationIds) {
      await updateApplication({ id, status: 'rejected' });
    }
    setSelectedApplications([]);
  };

  const handleApprove = async (applicationId: string) => {
    await updateApplication({ id: applicationId, status: 'accepted' });
    toast({
      title: "Application Accepted",
      description: "The comedian has been notified of their acceptance."
    });
  };

  const handleHide = async (applicationId: string) => {
    await updateApplication({ id: applicationId, status: 'rejected' });
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
      const application = displayApplications.find(app => app.id === selectedApplicationForSpot);
      if (application) {
        await assignSpot(spotId, application.comedian_id);
        toast({
          title: "Spot Assigned",
          description: `${application.comedian_name} has been assigned to the spot and notified.`
        });
      }
      setSelectedApplicationForSpot(null);
    }
  };

  const handleViewProfile = (comedianId: string) => {
    // Find the comedian's name from mock applications to create the profile slug
    const application = mockApplications.find(app => app.comedian_id === comedianId);
    if (application) {
      // Create slug from comedian name
      const slug = application.comedian_name.toLowerCase().replace(/\s+/g, '-');
      navigate(`/comedian/${slug}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Applications for {eventTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{stats.total}</div>
              <div className="text-sm text-purple-200">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-purple-200">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
              <div className="text-sm text-purple-200">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-sm text-purple-200">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">{stats.assigned}</div>
              <div className="text-sm text-purple-200">Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.confirmed}</div>
              <div className="text-sm text-purple-200">Confirmed</div>
            </div>
            {stats.overdue > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-5 h-5" />
                  {stats.overdue}
                </div>
                <div className="text-sm text-purple-200">Overdue</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkApplicationActions
        selectedApplications={selectedApplications}
        onBulkApprove={handleBulkApprove}
        onBulkHide={handleBulkHide}
        onClearSelection={() => setSelectedApplications([])}
        isProcessing={isUpdating}
      />

      {/* Applications List */}
      <div className="space-y-4">
        {displayApplications.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
              <p className="text-purple-100">
                No comedians have applied for this event yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          displayApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              isSelected={selectedApplications.includes(application.id)}
              onSelect={handleSelectApplication}
              onApprove={handleApprove}
              onHide={handleHide}
              onViewProfile={handleViewProfile}
              onAssignSpot={handleAssignSpot}
              showEventDetails={false}
            />
          ))
        )}
      </div>
      
      {/* Spot Assignment Dialog */}
      {selectedApplicationForSpot && (
        <Dialog open={!!selectedApplicationForSpot} onOpenChange={() => setSelectedApplicationForSpot(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Spot</DialogTitle>
            </DialogHeader>
            {(() => {
              const application = displayApplications.find(app => app.id === selectedApplicationForSpot);
              if (!application) return null;
              
              return (
                <SpotAssignmentManager
                  eventId={eventId}
                  onSpotAssigned={handleSpotAssigned}
                  preselectedComedianId={application.comedian_id}
                />
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventApplicationsPanel;
