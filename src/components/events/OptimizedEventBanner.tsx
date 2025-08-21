import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';

interface OptimizedEventBannerProps {
  bannerUrl?: string | null;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  capacity?: number;
  className?: string;
  priority?: boolean;
  showOverlay?: boolean;
}

export const OptimizedEventBanner: React.FC<OptimizedEventBannerProps> = ({
  bannerUrl,
  eventName,
  eventDate,
  eventLocation,
  capacity,
  className,
  priority = false,
  showOverlay = true
}) => {
  const defaultBanner = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=600&fit=crop';
  
  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <OptimizedImage
        src={bannerUrl || defaultBanner}
        alt={eventName}
        aspectRatio={2}
        imageSize="hero"
        priority={priority}
        className="w-full h-full"
        objectFit="cover"
        fallbackSrc={defaultBanner}
        blur
      />
      
      {showOverlay && (
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
      )}
    </div>
  );
};