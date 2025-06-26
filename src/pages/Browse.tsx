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
import { mockEvents } from '@/data/mockEvents';

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

  // Combine real events with mock events - this ensures consistency across all views
  const allEvents = [...events, ...mockEvents];

  // Filter to show only upcoming events (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const upcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  // Always use upcoming events for all views
  const eventsToShow = upcomingEvents;

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
