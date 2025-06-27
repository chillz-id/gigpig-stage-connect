
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Users, Star, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ModernEventCardProps {
  show: any;
  interestedEvents: Set<string>;
  onToggleInterested: (event: any) => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onShowDetails: (event: any) => void;
  onGetDirections: (event: any) => void;
  onRecurringApply?: (event: any) => void;
}

export const ModernEventCard: React.FC<ModernEventCardProps> = ({
  show,
  interestedEvents,
  onToggleInterested,
  onApply,
  onBuyTickets,
  onShowDetails,
  onGetDirections,
  onRecurringApply,
}) => {
  const { user, hasRole } = useAuth();

  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;
  const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
  const isInterested = interestedEvents.has(show.id);
  const isShowFull = availableSpots <= 0;

  const handleApplyClick = () => {
    if (show.is_recurring && onRecurringApply) {
      onRecurringApply(show);
    } else {
      onApply(show);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month: month.toUpperCase(), day };
  };

  const { month, day } = formatDate(show.event_date);

  return (
    <div className="group relative h-80 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Background Image */}
      {show.banner_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${show.banner_url})` }}
        />
      )}
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
        {/* Top Section - Just Date Badge */}
        <div className="flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
            <div className="text-xs font-medium opacity-80">{month}</div>
            <div className="text-lg font-bold leading-none">{day}</div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-3">
          {/* Event Title */}
          <h3 className="text-xl font-bold leading-tight">{show.title}</h3>
          
          {/* Venue and Location */}
          <div className="flex items-center gap-1 text-sm opacity-90">
            <MapPin className="w-4 h-4" />
            <span>{show.venue}</span>
          </div>
          
          {/* Location */}
          <div className="text-sm opacity-75">
            {show.city}, {show.state}
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-sm opacity-90">
            <Clock className="w-4 h-4" />
            <span>{show.start_time}</span>
          </div>

          {/* Compact Badges Row */}
          <div className="flex gap-2 flex-wrap">
            {isIndustryUser && show.is_verified_only && (
              <Badge className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 text-white border-0 text-xs backdrop-blur-sm px-2 py-1">
                Pro
              </Badge>
            )}
            {show.type && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs backdrop-blur-sm px-2 py-1">
                {show.type}
              </Badge>
            )}
            {show.age_restriction && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs backdrop-blur-sm px-2 py-1">
                {show.age_restriction}
              </Badge>
            )}
            {isIndustryUser && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs backdrop-blur-sm px-2 py-1">
                {availableSpots} spots
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isIndustryUser && (
              <Button 
                className={`flex-1 font-medium ${
                  isShowFull 
                    ? 'bg-gray-600/80 hover:bg-gray-600/90 text-white' 
                    : 'bg-blue-600/80 hover:bg-blue-700/90 text-white'
                } backdrop-blur-sm border-0`}
                onClick={handleApplyClick}
                disabled={isShowFull}
              >
                {isShowFull ? 'Full' : 'Apply'}
              </Button>
            )}
            
            {isConsumerUser && (
              <Button 
                className="flex-1 bg-green-600/80 hover:bg-green-700/90 text-white font-medium backdrop-blur-sm border-0"
                onClick={() => onBuyTickets(show)}
              >
                Tickets
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              onClick={() => onShowDetails(show)}
            >
              Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGetDirections(show)}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm p-2"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
