import React from 'react';
import { EventBannerDisplay } from './EventBannerDisplay';
import { Calendar, MapPin, Users } from 'lucide-react';

interface OptimizedEventBannerProps {
  bannerUrl?: string | null;
  bannerPosition?: { x: number; y: number; scale: number } | null;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  capacity?: number;
  className?: string;
  showOverlay?: boolean;
}

export const OptimizedEventBanner: React.FC<OptimizedEventBannerProps> = ({
  bannerUrl,
  bannerPosition,
  eventName,
  eventDate,
  eventLocation,
  capacity,
  className,
  showOverlay = true
}) => {
  const overlayContent = showOverlay ? (
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{eventName}</h1>

        <div className="flex flex-wrap gap-4 text-sm md:text-base">
          {eventDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(eventDate).toLocaleDateString()}</span>
            </div>
          )}

          {eventLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{eventLocation}</span>
            </div>
          )}

          {capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{capacity} seats</span>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <EventBannerDisplay
      bannerUrl={bannerUrl}
      bannerPosition={bannerPosition}
      eventName={eventName}
      className={className}
      showOverlay={showOverlay}
      overlayContent={overlayContent}
    />
  );
};