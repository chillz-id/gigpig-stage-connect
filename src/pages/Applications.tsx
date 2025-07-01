
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ApplicationStats from '@/components/admin/ApplicationStats';
import ApplicationList from '@/components/admin/ApplicationList';
import ApplicationFilters from '@/components/admin/ApplicationFilters';
import BulkApplicationActions from '@/components/admin/BulkApplicationActions';
import {
  mockApplications,
  mockEvents,
  filterAndSortApplications,
  calculateApplicationStats,
  ApplicationData
} from '@/services/applicationService';

const Applications = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationData[]>(mockApplications);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [sortBy, setSortBy] = useState('applied_at_desc');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Filter and sort applications
  const filteredApplications = filterAndSortApplications(
    applications,
    searchTerm,
    eventFilter,
    sortBy,
    dateRange
  );

  // Calculate stats
  const stats = calculateApplicationStats(applications);

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

  const handleBulkHide = async (applicationIds: string[]) => {
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

  const handleHide = (applicationId: string) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'declined' as const }
        : app
    ));

    const application = applications.find(app => app.id === applicationId);
    toast({
      title: "Application Hidden",
      description: `${application?.comedian_name}'s application has been hidden.`,
    });
  };

  const handleViewProfile = (comedianId: string) => {
    // Find the comedian's name to create the profile slug
    const application = applications.find(app => app.comedian_id === comedianId);
    if (application) {
      // Create slug from comedian name
      const slug = application.comedian_name.toLowerCase().replace(/\s+/g, '-');
      navigate(`/comedian/${slug}`);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setEventFilter('all');
    setSortBy('applied_at_desc');
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Applications Management</h1>
          <p className="text-purple-100">Review and manage comedian applications for your events</p>
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
          events={mockEvents}
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
