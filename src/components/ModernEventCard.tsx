
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Clock, Users, Star, ExternalLink } from 'lucide-react';
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

  const handleCardClick = () => {
    onShowDetails(show);
  };

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIndustryUser) {
      handleApplyClick();
    } else {
      onBuyTickets(show);
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleInterested(show);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month: month.toUpperCase(), day };
  };

  const { month, day } = formatDate(show.event_date);

  return (
    <div 
      className="group relative h-80 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
      onClick={handleCardClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {show.banner_url ? (
          <img 
            src={show.banner_url}
            alt={show.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100" />
        )}
      </div>
      
      {/* Subtle Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      
      {/* Top Row - Date & Heart */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        {/* Date Badge */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">{month}</div>
          <div className="text-lg font-bold text-gray-900 leading-none">{day}</div>
        </div>
        
        {/* Heart Icon for Consumers */}
        {isConsumerUser && (
          <button
            onClick={handleHeartClick}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isInterested 
                ? 'bg-red-500/90 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* Event Title & Venue */}
        <div className="mb-3">
          <h3 className="text-xl font-bold mb-1 line-clamp-2">{show.title}</h3>
          <div className="flex items-center gap-4 text-sm text-white/90">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{show.venue}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{show.start_time}</span>
            </div>
          </div>
          <div className="text-sm text-white/80 mt-1">
            {show.city}, {show.state}
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {isIndustryUser && show.is_verified_only && (
              <Badge className="bg-yellow-500/90 text-white border-0 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
            {show.type && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs backdrop-blur-sm">
                {show.type}
              </Badge>
            )}
            {isIndustryUser && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs backdrop-blur-sm">
                <Users className="w-3 h-3 mr-1" />
                {availableSpots} spots
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handlePrimaryAction}
            disabled={isIndustryUser && isShowFull}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all backdrop-blur-md shadow-sm flex items-center gap-1 ${
              isIndustryUser
                ? isShowFull
                  ? 'bg-gray-500/80 text-white cursor-not-allowed'
                  : 'bg-blue-600/90 hover:bg-blue-700 text-white'
                : 'bg-green-600/90 hover:bg-green-700 text-white'
            }`}
          >
            {isIndustryUser ? (
              isShowFull ? 'Full' : 'Apply'
            ) : (
              <>
                Tickets
                <ExternalLink className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hover Overlay for Additional Info */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
