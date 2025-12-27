
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Plus, Search, RefreshCw, Zap, Clock, BarChart3, Users } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ticketSyncService } from '@/services/ticketSyncService';
import { format } from 'date-fns';
import { TicketSalesDashboard } from '@/components/ticket-sales';

interface TicketSale {
  id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  ticket_type: string;
  total_amount: number;
  platform: string;
  platform_order_id?: string;
  refund_status: string;
  purchase_date: string;
  created_at: string;
}

interface SalesMetrics {
  totalTicketsSold: number;
  totalRevenue: number;
  remainingCapacity: number;
  conversionRate: number;
}

interface TicketSourceBreakdown {
  source: string;
  ticketsSold: number;
  revenue: number;
  percentage: number;
  lastUpdated: string;
}

interface EventTicketSalesTabProps {
  eventId: string;
}

const EventTicketSalesTab: React.FC<EventTicketSalesTabProps> = ({ eventId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    remainingCapacity: 0,
    conversionRate: 0
  });
  const [sourceBreakdown, setSourceBreakdown] = useState<TicketSourceBreakdown[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');

  const fetchTicketSales = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch ticket sales data
      const { data: salesData, error: salesError } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('event_id', eventId)
        .order('purchase_date', { ascending: false });

      if (salesError) throw salesError;

      // Fetch event capacity
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('capacity')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      const sales = salesData || [];
      setTicketSales(sales);

      // Calculate metrics
      const totalTickets = sales.reduce((sum, sale) => sum + sale.ticket_quantity, 0);
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const capacity = eventData?.capacity || 0;
      const remainingCapacity = Math.max(0, capacity - totalTickets);
      const conversionRate = capacity > 0 ? (totalTickets / capacity) * 100 : 0;

      setSalesMetrics({
        totalTicketsSold: totalTickets,
        totalRevenue,
        remainingCapacity,
        conversionRate
      });

      // Calculate source breakdown
      const sourceMap = new Map<string, { tickets: number; revenue: number; lastUpdated: string }>();
      
      sales.forEach(sale => {
        const source = sale.platform || 'Unknown';
        const existing = sourceMap.get(source) || { tickets: 0, revenue: 0, lastUpdated: sale.purchase_date };
        
        sourceMap.set(source, {
          tickets: existing.tickets + sale.ticket_quantity,
          revenue: existing.revenue + Number(sale.total_amount),
          lastUpdated: new Date(sale.purchase_date) > new Date(existing.lastUpdated) ? sale.purchase_date : existing.lastUpdated
        });
      });

      const breakdown = Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        ticketsSold: data.tickets,
        revenue: data.revenue,
        percentage: totalTickets > 0 ? (data.tickets / totalTickets) * 100 : 0,
        lastUpdated: data.lastUpdated
      }));

      setSourceBreakdown(breakdown);

      // Get last sync time from platforms
      const { data: platforms } = await supabase
        .from('ticket_platforms')
        .select('platform_data')
        .eq('event_id', eventId);
      
      if (platforms && platforms.length > 0) {
        const lastSyncs = platforms
          .map(p => p.platform_data?.last_sync)
          .filter(Boolean)
          .map(d => new Date(d));
        
        if (lastSyncs.length > 0) {
          setLastSyncTime(new Date(Math.max(...lastSyncs.map(d => d.getTime()))));
        }
      }

    } catch (error: any) {
      console.error('Error fetching ticket sales:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  const handleSyncTickets = async () => {
    try {
      setSyncing(true);
      
      const results = await ticketSyncService.syncAllPlatforms(eventId);
      
      // Count successful syncs
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${successCount} platform${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
        
        // Refresh the data
        await fetchTicketSales();
        setLastSyncTime(new Date());
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to sync ticket data from platforms",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('Error syncing tickets:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync ticket data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTicketSales();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchTicketSales, 30000);
    return () => clearInterval(interval);
  }, [fetchTicketSales]);

  const filteredSales = ticketSales.filter(sale => {
    const matchesSearch = 
      sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.platform_order_id && sale.platform_order_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlatform = filterPlatform === 'all' || sale.platform === filterPlatform;
    
    return matchesSearch && matchesPlatform;
  });

  const handleExportData = () => {
    if (ticketSales.length === 0) {
      toast({
        title: "No Data",
        description: "No ticket sales data to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Order Number', 'Customer Name', 'Email', 'Ticket Type', 'Quantity', 'Total Paid', 'Purchase Date', 'Platform', 'Status'].join(','),
      ...ticketSales.map(sale => [
        sale.platform_order_id || sale.id,
        sale.customer_name,
        sale.customer_email,
        sale.ticket_type,
        sale.ticket_quantity,
        `$${sale.total_amount}`,
        new Date(sale.purchase_date).toLocaleDateString(),
        sale.platform,
        sale.refund_status === 'none' ? 'Confirmed' : 'Refunded'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-sales-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Ticket sales data has been downloaded",
    });
  };

  const getStatusBadge = (refundStatus: string) => {
    switch (refundStatus) {
      case 'none':
        return <Badge variant="default">Confirmed</Badge>;
      case 'requested':
        return <Badge variant="secondary">Refund Requested</Badge>;
      case 'processed':
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge className="professional-button">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="analytics" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="analytics">
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="sales">
          <Users className="w-4 h-4 mr-2" />
          Sales Details
        </TabsTrigger>
      </TabsList>

      {/* Analytics Tab */}
      <TabsContent value="analytics">
        <TicketSalesDashboard eventId={eventId} />
      </TabsContent>

      {/* Sales Details Tab */}
      <TabsContent value="sales" className="space-y-6">
        {/* Sales Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Total Tickets Sold</div>
            <div className="text-2xl font-bold text-white">{salesMetrics.totalTicketsSold}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Total Revenue</div>
            <div className="text-2xl font-bold text-white">${salesMetrics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Remaining Capacity</div>
            <div className="text-2xl font-bold text-white">{salesMetrics.remainingCapacity}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Conversion Rate</div>
            <div className="text-2xl font-bold text-white">{salesMetrics.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Source Breakdown */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Ticket Sources</CardTitle>
          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <div className="flex items-center gap-1 text-white/60 text-sm">
                <Clock className="w-3 h-3" />
                <span>Last sync: {format(lastSyncTime, 'HH:mm')}</span>
              </div>
            )}
            <Button
              onClick={handleSyncTickets}
              className="professional-button border-white text-white hover:bg-white hover:text-purple-900"
              size="sm"
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Sync Tickets
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sourceBreakdown.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="text-white font-medium">{source.source}</div>
                <div className="text-right">
                  <div className="text-white">{source.ticketsSold} tickets (${source.revenue.toFixed(2)})</div>
                  <div className="text-white/60 text-sm">{source.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              placeholder="Search by customer name, email, or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
          >
            <option value="all">All Platforms</option>
            <option value="humanitix">Humanitix</option>
            <option value="eventbrite">Eventbrite</option>
            <option value="manual">Manual Entry</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={fetchTicketSales}
            className="professional-button border-white text-white hover:bg-white hover:text-purple-900"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleExportData}
            className="professional-button border-white text-white hover:bg-white hover:text-purple-900"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Sale
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Individual Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white/80 font-medium p-3">Order Number</th>
                  <th className="text-left text-white/80 font-medium p-3">Customer</th>
                  <th className="text-left text-white/80 font-medium p-3">Email</th>
                  <th className="text-left text-white/80 font-medium p-3">Type</th>
                  <th className="text-left text-white/80 font-medium p-3">Qty</th>
                  <th className="text-left text-white/80 font-medium p-3">Total</th>
                  <th className="text-left text-white/80 font-medium p-3">Date</th>
                  <th className="text-left text-white/80 font-medium p-3">Platform</th>
                  <th className="text-left text-white/80 font-medium p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="text-white p-3 font-mono text-sm">
                      {sale.platform_order_id || sale.id.slice(0, 8)}
                    </td>
                    <td className="text-white p-3">{sale.customer_name}</td>
                    <td className="text-white p-3 text-sm">{sale.customer_email}</td>
                    <td className="text-white p-3">{sale.ticket_type}</td>
                    <td className="text-white p-3">{sale.ticket_quantity}</td>
                    <td className="text-white p-3">${sale.total_amount}</td>
                    <td className="text-white p-3 text-sm">
                      {new Date(sale.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="text-white p-3">
                      <Badge className="professional-button border-white/20 text-white/80">
                        {sale.platform}
                      </Badge>
                    </td>
                    <td className="text-white p-3">
                      {getStatusBadge(sale.refund_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSales.length === 0 && (
              <div className="text-center py-8 text-white/60">
                {searchTerm || filterPlatform !== 'all' 
                  ? 'No tickets found matching your search criteria'
                  : 'No ticket sales recorded yet'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>
    </Tabs>
  );
};

export default EventTicketSalesTab;
