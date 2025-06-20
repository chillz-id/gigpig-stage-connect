
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, DollarSign, Users, Search, Star } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { CalendarView } from '@/components/CalendarView';
import { MapView } from '@/components/MapView';
import { useNavigate } from 'react-router-dom';

const Browse = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredShows = events.filter(event => {
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

    if (event.is_verified_only && !user.isVerified) {
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

  const ShowCard = ({ show }: { show: any }) => {
    const eventDate = new Date(show.event_date);
    const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
    
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground hover:bg-card/70 transition-colors">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{show.title}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {show.venue} • {show.city}, {show.state}
              </CardDescription>
            </div>
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
            </div>
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
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{Math.max(0, availableSpots)} spots left</span>
            </div>
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

          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => handleApply(show)}
              disabled={availableSpots <= 0}
            >
              {availableSpots <= 0 ? 'Show Full' : 'Apply Now'}
            </Button>
            <Button 
              variant="outline" 
              className="text-foreground border-border hover:bg-accent"
              onClick={() => navigate(`/event/${show.id}`)}
            >
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ListView = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-xl text-muted-foreground">Loading events...</div>
        </div>
      ) : filteredShows.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No shows found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      ) : (
        filteredShows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))
      )}
    </div>
  );

  return (
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
              List View
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
  );
};

export default Browse;
