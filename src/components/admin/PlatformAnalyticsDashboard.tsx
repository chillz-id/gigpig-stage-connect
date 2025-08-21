import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TicketSalesDashboard } from '@/components/ticket-sales';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/export';

interface EventPerformance {
  eventId: string;
  eventName: string;
  totalRevenue: number;
  totalTickets: number;
  platforms: string[];
  conversionRate: number;
  eventDate: string;
}

interface PlatformComparison {
  platform: string;
  totalRevenue: number;
  totalTickets: number;
  eventCount: number;
  avgTicketPrice: number;
}

const PlatformAnalyticsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [eventFilter, setEventFilter] = useState('all');
  const [events, setEvents] = useState<EventPerformance[]>([]);
  const [platformComparison, setPlatformComparison] = useState<PlatformComparison[]>([]);
  const [totalMetrics, setTotalMetrics] = useState({
    revenue: 0,
    tickets: 0,
    events: 0,
    avgTicketPrice: 0
  });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case 'month':
          startDate = startOfMonth(endDate);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Fetch events with ticket sales data
      let eventsQuery = supabase
        .from('events')
        .select(`
          id,
          name,
          date,
          capacity,
          total_tickets_sold,
          total_gross_sales,
          ticket_platforms (
            platform,
            tickets_sold,
            gross_sales
          ),
          ticket_sales (
            total_amount,
            ticket_quantity,
            purchase_date
          )
        `)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: false });

      if (eventFilter === 'active') {
        eventsQuery = eventsQuery.gt('total_tickets_sold', 0);
      }

      const { data: eventsData, error } = await eventsQuery;
      if (error) throw error;

      // Process event performance data
      const eventPerformance: EventPerformance[] = eventsData?.map(event => {
        const platforms = event.ticket_platforms?.map((p: any) => p.platform) || [];
        const conversionRate = event.capacity > 0 
          ? (event.total_tickets_sold / event.capacity) * 100 
          : 0;

        return {
          eventId: event.id,
          eventName: event.name,
          totalRevenue: event.total_gross_sales || 0,
          totalTickets: event.total_tickets_sold || 0,
          platforms,
          conversionRate,
          eventDate: event.date
        };
      }) || [];

      setEvents(eventPerformance);

      // Calculate platform comparison
      const platformMap = new Map<string, PlatformComparison>();
      
      eventsData?.forEach(event => {
        event.ticket_platforms?.forEach((platform: any) => {
          const existing = platformMap.get(platform.platform) || {
            platform: platform.platform,
            totalRevenue: 0,
            totalTickets: 0,
            eventCount: 0,
            avgTicketPrice: 0
          };
          
          platformMap.set(platform.platform, {
            ...existing,
            totalRevenue: existing.totalRevenue + (platform.gross_sales || 0),
            totalTickets: existing.totalTickets + (platform.tickets_sold || 0),
            eventCount: existing.eventCount + 1
          });
        });
      });

      // Calculate average ticket prices
      const platformData = Array.from(platformMap.values()).map(p => ({
        ...p,
        avgTicketPrice: p.totalTickets > 0 ? p.totalRevenue / p.totalTickets : 0
      }));

      setPlatformComparison(platformData);

      // Calculate total metrics
      const totalRevenue = eventPerformance.reduce((sum, e) => sum + e.totalRevenue, 0);
      const totalTickets = eventPerformance.reduce((sum, e) => sum + e.totalTickets, 0);
      
      setTotalMetrics({
        revenue: totalRevenue,
        tickets: totalTickets,
        events: eventPerformance.length,
        avgTicketPrice: totalTickets > 0 ? totalRevenue / totalTickets : 0
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportData = () => {
    const exportData = events.map(event => ({
      'Event Name': event.eventName,
      'Event Date': format(new Date(event.eventDate), 'yyyy-MM-dd'),
      'Total Revenue': `$${event.totalRevenue.toFixed(2)}`,
      'Tickets Sold': event.totalTickets,
      'Platforms': event.platforms.join(', '),
      'Conversion Rate': `${event.conversionRate.toFixed(1)}%`
    }));

    exportToCSV(exportData, `platform-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    
    toast({
      title: "Export Complete",
      description: "Analytics data exported to CSV",
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, eventFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-event performance and insights
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Event Filter */}
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="active">With sales only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(totalMetrics.revenue)}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold mt-2">{totalMetrics.tickets.toLocaleString()}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                <p className="text-2xl font-bold mt-2">{totalMetrics.events}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Ticket Price</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(totalMetrics.avgTicketPrice)}</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <TicketSalesDashboard multiEvent={true} />
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'Revenue') return formatCurrency(value);
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
                    <Bar yAxisId="right" dataKey="totalTickets" fill="#82ca9d" name="Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Platform Details */}
              <div className="mt-6 space-y-3">
                {platformComparison.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{platform.platform}</h4>
                      <p className="text-sm text-muted-foreground">
                        {platform.eventCount} events • Avg ticket: {formatCurrency(platform.avgTicketPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(platform.totalRevenue)}</p>
                      <p className="text-sm text-muted-foreground">{platform.totalTickets} tickets</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Revenue</th>
                      <th className="text-left p-3">Tickets</th>
                      <th className="text-left p-3">Platforms</th>
                      <th className="text-left p-3">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.eventId} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{event.eventName}</td>
                        <td className="p-3">{format(new Date(event.eventDate), 'MMM d, yyyy')}</td>
                        <td className="p-3">{formatCurrency(event.totalRevenue)}</td>
                        <td className="p-3">{event.totalTickets}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {event.platforms.map((platform, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${Math.min(event.conversionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm">{event.conversionRate.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {events.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No events found for the selected time range
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformAnalyticsDashboard;