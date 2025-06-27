
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Eye, Edit, Trash2, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  ticket_price: number;
  spots_filled: number;
  total_spots: number;
  promoter: string;
}

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Comedy Night at The Basement',
        date: '2024-12-28T19:00:00Z',
        venue: 'The Basement Theatre',
        status: 'upcoming',
        ticket_price: 25,
        spots_filled: 4,
        total_spots: 6,
        promoter: 'Mike Johnson'
      },
      {
        id: '2',
        title: 'New Year Comedy Special',
        date: '2024-12-31T20:00:00Z',
        venue: 'Sydney Comedy Store',
        status: 'upcoming',
        ticket_price: 35,
        spots_filled: 6,
        total_spots: 8,
        promoter: 'Sarah Wilson'
      },
      {
        id: '3',
        title: 'Open Mic Night',
        date: '2024-12-20T18:30:00Z',
        venue: 'Local Pub',
        status: 'completed',
        ticket_price: 15,
        spots_filled: 10,
        total_spots: 10,
        promoter: 'Dave Miller'
      }
    ];
    
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'ongoing': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Event Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Table */}
        <div className="rounded-lg border border-white/20 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-gray-300">Event</TableHead>
                <TableHead className="text-gray-300">Date & Venue</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Spots</TableHead>
                <TableHead className="text-gray-300">Price</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id} className="border-white/20">
                  <TableCell>
                    <div className="text-white">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-300">by {event.promoter}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-white">
                      <div className="text-sm">{new Date(event.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="text-sm">
                      {event.spots_filled}/{event.total_spots}
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-purple-500 h-1.5 rounded-full" 
                        style={{ width: `${(event.spots_filled / event.total_spots) * 100}%` }}
                      ></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {event.ticket_price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-gray-300">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No events found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventManagement;
