import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Plus, Download, BarChart3, Settings, 
  Megaphone, FileText, Users, TrendingUp, Clock,
  MapPin, DollarSign, Ticket
} from 'lucide-react';
import EventFilters from './EventFilters';
import EventsTable from './EventsTable';
import { useEventManagement } from '@/hooks/useEventManagement';
import { useEventSubscriptions } from '@/hooks/useEventSubscriptions';
import { useTicketSalesSubscription } from '@/hooks/useTicketSalesSubscription';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const EventManagementContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('events');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

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
    
    // Date range filtering
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const eventDate = new Date(event.event_date || event.date);
      if (dateRange.start && eventDate < dateRange.start) {
        matchesDateRange = false;
      }
      if (dateRange.end && eventDate > dateRange.end) {
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Calculate event statistics
  const eventStats = {
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
    upcoming: events.filter(e => new Date(e.date) > new Date()).length,
    thisMonth: events.filter(e => {
      const eventDate = new Date(e.date);
      const now = new Date();
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear();
    }).length
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEvents.length === 0) return;
    // Implement bulk actions like publish, unpublish, delete, etc.
    console.log(`Bulk ${action} for events:`, selectedEvents);
    setSelectedEvents([]);
  };

  const exportEvents = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,Venue,Date,Status,Tickets Sold,Revenue\n"
      + filteredEvents.map(event => 
          `"${event.title}","${event.venue}","${event.date}","${event.status}","${event.ticket_count || 0}","${event.ticket_revenue || 0}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `events-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const EventStatsCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">{title}</p>
            <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const EventTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white text-lg font-semibold">Event Templates</h3>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <FileText className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Template cards would go here */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Stand-up Comedy Night</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-4">Standard comedy show template with 5 comedians</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-white border-white/20">
                Use Template
              </Button>
              <Button size="sm" variant="outline" className="text-white border-white/20">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Open Mic Night</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-4">Open mic format with signup slots</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-white border-white/20">
                Use Template
              </Button>
              <Button size="sm" variant="outline" className="text-white border-white/20">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const PromotionTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white text-lg font-semibold">Event Promotion</h3>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Megaphone className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Social Media Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-white/5 rounded border border-green-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Facebook Campaign #1</span>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <p className="text-gray-300 text-sm">Targeting comedy fans in Sydney</p>
              <div className="text-xs text-gray-400 mt-2">Reach: 12,430 | Clicks: 234 | Conversions: 18</div>
            </div>
            <div className="p-3 bg-white/5 rounded border border-blue-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Instagram Stories</span>
                <Badge variant="outline">Scheduled</Badge>
              </div>
              <p className="text-gray-300 text-sm">Weekly comedy night promotion</p>
              <div className="text-xs text-gray-400 mt-2">Scheduled for tomorrow 6PM</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Email Marketing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-white/5 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Weekly Newsletter</span>
                <Badge className="bg-purple-500">Sent</Badge>
              </div>
              <p className="text-gray-300 text-sm">Upcoming shows digest</p>
              <div className="text-xs text-gray-400 mt-2">Open rate: 24.5% | Click rate: 8.2%</div>
            </div>
            <Button variant="outline" className="w-full text-white border-white/20">
              Create New Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-white text-lg font-semibold">Event Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Avg Attendance</p>
                <h3 className="text-2xl font-bold text-green-400">78%</h3>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Revenue/Event</p>
                <h3 className="text-2xl font-bold text-yellow-400">$1,240</h3>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Cancellation Rate</p>
                <h3 className="text-2xl font-bold text-red-400">2.3%</h3>
              </div>
              <Clock className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Top Venue</p>
                <h3 className="text-lg font-bold text-blue-400">The Comedy Store</h3>
              </div>
              <MapPin className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading events...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <EventStatsCard title="Total Events" value={eventStats.total} icon={Calendar} color="text-white" />
        <EventStatsCard title="Published" value={eventStats.published} icon={Ticket} color="text-green-400" />
        <EventStatsCard title="Drafts" value={eventStats.draft} icon={Settings} color="text-yellow-400" />
        <EventStatsCard title="Upcoming" value={eventStats.upcoming} icon={Clock} color="text-blue-400" />
        <EventStatsCard title="This Month" value={eventStats.thisMonth} icon={TrendingUp} color="text-purple-400" />
        <EventStatsCard title="Cancelled" value={eventStats.cancelled} icon={Calendar} color="text-red-400" />
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Management
              <Badge variant="outline" className="ml-2">
                {filteredEvents.length} events
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportEvents}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="events" className="text-white data-[state=active]:bg-purple-600">
                Events
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-white data-[state=active]:bg-purple-600">
                Templates
              </TabsTrigger>
              <TabsTrigger value="promotion" className="text-white data-[state=active]:bg-purple-600">
                Promotion
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600">
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="space-y-4 mt-6">
              <EventFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
              
              {/* Bulk Actions */}
              {selectedEvents.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <span className="text-white font-medium">
                    {selectedEvents.length} event(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkAction('publish')}
                      className="text-green-400 border-green-400/50 hover:bg-green-400/10"
                    >
                      Publish
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkAction('unpublish')}
                      className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10"
                    >
                      Unpublish
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                    >
                      Delete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedEvents([])}
                      className="text-gray-400 border-gray-400/50 hover:bg-gray-400/10"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              
              <EventsTable 
                events={filteredEvents}
                onDeleteEvent={handleDeleteEvent}
                selectedEvents={selectedEvents}
                onSelectEvents={setSelectedEvents}
              />
            </TabsContent>
            
            <TabsContent value="templates" className="mt-6">
              <EventTemplatesTab />
            </TabsContent>
            
            <TabsContent value="promotion" className="mt-6">
              <PromotionTab />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <AnalyticsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventManagementContent;