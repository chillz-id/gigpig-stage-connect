
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Users } from 'lucide-react';

interface ShowCardInfoProps {
  show: any;
  isIndustryUser: boolean;
  availableSpots: number;
}

export const ShowCardInfo: React.FC<ShowCardInfoProps> = ({
  show,
  isIndustryUser,
  availableSpots,
}) => {
  const eventDate = new Date(show.event_date);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>{eventDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{show.start_time || 'Time TBA'}</span>
        </div>
        {isIndustryUser && show.is_paid && (
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{Math.max(0, availableSpots)} spots left</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4" />
          <span>{show.is_paid ? 'Paid Event' : 'Free'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {show.type && (
          <Badge variant="outline" className="text-foreground border-border">
            {show.type}
          </Badge>
        )}
        <Badge variant="outline" className="text-foreground border-border">
          {show.age_restriction || '18+'}
        </Badge>
      </div>

      {show.description && (
        <p className="text-muted-foreground text-sm line-clamp-2">{show.description}</p>
      )}
    </div>
  );
};
