import React from 'react';
import { SpotAssignmentManager } from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Demo component for SpotAssignmentManager
 * Shows how to use the SpotAssignmentManager component
 */
const SpotAssignmentManagerDemo: React.FC = () => {
  // Mock event ID for demonstration
  const mockEventId = "demo-event-123";

  const handleAssignmentChange = () => {
    console.log('Assignment changed');
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spot Assignment Manager Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo shows the SpotAssignmentManager component in action. 
            It allows promoters to assign comedians to event spots using drag and drop.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features included:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Display all spots for an event with filled/pending status</li>
              <li>Show approved applications ready for assignment</li>
              <li>Drag and drop spot assignment functionality</li>
              <li>Manual spot selection and ordering</li>
              <li>Visual indicators for filled/pending spots</li>
              <li>Bulk operations for multiple assignments</li>
              <li>Search and filter functionality</li>
              <li>Real-time updates and notifications</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <SpotAssignmentManager 
        eventId={mockEventId}
        onAssignmentChange={handleAssignmentChange}
      />
    </div>
  );
};

export default SpotAssignmentManagerDemo;