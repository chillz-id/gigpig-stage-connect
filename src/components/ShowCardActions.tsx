
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Users } from 'lucide-react';
import { WaitlistDialog } from './WaitlistDialog';

interface ShowCardActionsProps {
  show: any;
  isIndustryUser: boolean;
  isConsumerUser: boolean;
  isShowFull: boolean;
  onApply: (show: any) => void;
  onRecurringApply?: (show: any) => void;
  onBuyTickets: (show: any) => void;
  onShowDetails: (show: any) => void;
  onGetDirections: (show: any) => void;
}

export const ShowCardActions: React.FC<ShowCardActionsProps> = ({
  show,
  isIndustryUser,
  isConsumerUser,
  isShowFull,
  onApply,
  onRecurringApply,
  onBuyTickets,
  onShowDetails,
  onGetDirections,
}) => {
  const handleApplyClick = () => {
    if (show.is_recurring && onRecurringApply) {
      onRecurringApply(show);
    } else {
      onApply(show);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {isIndustryUser && (
        <>
          {!isShowFull ? (
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleApplyClick}
            >
              Apply Now
            </Button>
          ) : (
            <WaitlistDialog
              eventId={show.id}
              eventTitle={show.title}
              trigger={
                <Button variant="outline" className="flex-1">
                  <Users className="w-4 h-4 mr-2" />
                  Join Waitlist
                </Button>
              }
            />
          )}
        </>
      )}
      
      {isConsumerUser && (
        <Button 
          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
          onClick={() => onBuyTickets(show)}
        >
          Buy Tickets
        </Button>
      )}
      
      <Button 
        variant="outline" 
        className="text-foreground border-border hover:bg-accent"
        onClick={() => onShowDetails(show)}
      >
        Details
      </Button>
      
      {show.address && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGetDirections(show)}
          className="flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          Directions
        </Button>
      )}
    </div>
  );
};
