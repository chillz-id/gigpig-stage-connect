
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ApplicationCard from '@/components/admin/ApplicationCard';
import ApplicationFilters from '@/components/admin/ApplicationFilters';
import BulkApplicationActions from '@/components/admin/BulkApplicationActions';

// Mock data - replace with real data from useEventApplications
const mockApplications = [
  {
    id: '1',
    comedian_id: '1',
    comedian_name: 'Sarah Mitchell',
    comedian_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    comedian_experience: '3 years',
    comedian_rating: 4.2,
    event_id: '1',
    event_title: 'Wednesday Comedy Night',
    event_venue: 'The Laugh Track',
    event_date: '2024-12-20',
    applied_at: '2024-12-18T10:00:00Z',
    status: 'pending' as const,
    message: 'Hi! I\'d love to perform at your show. I have great crowd work skills and clean material.',
  },
  {
    id: '2',
    comedian_id: '2',
    comedian_name: 'Mike Chen',
    comedian_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    comedian_experience: '2 years',
    comedian_rating: 4.5,
    event_id: '1',
    event_title: 'Wednesday Comedy Night',
    event_venue: 'The Laugh Track',
    event_date: '2024-12-20',
    applied_at: '2024-12-17T15:30:00Z',
    status: 'accepted' as const,
    message: 'Looking forward to a great show! I have solid 5-minute set ready.',
  },
  {
    id: '3',
    comedian_id: '3',
    comedian_name: 'Emma Wilson',
    comedian_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    comedian_experience: '1 year',
    comedian_rating: 4.0,
    event_id: '2',
    event_title: 'Friday Headliner Showcase',
    event_venue: 'Comedy Central Club',
    event_date: '2024-12-22',
    applied_at: '2024-12-15T09:15:00Z',
    status: 'declined' as const,
    message: 'Hi, I\'m relatively new but very passionate. Would love the opportunity!',
  },
];

const mockEvents = [
  { id: '1', title: 'Wednesday Comedy Night' },
  { id: '2', title: 'Friday Headliner Showcase' },
];

const Applications = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState(mockApplications);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [sortBy, setSortBy] = useState('applied_at_desc');

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.comedian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.event_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesEvent = eventFilter === 'all' || app.event_id === eventFilter;
      
      return matchesSearch && matchesStatus && matchesEvent;
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

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'declined').length,
  };

  const handleSelectApplication = (applicationId: string, selected: boolean) => {
    setSelectedApplications(prev => 
      selected 
        ? [...prev, applicationId]
        : prev.filter(id => id !== applicationId)
    );
  };

  const handleBulkApprove = async (applicationIds: string[]) => {
    setApplications(prev => prev.map(app => 
      applicationIds.includes(app.id) 
        ? { ...app, status: 'accepted' as const }
        : app
    ));
    setSelectedApplications([]);
  };

  const handleBulkReject = async (applicationIds: string[]) => {
    setApplications(prev => prev.map(app => 
      applicationIds.includes(app.id) 
        ? { ...app, status: 'declined' as const }
        : app
    ));
    setSelectedApplications([]);
  };

  const handleApprove = (applicationId: string) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'accepted' as const }
        : app
    ));
    
    const application = applications.find(app => app.id === applicationId);
    toast({
      title: "Application Approved",
      description: `${application?.comedian_name}'s application has been approved.`,
    });
  };

  const handleReject = (applicationId: string) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'declined' as const }
        : app
    ));

    const application = applications.find(app => app.id === applicationId);
    toast({
      title: "Application Rejected",
      description: `${application?.comedian_name}'s application has been rejected.`,
    });
  };

  const handleViewProfile = (comedianId: string) => {
    // Implementation for viewing comedian profile
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setEventFilter('all');
    setSortBy('applied_at_desc');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Applications Management</h1>
          <p className="text-purple-100">Review and manage comedian applications for your events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-purple-300" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-purple-200">Total Applications</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-purple-200">Pending Review</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
              <div className="text-sm text-purple-200">Approved</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-sm text-purple-200">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <ApplicationFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          eventFilter={eventFilter}
          setEventFilter={setEventFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          events={mockEvents}
          onClearFilters={handleClearFilters}
        />

        {/* Bulk Actions */}
        <BulkApplicationActions
          selectedApplications={selectedApplications}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          onClearSelection={() => setSelectedApplications([])}
        />

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
                <p className="text-purple-100">
                  No applications match your current filters. Try adjusting your search criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                isSelected={selectedApplications.includes(application.id)}
                onSelect={handleSelectApplication}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewProfile={handleViewProfile}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
