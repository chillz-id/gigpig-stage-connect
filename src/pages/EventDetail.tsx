
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import EventTicketSalesTab from '@/components/admin/event-detail/EventTicketSalesTab';
import EventLineupTab from '@/components/admin/event-detail/EventLineupTab';
import EventSettlementsTab from '@/components/admin/event-detail/EventSettlementsTab';
import EventDetailsTab from '@/components/admin/event-detail/EventDetailsTab';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users, Settings } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  status: string;
  capacity: number;
  tickets_sold: number;
  total_revenue: number;
  comedian_slots: number;
  filled_slots: number;
  city: string;
  state: string;
}

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ticket-sales');

  // Check admin access
  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/admin');
      return;
    }
  }, [hasRole, navigate]);

  // Fetch event data
  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            venue,
            event_date,
            status,
            capacity,
            tickets_sold,
            total_revenue,
            comedian_slots,
            filled_slots,
            city,
            state
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;

        if (!data) {
          setError('Event not found');
          return;
        }

        setEvent(data);
      } catch (error: any) {
        console.error('Error fetching event:', error);
        setError(error.message || 'Failed to load event');
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, toast]);

  const handleDeleteEvent = async () => {
    if (!event || !confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
      
      navigate('/admin');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'open':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#131b2b]">
        <ResponsiveContainer className="py-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                {error || 'Event not found'}
              </h2>
              <Button
                onClick={() => navigate('/admin')}
                className="professional-button border-white text-white hover:bg-white hover:text-purple-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131b2b]">
      <ResponsiveContainer className="py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/admin')}
            variant="ghost"
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-white mb-2">
                    {event.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.venue}
                      {event.city && `, ${event.city}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.tickets_sold} / {event.capacity} tickets sold
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Badge variant={getStatusBadgeVariant(event.status)}>
                    {event.status}
                  </Badge>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/events/${eventId}/manage`)}
                    className="bg-white text-purple-900 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Event
                  </Button>
                  <Button
                    className="professional-button border-white text-white hover:bg-white hover:text-purple-900"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteEvent}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/10 backdrop-blur-sm border-white/20">
                <TabsTrigger 
                  value="ticket-sales" 
                  className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Ticket Sales
                </TabsTrigger>
                <TabsTrigger 
                  value="lineup" 
                  className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Lineup
                </TabsTrigger>
                <TabsTrigger 
                  value="settlements" 
                  className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Settlements
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Event Details
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="ticket-sales" className="space-y-6">
                  <EventTicketSalesTab eventId={event.id} />
                </TabsContent>

                <TabsContent value="lineup" className="space-y-6">
                  <EventLineupTab eventId={event.id} />
                </TabsContent>

                <TabsContent value="settlements" className="space-y-6">
                  <EventSettlementsTab eventId={event.id} />
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <EventDetailsTab eventId={event.id} event={event} onEventUpdate={setEvent} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </ResponsiveContainer>
    </div>
  );
};

export default EventDetail;
