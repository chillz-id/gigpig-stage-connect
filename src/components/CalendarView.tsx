
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Star, Heart } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Using the same mock data as Browse.tsx
const mockEvents = [
  // January 2025 Events
  {
    id: 'mock-1',
    title: 'New Year Comedy Kickoff',
    venue: 'The Laugh Track',
    city: 'Sydney',
    state: 'NSW',
    address: '123 Comedy Street, Sydney NSW 2000',
    event_date: '2025-01-03',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Start the new year with laughs! Featuring top comedians from across Australia.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 8,
    applied_spots: 3,
    status: 'open',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only'
  },
  {
    id: 'mock-2',
    title: 'Melbourne Open Mic Night',
    venue: 'Brew & Laugh Cafe',
    city: 'Melbourne',
    state: 'VIC',
    address: '456 Laughter Lane, Melbourne VIC 3000',
    event_date: '2025-01-05',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Weekly open mic night for new and experienced comedians to test their material.',
    type: 'Open Mic',
    age_restriction: 'All Ages',
    is_paid: false,
    is_verified_only: false,
    spots: 12,
    applied_spots: 8,
    status: 'open',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=400&fit=crop',
    is_recurring: true,
    recurrence_pattern: 'Weekly',
    series_id: 'series-1'
  },
  {
    id: 'mock-3',
    title: 'Brisbane Comedy Showcase',
    venue: 'The Comedy Corner',
    city: 'Brisbane',
    state: 'QLD',
    address: '789 Funny Street, Brisbane QLD 4000',
    event_date: '2025-01-08',
    start_time: '8:30 PM',
    end_time: '11:00 PM',
    description: 'Professional comedy showcase featuring established comedians.',
    type: 'Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 6,
    applied_spots: 4,
    status: 'open',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-4',
    title: 'Perth Sunset Comedy',
    venue: 'Sunset Lounge',
    city: 'Perth',
    state: 'WA',
    address: '321 Sunset Drive, Perth WA 6000',
    event_date: '2025-01-10',
    start_time: '6:00 PM',
    end_time: '8:30 PM',
    description: 'Enjoy comedy with a beautiful sunset view over Perth.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 10,
    applied_spots: 6,
    status: 'open',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-5',
    title: 'Adelaide Comedy Festival Preview',
    venue: 'Adelaide Arts Centre',
    city: 'Adelaide',
    state: 'SA',
    address: '567 Arts Way, Adelaide SA 5000',
    event_date: '2025-01-12',
    start_time: '7:00 PM',
    end_time: '9:00 PM',
    description: 'Preview night for the upcoming Adelaide Comedy Festival.',
    type: 'Professional',
    age_restriction: '16+',
    is_paid: true,
    is_verified_only: true,
    spots: 5,
    applied_spots: 5,
    status: 'full',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only'
  },
  {
    id: 'mock-6',
    title: 'Gold Coast Beach Comedy',
    venue: 'Beachside Bar',
    city: 'Gold Coast',
    state: 'QLD',
    address: '888 Beach Road, Gold Coast QLD 4217',
    event_date: '2025-01-15',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Comedy by the beach with ocean views.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: false,
    is_verified_only: false,
    spots: 8,
    applied_spots: 3,
    status: 'open',
    allow_recording: true,
    dress_code: 'Beach Casual',
    banner_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-7',
    title: 'Newcastle Comedy Night',
    venue: 'The Steel City Club',
    city: 'Newcastle',
    state: 'NSW',
    address: '999 Steel Street, Newcastle NSW 2300',
    event_date: '2025-01-18',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Local comedy night featuring Newcastle\'s best comedians.',
    type: 'Open Mic',
    age_restriction: '18+',
    is_paid: false,
    is_verified_only: false,
    spots: 10,
    applied_spots: 7,
    status: 'open',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1588270937732-b6ba75eb8b45?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-8',
    title: 'Canberra Capitol Comedy',
    venue: 'Parliament House Comedy Club',
    city: 'Canberra',
    state: 'ACT',
    address: '111 Parliament Drive, Canberra ACT 2600',
    event_date: '2025-01-20',
    start_time: '8:00 PM',
    end_time: '10:30 PM',
    description: 'Political satire and general comedy in the nation\'s capital.',
    type: 'Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 6,
    applied_spots: 4,
    status: 'open',
    allow_recording: false,
    dress_code: 'Business Casual',
    banner_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only'
  },
  {
    id: 'mock-9',
    title: 'Hobart Harbor Comedy',
    venue: 'Waterfront Comedy Club',
    city: 'Hobart',
    state: 'TAS',
    address: '222 Harbor View, Hobart TAS 7000',
    event_date: '2025-01-22',
    start_time: '7:00 PM',
    end_time: '9:00 PM',
    description: 'Comedy with stunning harbor views in Tasmania.',
    type: 'Mixed',
    age_restriction: '16+',
    is_paid: true,
    is_verified_only: false,
    spots: 7,
    applied_spots: 2,
    status: 'open',
    allow_recording: true,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-10',
    title: 'Darwin Tropical Comedy Night',
    venue: 'Top End Laughs',
    city: 'Darwin',
    state: 'NT',
    address: '333 Tropical Ave, Darwin NT 0800',
    event_date: '2025-01-25',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Comedy in the tropical heat of Darwin.',
    type: 'Open Mic',
    age_restriction: '18+',
    is_paid: false,
    is_verified_only: false,
    spots: 9,
    applied_spots: 5,
    status: 'open',
    allow_recording: true,
    dress_code: 'Tropical Casual',
    banner_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop'
  },
  // February 2025 Events
  {
    id: 'mock-11',
    title: 'Valentine\'s Day Love & Laughs',
    venue: 'Romance Comedy Club',
    city: 'Sydney',
    state: 'NSW',
    address: '444 Love Street, Sydney NSW 2000',
    event_date: '2025-02-14',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Special Valentine\'s Day comedy show about love, relationships, and dating disasters.',
    type: 'Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 6,
    applied_spots: 6,
    status: 'full',
    allow_recording: false,
    dress_code: 'Romantic Attire',
    banner_url: 'https://images.unsplash.com/photo-1518621012406-0a4e1e7c4138?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only'
  },
  {
    id: 'mock-12',
    title: 'Melbourne International Comedy Festival Warm-up',
    venue: 'Festival Hall',
    city: 'Melbourne',
    state: 'VIC',
    address: '555 Festival St, Melbourne VIC 3000',
    event_date: '2025-02-20',
    start_time: '7:00 PM',
    end_time: '10:00 PM',
    description: 'Get ready for the big festival with this warm-up show.',
    type: 'Professional',
    age_restriction: '15+',
    is_paid: true,
    is_verified_only: false,
    spots: 12,
    applied_spots: 8,
    status: 'open',
    allow_recording: true,
    dress_code: 'Festival Casual',
    banner_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-13',
    title: 'Wollongong Coastal Comedy',
    venue: 'Seaside Laughs',
    city: 'Wollongong',
    state: 'NSW',
    address: '666 Coastal Road, Wollongong NSW 2500',
    event_date: '2025-02-22',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Comedy by the coast with local and visiting comedians.',
    type: 'Mixed',
    age_restriction: '16+',
    is_paid: false,
    is_verified_only: false,
    spots: 8,
    applied_spots: 4,
    status: 'open',
    allow_recording: true,
    dress_code: 'Coastal Casual',
    banner_url: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=400&fit=crop'
  },
  {
    id: 'mock-14',
    title: 'Cairns Tropical Laughs Festival',
    venue: 'Rainforest Comedy Club',
    city: 'Cairns',
    state: 'QLD',
    address: '777 Rainforest Ave, Cairns QLD 4870',
    event_date: '2025-02-25',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Comedy in the heart of tropical North Queensland.',
    type: 'Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 5,
    applied_spots: 3,
    status: 'open',
    allow_recording: false,
    dress_code: 'Tropical Smart',
    banner_url: 'https://images.unsplash.com/photo-1582719471324-f3dfc0a5e3b9?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only'
  },
  {
    id: 'mock-15',
    title: 'Geelong Comedy Club Monthly Show',
    venue: 'Geelong Laughs',
    city: 'Geelong',
    state: 'VIC',
    address: '888 Bay Street, Geelong VIC 3220',
    event_date: '2025-02-28',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Monthly comedy showcase in Geelong with local talent.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 7,
    applied_spots: 5,
    status: 'open',
    allow_recording: true,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1533922922960-8a77186b6a78?w=800&h=400&fit=crop'
  }
];

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { isMemberView } = useViewMode();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter to show only upcoming events for member view
  const upcomingEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    return eventDate >= now;
  });

  // Use upcoming events for member view, all events for other views
  const eventsToShow = isMemberView ? upcomingEvents : mockEvents;

  const handleToggleInterested = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark events as interested.",
        variant: "destructive",
      });
      return;
    }

    const newInterestedEvents = new Set(interestedEvents);
    if (interestedEvents.has(event.id)) {
      newInterestedEvents.delete(event.id);
      toast({
        title: "Removed from interested",
        description: `"${event.title}" has been removed from your interested events.`,
      });
    } else {
      newInterestedEvents.add(event.id);
      toast({
        title: "Added to interested!",
        description: `"${event.title}" has been added to your calendar as an interested event.`,
      });
    }
    setInterestedEvents(newInterestedEvents);
  };

  const handleBuyTickets = (event: any) => {
    toast({
      title: "Ticket purchase",
      description: `Redirecting to ticket purchase for "${event.title}"`,
    });
  };

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
      description: `Your application for "${event.title}" has been submitted successfully.`,
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  const getEventsForDate = (date: Date) => {
    return eventsToShow.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === today.toDateString();
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                const dayEvents = getEventsForDate(day);
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-1 border border-border cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-card/30' : 'bg-muted/20 text-muted-foreground'}
                      ${isToday ? 'bg-primary/20 border-primary' : ''}
                      ${isSelected ? 'bg-primary/30 border-primary' : ''}
                      hover:bg-card/50
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 bg-primary/80 text-primary-foreground rounded truncate"
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {selectedDate ? `Events on ${selectedDate.toLocaleDateString()}` : 'Select a date'}
        </h3>

        {selectedDate && selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map(event => {
              const isInterested = interestedEvents.has(event.id);
              const availableSpots = (event.spots || 5) - (event.applied_spots || 0);
              
              return (
                <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <p className="text-muted-foreground text-sm">{event.venue}</p>
                        <p className="text-muted-foreground text-sm">{event.city}, {event.state}</p>
                      </div>
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
                            onClick={() => handleToggleInterested(event)}
                          >
                            <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
                          </Button>
                        ) : (
                          <>
                            {event.is_verified_only && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                                <Star className="w-3 h-3 mr-1" />
                                Comedian Pro
                              </Badge>
                            )}
                            {availableSpots <= 0 && (
                              <Badge variant="destructive">Full</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.start_time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.city}, {event.state}</span>
                      </div>
                      {!isMemberView && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{Math.max(0, availableSpots)} spots left</span>
                        </div>
                      )}
                    </div>

                    {/* Only show age restriction for member view */}
                    <div className="flex flex-wrap gap-2">
                      {isMemberView ? (
                        <Badge variant="outline" className="text-foreground border-border">
                          {event.age_restriction}
                        </Badge>
                      ) : (
                        <>
                          {event.type && (
                            <Badge variant="outline" className="text-foreground border-border">
                              {event.type}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-foreground border-border">
                            {event.age_restriction}
                          </Badge>
                        </>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {!isMemberView && (
                        <Button 
                          className="flex-1 bg-primary hover:bg-primary/90"
                          onClick={() => handleApply(event)}
                          disabled={availableSpots <= 0}
                        >
                          {availableSpots <= 0 ? 'Show Full' : 'Apply Now'}
                        </Button>
                      )}
                      
                      {(isMemberView || event.is_paid) && (
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleBuyTickets(event)}
                        >
                          Buy Tickets
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : selectedDate ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">No events on this date</h4>
              <p className="text-muted-foreground text-sm">
                Check other dates for upcoming shows
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">
                {isMemberView ? 'Find Events to Attend' : 'Find Shows to Apply For'}
              </h4>
              <p className="text-muted-foreground text-sm">
                Click on any date to see available {isMemberView ? 'events' : 'shows'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
