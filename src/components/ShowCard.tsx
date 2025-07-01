
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ShowCardHeader } from './ShowCardHeader';
import { ShowCardInfo } from './ShowCardInfo';
import { ShowCardActions } from './ShowCardActions';

interface ShowCardProps {
  show: any;
  interestedEvents: Set<string>;
  onToggleInterested: (event: any) => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onShowDetails: (event: any) => void;
  onGetDirections: (event: any) => void;
  onRecurringApply?: (event: any) => void;
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
}) => {
  const { user, hasRole } = useAuth();

  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;
  const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
  const isInterested = interestedEvents.has(show.id);
  const isShowFull = availableSpots <= 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const { day, month } = formatDate(show.event_date);

  return (
    <Card className="relative bg-card/50 backdrop-blur-sm border-border text-foreground hover:bg-card/70 transition-colors overflow-hidden aspect-[4/3]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {show.banner_url ? (
          <img 
            src={show.banner_url} 
            alt={show.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
        )}
      </div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Date - Top Left Corner */}
      <div className="absolute top-4 left-4 text-white">
        <div className="text-2xl font-bold leading-none">{day}</div>
        <div className="text-sm font-medium opacity-90">{month}</div>
      </div>

      {/* Content - Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="space-y-2 mb-4">
          {/* Show Title */}
          <h3 className="text-xl font-bold leading-tight">
            {show.title}
          </h3>
          
          {/* Venue */}
          <p className="text-sm opacity-90">
            {show.venue}
          </p>
        </div>

        {/* Apply Button - Bottom Right */}
        <div className="flex justify-end">
          {isIndustryUser && (
            <button
              onClick={() => isShowFull ? null : onApply(show)}
              disabled={isShowFull}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isShowFull 
                  ? 'bg-gray-600/80 text-gray-300 cursor-not-allowed' 
                  : 'bg-white/90 text-black hover:bg-white hover:scale-105'
              }`}
            >
              {isShowFull ? 'Full' : 'Apply'}
            </button>
          )}
          
          {isConsumerUser && (
            <button
              onClick={() => onBuyTickets(show)}
              className="px-4 py-2 bg-white/90 text-black hover:bg-white hover:scale-105 rounded-lg font-medium text-sm transition-all duration-200"
            >
              Get Tickets
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
