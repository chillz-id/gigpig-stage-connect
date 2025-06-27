
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Users, Star, Heart, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';
import { WaitlistDialog } from './WaitlistDialog';

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
  const eventDate = new Date(show.event_date);
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

  // Function to get recurring type badge text
  const getRecurringBadgeText = (show: any) => {
    if (!show.is_recurring) return null;
    
    // Check if show has a recurrence_pattern or default to "Multiple"
    if (show.recurrence_pattern) {
      switch (show.recurrence_pattern.toLowerCase()) {
        case 'weekly':
          return 'Weekly';
        case 'monthly':
          return 'Monthly';
        default:
          return 'Multiple';
      }
    }
    return 'Multiple';
  };

  const recurringBadgeText = getRecurringBadgeText(show);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground hover:bg-card/70 transition-colors overflow-hidden">
      {show.banner_url && (
        <div className="aspect-[2/1] relative overflow-hidden">
          <img 
            src={show.banner_url} 
            alt={show.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 right-2 flex gap-2">
            {!isMemberView && show.is_verified_only && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Star className="w-3 h-3 mr-1" />
                Comedian Pro
              </Badge>
            )}
            {!isMemberView && isShowFull && (
              <Badge variant="destructive">Full</Badge>
            )}
            {recurringBadgeText && (
              <Badge className="bg-blue-600">{recurringBadgeText}</Badge>
            )}
          </div>
          {isMemberView && (
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-2 right-2 ${
                isInterested 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-white hover:text-red-500'
              }`}
              onClick={() => onToggleInterested(show)}
            >
              <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{show.title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {show.venue} • {show.city}, {show.state}
            </CardDescription>
          </div>
          {!show.banner_url && (
            <div className="flex flex-col gap-2">
              {isMemberView ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    isInterested 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                  onClick={() => onToggleInterested(show)}
                >
                  <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
                </Button>
              ) : (
                <>
                  {show.is_verified_only && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      <Star className="w-3 h-3 mr-1" />
                      Comedian Pro
                    </Badge>
                  )}
                  {isShowFull && (
                    <Badge variant="destructive">Full</Badge>
                  )}
                  {recurringBadgeText && (
                    <Badge className="bg-blue-600">{recurringBadgeText}</Badge>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{eventDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{show.start_time || 'Time TBA'}</span>
          </div>
          {!isMemberView && isIndustryUser && show.is_paid && (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{Math.max(0, availableSpots)} spots left</span>
            </div>
          )}
          {!isMemberView && (
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{show.is_paid ? 'Paid Event' : 'Free'}</span>
            </div>
          )}
        </div>

        {!isMemberView && (
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
        )}

        {isMemberView && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-foreground border-border">
              {show.age_restriction || '18+'}
            </Badge>
          </div>
        )}

        {show.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{show.description}</p>
        )}

        <div className="flex gap-2 flex-wrap">
          {isIndustryUser && !isMemberView && (
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
          
          {(isConsumerUser || isMemberView) && (
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
      </CardContent>
    </Card>
  );
};
