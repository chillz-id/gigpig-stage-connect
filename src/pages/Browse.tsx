import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, DollarSign, Users, Search, Star, Navigation, Heart, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { CalendarView } from '@/components/CalendarView';
import { MapView } from '@/components/MapView';
import { TicketPage } from '@/components/TicketPage';
import { EventDetailsPopup } from '@/components/EventDetailsPopup';
import { RecurringEventDateSelector } from '@/components/RecurringEventDateSelector';
import { useNavigate } from 'react-router-dom';
import { useViewMode } from '@/contexts/ViewModeContext';

const Browse = () => {
  const { user, profile, hasRole } = useAuth();
  const { isMemberView } = useViewMode();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedEventForTickets, setSelectedEventForTickets] = useState<any>(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);
  const [showTicketPage, setShowTicketPage] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [showRecurringDateSelector, setShowRecurringDateSelector] = useState(false);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());

  // Check if user is comedian, promoter, or admin
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;

  // Comprehensive mock events for the next 2 months
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

  // Combine real events with mock events - this ensures consistency across all views
  const allEvents = [...events, ...mockEvents];

  // Filter to show only upcoming events for member view
  const upcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    return eventDate >= now;
  });

  // Use upcoming events for member view, all events for other views
  const eventsToShow = isMemberView ? upcomingEvents : allEvents;

  const filteredShows = eventsToShow.filter(event => {
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

    if (event.is_verified_only && !profile?.is_verified) {
      toast({
        title: "Verification required",
        description: "This show requires Comedian Pro members only. Upgrade to Pro to get verified!",
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
    // Check if event is recurring and doesn't have external ticket URL
    if (event.is_recurring && !event.external_ticket_url) {
      setSelectedEventForTickets(event);
      setShowRecurringDateSelector(true);
    } else {
      setSelectedEventForTickets(event);
      setShowTicketPage(true);
    }
  };

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

  const handleShowDetails = (event: any) => {
    setSelectedEventForDetails(event);
    setShowEventDetailsDialog(true);
  };

  const handleDateSelected = (selectedDate: Date) => {
    setShowRecurringDateSelector(false);
    setShowTicketPage(true);
  };

  const ShowCard = ({ show }: { show: any }) => {
    const eventDate = new Date(show.event_date);
    const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
    const isInterested = interestedEvents.has(show.id);
    
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
              {!isMemberView && show.is_verified_only && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Star className="w-3 h-3 mr-1" />
                  Comedian Pro
                </Badge>
              )}
              {!isMemberView && availableSpots <= 0 && (
                <Badge variant="destructive">Full</Badge>
              )}
              {!isMemberView && show.is_recurring && (
                <Badge className="bg-blue-600">Recurring</Badge>
              )}
            </div>
            {isMemberView && (
              <Button
                variant="ghost"
                size="sm"
                className={`absolute top-2 right-2 ${
                  isInterested 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-white hover:text-red-500'
                }`}
                onClick={() => handleToggleInterested(show)}
              >
                <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
              </Button>
            )}
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
                {isMemberView ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      isInterested 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`}
                    onClick={() => handleToggleInterested(show)}
                  >
                    <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
                  </Button>
                ) : (
                  <>
                    {show.is_verified_only && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        <Star className="w-3 h-3 mr-1" />
                        Comedian Pro
                      </Badge>
                    )}
                    {availableSpots <= 0 && (
                      <Badge variant="destructive">Full</Badge>
                    )}
                    {show.is_recurring && (
                      <Badge className="bg-blue-600">Recurring</Badge>
                    )}
                  </>
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
            {!isMemberView && isIndustryUser && show.is_paid && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{Math.max(0, availableSpots)} spots left</span>
              </div>
            )}
            {!isMemberView && (
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>{show.is_paid ? 'Paid Event' : 'Free'}</span>
              </div>
            )}
          </div>

          {!isMemberView && (
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
          )}

          {/* For member view, only show age restriction */}
          {isMemberView && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-foreground border-border">
                {show.age_restriction || '18+'}
              </Badge>
            </div>
          )}

          {show.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{show.description}</p>
          )}

          <div className="flex gap-2 flex-wrap">
            {isIndustryUser && !isMemberView && (
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => handleApply(show)}
                disabled={availableSpots <= 0}
              >
                {availableSpots <= 0 ? 'Show Full' : 'Apply Now'}
              </Button>
            )}
            
            {(isConsumerUser || isMemberView) && (
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
              onClick={() => handleShowDetails(show)}
            >
              Details
            </Button>
            
            {!isMemberView && show.is_recurring && (
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
            <p className="text-muted-foreground">
              {isMemberView ? 'Find shows to attend and buy tickets' : 'Find gigs near you'}
            </p>
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
                  <SelectItem value="Adelaide">Adelaide, SA</SelectItem>
                  <SelectItem value="Gold Coast">Gold Coast, QLD</SelectItem>
                  <SelectItem value="Newcastle">Newcastle, NSW</SelectItem>
                  <SelectItem value="Canberra">Canberra, ACT</SelectItem>
                  <SelectItem value="Hobart">Hobart, TAS</SelectItem>
                  <SelectItem value="Darwin">Darwin, NT</SelectItem>
                  <SelectItem value="Wollongong">Wollongong, NSW</SelectItem>
                  <SelectItem value="Cairns">Cairns, QLD</SelectItem>
                  <SelectItem value="Geelong">Geelong, VIC</SelectItem>
                  <SelectItem value="Townsville">Townsville, QLD</SelectItem>
                  <SelectItem value="Launceston">Launceston, TAS</SelectItem>
                  <SelectItem value="Bendigo">Bendigo, VIC</SelectItem>
                  <SelectItem value="Ballarat">Ballarat, VIC</SelectItem>
                  <SelectItem value="Mackay">Mackay, QLD</SelectItem>
                  <SelectItem value="Rockhampton">Rockhampton, QLD</SelectItem>
                  <SelectItem value="Toowoomba">Toowoomba, QLD</SelectItem>
                </SelectContent>
              </Select>
              {!isMemberView && (
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
              )}
            </div>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {isMemberView ? 'Events' : 'Card View'}
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

      {/* Event Details Popup */}
      <EventDetailsPopup
        event={selectedEventForDetails}
        isOpen={showEventDetailsDialog}
        onClose={() => setShowEventDetailsDialog(false)}
        onApply={handleApply}
        onBuyTickets={handleBuyTickets}
        onGetDirections={handleGetDirections}
        isIndustryUser={isIndustryUser}
        isConsumerUser={isConsumerUser}
      />

      {/* Recurring Event Date Selector */}
      <RecurringEventDateSelector
        event={selectedEventForTickets}
        isOpen={showRecurringDateSelector}
        onClose={() => setShowRecurringDateSelector(false)}
        onDateSelected={handleDateSelected}
      />

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
