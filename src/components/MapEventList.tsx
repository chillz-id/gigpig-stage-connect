
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useViewMode } from '@/contexts/ViewModeContext';
import { mockEvents } from '@/data/mockEvents';

interface MapEventListProps {
  onEventSelect: (event: any) => void;
  selectedShow: any;
}

export const MapEventList: React.FC<MapEventListProps> = ({
  onEventSelect,
  selectedShow,
}) => {
  const { isMemberView } = useViewMode();

  // Filter to show only upcoming events (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">All {isMemberView ? 'Events' : 'Shows'} ({upcomingEvents.length})</h4>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {upcomingEvents.map((show) => (
          <button
            key={show.id}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedShow?.id === show.id 
                ? 'bg-primary/10 border-primary' 
                : 'bg-card/30 border-border hover:bg-card/50'
            }`}
            onClick={() => onEventSelect(show)}
          >
            <div className="font-medium text-sm">{show.title}</div>
            <div className="text-xs text-muted-foreground">{show.venue} • {show.start_time}</div>
            <div className="text-xs text-muted-foreground">
              {show.city}, {show.state} • {new Date(show.event_date).toLocaleDateString()}
            </div>
            {show.type && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">{show.type}</Badge>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
