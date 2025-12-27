import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useSpotConfirmation } from '@/hooks/useSpotConfirmation';
import { toast } from 'sonner';

interface SpotConfirmationCardProps {
  spotId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  spotType: string;
  isPaid: boolean;
  paymentAmount?: number;
  currency?: string;
  confirmationStatus?: string | null;
  confirmationDeadline?: string | null;
  onConfirmationUpdate?: () => void;
}

const SpotConfirmationCard: React.FC<SpotConfirmationCardProps> = ({
  spotId,
  eventTitle,
  eventDate,
  eventVenue,
  spotType,
  isPaid,
  paymentAmount,
  currency,
  confirmationStatus,
  confirmationDeadline,
  onConfirmationUpdate
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const { confirmSpot, declineSpot } = useSpotConfirmation();

  const deadline = confirmationDeadline ? new Date(confirmationDeadline) : null;
  const isPastDeadline = deadline && isPast(deadline);
  const isConfirmed = confirmationStatus === 'confirmed';
  const isDeclined = confirmationStatus === 'declined';
  const isPending = !confirmationStatus || confirmationStatus === 'pending';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmSpot(spotId);
      toast.success('Spot confirmed successfully!');
      onConfirmationUpdate?.();
    } catch (error) {
      toast.error('Failed to confirm spot');
      console.error('Confirmation error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await declineSpot(spotId, 'Schedule conflict'); // You can add a reason input
      toast.success('Spot declined');
      onConfirmationUpdate?.();
    } catch (error) {
      toast.error('Failed to decline spot');
      console.error('Decline error:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  const getStatusBadge = () => {
    if (isConfirmed) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    }
    if (isDeclined) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      );
    }
    if (isPastDeadline) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge variant="warning">
        <Clock className="w-3 h-3 mr-1" />
        Action Required
      </Badge>
    );
  };

  return (
    <Card className={`${isPending && !isPastDeadline ? 'border-yellow-200' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{eventTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{spotType} Spot</p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{format(new Date(eventDate), 'MMMM d, yyyy - h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{eventVenue}</span>
          </div>
          {isPaid && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span>{currency} {paymentAmount}</span>
            </div>
          )}
        </div>

        {/* Deadline Alert */}
        {isPending && deadline && (
          <Alert className={isPastDeadline ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isPastDeadline ? (
                <span className="text-red-700">
                  Confirmation deadline has passed
                </span>
              ) : (
                <span>
                  Please confirm by{' '}
                  <span className="font-semibold">
                    {format(deadline, 'MMM d, h:mm a')}
                  </span>
                  {' '}({formatDistanceToNow(deadline, { addSuffix: true })})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {isPending && !isPastDeadline && (
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isConfirming || isDeclining}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Spot
                </>
              )}
            </Button>
            <Button
              className="professional-button"
              className="flex-1"
              onClick={handleDecline}
              disabled={isConfirming || isDeclining}
            >
              {isDeclining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {isConfirmed && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Spot Confirmed!</p>
            <p className="text-sm text-green-600 mt-1">See you at the show</p>
          </div>
        )}

        {isDeclined && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <XCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Spot Declined</p>
          </div>
        )}

        {isPastDeadline && isPending && (
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Deadline Expired</p>
            <p className="text-sm text-red-600 mt-1">This spot may have been reassigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpotConfirmationCard;