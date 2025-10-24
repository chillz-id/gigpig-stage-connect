import { Deal } from '@/hooks/useDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  Building,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}

/**
 * DealCard Component
 *
 * Card displayed in kanban board with:
 * - Deal title and type
 * - Artist and promoter info
 * - Proposed fee
 * - Performance date
 * - Deadline indicator
 * - Click to open negotiation modal
 */
export const DealCard = ({ deal, onClick, isDragging }: DealCardProps) => {
  const getDealTypeColor = (type: Deal['deal_type']) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800';
      case 'performance':
        return 'bg-purple-100 text-purple-800';
      case 'collaboration':
        return 'bg-green-100 text-green-800';
      case 'sponsorship':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isNearDeadline = () => {
    if (!deal.deadline) return false;

    const deadline = new Date(deal.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  };

  const isOverdue = () => {
    if (!deal.deadline) return false;

    const deadline = new Date(deal.deadline);
    const now = new Date();

    return deadline < now;
  };

  const artistName = deal.artist
    ? deal.artist.stage_name || `${deal.artist.first_name} ${deal.artist.last_name}`
    : 'Unknown Artist';

  const promoterName = deal.promoter
    ? `${deal.promoter.first_name} ${deal.promoter.last_name}`
    : 'Unknown Promoter';

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-2' : ''
      } ${isOverdue() ? 'border-red-300' : ''} ${
        isNearDeadline() ? 'border-yellow-300' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">{deal.title}</h4>
          <Badge className={getDealTypeColor(deal.deal_type)} variant="secondary">
            {deal.deal_type}
          </Badge>
        </div>

        {/* Fee */}
        {deal.proposed_fee && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(deal.proposed_fee)}
            </span>
          </div>
        )}

        {/* Artist */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground truncate">{artistName}</span>
        </div>

        {/* Event */}
        {deal.event && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{deal.event.title}</span>
          </div>
        )}

        {/* Performance Date */}
        {deal.performance_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(deal.performance_date)}
            </span>
          </div>
        )}

        {/* Deadline Warning */}
        {(isNearDeadline() || isOverdue()) && (
          <div
            className={`flex items-center gap-2 text-xs ${
              isOverdue() ? 'text-red-600' : 'text-yellow-600'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="font-medium">
              {isOverdue()
                ? `Overdue: ${formatDate(deal.deadline)}`
                : `Deadline: ${formatDate(deal.deadline)}`}
            </span>
          </div>
        )}

        {/* Footer Metadata */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(deal.created_at)}</span>
          </div>

          {deal.negotiation_stage && (
            <Badge variant="outline" className="text-xs capitalize">
              {deal.negotiation_stage.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Quick Action */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-2" />
          Open Negotiation
        </Button>
      </CardContent>
    </Card>
  );
};
