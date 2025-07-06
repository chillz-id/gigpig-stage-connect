// Flight Dashboard - Real-time flight tracking and management
import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Search,
  Filter,
  Bell,
  Map,
  Calendar,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import FlightList from '@/components/flights/FlightList';
import FlightMap from '@/components/flights/FlightMap';
import FlightStatisticsWidget from '@/components/flights/FlightStatisticsWidget';
import CreateFlightBookingDialog from '@/components/flights/CreateFlightBookingDialog';
import FlightNotificationsPanel from '@/components/flights/FlightNotificationsPanel';
import FlightSearchDialog from '@/components/flights/FlightSearchDialog';

import { useUserFlightBookings, useUserFlightStatistics } from '@/hooks/useFlights';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { FlightFilters, FlightSort, FlightStatus } from '@/types/flight';

export default function FlightDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'map' | 'calendar'>('list');
  const [createFlightOpen, setCreateFlightOpen] = useState(false);
  const [flightSearchOpen, setFlightSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters and sorting state
  const [filters, setFilters] = useState<FlightFilters>({});
  const [sort, setSort] = useState<FlightSort>({
    field: 'scheduled_departure',
    direction: 'asc'
  });

  // Fetch flight data
  const {
    data: flights = [],
    isLoading: flightsLoading,
    error: flightsError,
    refetch: refetchFlights
  } = useUserFlightBookings(user?.id, filters);

  const {
    data: flightStats,
    isLoading: statsLoading,
    error: statsError
  } = useUserFlightStatistics(user?.id);

  // Auto-refresh flights every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchFlights();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, refetchFlights]);

  // Handle real-time flight status updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to flight status changes
    const { flightSubscriptionService } = require('@/services/flightService');
    
    const subscription = flightSubscriptionService.subscribeToFlightChanges(
      (payload: any) => {
        if (payload.eventType === 'UPDATE') {
          // Refresh flights to get latest data
          refetchFlights();
          
          // Show toast notification for status changes
          if (payload.new.status !== payload.old.status) {
            const statusMessages = {
              'delayed': 'Flight delayed',
              'cancelled': 'Flight cancelled',
              'boarding': 'Flight boarding',
              'departed': 'Flight departed',
              'arrived': 'Flight arrived'
            };
            
            const message = statusMessages[payload.new.status as FlightStatus] || 'Flight status updated';
            
            toast({
              title: `${payload.new.flight_number} - ${message}`,
              description: `Status changed from ${payload.old.status} to ${payload.new.status}`,
              variant: payload.new.status === 'cancelled' ? 'destructive' : 'default'
            });
          }
        }
      },
      { user_id: user.id }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, refetchFlights]);

  // Quick filter functions
  const handleQuickFilter = (quickFilter: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (quickFilter) {
      case 'upcoming':
        setFilters({
          departure_date_range: { start: today },
          status: ['scheduled', 'delayed', 'boarding']
        });
        break;
      case 'today':
        setFilters({
          departure_date_range: { start: today, end: today }
        });
        break;
      case 'tomorrow':
        setFilters({
          departure_date_range: { start: tomorrow, end: tomorrow }
        });
        break;
      case 'delayed':
        setFilters({ status: ['delayed'] });
        break;
      case 'cancelled':
        setFilters({ status: ['cancelled'] });
        break;
      case 'in-progress':
        setFilters({ status: ['boarding', 'departed'] });
        break;
      case 'completed':
        setFilters({ status: ['arrived'] });
        break;
      case 'all':
      default:
        setFilters({});
        break;
    }
  };

  // Statistics cards data
  const statsCards = [
    {
      title: 'Upcoming Flights',
      value: flightStats?.upcoming_flights || 0,
      description: 'Flights ahead',
      icon: Plane,
      color: 'blue'
    },
    {
      title: 'Today\'s Flights',
      value: flightStats?.flights_today || 0,
      description: 'Departing today',
      icon: Calendar,
      color: 'green'
    },
    {
      title: 'Delayed',
      value: flightStats?.delayed_flights || 0,
      description: 'Currently delayed',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'On Time Rate',
      value: flightStats?.punctuality_rate ? `${Math.round(flightStats.punctuality_rate)}%` : '0%',
      description: 'Punctuality',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  // Filter flights based on search query
  const filteredFlights = flights.filter(flight => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      flight.flight_number.toLowerCase().includes(searchLower) ||
      flight.airline.toLowerCase().includes(searchLower) ||
      flight.departure_airport.toLowerCase().includes(searchLower) ||
      flight.arrival_airport.toLowerCase().includes(searchLower)
    );
  });

  // Count urgent notifications
  const urgentFlights = flights.filter(flight => 
    flight.status === 'cancelled' || 
    (flight.status === 'delayed' && flight.estimated_departure)
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flight Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your flights in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 ${autoRefresh ? 'bg-green-50 border-green-200' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>

          <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                {urgentFlights > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {urgentFlights}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Flight Notifications</DialogTitle>
              </DialogHeader>
              <FlightNotificationsPanel userId={user?.id || ''} />
            </DialogContent>
          </Dialog>

          <Dialog open={flightSearchOpen} onOpenChange={setFlightSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Flights
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Search & Book Flights</DialogTitle>
              </DialogHeader>
              <FlightSearchDialog onClose={() => setFlightSearchOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={createFlightOpen} onOpenChange={setCreateFlightOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Flight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Flight Booking</DialogTitle>
              </DialogHeader>
              <CreateFlightBookingDialog 
                onSuccess={() => {
                  setCreateFlightOpen(false);
                  refetchFlights();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alerts */}
      {(flightsError || statsError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load flight data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <FlightStatisticsWidget
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('all')}
          className={!Object.keys(filters).length ? 'bg-primary text-primary-foreground' : ''}
        >
          All Flights
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('upcoming')}
        >
          Upcoming
          {flightStats?.upcoming_flights && flightStats.upcoming_flights > 0 && (
            <Badge variant="secondary" className="ml-2">
              {flightStats.upcoming_flights}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('today')}
        >
          Today
          {flightStats?.flights_today && flightStats.flights_today > 0 && (
            <Badge variant="secondary" className="ml-2">
              {flightStats.flights_today}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('delayed')}
          className={filters.status?.includes('delayed') ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
        >
          Delayed
          {flightStats?.delayed_flights && flightStats.delayed_flights > 0 && (
            <Badge variant="destructive" className="ml-2">
              {flightStats.delayed_flights}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('cancelled')}
          className={filters.status?.includes('cancelled') ? 'bg-red-100 text-red-800 border-red-200' : ''}
        >
          Cancelled
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('in-progress')}
        >
          In Progress
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search flights by number, airline, or airport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={sort.field}
          onValueChange={(field) => setSort(prev => ({ ...prev, field: field as any }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled_departure">Departure Time</SelectItem>
            <SelectItem value="created_at">Booking Date</SelectItem>
            <SelectItem value="airline">Airline</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSort(prev => ({ 
            ...prev, 
            direction: prev.direction === 'asc' ? 'desc' : 'asc' 
          }))}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {sort.direction === 'asc' ? 'Asc' : 'Desc'}
        </Button>
      </div>

      {/* View Selector */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <FlightList
            flights={filteredFlights}
            isLoading={flightsLoading}
            onFlightUpdate={() => refetchFlights()}
            sort={sort}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                Flight Map
              </CardTitle>
              <CardDescription>
                Real-time flight tracking on interactive map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FlightMap 
                flights={filteredFlights}
                onFlightSelect={(flight) => {
                  // Handle flight selection on map
                  console.log('Selected flight:', flight);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Flight Calendar
              </CardTitle>
              <CardDescription>
                View your flights in calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Flight calendar component would go here */}
              <div className="h-96 flex items-center justify-center text-gray-500">
                Flight calendar view coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {(flightsLoading || statsLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!flightsLoading && flights.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Plane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No flights found</h3>
            <p className="text-gray-500 mb-4">
              Start tracking your flights by adding your first booking.
            </p>
            <Button onClick={() => setCreateFlightOpen(true)}>
              Add Your First Flight
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}