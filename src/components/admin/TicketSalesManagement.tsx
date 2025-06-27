
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useTicketSalesManagement } from '@/hooks/useTicketSalesManagement';
import { useEventData } from '@/hooks/useEventData';

const TicketSalesManagement = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    event_id: '',
    customer_name: '',
    customer_email: '',
    ticket_quantity: 1,
    ticket_type: 'general',
    total_amount: 0,
    platform: 'manual' as const,
    platform_order_id: '',
  });

  const { events } = useEventData();
  const { 
    ticketSales, 
    isLoading, 
    salesMetrics, 
    addTicketSale, 
    updateTicketSale 
  } = useTicketSalesManagement(selectedEventId === 'all' ? undefined : selectedEventId);

  const handleAddSale = async () => {
    if (!newSale.event_id || !newSale.customer_name || !newSale.customer_email) {
      return;
    }

    try {
      await addTicketSale.mutateAsync({
        ...newSale,
        refund_status: 'none',
      });
      
      setIsAddDialogOpen(false);
      setNewSale({
        event_id: '',
        customer_name: '',
        customer_email: '',
        ticket_quantity: 1,
        ticket_type: 'general',
        total_amount: 0,
        platform: 'manual',
        platform_order_id: '',
      });
    } catch (error) {
      console.error('Failed to add ticket sale:', error);
    }
  };

  const handleRefund = async (saleId: string, refundStatus: 'partial' | 'full') => {
    try {
      await updateTicketSale.mutateAsync({
        id: saleId,
        updates: { refund_status: refundStatus }
      });
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading ticket sales...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Ticket Sales Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <Label className="text-white mb-2 block">Filter by Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} - {new Date(event.event_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Ticket Sale</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Event</Label>
                    <Select value={newSale.event_id} onValueChange={(value) => setNewSale(prev => ({ ...prev, event_id: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {new Date(event.event_date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Customer Name</Label>
                      <Input
                        value={newSale.customer_name}
                        onChange={(e) => setNewSale(prev => ({ ...prev, customer_name: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Customer Email</Label>
                      <Input
                        type="email"
                        value={newSale.customer_email}
                        onChange={(e) => setNewSale(prev => ({ ...prev, customer_email: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newSale.ticket_quantity}
                        onChange={(e) => setNewSale(prev => ({ ...prev, ticket_quantity: parseInt(e.target.value) || 1 }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Total Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newSale.total_amount}
                        onChange={(e) => setNewSale(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Platform</Label>
                      <Select value={newSale.platform} onValueChange={(value: 'manual' | 'humanitix' | 'eventbrite') => setNewSale(prev => ({ ...prev, platform: value }))}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="humanitix">Humanitix</SelectItem>
                          <SelectItem value="eventbrite">Eventbrite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSale} disabled={addTicketSale.isPending}>
                      {addTicketSale.isPending ? 'Adding...' : 'Add Sale'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-300">Total Revenue</p>
                <p className="text-xl font-bold text-white">${salesMetrics.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-300">Total Tickets</p>
                <p className="text-xl font-bold text-white">{salesMetrics.totalTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-300">Avg. Price</p>
                <p className="text-xl font-bold text-white">${salesMetrics.averageTicketPrice.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-300">Total Sales</p>
                <p className="text-xl font-bold text-white">{salesMetrics.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Ticket Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {ticketSales.length > 0 ? (
            <div className="rounded-lg border border-white/20 bg-white/5 max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-gray-300">Customer</TableHead>
                    <TableHead className="text-gray-300">Event</TableHead>
                    <TableHead className="text-gray-300">Tickets</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Platform</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketSales.map((sale) => {
                    const event = events.find(e => e.id === sale.event_id);
                    return (
                      <TableRow key={sale.id} className="border-white/20">
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{sale.customer_name}</div>
                            <div className="text-xs text-gray-300">{sale.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{event?.title || 'Unknown Event'}</div>
                            <div className="text-xs text-gray-300">{event?.venue}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{sale.ticket_quantity}</TableCell>
                        <TableCell className="text-white">${Number(sale.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {sale.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="text-xs">
                            {new Date(sale.purchase_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={sale.refund_status === 'none' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {sale.refund_status === 'none' ? 'Active' : `Refunded (${sale.refund_status})`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sale.refund_status === 'none' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRefund(sale.id, 'partial')}
                                className="text-xs"
                              >
                                Partial Refund
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRefund(sale.id, 'full')}
                                className="text-xs"
                              >
                                Full Refund
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No ticket sales found for the selected criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSalesManagement;
