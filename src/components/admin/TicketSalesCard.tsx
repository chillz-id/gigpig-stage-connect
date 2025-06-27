
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

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
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Ticket Sales
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClose}
            className="ml-auto text-white hover:bg-white/20"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ticketSales.length > 0 ? (
            ticketSales.map((sale) => (
              <div key={sale.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{sale.customer_name}</p>
                    <p className="text-sm text-gray-300">{sale.customer_email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.purchase_date).toLocaleDateString()} via {sale.platform}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">${sale.total_amount}</p>
                    <p className="text-sm text-gray-300">{sale.ticket_quantity} tickets</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-center py-4">No ticket sales yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketSalesCard;
