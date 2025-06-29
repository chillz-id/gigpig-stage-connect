import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Check, X } from 'lucide-react';
import ApplicationCard from './ApplicationCard';
import BulkApplicationActions from './BulkApplicationActions';
import { useEventApplications } from '@/hooks/useEventApplications';

interface EventApplicationsPanelProps {
  eventId: string;
  eventTitle: string;
}

const EventApplicationsPanel: React.FC<EventApplicationsPanelProps> = ({
  eventId,
  eventTitle,
}) => {
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const {
    applications,
    isLoading,
    updateApplication,
    isUpdating,
  } = useEventApplications(eventId);

  // Mock data - replace with real data from useEventApplications
  const mockApplications = [
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
      status: 'declined' as const,
      message: 'Looking forward to sharing my observational comedy style.',
    },
  ];

  const stats = {
    total: mockApplications.length,
    pending: mockApplications.filter(app => app.status === 'pending').length,
    approved: mockApplications.filter(app => app.status === 'accepted').length,
    rejected: mockApplications.filter(app => app.status === 'declined').length,
  };

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

  const handleBulkReject = async (applicationIds: string[]) => {
    for (const id of applicationIds) {
      await updateApplication({ id, status: 'declined' });
    }
    setSelectedApplications([]);
  };

  const handleApprove = async (applicationId: string) => {
    await updateApplication({ id: applicationId, status: 'accepted' });
  };

  const handleReject = async (applicationId: string) => {
    await updateApplication({ id: applicationId, status: 'declined' });
  };

  const handleViewProfile = (comedianId: string) => {
    // Implementation for viewing comedian profile
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{stats.total}</div>
              <div className="text-sm text-purple-200">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-purple-200">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
              <div className="text-sm text-purple-200">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-sm text-purple-200">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkApplicationActions
        selectedApplications={selectedApplications}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedApplications([])}
        isProcessing={isUpdating}
      />

      {/* Applications List */}
      <div className="space-y-4">
        {mockApplications.length === 0 ? (
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
          mockApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              isSelected={selectedApplications.includes(application.id)}
              onSelect={handleSelectApplication}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewProfile={handleViewProfile}
              showEventDetails={false}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EventApplicationsPanel;
