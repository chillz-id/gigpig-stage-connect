
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ShowCardBadgesProps {
  show: any;
  isMemberView?: boolean;
  isShowFull: boolean;
}

export const ShowCardBadges: React.FC<ShowCardBadgesProps> = ({
  show,
  isMemberView = false,
  isShowFull,
}) => {
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
    <div className="flex gap-2">
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
  );
};
