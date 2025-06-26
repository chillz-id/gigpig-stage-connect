
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  Search,
  ArrowLeft,
  Building,
  Globe,
  Mail,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EventDetailsPopup } from '@/components/EventDetailsPopup';

const Organizer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizations } = useOrganizations();
  const { events } = useEvents();
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);

  const organization = organizations.find(org => org.id === id);
  const organizationEvents = events.filter(event => event.promoter_id === organization?.promoter_id);

  // Check if user is comedian, promoter, or admin
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;

  // Filter events based on search and time filter
  const filteredEvents = organizationEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const eventDate = new Date(event.event_date);
    const now = new Date();
    
    let matchesTime = true;
    if (timeFilter === 'upcoming') {
      matchesTime = eventDate >= now;
    } else if (timeFilter === 'past') {
      matchesTime = eventDate < now;
    }
    
    return matchesSearch && matchesTime;
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
        description: "This show requires verified comedians only. Upgrade to Pro to get verified!",
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
    // Handle ticket purchase logic here
    toast({
      title: "Redirecting to tickets",
      description: "Opening ticket purchase page...",
    });
  };

  const handleGetDirections = (event: any) => {
    if (event.address) {
      const encodedAddress = encodeURIComponent(event.address);
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleShowDetails = (event: any) => {
    setSelectedEventForDetails(event);
    setShowEventDetailsDialog(true);
  };

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Organization Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The organization you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/browse')} className="w-full">
              Browse Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const EventCard = ({ event }: { event: any }) => {
    const eventDate = new Date(event.event_date);
    const isUpcoming = eventDate >= new Date();
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {event.banner_url && (
          <div className="aspect-[2/1] relative overflow-hidden">
            <img 
              src={event.banner_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-2 right-2 flex gap-2">
              {event.is_verified_only && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Star className="w-3 h-3 mr-1" />
                  Verified Only
                </Badge>
              )}
              {!isUpcoming && (
                <Badge variant="secondary">Past Event</Badge>
              )}
            </div>
            <div className="absolute bottom-2 left-2 text-white">
              <p className="text-sm font-medium">
                {eventDate.toLocaleDateString()} • {event.start_time}
              </p>
            </div>
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          <CardDescription>
            {event.venue} • {event.city}, {event.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{eventDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{event.start_time || 'TBA'}</span>
              </div>
            </div>
            <Badge variant={event.is_paid ? "default" : "outline"}>
              {event.is_paid ? 'Paid' : 'Free'}
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShowDetails(event)}
              className="flex-1"
            >
              View Details
            </Button>
            {isIndustryUser && isUpcoming && (
              <Button 
                size="sm"
                onClick={() => handleApply(event)}
                className="flex-1"
              >
                Apply
              </Button>
            )}
            {isConsumerUser && isUpcoming && event.is_paid && (
              <Button 
                size="sm"
                onClick={() => handleBuyTickets(event)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Tickets
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/browse')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </div>

          {/* Organization Header */}
          <div className="mb-8">
            <Card className="overflow-hidden">
              <div className="relative">
                {organization.logo_url && (
                  <div className="h-48 bg-gradient-to-r from-purple-600 to-blue-600 relative">
                    <img 
                      src={organization.logo_url} 
                      alt={organization.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )}
                <div className={`p-6 ${organization.logo_url ? 'bg-white' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
                      {organization.description && (
                        <p className="text-muted-foreground mb-4 max-w-2xl">
                          {organization.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {organization.city && organization.state && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{organization.city}, {organization.state}</span>
                          </div>
                        )}
                        {organization.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{organization.contact_email}</span>
                          </div>
                        )}
                        {organization.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{organization.contact_phone}</span>
                          </div>
                        )}
                        {organization.website_url && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <a 
                              href={organization.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Events Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-2xl font-bold">
                Events ({filteredEvents.length})
              </h2>
              
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Time Filter Tabs */}
            <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value={timeFilter} className="mt-6">
                {filteredEvents.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No events found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? "Try adjusting your search criteria" 
                          : "This organizer hasn't posted any events yet"
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
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
    </>
  );
};

export default Organizer;
