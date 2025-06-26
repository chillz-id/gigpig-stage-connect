import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, DollarSign, Users, Search, Star, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { CalendarView } from '@/components/CalendarView';
import { MapView } from '@/components/MapView';
import { TicketPage } from '@/components/TicketPage';
import { useNavigate } from 'react-router-dom';

const Browse = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedEventForTickets, setSelectedEventForTickets] = useState<any>(null);
  const [showTicketPage, setShowTicketPage] = useState(false);

  // Check if user is comedian, promoter, or admin
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;

  // Mock events for the next 2 months with banner images
  const mockEvents = [
    {
      id: 'mock-1',
      title: 'Comedy Night Downtown',
      venue: 'The Laugh Track',
      city: 'Sydney',
      state: 'NSW',
      address: '123 Comedy Street, Sydney NSW 2000',
      event_date: '2024-07-15',
      start_time: '8:00 PM',
      end_time: '10:00 PM',
      description: 'Join us for an evening of hilarious stand-up comedy featuring local and international comedians.',
      type: 'Stand-up',
      age_restriction: '18+',
      is_paid: true,
      is_verified_only: false,
      spots: 8,
      applied_spots: 3,
      status: 'open',
      allow_recording: false,
      dress_code: 'Smart Casual',
      banner_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop',
      is_recurring: true,
      recurrence_pattern: 'weekly',
      series_id: 'series-1'
    },
    {
      id: 'mock-2',
      title: 'Open Mic Comedy',
      venue: 'Brew & Laugh Cafe',
      city: 'Melbourne',
      state: 'VIC',
      address: '456 Laughter Lane, Melbourne VIC 3000',
      event_date: '2024-07-20',
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
      banner_url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=400&fit=crop'
    },
    {
      id: 'mock-3',
      title: 'Pro Comedy Showcase',
      venue: 'Elite Comedy Club',
      city: 'Brisbane',
      state: 'QLD',
      address: '789 Professional Way, Brisbane QLD 4000',
      event_date: '2024-07-25',
      start_time: '8:30 PM',
      end_time: '11:00 PM',
      description: 'Professional comedy showcase featuring verified comedians only.',
      type: 'Professional',
      age_restriction: '21+',
      is_paid: true,
      is_verified_only: true,
      spots: 6,
      applied_spots: 6,
      status: 'full',
      allow_recording: false,
      dress_code: 'Smart Casual',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop'
    },
    {
      id: 'mock-4',
      title: 'Friday Night Laughs',
      venue: 'The Comedy Corner',
      city: 'Perth',
      state: 'WA',
      address: '321 Funny Street, Perth WA 6000',
      event_date: '2024-08-02',
      start_time: '9:00 PM',
      end_time: '11:30 PM',
      description: 'End your week with a bang at our popular Friday night comedy show.',
      type: 'Mixed',
      age_restriction: '18+',
      is_paid: true,
      is_verified_only: false,
      spots: 10,
      applied_spots: 4,
      status: 'open',
      allow_recording: true,
      dress_code: 'Casual',
      banner_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
      is_recurring: true,
      recurrence_pattern: 'weekly',
      series_id: 'series-2'
    },
    {
      id: 'mock-5',
      title: 'Rooftop Comedy Under Stars',
      venue: 'Sky High Comedy',
      city: 'Sydney',
      state: 'NSW',
      address: '567 Heights Boulevard, Sydney NSW 2001',
      event_date: '2024-08-10',
      start_time: '7:00 PM',
      end_time: '10:00 PM',
      description: 'Unique outdoor comedy experience on our rooftop terrace with city views.',
      type: 'Outdoor',
      age_restriction: '18+',
      is_paid: true,
      is_verified_only: false,
      spots: 15,
      applied_spots: 7,
      status: 'open',
      allow_recording: false,
      dress_code: 'Weather Appropriate',
      banner_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop'
    }
  ];

  // Combine real events with mock events
  const allEvents = [...events, ...mockEvents];

  const filteredShows = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${event.city}, ${event.state}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || locationFilter === 'all' || 
                           `${event.city}, ${event.state}`.includes(locationFilter);
    const matchesType = !typeFilter || typeFilter === 'all' || 
                       (event.type && event.type.toLowerCase().includes(typeFilter.toLowerCase()));
    
    return matchesSearch && matchesLocation && matchesType;
  });

  const handleApply = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    if (event.is_verified_only && !user.is_verified) {
      toast({
        title: "Verification required",
        description: "This show requires verified comedians only. Upgrade to Pro to get verified!",
        variant: "destructive",
      });
      return;
    }

    if (event.status === 'full') {
      toast({
        title: "Show is full",
        description: "This show has reached its maximum capacity.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${event.title}" has been submitted successfully.`,
    });
  };

  const handleBuyTickets = (event: any) => {
    setSelectedEventForTickets(event);
    setShowTicketPage(true);
  };

  const handleGetDirections = (event: any) => {
    if (event.address) {
      const encodedAddress = encodeURIComponent(event.address);
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      toast({
        title: "Address not available",
        description: "No address provided for this venue.",
        variant: "destructive",
      });
    }
  };

  const ShowCard = ({ show }: { show: any }) => {
    const eventDate = new Date(show.event_date);
    const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
    
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
              {show.is_verified_only && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Star className="w-3 h-3 mr-1" />
                  Verified Only
                </Badge>
              )}
              {availableSpots <= 0 && (
                <Badge variant="destructive">Full</Badge>
              )}
              {show.is_recurring && (
                <Badge className="bg-blue-600">Recurring</Badge>
              )}
            </div>
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
                {show.is_verified_only && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Star className="w-3 h-3 mr-1" />
                    Verified Only
                  </Badge>
                )}
                {availableSpots <= 0 && (
                  <Badge variant="destructive">Full</Badge>
                )}
                {show.is_recurring && (
                  <Badge className="bg-blue-600">Recurring</Badge>
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
            {/* Show spots left only to industry users (comedians/promoters) and only for paid events */}
            {isIndustryUser && show.is_paid && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{Math.max(0, availableSpots)} spots left</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{show.is_paid ? 'Paid Event' : 'Free'}</span>
            </div>
          </div>

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

          {show.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{show.description}</p>
          )}

          <div className="flex gap-2 flex-wrap">
            {/* Show Apply Now for industry users (comedians/promoters) */}
            {isIndustryUser && (
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => handleApply(show)}
                disabled={availableSpots <= 0}
              >
                {availableSpots <= 0 ? 'Show Full' : 'Apply Now'}
              </Button>
            )}
            
            {/* Show Buy Tickets for consumer users and paid events */}
            {isConsumerUser && show.is_paid && (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                onClick={() => handleBuyTickets(show)}
              >
                Buy Tickets
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="text-foreground border-border hover:bg-accent"
              onClick={() => navigate(`/event/${show.id}`)}
            >
              Details
            </Button>
            
            {show.is_recurring && (
              <Button 
                variant="outline" 
                className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                onClick={() => navigate(`/series/${show.series_id}`)}
              >
                View Series
              </Button>
            )}
            
            {show.address && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGetDirections(show)}
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

  const ListView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading ? (
        <div className="col-span-full text-center py-8">
          <div className="text-xl text-muted-foreground">Loading events...</div>
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="col-span-full">
          <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No shows found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        filteredShows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Browse Shows</h1>
            <p className="text-muted-foreground">Find gigs near you</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search shows, venues, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Select onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-48 bg-card/50 border-border text-foreground">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Sydney">Sydney, NSW</SelectItem>
                  <SelectItem value="Melbourne">Melbourne, VIC</SelectItem>
                  <SelectItem value="Brisbane">Brisbane, QLD</SelectItem>
                  <SelectItem value="Perth">Perth, WA</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48 bg-card/50 border-border text-foreground">
                  <SelectValue placeholder="Show Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="open mic">Open Mic</SelectItem>
                  <SelectItem value="semi-pro">Semi-Pro</SelectItem>
                  <SelectItem value="pro">Professional</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Card View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              <ListView />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <CalendarView />
            </TabsContent>
            
            <TabsContent value="map" className="mt-6">
              <MapView />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Ticket Purchase Modal */}
      <TicketPage
        event={selectedEventForTickets}
        isOpen={showTicketPage}
        onClose={() => setShowTicketPage(false)}
      />
    </>
  );
};

export default Browse;
