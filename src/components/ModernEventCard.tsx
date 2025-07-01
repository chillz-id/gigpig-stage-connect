
import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEventApplications } from '@/hooks/useEventApplications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const { userApplications } = useEventApplications();
  const [hasApplied, setHasApplied] = useState(false);

  // Check if user has applied to this event
  useEffect(() => {
    if (user && userApplications) {
      const application = userApplications.find(app => app.event_id === show.id);
      setHasApplied(!!application);
    }
  }, [user, userApplications, show.id]);

  const isAdmin = hasRole('admin');
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || isAdmin);
  const isConsumerUser = !isIndustryUser;
  const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
  const isInterested = interestedEvents.has(show.id);
  const isShowFull = availableSpots <= 0;

  const handleApplyClick = async () => {
    if (show.is_recurring && onRecurringApply) {
      onRecurringApply(show);
    } else {
      await onApply(show);
    }
    setHasApplied(true);
  };

  const handleCardClick = () => {
    if (isIndustryUser && !isShowFull && !hasApplied) {
      handleApplyClick();
    } else if (isConsumerUser) {
      onBuyTickets(show);
    } else {
      onShowDetails(show);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
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

  const getActionText = () => {
    if (isIndustryUser) {
      return hasApplied ? 'Applied' : 'Apply';
    } else {
      return isShowFull ? 'Join Waitlist' : 'Get Tickets';
    }
  };

  const getStatusBadge = () => {
    if (isShowFull) {
      return <Badge variant="destructive" className="text-xs">FULL</Badge>;
    }
    if (show.is_paid && show.pay_per_comedian) {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">${show.pay_per_comedian}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">FREE</Badge>;
  };

  return (
    <div className="group relative w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden">
      {/* Event Image */}
      <div className="relative aspect-video overflow-hidden">
        {show.banner_url ? (
          <img 
            src={show.banner_url} 
            alt={show.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Top Right - Status Badge */}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        
        {/* Heart Icon for Consumers */}
        {isConsumerUser && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleInterested(show);
            }}
            className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm transition-all ${
              isInterested 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-purple-600 transition-colors duration-300">
          {show.title}
        </h3>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <span className="font-medium">{show.venue}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span>{formatDate(show.event_date)}</span>
            </div>
            
            {show.start_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>{formatTime(show.start_time)}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {show.city}, {show.state}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleCardClick}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg"
          disabled={hasApplied}
        >
          {getActionText()}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
