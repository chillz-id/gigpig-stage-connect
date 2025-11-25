import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrganizationUpcomingEventsProps {
  organizationId: string;
  isOwnProfile?: boolean;
}

const OrganizationUpcomingEvents: React.FC<OrganizationUpcomingEventsProps> = ({
  organizationId,
  isOwnProfile = false
}) => {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-2xl">
            <Calendar className="w-6 h-6 text-purple-400" />
            Upcoming Events
          </CardTitle>
          {isOwnProfile && (
            <Button className="professional-button" size="sm">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Upcoming Events</h3>
          <p className="text-gray-300">
            Organization events showcase coming soon!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationUpcomingEvents;
