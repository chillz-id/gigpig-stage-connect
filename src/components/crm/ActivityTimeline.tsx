import type { CustomerActivity } from '@/hooks/useCustomerActivity';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, MessageSquare, Handshake, CheckSquare, Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';
import { OrderActivity } from '@/components/crm/activity/OrderActivity';
import { MessageActivity } from '@/components/crm/activity/MessageActivity';
import { DealActivity } from '@/components/crm/activity/DealActivity';
import { TaskActivity } from '@/components/crm/activity/TaskActivity';

interface ActivityTimelineProps {
  activities: CustomerActivity[];
  isLoading?: boolean;
}

/**
 * ActivityTimeline Component
 *
 * Displays a unified timeline of all customer activities:
 * - Orders (purchases, tickets)
 * - Messages (communications)
 * - Deals (negotiations)
 * - Tasks (assignments)
 */
export const ActivityTimeline = ({ activities, isLoading }: ActivityTimelineProps) => {
  const getActivityIcon = (type: CustomerActivity['activity_type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-5 w-5 text-green-600" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'deal':
        return <Handshake className="h-5 w-5 text-purple-600" />;
      case 'task':
        return <CheckSquare className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: CustomerActivity['activity_type']) => {
    switch (type) {
      case 'order':
        return 'border-l-green-600';
      case 'message':
        return 'border-l-blue-600';
      case 'deal':
        return 'border-l-purple-600';
      case 'task':
        return 'border-l-orange-600';
      default:
        return 'border-l-gray-600';
    }
  };

  const renderActivityContent = (activity: CustomerActivity) => {
    switch (activity.activity_type) {
      case 'order':
        return <OrderActivity metadata={activity.metadata} />;
      case 'message':
        return <MessageActivity metadata={activity.metadata} />;
      case 'deal':
        return <DealActivity metadata={activity.metadata} />;
      case 'task':
        return <TaskActivity metadata={activity.metadata} />;
      default:
        return <div className="text-sm text-muted-foreground">Unsupported activity type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-gray-300" data-testid="activity-skeleton">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-1/4 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Activity will appear here as the customer interacts with the platform
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card
          key={`${activity.activity_type}-${activity.activity_id}`}
          className={`border-l-4 ${getActivityColor(activity.activity_type)}`}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(activity.activity_type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {renderActivityContent(activity)}

                {/* Timestamp */}
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(activity.created_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
