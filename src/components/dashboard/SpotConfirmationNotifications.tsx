import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight,
  Timer
} from 'lucide-react';
import { useSpotConfirmations } from '@/hooks/useSpotConfirmations';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SpotConfirmationNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    confirmations, 
    isLoading, 
    getPendingConfirmationsCount,
    getUrgentConfirmations,
    getExpiredConfirmations 
  } = useSpotConfirmations();

  const pendingCount = getPendingConfirmationsCount();
  const urgentConfirmations = getUrgentConfirmations();
  const expiredConfirmations = getExpiredConfirmations();

  // Only show for comedians
  if (!user || !user.user_metadata?.role || user.user_metadata.role !== 'comedian') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Spot Confirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (confirmations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Spot Confirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No pending spot confirmations</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Spot Confirmations
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          {pendingCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard?tab=confirmations')}
            >
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expired confirmations warning */}
        {expiredConfirmations.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{expiredConfirmations.length}</strong> spot confirmation(s) have expired. 
              Contact the promoter if you still want to perform.
            </AlertDescription>
          </Alert>
        )}

        {/* Urgent confirmations */}
        {urgentConfirmations.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>{urgentConfirmations.length}</strong> spot confirmation(s) need urgent attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Show pending confirmations */}
        <div className="space-y-3">
          {confirmations
            .filter(conf => conf.status === 'pending')
            .slice(0, 3)
            .map((confirmation) => (
              <div
                key={confirmation.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{confirmation.spot.event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {confirmation.spot.spot_name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(confirmation.spot.event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {formatDate(confirmation.response_deadline)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/spots/${confirmation.spot_id}/confirm`)}
                  className="ml-3"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Respond
                </Button>
              </div>
            ))}
        </div>

        {/* Show recent confirmations */}
        {confirmations.filter(conf => conf.status !== 'pending').length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm mb-2">Recent Responses</h4>
            <div className="space-y-2">
              {confirmations
                .filter(conf => conf.status !== 'pending')
                .slice(0, 2)
                .map((confirmation) => (
                  <div
                    key={confirmation.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {confirmation.status === 'confirmed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">{confirmation.spot.event.title}</span>
                    </div>
                    <Badge 
                      variant={confirmation.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {confirmation.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};