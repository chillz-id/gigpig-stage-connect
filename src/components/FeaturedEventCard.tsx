
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FeaturedEventCardProps {
  event: any;
}

export const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({ event }) => {
  const { user, hasRole } = useAuth();
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusInfo = () => {
    const availableSpots = (event.spots || 5) - (event.applied_spots || 0);
    
    if (event.status === 'full' || availableSpots <= 0) {
      return { text: 'FULL', variant: 'destructive' as const };
    }
    
    if (event.is_paid && event.pay_per_comedian) {
      return { text: `$${event.pay_per_comedian}`, variant: 'secondary' as const };
    }
    
    return { text: 'FREE', variant: 'secondary' as const };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="group relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] cursor-pointer">
      {/* Background Image */}
      <div className="absolute inset-0">
        {event.banner_url ? (
          <img 
            src={event.banner_url} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
        )}
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Top Section - Featured Badge and Status */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <Badge className="bg-yellow-500/90 text-black border-0 px-3 py-1 text-xs font-bold backdrop-blur-sm">
          <Star className="w-3 h-3 mr-1 fill-current" />
          FEATURED
        </Badge>
        
        <Badge 
          variant={statusInfo.variant}
          className="bg-white/90 text-black border-0 px-3 py-1 text-xs font-bold backdrop-blur-sm"
        >
          {statusInfo.text}
        </Badge>
      </div>

      {/* Bottom Section - Event Details */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-3">
          {/* Event Title */}
          <h3 className="text-2xl font-bold leading-tight mb-2 group-hover:text-yellow-300 transition-colors duration-300">
            {event.title}
          </h3>

          {/* Event Details */}
          <div className="space-y-2 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{event.venue}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatDate(event.event_date)}</span>
              </div>
              
              {event.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{formatTime(event.start_time)}</span>
                </div>
              )}
            </div>

            <div className="text-xs opacity-75">
              {event.city}, {event.state}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button 
              className="w-full bg-white/90 hover:bg-white text-black border-0 font-bold py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg"
              disabled={event.status === 'full'}
            >
              {isIndustryUser ? (
                event.status === 'full' ? 'Full' : 'Apply Now'
              ) : (
                'Get Tickets'
              )}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
