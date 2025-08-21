
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const EventsEmptyState = () => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardContent className="p-8 text-center">
        <Calendar className="w-12 h-12 text-white/60 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
        <p className="text-white/60">No events match your current search criteria.</p>
      </CardContent>
    </Card>
  );
};

export default EventsEmptyState;
