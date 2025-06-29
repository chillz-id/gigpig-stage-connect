
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, DollarSign, Calendar, Mail, User, CreditCard } from 'lucide-react';

interface TicketSale {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  total_amount: number;
  platform: string;
  purchase_date: string;
}

interface TicketSalesCardProps {
  ticketSales: TicketSale[];
  onClose: () => void;
}

const TicketSalesCard = ({ ticketSales, onClose }: TicketSalesCardProps) => {
  const totalRevenue = ticketSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalTickets = ticketSales.reduce((sum, sale) => sum + sale.ticket_quantity, 0);

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Ticket Sales ({ticketSales.length})
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </div>
            <div className="text-xl font-bold text-white">
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CreditCard className="w-4 h-4" />
              Total Tickets
            </div>
            <div className="text-xl font-bold text-white">
              {totalTickets}
            </div>
          </div>
        </div>

        {ticketSales.length > 0 ? (
          <div className="rounded-lg border border-white/20 bg-white/5 max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Tickets</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Platform</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketSales.map((sale) => (
                  <TableRow key={sale.id} className="border-white/20">
                    <TableCell className="text-white">
                      <div>
                        <div className="flex items-center gap-1 font-medium">
                          <User className="w-3 h-3" />
                          {sale.customer_name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-300">
                          <Mail className="w-3 h-3" />
                          {sale.customer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{sale.ticket_quantity}</TableCell>
                    <TableCell className="text-white">${sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sale.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(sale.purchase_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-300">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No ticket sales recorded for this event.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketSalesCard;
