
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  ArrowLeft,
  Repeat,
  Star
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

const EventSeries = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();

  // Mock series data - in real app this would come from an API
  const mockSeries = {
    'series-1': {
      title: 'Comedy Night Downtown',
      venue: 'The Laugh Track',
      city: 'Sydney',
      state: 'NSW',
      address: '123 Comedy Street, Sydney NSW 2000',
      description: 'Join us every Monday for an evening of hilarious stand-up comedy featuring local and international comedians.',
      type: 'Stand-up',
      pattern: 'Weekly',
      image_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop',
      events: [
        {
          id: 'mock-1',
          event_date: '2024-07-15',
          start_time: '8:00 PM',
          end_time: '10:00 PM',
          spots: 8,
          applied_spots: 3,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: false,
          dress_code: 'Smart Casual'
        },
        {
          id: 'mock-1-2',
          event_date: '2024-07-22',
          start_time: '8:00 PM',
          end_time: '10:00 PM',
          spots: 8,
          applied_spots: 5,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: false,
          dress_code: 'Smart Casual'
        },
        {
          id: 'mock-1-3',
          event_date: '2024-07-29',
          start_time: '8:00 PM',
          end_time: '10:00 PM',
          spots: 8,
          applied_spots: 1,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: false,
          dress_code: 'Smart Casual'
        },
        {
          id: 'mock-1-4',
          event_date: '2024-08-05',
          start_time: '8:00 PM',
          end_time: '10:00 PM',
          spots: 8,
          applied_spots: 0,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: false,
          dress_code: 'Smart Casual'
        }
      ]
    },
    'series-2': {
      title: 'Friday Night Laughs',
      venue: 'The Comedy Corner',
      city: 'Perth',
      state: 'WA',
      address: '321 Funny Street, Perth WA 6000',
      description: 'End your week with a bang at our popular Friday night comedy show every week!',
      type: 'Mixed',
      pattern: 'Weekly',
      image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
      events: [
        {
          id: 'mock-4',
          event_date: '2024-08-02',
          start_time: '9:00 PM',
          end_time: '11:30 PM',
          spots: 10,
          applied_spots: 4,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: true,
          dress_code: 'Casual'
        },
        {
          id: 'mock-4-2',
          event_date: '2024-08-09',
          start_time: '9:00 PM',
          end_time: '11:30 PM',
          spots: 10,
          applied_spots: 2,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: true,
          dress_code: 'Casual'
        },
        {
          id: 'mock-4-3',
          event_date: '2024-08-16',
          start_time: '9:00 PM',
          end_time: '11:30 PM',
          spots: 10,
          applied_spots: 0,
          status: 'open',
          age_restriction: '18+',
          is_paid: true,
          allow_recording: true,
          dress_code: 'Casual'
        }
      ]
    }
  };

  const series = seriesId ? mockSeries[seriesId as keyof typeof mockSeries] : null;

  const handleApply = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${series?.title}" on ${new Date(event.event_date).toLocaleDateString()} has been submitted successfully.`,
    });
  };

  if (!series) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Series Not Found</h1>
            <p className="text-purple-100 mb-4">The event series you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/browse')} className="bg-gradient-to-r from-pink-500 to-purple-500">
              Browse Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Series Banner */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white overflow-hidden">
            <div className="aspect-[3/1] relative">
              <img 
                src={series.image_url} 
                alt={series.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="w-5 h-5 text-blue-300" />
                  <Badge className="bg-blue-600">{series.pattern}</Badge>
                </div>
                <h1 className="text-4xl font-bold mb-2">{series.title}</h1>
                <p className="text-xl text-gray-200 mb-2">{series.venue} • {series.city}, {series.state}</p>
                <p className="text-gray-300 max-w-2xl">{series.description}</p>
              </div>
            </div>
          </Card>

          {/* Events List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Upcoming Shows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {series.events.map((event) => {
                const eventDate = new Date(event.event_date);
                const availableSpots = event.spots - event.applied_spots;
                const isPastEvent = eventDate < new Date();

                return (
                  <Card key={event.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">
                            {eventDate.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            {series.venue}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          {event.status === 'full' || availableSpots <= 0 ? (
                            <Badge variant="destructive">Full</Badge>
                          ) : isPastEvent ? (
                            <Badge variant="secondary">Past</Badge>
                          ) : (
                            <Badge className="bg-green-600">Open</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-purple-300" />
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-purple-300" />
                          <span>{Math.max(0, availableSpots)} spots left</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-purple-300" />
                          <span>{event.is_paid ? 'Paid Event' : 'Free'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-white border-white/30">
                          {series.type}
                        </Badge>
                        <Badge variant="outline" className="text-white border-white/30">
                          {event.age_restriction}
                        </Badge>
                        <Badge variant="outline" className="text-white border-white/30">
                          {event.dress_code}
                        </Badge>
                        {event.allow_recording && (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Recording OK
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                          onClick={() => handleApply(event)}
                          disabled={availableSpots <= 0 || isPastEvent}
                        >
                          {availableSpots <= 0 ? 'Show Full' : isPastEvent ? 'Past Event' : 'Apply Now'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-white border-white/30 hover:bg-white/10"
                          onClick={() => navigate(`/event/${event.id}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Series Information */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle>About This Series</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <p className="text-gray-300">{series.address}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Show Type</h4>
                  <p className="text-gray-300">{series.type}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Schedule</h4>
                  <p className="text-gray-300">{series.pattern}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Total Shows</h4>
                  <p className="text-gray-300">{series.events.length} scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventSeries;
