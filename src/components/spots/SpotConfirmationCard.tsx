import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Timer,
  CalendarPlus
} from 'lucide-react';
import { SpotConfirmationWithDetails, SpotConfirmationResponse } from '@/types/spotConfirmation';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { toast } from '@/hooks/use-toast';

interface SpotConfirmationCardProps {
  confirmation: SpotConfirmationWithDetails;
  onConfirmation: (response: SpotConfirmationResponse) => void;
  isLoading?: boolean;
}

export const SpotConfirmationCard: React.FC<SpotConfirmationCardProps> = ({
  confirmation,
  onConfirmation,
  isLoading = false
}) => {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const { syncEventToCalendar, downloadICSFile, isGoogleConnected } = useCalendarIntegration();

  // Calculate time remaining until deadline
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadline = new Date(confirmation.response_deadline);
      const timeDiff = deadline.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [confirmation.response_deadline]);

  const handleConfirmation = (status: 'confirmed' | 'declined') => {
    onConfirmation({
      status,
      notes: notes.trim() || undefined
    });
  };

  const handleCalendarSync = async () => {
    const calendarEvent = {
      id: confirmation.spot.event_id,
      title: `${confirmation.spot.event.title} - ${confirmation.spot.spot_name}`,
      description: `Comedy performance at ${confirmation.spot.event.venue}\n\nSpot: ${confirmation.spot.spot_name}\nDuration: ${confirmation.spot.duration_minutes || 'TBD'} minutes\n\n${confirmation.spot.event.description || ''}`,
      start_time: `${confirmation.spot.event.event_date}T${confirmation.spot.event.start_time}`,
      end_time: confirmation.spot.event.end_time 
        ? `${confirmation.spot.event.event_date}T${confirmation.spot.event.end_time}`
        : `${confirmation.spot.event.event_date}T${confirmation.spot.event.start_time}`,
      location: `${confirmation.spot.event.venue}, ${confirmation.spot.event.address}`,
      attendees: [confirmation.comedian.email]
    };

    try {
      if (isGoogleConnected) {
        await syncEventToCalendar({ eventData: calendarEvent, integrationId: 'google' });
      } else {
        downloadICSFile([calendarEvent], `${confirmation.spot.event.title.replace(/\s+/g, '-')}.ics`);
      }
    } catch (error) {
      toast({
        title: "Calendar Sync Failed",
        description: "Failed to add event to calendar. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Timer className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Spot Confirmation
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              You've been invited to perform at this event
            </p>
          </div>
          <Badge
            className={`professional-button ${getStatusColor(confirmation.status)} flex items-center gap-1`}
          >
            {getStatusIcon(confirmation.status)}
            {confirmation.status.charAt(0).toUpperCase() + confirmation.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Deadline Warning */}
        {confirmation.status === 'pending' && (
          <Alert className={`${isExpired ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <AlertTriangle className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className={`${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
              {isExpired ? (
                'This invitation has expired. Please contact the promoter if you still want to perform.'
              ) : (
                <>
                  <strong>Response required by:</strong> {formatDate(confirmation.response_deadline)} at{' '}
                  {formatTime(confirmation.response_deadline.split('T')[1])}
                  <br />
                  <strong>Time remaining:</strong> {timeLeft}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Event Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Details
          </h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">{confirmation.spot.event.title}</h4>
              <p className="text-sm text-gray-600">{confirmation.spot.event.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {formatDate(confirmation.spot.event.event_date)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {formatTime(confirmation.spot.event.start_time)}
                  {confirmation.spot.event.end_time && ` - ${formatTime(confirmation.spot.event.end_time)}`}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {confirmation.spot.event.venue}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {confirmation.spot.event.address}
                </span>
              </div>
            </div>

            {confirmation.spot.event.requirements && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">Event Requirements:</p>
                <p className="text-sm text-blue-700 mt-1">{confirmation.spot.event.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Spot Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Spot
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Spot Name</p>
              <p className="font-medium">{confirmation.spot.spot_name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Performance Order</p>
              <p className="font-medium">#{confirmation.spot.spot_order}</p>
            </div>
            
            {confirmation.spot.duration_minutes && (
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">{confirmation.spot.duration_minutes} minutes</p>
              </div>
            )}
            
            {confirmation.spot.payment_amount && (
              <div>
                <p className="text-sm text-gray-600">Payment</p>
                <p className="font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {confirmation.spot.payment_amount} {confirmation.spot.currency}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Promoter Contact */}
        {confirmation.spot.event.promoter && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Promoter Contact</h3>
            <div className="flex items-center gap-3">
              <OptimizedAvatar
                src={confirmation.spot.event.promoter.avatar_url}
                name={`${confirmation.spot.event.promoter.first_name} ${confirmation.spot.event.promoter.last_name}`}
                className="w-10 h-10"
              />
              <div>
                <p className="font-medium">
                  {confirmation.spot.event.promoter.first_name} {confirmation.spot.event.promoter.last_name}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${confirmation.spot.event.promoter.email}`} className="hover:text-blue-600">
                      {confirmation.spot.event.promoter.email}
                    </a>
                  </div>
                  {confirmation.spot.event.promoter.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${confirmation.spot.event.promoter.phone}`} className="hover:text-blue-600">
                        {confirmation.spot.event.promoter.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Section */}
        {(confirmation.status === 'pending' || showNotes) && (
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or questions about this performance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={3}
              disabled={confirmation.status !== 'pending'}
            />
          </div>
        )}

        {/* Calendar Integration */}
        {confirmation.status === 'confirmed' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" />
              Add to Calendar
            </h3>
            <Button
              onClick={handleCalendarSync}
              className="professional-button w-full"
            >
              {isGoogleConnected ? 'Sync to Google Calendar' : 'Download Calendar File'}
            </Button>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        {confirmation.status === 'pending' && !isExpired && (
          <div className="flex gap-4">
            <Button
              onClick={() => handleConfirmation('confirmed')}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Spot
            </Button>
            <Button
              onClick={() => handleConfirmation('declined')}
              disabled={isLoading}
              className="professional-button flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {/* Show Notes Toggle for Confirmed/Declined */}
        {confirmation.status !== 'pending' && confirmation.notes && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600 mb-1">Your response notes:</p>
            <p className="text-sm">{confirmation.notes}</p>
            {confirmation.response_date && (
              <p className="text-xs text-gray-500 mt-2">
                Responded on {formatDate(confirmation.response_date)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};