
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, DollarSign, Users, Search, Star } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { mockShows } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Browse = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredShows = mockShows.filter(show => {
    const matchesSearch = show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         show.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         show.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || show.location.includes(locationFilter);
    const matchesType = !typeFilter || show.type.toLowerCase().includes(typeFilter.toLowerCase());
    
    return matchesSearch && matchesLocation && matchesType;
  });

  const handleApply = (show: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    if (show.isVerifiedOnly && !user.isVerified) {
      toast({
        title: "Verification required",
        description: "This show requires verified comedians only. Upgrade to Pro to get verified!",
        variant: "destructive",
      });
      return;
    }

    if (show.status === 'full') {
      toast({
        title: "Show is full",
        description: "This show has reached its maximum capacity.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${show.title}" has been submitted successfully.`,
    });
  };

  const ShowCard = ({ show }: { show: any }) => (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{show.title}</CardTitle>
            <CardDescription className="text-purple-100">
              {show.venue} • {show.location}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            {show.isVerifiedOnly && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Star className="w-3 h-3 mr-1" />
                Verified Only
              </Badge>
            )}
            {show.status === 'full' && (
              <Badge variant="destructive">Full</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{show.date}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{show.time}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{show.spots - show.appliedSpots} spots left</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span>{show.pay}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-white border-white/30">
            {show.type}
          </Badge>
          <Badge variant="outline" className="text-white border-white/30">
            {show.duration}
          </Badge>
        </div>

        <p className="text-purple-100 text-sm">{show.description}</p>

        {show.requirements && (
          <div className="text-xs text-purple-200">
            <p className="font-medium mb-1">Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              {show.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            onClick={() => handleApply(show)}
            disabled={show.status === 'full'}
          >
            {show.status === 'full' ? 'Show Full' : 'Apply Now'}
          </Button>
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ListView = () => (
    <div className="space-y-4">
      {filteredShows.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No shows found</h3>
            <p className="text-purple-100">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      ) : (
        filteredShows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))
      )}
    </div>
  );

  const CalendarView = () => (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center text-white">
      <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-300" />
      <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
      <p className="text-purple-100">
        Interactive calendar showing all available shows by date - Coming Soon!
      </p>
    </div>
  );

  const MapView = () => (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center text-white">
      <MapPin className="w-16 h-16 mx-auto mb-4 text-purple-300" />
      <h3 className="text-xl font-semibold mb-2">Map View</h3>
      <p className="text-purple-100">
        Interactive map showing comedy venues and events near you - Coming Soon!
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Shows</h1>
          <p className="text-purple-100">Find your next comedy opportunity</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search shows, venues, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />
            </div>
            <Select onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                <SelectItem value="Sydney">Sydney, NSW</SelectItem>
                <SelectItem value="Melbourne">Melbourne, VIC</SelectItem>
                <SelectItem value="Brisbane">Brisbane, QLD</SelectItem>
                <SelectItem value="Perth">Perth, WA</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Show Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
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
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="list" className="data-[state=active]:bg-purple-500">
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-purple-500">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-purple-500">
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
