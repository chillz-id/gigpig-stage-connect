import { Calendar, Clock, Navigation, Users } from 'lucide-react';

import type { TourStop } from '@/types/tour';

interface TourStopSummaryProps {
  stop: TourStop;
}

export function TourStopSummary({ stop }: TourStopSummaryProps) {
  const eventDate = new Date(stop.event_date).toLocaleDateString();

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-white font-semibold text-lg">{stop.venue_name}</h3>
        <p className="text-blue-200">
          {stop.venue_city}, {stop.venue_state || stop.venue_country}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-300">
        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date" value={eventDate} />
        <InfoRow icon={<Clock className="w-4 h-4" />} label="Show Time" value={stop.show_time} />
        <InfoRow
          icon={<Users className="w-4 h-4" />}
          label="Capacity"
          value={stop.venue_capacity?.toLocaleString() || 'TBD'}
        />
        <InfoRow
          icon={<Navigation className="w-4 h-4" />} 
          label="Travel"
          value={formatTravelSummary(stop)}
        />
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}

function formatTravelSummary(stop: TourStop): string {
  if (!stop.distance_to_next_km && !stop.travel_time_to_next) {
    return 'TBD';
  }

  const distance = stop.distance_to_next_km ? `${stop.distance_to_next_km} km` : '';
  const minutes = stop.travel_time_to_next ? Math.round(stop.travel_time_to_next / 60) : undefined;
  const time = minutes ? `${minutes}h` : '';

  return [distance, time].filter(Boolean).join(' • ') || 'TBD';
}
