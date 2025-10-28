/**
 * ApplicationList Component (Presentational)
 *
 * Grid layout for displaying application cards with responsive columns
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileX } from 'lucide-react';
import type { ApplicationData } from '@/types/application';

interface ApplicationListProps {
  applications: ApplicationData[];
  renderCard: (application: ApplicationData) => React.ReactNode;
  emptyMessage?: string;
}

export function ApplicationList({
  applications,
  renderCard,
  emptyMessage = 'No applications found'
}: ApplicationListProps) {
  // Empty state
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Alert className="max-w-md">
          <FileX className="h-4 w-4" />
          <AlertTitle>No Applications</AlertTitle>
          <AlertDescription>{emptyMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((application) => (
          <div key={application.id}>{renderCard(application)}</div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default ApplicationList;
