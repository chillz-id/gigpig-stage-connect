
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  ArrowLeft,
  Mic,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useEventSpots } from '@/hooks/useEventSpots';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const { events, isLoading } = useEvents();
  const { spots, isLoading: spotsLoading } = useEventSpots(id || '');

  const event = events.find(e => e.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-purple-100 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/browse')} className="bg-gradient-to-r from-pink-500 to-purple-500">
              Browse Other Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const now = new Date();
  const isUpcoming = eventDate >= now;
  
  const filledSpots = spots?.filter(spot => spot.is_filled) || [];
  const availableSpots = spots?.filter(spot => !spot.is_filled) || [];

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    if (event.is_verified_only && !user.isVerified) {
      toast({
        title: "Verification required",
        description: "This show requires Comedian Pro members only. Upgrade to Pro to get verified!",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${event.title}" has been submitted successfully.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/browse')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Event Banner */}
          {event.banner_url && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white overflow-hidden">
              <div className="aspect-[3/1] relative">
                <img 
                  src={event.banner_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                  <p className="text-xl text-gray-200">{event.venue}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Main Event Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Event Header (if no banner) */}
              {!event.banner_url && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-3xl">{event.title}</CardTitle>
                    <CardDescription className="text-xl text-gray-200">
                      {event.venue}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* Event Details */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show past event notice */}
                  {!isUpcoming && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">This event has already occurred</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-300" />
                      <span>{eventDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span>{event.start_time || 'Time TBA'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-purple-300" />
                      <span>{event.city}, {event.state}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-purple-300" />
                      <span>{event.is_paid ? 'Paid Event' : 'Free Event'}</span>
                    </div>
                  </div>

                  {event.address && (
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Full Address:</p>
                      <p>{event.address}</p>
                    </div>
                  )}

                  {event.description && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Description:</p>
                      <p className="text-gray-100">{event.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {event.type && (
                      <Badge variant="outline" className="text-white border-white/30">
                        {event.type}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-white border-white/30">
                      {event.age_restriction}
                    </Badge>
                    <Badge variant="outline" className="text-white border-white/30">
                      {event.dress_code}
                    </Badge>
                    {event.is_verified_only && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        <Star className="w-3 h-3 mr-1" />
                        Comedian Pro
                      </Badge>
                    )}
                    {event.allow_recording && (
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Recording Allowed
                      </Badge>
                    )}
                  </div>

                  {event.requirements && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Requirements:</p>
                      <div className="bg-white/5 p-3 rounded-lg">
                        <p className="text-gray-100 whitespace-pre-line">{event.requirements}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confirmed Line-up - Changed icon from Music to Mic */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Confirmed Line-up ({filledSpots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filledSpots.length > 0 ? (
                    <div className="space-y-3">
                      {filledSpots.map((spot, index) => (
                        <div key={spot.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-purple-500 text-white">
                                {index + 1}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{spot.spot_name}</p>
                              <p className="text-sm text-gray-300">{spot.duration_minutes} minutes</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {spot.is_paid && (
                              <Badge className="bg-green-600">
                                ${spot.payment_amount} {spot.currency}
                              </Badge>
                            )}
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mic className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-300">No confirmed comedians yet</p>
                      {isUpcoming && <p className="text-sm text-gray-400">Be the first to apply!</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {isUpcoming ? 'Spots Available' : 'Event Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {isUpcoming ? (
                      <>
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {availableSpots.length}
                        </div>
                        <p className="text-gray-300">out of {spots?.length || 0} total spots</p>
                        
                        {availableSpots.length > 0 ? (
                          <Button 
                            onClick={handleApply}
                            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                          >
                            Apply Now
                          </Button>
                        ) : (
                          <Badge variant="destructive" className="mt-4">
                            Show Full
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-400 mb-2">
                          Past Event
                        </div>
                        <p className="text-gray-300">This event has concluded</p>
                        <Badge variant="outline" className="mt-4 text-gray-400 border-gray-400">
                          Event Completed
                        </Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Available Spots Details - only show for upcoming events */}
              {isUpcoming && availableSpots.length > 0 && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Available Spots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {availableSpots.map((spot) => (
                        <div key={spot.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium">{spot.spot_name}</p>
                            {spot.is_paid && (
                              <Badge className="bg-green-600 text-xs">
                                ${spot.payment_amount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-300">
                            {spot.duration_minutes} minutes
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Stats */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Event Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Event Type:</span>
                    <span>{event.type || 'Mixed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Duration:</span>
                    <span>{event.end_time ? `${event.start_time} - ${event.end_time}` : 'TBA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <Badge variant={isUpcoming && event.status === 'open' ? 'default' : 'secondary'}>
                      {isUpcoming ? (event.status || 'Open') : 'Past Event'}
                    </Badge>
                  </div>
                  {event.is_recurring && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Recurring:</span>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {event.recurrence_pattern}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
