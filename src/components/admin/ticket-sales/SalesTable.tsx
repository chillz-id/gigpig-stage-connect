
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard } from 'lucide-react';
import { TicketSale } from '@/types/ticketSales';

interface Event {
  id: string;
  title: string;
  venue: string;
}

interface SalesTableProps {
  ticketSales: TicketSale[];
  events: Event[];
  onRefund: (saleId: string, refundStatus: 'partial' | 'full') => void;
}

const SalesTable = ({ ticketSales, events, onRefund }: SalesTableProps) => {
  if (ticketSales.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Ticket Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-300">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No ticket sales found for the selected criteria.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Recent Ticket Sales</CardTitle>
      </CardHeader>
      <CardContent>
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
                            onClick={() => onRefund(sale.id, 'partial')}
                            className="text-xs"
                          >
                            Partial Refund
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onRefund(sale.id, 'full')}
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
      </CardContent>
    </Card>
  );
};

export default SalesTable;
