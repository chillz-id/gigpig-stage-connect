
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

interface ShowCardProps {
  show: any;
  interestedEvents: Set<string>;
  onToggleInterested: (event: any) => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onShowDetails: (event: any) => void;
  onGetDirections: (event: any) => void;
  onRecurringApply?: (event: any) => void;
  hasAppliedToEvent?: (eventId: string) => boolean;
  getApplicationStatus?: (eventId: string) => string | null;
  isApplying?: boolean;
}

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  interestedEvents,
  onToggleInterested,
  onApply,
  onBuyTickets,
  onShowDetails,
  onGetDirections,
  onRecurringApply,
  hasAppliedToEvent,
  getApplicationStatus,
  isApplying = false,
}) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;
  const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
  const isInterested = interestedEvents.has(show.id);
  const isShowFull = availableSpots <= 0 || show.status === 'closed';
  const hasApplied = hasAppliedToEvent ? hasAppliedToEvent(show.id) : false;
  const applicationStatus = getApplicationStatus ? getApplicationStatus(show.id) : null;
  const isComedian = user && hasRole('comedian');
  const isSoldOut = show.status === 'closed';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const { day, month } = formatDate(show.event_date);

  return (
    <div 
      className="relative aspect-[4/3] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:translate-y-[-4px] bg-gray-900 border border-gray-700 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Prevent navigation if clicking on action buttons
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        navigate(`/events/${show.id}`);
      }}
    >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {show.image_url ? (
            <img 
              src={show.image_url} 
              alt={show.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
          )}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 z-1" />

        {/* Date - Top Left */}
        <div className="absolute top-4 left-4 text-white z-20">
          <div className="text-2xl font-bold leading-none">{day}</div>
          <div className="text-sm font-medium opacity-90">{month}</div>
        </div>

        {/* Action Buttons - Top Right */}
        <div className={`absolute top-4 right-4 z-20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {isComedian && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isShowFull && !hasApplied && !isApplying) {
                  navigate(`/events/${show.id}/apply`);
                }
              }}
              disabled={isShowFull || hasApplied || isApplying}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                hasApplied
                  ? 'text-green-400 cursor-default'
                  : isShowFull 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : isApplying
                      ? 'text-blue-400 cursor-wait'
                      : 'text-white hover:text-yellow-400'
              }`}
            >
              {isApplying ? 'Applying...' : hasApplied ? 'Applied ✓' : isSoldOut ? 'Sold Out' : isShowFull ? 'Full' : 'Apply'}
            </button>
          )}
          
          {/* Show status badge for other industry users */}
          {isIndustryUser && !isComedian && hasApplied && (
            <div className="px-3 py-1.5 text-sm font-medium text-green-400 transition-all duration-300">
              Applied ✓
            </div>
          )}
          
          {isConsumerUser && (
            <button
              onClick={() => onBuyTickets(show)}
              className="px-3 py-1.5 text-white hover:text-yellow-400 text-sm font-medium transition-all duration-300"
            >
              {isSoldOut ? 'Join Waitlist' : 'Get Tickets'}
            </button>
          )}
        </div>

        {/* Content - Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
          <div className="space-y-2">
            {/* Show Title */}
            <h3 className="text-lg font-bold leading-tight">
              {show.title}
            </h3>
            
            {/* Location with Icon */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
              <p className="text-sm opacity-90 truncate">
                {show.venue}
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};
