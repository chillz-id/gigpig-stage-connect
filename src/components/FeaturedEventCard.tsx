
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Star } from 'lucide-react';
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
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground hover:bg-card/70 transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
      {/* Featured Badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
          <Star className="w-3 h-3 mr-1 fill-current" />
          Featured
        </Badge>
      </div>

      {/* Event Image */}
      <div className="relative aspect-video overflow-hidden">
        {event.banner_url ? (
          <img 
            src={event.banner_url} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <div className="text-white text-lg font-semibold text-center p-4">
              {event.title}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={statusInfo.variant}>
            {statusInfo.text}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Event Title */}
        <h3 className="font-semibold text-lg leading-tight line-clamp-2">
          {event.title}
        </h3>

        {/* Event Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          
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

          <div className="text-xs">
            {event.city}, {event.state}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isIndustryUser ? (
            <Button 
              size="sm" 
              className="w-full"
              disabled={event.status === 'full'}
            >
              {event.status === 'full' ? 'Full' : 'Apply Now'}
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="w-full"
              variant="outline"
            >
              Get Tickets
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
