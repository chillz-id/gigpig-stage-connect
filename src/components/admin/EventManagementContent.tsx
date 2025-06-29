
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import EventFilters from './EventFilters';
import EventsTable from './EventsTable';
import { useEventManagement } from '@/hooks/useEventManagement';
import { useEventSubscriptions } from '@/hooks/useEventSubscriptions';
import { useTicketSalesSubscription } from '@/hooks/useTicketSalesSubscription';

const EventManagementContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    events,
    loading,
    fetchEvents,
    fetchComedianBookings,
    handleDeleteEvent,
  } = useEventManagement();

  // Set up real-time subscriptions
  useEventSubscriptions(
    fetchEvents,
    fetchComedianBookings,
    null // No selected event in this context
  );

  // Add ticket sales real-time subscription
  useTicketSalesSubscription();

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          
          <EventsTable 
            events={filteredEvents}
            onDeleteEvent={handleDeleteEvent}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EventManagementContent;
