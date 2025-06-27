
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, X } from 'lucide-react';

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
        <div className="space-y-4">
          {ticketSales.length > 0 ? (
            ticketSales.map((sale) => (
              <div key={sale.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm md:text-base truncate">{sale.customer_name}</p>
                    <p className="text-sm text-gray-300 truncate">{sale.customer_email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.purchase_date).toLocaleDateString()} via {sale.platform}
                    </p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-white font-medium">${sale.total_amount}</p>
                    <p className="text-sm text-gray-300">{sale.ticket_quantity} tickets</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="text-gray-300 text-content">No ticket sales yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketSalesCard;
