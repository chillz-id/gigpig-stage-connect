
import React, { useState, useEffect } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEventApplications } from '@/hooks/useEventApplications';

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

  // Admin should have access to all features
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
    // Update local state to reflect application
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
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month: month.toUpperCase(), day };
  };

  const { month, day } = formatDate(show.event_date);

  // Determine action text based on user type and show status
  const getActionText = () => {
    if (isIndustryUser) {
      return hasApplied ? 'Applied' : 'Apply';
    } else {
      return isShowFull ? 'Join Waitlist' : 'Get Tickets';
    }
  };

  return (
    <div 
      className="group relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Background Image */}
      {show.banner_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${show.banner_url})` }}
        />
      )}
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Bottom Text Overlay Rectangle */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/60" />
      
      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
        {/* Top Section - Date and Heart */}
        <div className="flex justify-between items-start">
          {/* Clean Date Text */}
          <div className="text-white">
            <div className="text-xs font-medium opacity-90">{month}</div>
            <div className="text-sm font-bold">{day}</div>
          </div>
          
          {/* Heart Icon for Consumers - Only visible on hover */}
          {isConsumerUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleInterested(show);
              }}
              className={`p-2 rounded-full backdrop-blur-sm border transition-all opacity-0 group-hover:opacity-100 ${
                isInterested 
                  ? 'bg-red-500/80 text-white border-red-500/50' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Bottom Section - Event Info and Action Text */}
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold leading-tight">{show.title}</h3>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <MapPin className="w-3 h-3" />
              <span>{show.city}, {show.state}</span>
            </div>
          </div>
          
          {/* Action Text - Bottom Right */}
          <div className={`text-xs font-medium ${hasApplied ? 'text-green-400' : 'opacity-90'}`}>
            {getActionText()}
          </div>
        </div>
      </div>
    </div>
  );
};
