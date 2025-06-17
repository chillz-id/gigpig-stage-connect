
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, DollarSign, Users, Search, Filter } from 'lucide-react';

const Browse = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const mockShows = [
    {
      id: 1,
      title: "Wednesday Comedy Night",
      venue: "The Laugh Track",
      location: "Sydney, NSW",
      date: "2024-12-20",
      time: "19:30",
      type: "Open Mic",
      spots: 6,
      appliedSpots: 2,
      pay: "Free",
      duration: "5 min",
      description: "Weekly open mic night for new and emerging comedians",
    },
    {
      id: 2,
      title: "Friday Headliner Showcase",
      venue: "Comedy Central Club",
      location: "Melbourne, V6IC",
      date: "2024-12-22",
      time: "20:00",
      type: "Pro",
      spots: 4,
      appliedSpots: 1,
      pay: "$150",
      duration: "15 min",
      description: "Professional showcase featuring established comedians",
      isPaid: true,
    },
    {
      id: 3,
      title: "Saturday Mixed Show",
      venue: "Riverside Comedy",
      location: "Brisbane, QLD",
      date: "2024-12-23",
      time: "21:00",
      type: "Mixed",
      spots: 8,
      appliedSpots: 3,
      pay: "Split",
      duration: "10 min",
      description: "Mix of open mic and paid spots with ticket revenue split",
    },
  ];

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
          {show.isPaid && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
              Verified Only
            </Badge>
          )}
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

        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            disabled={show.isPaid}
          >
            {show.isPaid ? "Upgrade to View" : "Apply Now"}
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
      {mockShows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
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
            <Select>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sydney">Sydney, NSW</SelectItem>
                <SelectItem value="melbourne">Melbourne, VIC</SelectItem>
                <SelectItem value="brisbane">Brisbane, QLD</SelectItem>
                <SelectItem value="perth">Perth, WA</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Show Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open-mic">Open Mic</SelectItem>
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
