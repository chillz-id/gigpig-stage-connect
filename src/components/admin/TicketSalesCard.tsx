
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, X, DollarSign, Calendar } from 'lucide-react';

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
  const totalTickets = ticketSales.reduce((sum, sale) => sum + sale.ticket_quantity, 0);
  const totalRevenue = ticketSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const averageTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  const getPlatformBadgeVariant = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'humanitix':
        return 'default';
      case 'eventbrite':
        return 'secondary';
      case 'manual':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          <Users className="w-5 h-5 flex-shrink-0" />
          Ticket Sales
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClose}
            className="ml-auto text-white hover:bg-white/20 min-h-[44px] min-w-[44px] p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalTickets}</div>
            <div className="text-xs text-gray-300">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-gray-300">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">${averageTicketPrice.toFixed(2)}</div>
            <div className="text-xs text-gray-300">Avg Price</div>
          </div>
        </div>

        {/* Sales List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {ticketSales.length > 0 ? (
            ticketSales.map((sale) => (
              <div key={sale.id} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm md:text-base truncate">{sale.customer_name}</p>
                      <Badge variant={getPlatformBadgeVariant(sale.platform)} className="text-xs">
                        {sale.platform}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{sale.customer_email}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sale.purchase_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {sale.ticket_quantity} ticket{sale.ticket_quantity !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-white font-medium">
                      <DollarSign className="w-4 h-4" />
                      {sale.total_amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-300">
                      ${(sale.total_amount / sale.ticket_quantity).toFixed(2)} per ticket
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="text-gray-300 text-content">No ticket sales yet</p>
              <p className="text-xs text-gray-400 mt-2">Sales will appear here once tickets are purchased</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketSalesCard;
