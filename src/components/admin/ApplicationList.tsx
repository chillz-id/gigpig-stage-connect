
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import ApplicationCard from './ApplicationCard';
import { ApplicationData } from '@/services/applicationService';

interface ApplicationListProps {
  applications: ApplicationData[];
  selectedApplications: string[];
  onSelectApplication: (applicationId: string, selected: boolean) => void;
  onApprove: (applicationId: string) => void;
  onHide: (applicationId: string) => void;
  onViewProfile: (comedianId: string) => void;
}

const ApplicationList: React.FC<ApplicationListProps> = ({
  applications,
  selectedApplications,
  onSelectApplication,
  onApprove,
  onHide,
  onViewProfile,
}) => {
  if (applications.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
          <p className="text-purple-100">
            No applications match your current filters. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          isSelected={selectedApplications.includes(application.id)}
          onSelect={onSelectApplication}
          onApprove={onApprove}
          onHide={onHide}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
};

export default ApplicationList;
