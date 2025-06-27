
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
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
  const { isMemberView } = useViewMode();

  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;
  const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
  const isInterested = interestedEvents.has(show.id);
  const isShowFull = availableSpots <= 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground hover:bg-card/70 transition-colors overflow-hidden">
      <ShowCardHeader
        show={show}
        isMemberView={isMemberView}
        isInterested={isInterested}
        isShowFull={isShowFull}
        onToggleInterested={onToggleInterested}
      />
      <CardContent className="space-y-4">
        <ShowCardInfo
          show={show}
          isMemberView={isMemberView}
          isIndustryUser={isIndustryUser}
          availableSpots={availableSpots}
        />
        <ShowCardActions
          show={show}
          isIndustryUser={isIndustryUser}
          isConsumerUser={isConsumerUser}
          isMemberView={isMemberView}
          isShowFull={isShowFull}
          onApply={onApply}
          onRecurringApply={onRecurringApply}
          onBuyTickets={onBuyTickets}
          onShowDetails={onShowDetails}
          onGetDirections={onGetDirections}
        />
      </CardContent>
    </Card>
  );
};
